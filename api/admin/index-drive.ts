import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, admin } from "../_lib/firestore.js";
import { requireDrive } from "../_lib/driveClient.js";
import { first, mediaTypeFromMime } from "../_lib/query.js";

const ADMIN_EMAIL = "ryan.polasky@acmutd.co";

function escapeQ(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

type CursorState = {
  queue: string[];
  current: string | null;
  pageToken: string | null;
  syncId: number;
  folders: number;
  files: number;
  writes: number;
  /** Map of folderId → parentId, built as we discover folders. */
  parentMap: Record<string, string | null>;
};

function decodeCursor(cursor: string | undefined): CursorState | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function encodeCursor(state: CursorState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

/**
 * Walk up the parent chain to build the ancestors array for a file/folder.
 * Includes every folder from the direct parent up to and including rootId.
 */
function buildAncestors(
  folderId: string | null,
  parentMap: Record<string, string | null>,
  rootId: string,
): string[] {
  const ancestors: string[] = [];
  let cur = folderId;
  const seen = new Set<string>();

  while (cur && !seen.has(cur)) {
    seen.add(cur);
    ancestors.push(cur);
    if (cur === rootId) break;
    cur = parentMap[cur] ?? null;
  }

  return ancestors;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { drive, driveId } = await requireDrive(req);

    const about = await drive.about.get({ fields: "user(emailAddress)" });
    const email = about.data.user?.emailAddress ?? null;
    if (email !== ADMIN_EMAIL)
      return res.status(403).json({ error: "Forbidden" });

    const rootId = process.env.MEDIA_ROOT_FOLDER_ID || process.env.SHARED_DRIVE_ID;
    if (!rootId)
      return res.status(500).json({ error: "Missing MEDIA_ROOT_FOLDER_ID or SHARED_DRIVE_ID" });

    const dry = first(req.query.dry as string | string[]) === "1";
    const maxWrites = Math.min(
      Math.max(
        parseInt(first(req.query.maxWrites as string | string[]) ?? "800", 10) || 800,
        1,
      ),
      4000,
    );

    const db = getDb();
    const foldersCol = db.collection("drive_folders");
    const filesCol = db.collection("drive_files");
    const metaDoc = db.collection("drive_index").doc("meta");

    const cursorRaw = first(req.query.cursor as string | string[]);
    const cursor = decodeCursor(cursorRaw);

    const state: CursorState = cursor ?? {
      queue: [rootId],
      current: null,
      pageToken: null,
      syncId: Date.now(),
      folders: 0,
      files: 0,
      writes: 0,
      parentMap: {},
    };

    // On first invocation (no cursor), seed the parentMap from existing
    // Firestore folder data so we can compute ancestors for files even if
    // their parent folders were indexed in a previous cursor page.
    if (!cursor) {
      const existingFolders = await foldersCol
        .where("rootId", "==", rootId)
        .select("parentId")
        .get();
      for (const doc of existingFolders.docs) {
        state.parentMap[doc.id] = doc.data().parentId ?? null;
      }
      // The root folder itself
      state.parentMap[rootId] = null;
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    const ops: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];

    async function flush() {
      if (dry || ops.length === 0) return;
      const batch = db.batch();
      const chunk = ops.splice(0, 450);
      chunk.forEach((op) => op(batch));
      await batch.commit();
    }

    while (state.writes < maxWrites) {
      if (!state.current) {
        state.current = state.queue.shift() ?? null;
        state.pageToken = null;
      }

      if (!state.current) break;

      const q = `'${escapeQ(state.current)}' in parents and trashed = false`;

      console.log(`[index] Listing children of: ${state.current} (query: ${q})`);
      console.log(`[index] driveId: ${driveId}, rootId: ${rootId}`);

      const r = await drive.files.list({
        q,
        fields:
          "nextPageToken, files(id,name,mimeType,parents,createdTime,modifiedTime,webViewLink,webContentLink)",
        pageSize: 1000,
        pageToken: state.pageToken ?? undefined,
        corpora: "drive",
        driveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      const items = r.data.files ?? [];
      console.log(`[index] Got ${items.length} items from folder ${state.current}`);
      if (items.length > 0) {
        console.log(`[index] First few items:`, items.slice(0, 3).map(f => `${f.name} (${f.mimeType})`));
      }
      if (items.length === 0) {
        console.log(`[index] No items found. Check that SHARED_DRIVE_ID (${driveId}) is correct and the folder ${state.current} has children.`);
      }

      for (const f of items) {
        if (!f?.id) continue;

        const mimeType = f.mimeType ?? "";
        const parentId = f.parents?.[0] ?? null;

        // Always index folders (for tree navigation), but skip non-media files
        const isFolder = mimeType === "application/vnd.google-apps.folder";
        const isMedia =
          mimeType.startsWith("image/") ||
          mimeType.startsWith("video/") ||
          mimeType === "image/svg+xml";

        if (!isFolder && !isMedia) continue;

        if (isFolder) {
          state.queue.push(f.id);
          state.folders++;
          state.writes++;

          // Track this folder in the parentMap for ancestor computation
          state.parentMap[f.id] = parentId;

          ops.push((batch) =>
            batch.set(
              foldersCol.doc(f.id!),
              {
                id: f.id,
                name: f.name ?? "(untitled)",
                parentId,
                rootId,
                driveId,
                syncId: state.syncId,
                updatedAt: now,
              },
              { merge: true },
            ),
          );
        } else {
          const type = mediaTypeFromMime(mimeType);
          const ancestors = buildAncestors(parentId, state.parentMap, rootId);

          state.files++;
          state.writes++;

          ops.push((batch) =>
            batch.set(
              filesCol.doc(f.id!),
              {
                id: f.id,
                name: f.name ?? "(untitled)",
                mimeType,
                type,
                parentId,
                folderId: parentId,
                ancestors,
                rootId,
                driveId,
                createdTime: f.createdTime ?? null,
                modifiedTime: f.modifiedTime ?? null,
                webViewLink: f.webViewLink ?? null,
                webContentLink: (f as Record<string, unknown>).webContentLink ?? null,
                thumbUrl: `/api/drive/thumb?id=${encodeURIComponent(f.id!)}&s=400`,
                syncId: state.syncId,
                updatedAt: now,
              },
              { merge: true },
            ),
          );
        }

        if (ops.length >= 400) await flush();
        if (state.writes >= maxWrites) break;
      }

      if (state.writes >= maxWrites) {
        state.pageToken = r.data.nextPageToken ?? null;
        if (!state.pageToken) state.current = null;
        break;
      }

      if (r.data.nextPageToken) {
        state.pageToken = r.data.nextPageToken;
      } else {
        state.pageToken = null;
        state.current = null;
      }
    }

    await flush();

    const hasMore = !!state.current || state.queue.length > 0;

    if (!hasMore && !dry) {
      await metaDoc.set(
        {
          rootId,
          driveId,
          lastRunBy: email,
          lastRunAt: now,
          lastSyncId: state.syncId,
        },
        { merge: true },
      );

      console.log(`Starting cleanup for syncId < ${state.syncId}`);

      await deleteOrphanedDocs(foldersCol, rootId, state.syncId);
      await deleteOrphanedDocs(filesCol, rootId, state.syncId);
    }

    return res.status(200).json({
      ok: true,
      dry,
      config: {
        rootId,
        driveId,
        rootIsSharedDrive: rootId === driveId,
      },
      scanned: {
        folders: state.folders,
        files: state.files,
        writes: state.writes,
        queueRemaining: state.queue.length,
      },
      nextCursor: hasMore ? encodeCursor(state) : null,
    });
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(500).json({ error: msg });
  }
}

async function deleteOrphanedDocs(
  col: FirebaseFirestore.CollectionReference,
  rootId: string,
  currentSyncId: number,
) {
  const snapshot = await col
    .where("rootId", "==", rootId)
    .select("syncId")
    .get();

  if (snapshot.empty) return;

  const orphanRefs = snapshot.docs
    .filter((doc) => {
      const data = doc.data();
      return !data.syncId || data.syncId < currentSyncId;
    })
    .map((doc) => doc.ref);

  if (orphanRefs.length === 0) return;

  console.log(`Deleting ${orphanRefs.length} orphaned items from ${col.id}`);

  // Chunk into batches of 450 to stay under Firestore's 500-write limit
  for (let i = 0; i < orphanRefs.length; i += 450) {
    const chunk = orphanRefs.slice(i, i + 450);
    const batch = col.firestore.batch();
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

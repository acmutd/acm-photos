/* eslint-disable */
import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import admin from "firebase-admin";
import { requireDrive } from "../_lib/driveClient.js";

const ADMIN_EMAIL = "ryan.polasky@acmutd.co";

let dbInstance: admin.firestore.Firestore | null = null;

function getDb() {
  if (dbInstance) return dbInstance;
  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
    return dbInstance;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

  const sa = JSON.parse(raw);
  if (typeof sa.private_key === "string") {
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  }

  admin.initializeApp({
    credential: admin.credential.cert(sa),
  });

  dbInstance = admin.firestore();
  return dbInstance;
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { drive, driveId } = await requireDrive(req);

    const about = await drive.about.get({ fields: "user(emailAddress)" });
    const email = about.data.user?.emailAddress ?? null;
    if (email !== ADMIN_EMAIL)
      return res.status(403).json({ error: "Forbidden" });

    const rootId = process.env.MEDIA_ROOT_FOLDER_ID;
    if (!rootId)
      return res.status(500).json({ error: "Missing MEDIA_ROOT_FOLDER_ID" });

    const dry = first(req.query.dry as any) === "1";
    const maxWrites = Math.min(
      Math.max(
        parseInt(first(req.query.maxWrites as any) ?? "800", 10) || 800,
        1,
      ),
      4000,
    );

    const db = getDb();
    const foldersCol = db.collection("drive_folders");
    const filesCol = db.collection("drive_files");
    const metaDoc = db.collection("drive_index").doc("meta");

    const cursorRaw = first(req.query.cursor as any);
    const cursor = decodeCursor(cursorRaw);

    const state: CursorState = cursor ?? {
      queue: [rootId],
      current: null,
      pageToken: null,
      syncId: Date.now(),
      folders: 0,
      files: 0,
      writes: 0,
    };

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 3. Batching Logic
    const ops: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];

    // @ts-ignore
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

      const r = await drive.files.list({
        q,
        fields:
          "nextPageToken, files(id,name,mimeType,parents,createdTime,modifiedTime,webViewLink)",
        pageSize: 1000,
        pageToken: state.pageToken ?? undefined,
        corpora: "drive",
        driveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      const items = r.data.files ?? [];

      for (const f of items) {
        if (!f?.id) continue;

        const mimeType = f.mimeType ?? "";
        const parentId = f.parents?.[0] ?? null;

        if (mimeType === "application/vnd.google-apps.folder") {
          state.queue.push(f.id);
          state.folders++;
          state.writes++;

          ops.push((batch) =>
            batch.set(
              foldersCol.doc(f.id),
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
          const type =
            mimeType === "image/gif"
              ? "gif"
              : mimeType.startsWith("image/")
                ? "photo"
                : mimeType.startsWith("video/")
                  ? "video"
                  : "other";

          state.files++;
          state.writes++;

          ops.push((batch) =>
            batch.set(
              filesCol.doc(f.id),
              {
                id: f.id,
                name: f.name ?? "(untitled)",
                mimeType,
                type,
                parentId,
                folderId: parentId,
                rootId,
                driveId,
                createdTime: f.createdTime ?? null,
                modifiedTime: f.modifiedTime ?? null,
                webViewLink: f.webViewLink ?? null,
                thumbUrl: `/api/drive/thumb?id=${encodeURIComponent(f.id)}`,
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
      scanned: {
        folders: state.folders,
        files: state.files,
        writes: state.writes,
      },
      nextCursor: hasMore ? encodeCursor(state) : null,
    });
  } catch (e: any) {
    console.error(e);
    const msg = typeof e?.message === "string" ? e.message : "Failed";
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

  const batch = col.firestore.batch();
  let deleteCount = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.syncId || data.syncId < currentSyncId) {
      batch.delete(doc.ref);
      deleteCount++;
    }
  });

  if (deleteCount > 0) {
    console.log(`Deleting ${deleteCount} orphaned items from ${col.id}`);
    await batch.commit();
  }
}

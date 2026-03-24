import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../_lib/firestore.js";
import { requireDrive } from "../_lib/driveClient.js";
import { first, mediaTypeFromMime } from "../_lib/query.js";

const FOLDER_CACHE = new Map<string, { ts: number; items: FolderCacheItem[] }>();
const CACHE_TTL = 1000 * 60 * 5;

type FolderCacheItem = {
  id: string;
  title: string;
  mimeType: string;
  type: "photo" | "video" | "gif" | "other";
  fileExtension: string | null;
  tags: string[];
  thumbUrl: string;
  viewUrl?: string;
  createdAt?: string;
  timestamp: number;
};

function extractTags(name: string): string[] {
  const base = name.toLowerCase();
  const tokens = base
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
  const years = base.match(/\b(19|20)\d{2}\b/g) ?? [];
  const uniq = new Set([...tokens, ...years]);
  return Array.from(uniq).slice(0, 30);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireDrive(req);
    const db = getDb();
    const rootId = process.env.MEDIA_ROOT_FOLDER_ID || process.env.SHARED_DRIVE_ID;
    if (!rootId)
      return res.status(500).json({ error: "Missing MEDIA_ROOT_FOLDER_ID or SHARED_DRIVE_ID" });

    const folderId = (first(req.query.folderId as string | string[]) ?? rootId) as string;
    const sub = first(req.query.sub as string | string[]) !== "0";
    const text = (first(req.query.text as string | string[]) ?? "").trim().toLowerCase();
    const type = (first(req.query.type as string | string[]) ?? "all") as
      | "all"
      | "photo"
      | "video"
      | "gif"
      | "other";
    const sort = (first(req.query.sort as string | string[]) ?? "new") as "new" | "old";
    const tagsRaw = (first(req.query.tags as string | string[]) ?? "").trim();
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const pageSize = Math.min(
      Math.max(parseInt(first(req.query.pageSize as string | string[]) ?? "60", 10) || 60, 1),
      200,
    );
    const pageToken = parseInt(first(req.query.cursor as string | string[]) ?? "0", 10) || 0;

    const cacheKey = `${folderId}::${sub ? "sub" : "flat"}`;
    const now = Date.now();
    const cached = FOLDER_CACHE.get(cacheKey);

    let allItems: FolderCacheItem[] = [];

    if (cached && now - cached.ts < CACHE_TTL) {
      allItems = cached.items;
    } else {
      let q: FirebaseFirestore.Query = db
        .collection("drive_files")
        .where("rootId", "==", rootId);

      if (!sub) {
        q = q.where("folderId", "==", folderId);
      } else if (folderId !== rootId) {
        q = q.where("ancestors", "array-contains", folderId);
      }

      const snapshot = await q.get();

      allItems = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: d.id ?? doc.id,
          title: d.name ?? "(untitled)",
          mimeType: d.mimeType ?? "",
          type: d.type ?? mediaTypeFromMime(d.mimeType ?? ""),
          fileExtension: d.fileExtension ?? null,
          tags: extractTags(d.name ?? ""),
          thumbUrl:
            d.thumbUrl ?? `/api/drive/thumb?id=${encodeURIComponent(d.id)}&s=400`,
          viewUrl: d.webViewLink ?? undefined,
          createdAt: d.createdTime ?? undefined,
          timestamp: d.createdTime ? new Date(d.createdTime).getTime() : 0,
        };
      });

      FOLDER_CACHE.set(cacheKey, { ts: now, items: allItems });
    }

    // Shallow copy so sorting doesn't mutate the cached array
    let processed = [...allItems];

    if (text || tags.length > 0 || type !== "all") {
      processed = processed.filter((item) => {
        if (type !== "all" && item.type !== type) return false;

        if (text) {
          const hay = item.title.toLowerCase();
          const tagMatch = item.tags.some((t: string) => t.includes(text));
          if (!hay.includes(text) && !tagMatch) return false;
        }

        if (tags.length > 0) {
          if (!tags.every((t: string) => item.tags.includes(t))) return false;
        }

        return true;
      });
    }

    if (sort === "new") {
      processed.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      processed.sort((a, b) => a.timestamp - b.timestamp);
    }

    const totalItems = processed.length;
    const sliceStart = pageToken;
    const sliceEnd = Math.min(sliceStart + pageSize, totalItems);
    const pagedItems = processed.slice(sliceStart, sliceEnd);

    const nextCursor = sliceEnd < totalItems ? String(sliceEnd) : null;

    return res.status(200).json({
      items: pagedItems,
      nextCursor,
      total: totalItems,
    });
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(500).json({ error: msg });
  }
}

import type { MediaSearchQuery, MediaItem } from "@/features/drive/types";

export type DriveMediaResponse = {
  items: MediaItem[];
  nextPageToken?: string | null; // non-recursive
  nextCursor?: string | null; // recursive
};

type DriveMediaPageParam =
  | { mode: "direct"; pageToken?: string | null; pageSize?: number }
  | { mode: "recursive"; cursor?: string | null; pageSize?: number };

export async function getDriveMedia(
  q: MediaSearchQuery,
  page?: DriveMediaPageParam,
): Promise<DriveMediaResponse> {
  const sp = new URLSearchParams();
  sp.set("folderId", q.folderId);
  if (q.text.trim()) sp.set("text", q.text.trim());
  if (q.type !== "all") sp.set("type", q.type);
  sp.set("sort", q.sort);
  if (q.tags.length) sp.set("tags", q.tags.join(","));

  if (page?.pageSize) sp.set("pageSize", String(page.pageSize));

  if (!page || page.mode === "direct") {
    if (page?.pageToken != null) sp.set("pageToken", page.pageToken);
  } else {
    sp.set("recursive", "1");
    if (page.cursor != null) sp.set("cursor", page.cursor);
  }

  const r = await fetch(`/api/drive/media?${sp.toString()}`);
  if (!r.ok) throw new Error("Failed to load media");
  return r.json();
}

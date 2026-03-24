/** Extract the first value from a query param that may be string | string[]. */
export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Map a MIME type to the media type bucket used for filtering. */
export function mediaTypeFromMime(
  mime: string,
): "photo" | "video" | "gif" | "other" {
  if (mime === "image/gif") return "gif";
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

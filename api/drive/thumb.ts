import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireDrive } from "../_lib/driveClient.js";
import { first } from "../_lib/query.js";

/** Clamp a thumbnail size to a reasonable range. */
function clampSize(raw: string | undefined): number {
  const n = parseInt(raw ?? "400", 10);
  if (!Number.isFinite(n) || n < 32) return 400;
  return Math.min(n, 1600);
}

/**
 * Drive thumbnailLinks look like `https://lh3.googleusercontent.com/...=s220`.
 * Replace the trailing `=s{N}` with a custom size so the grid can request
 * smaller thumbs and the modal can request larger ones.
 */
function resizeThumbUrl(url: string, size: number): string {
  return url.replace(/=s\d+$/, `=s${size}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { drive, oauth2 } = await requireDrive(req);

    const id = first(req.query.id as string | string[]);
    if (!id) return res.status(400).json({ error: "Missing id" });

    const size = clampSize(first(req.query.s as string | string[]));

    const meta = await drive.files.get({
      fileId: id,
      fields: "thumbnailLink,iconLink",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const rawThumb = meta.data.thumbnailLink ?? "";
    const thumb = rawThumb ? resizeThumbUrl(rawThumb, size) : "";
    const icon = meta.data.iconLink ?? "";

    const access = await oauth2.getAccessToken();
    const token = typeof access === "string" ? access : access?.token;

    if (thumb && token) {
      const r = await fetch(thumb, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        res.setHeader(
          "Content-Type",
          r.headers.get("content-type") ?? "image/jpeg",
        );
        res.setHeader(
          "Cache-Control",
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        );
        const buf = Buffer.from(await r.arrayBuffer());
        return res.status(200).send(buf);
      }
    }

    if (icon) {
      res.statusCode = 302;
      res.setHeader("Location", icon);
      return res.end();
    }

    return res.status(204).end();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(msg === "Not signed in" ? 401 : 500).json({ error: msg });
  }
}

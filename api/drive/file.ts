import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireDrive } from "../_lib/driveClient.js";
import { first } from "../_lib/query.js";
import { pipeline } from "stream";
import { promisify } from "util";

const pipe = promisify(pipeline);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeStream: any = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

    const { drive } = await requireDrive(req);

    const rawId = first(req.query.id as string | string[]);
    if (!rawId) return res.status(400).json({ error: "Missing id" });

    const wantMeta = first(req.query.meta as string | string[]) === "1";

    const meta = await drive.files.get({
      fileId: rawId,
      fields: [
        "id",
        "name",
        "mimeType",
        "fileExtension",
        "size",
        "md5Checksum",
        "createdTime",
        "modifiedTime",
        "parents",
        "webViewLink",
        "webContentLink",
        "shortcutDetails(targetId,targetMimeType)",
      ].join(","),
      supportsAllDrives: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shortcut = (meta.data as any).shortcutDetails;
    const id = shortcut?.targetId ?? rawId;

    if (wantMeta) {
      return res.status(200).json({
        requestedId: rawId,
        resolvedId: id,
        name: meta.data.name ?? null,
        mimeType: meta.data.mimeType ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fileExtension: (meta.data as any).fileExtension ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        size: (meta.data as any).size ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        md5Checksum: (meta.data as any).md5Checksum ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdTime: (meta.data as any).createdTime ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modifiedTime: (meta.data as any).modifiedTime ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parents: (meta.data as any).parents ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        webViewLink: (meta.data as any).webViewLink ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        webContentLink: (meta.data as any).webContentLink ?? null,
        shortcutDetails: shortcut ?? null,
      });
    }

    const mimeType = (shortcut?.targetMimeType ??
      meta.data.mimeType ??
      "") as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sizeStr = (meta.data as any).size as string | undefined;
    const size = sizeStr ? Number(sizeStr) : null;

    if (mimeType.startsWith("application/vnd.google-apps.")) {
      return res.status(400).json({ error: "Not a downloadable binary file" });
    }

    if (mimeType.startsWith("video/")) {
      // Redirect to Drive's built-in viewer — it handles adaptive streaming,
      // transcoding, and playback far better than proxying through serverless.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewLink = (meta.data as any).webViewLink;
      if (viewLink) {
        res.statusCode = 302;
        res.setHeader("Location", viewLink);
        return res.end();
      }
      // Fallback to download if no view link
      res.statusCode = 302;
      res.setHeader(
        "Location",
        `/api/drive/download?id=${encodeURIComponent(id)}`,
      );
      return res.end();
    }

    // Cache images at the edge for 24h, browser for 1h
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    );
    if (mimeType) res.setHeader("Content-Type", mimeType);

    if (size !== null && Number.isFinite(size) && size <= 8 * 1024 * 1024) {
      const rr = await drive.files.get(
        {
          fileId: id,
          alt: "media",
          acknowledgeAbuse: true,
          supportsAllDrives: true,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { responseType: "arraybuffer" } as any,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h: Record<string, string> = (rr.headers as any) || {};
      if (h["content-type"]) res.setHeader("Content-Type", h["content-type"]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buf = Buffer.from(rr.data as any);
      res.setHeader("Content-Length", String(buf.length));
      return res.status(200).send(buf);
    }

    const r = await drive.files.get(
      {
        fileId: id,
        alt: "media",
        acknowledgeAbuse: true,
        supportsAllDrives: true,
      },
      {
        responseType: "stream",
        headers: req.headers.range ? { Range: req.headers.range } : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h: Record<string, string> = (r.headers as any) || {};
    if (h["content-type"]) res.setHeader("Content-Type", h["content-type"]);
    if (h["content-length"] && !h["content-encoding"])
      res.setHeader("Content-Length", h["content-length"]);
    if (h["accept-ranges"]) res.setHeader("Accept-Ranges", h["accept-ranges"]);
    if (h["content-range"]) res.setHeader("Content-Range", h["content-range"]);

    res.statusCode =
      typeof r.status === "number" ? r.status : req.headers.range ? 206 : 200;

    activeStream = r.data;

    const kill = () => {
      try {
        activeStream?.destroy();
      } catch {
        /* empty */
      }
    };

    res.on("close", () => {
      if (timeout) clearTimeout(timeout);
      if (!res.writableEnded) kill();
    });

    timeout = setTimeout(() => {
      kill();
    }, 25_000);

    await pipe(activeStream, res);
    if (timeout) clearTimeout(timeout);
    return;
  } catch (e: unknown) {
    if (timeout) clearTimeout(timeout);
    try {
      activeStream?.destroy();
    } catch {
      /* empty */
    }

    if (res.headersSent) {
      try {
        res.end();
      } catch {
        /* empty */
      }
      return;
    }

    const msg = e instanceof Error ? e.message : "Failed";
    const code = msg === "Not signed in" || msg.includes("401") ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}

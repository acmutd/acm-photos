/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireDrive } from "../_lib/driveClient.js";
import { pipeline } from "stream";
import { promisify } from "util";

const pipe = promisify(pipeline);

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let activeStream: any = null;
  let timeout: any = null;

  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

    const { drive } = await requireDrive(req);

    const rawId = first(req.query.id as any);
    if (!rawId) return res.status(400).json({ error: "Missing id" });

    const wantMeta = first(req.query.meta as any) === "1";

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

    const shortcut = (meta.data as any).shortcutDetails;
    const id = shortcut?.targetId ?? rawId;

    if (wantMeta) {
      return res.status(200).json({
        requestedId: rawId,
        resolvedId: id,
        name: meta.data.name ?? null,
        mimeType: meta.data.mimeType ?? null,
        fileExtension: (meta.data as any).fileExtension ?? null,
        size: (meta.data as any).size ?? null,
        md5Checksum: (meta.data as any).md5Checksum ?? null,
        createdTime: (meta.data as any).createdTime ?? null,
        modifiedTime: (meta.data as any).modifiedTime ?? null,
        parents: (meta.data as any).parents ?? null,
        webViewLink: (meta.data as any).webViewLink ?? null,
        webContentLink: (meta.data as any).webContentLink ?? null,
        shortcutDetails: shortcut ?? null,
      });
    }

    const mimeType = (shortcut?.targetMimeType ??
      meta.data.mimeType ??
      "") as string;
    const sizeStr = (meta.data as any).size as string | undefined;
    const size = sizeStr ? Number(sizeStr) : null;

    if (mimeType.startsWith("application/vnd.google-apps.")) {
      return res.status(400).json({ error: "Not a downloadable binary file" });
    }

    if (mimeType.startsWith("video/")) {
      res.statusCode = 302;
      res.setHeader(
        "Location",
        `/api/drive/download?id=${encodeURIComponent(id)}`,
      );
      return res.end();
    }

    res.setHeader("Cache-Control", "private, max-age=300");
    if (mimeType) res.setHeader("Content-Type", mimeType);

    if (size !== null && Number.isFinite(size) && size <= 8 * 1024 * 1024) {
      const rr = await drive.files.get(
        {
          fileId: id,
          alt: "media",
          acknowledgeAbuse: true,
          supportsAllDrives: true,
        },
        { responseType: "arraybuffer" } as any,
      );

      const h: any = rr.headers || {};
      if (h["content-type"]) res.setHeader("Content-Type", h["content-type"]);
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
      } as any,
    );

    const h: any = r.headers || {};
    if (h["content-type"]) res.setHeader("Content-Type", h["content-type"]);
    if (h["content-length"] && !h["content-encoding"])
      res.setHeader("Content-Length", h["content-length"]);
    if (h["accept-ranges"]) res.setHeader("Accept-Ranges", h["accept-ranges"]);
    if (h["content-range"]) res.setHeader("Content-Range", h["content-range"]);

    res.statusCode =
      typeof r.status === "number" ? r.status : req.headers.range ? 206 : 200;

    activeStream = r.data as any;

    const kill = () => {
      try {
        activeStream?.destroy();
      } catch {
        /* empty */
      }
    };

    res.on("close", () => {
      clearTimeout(timeout);
      if (!res.writableEnded) kill();
    });

    timeout = setTimeout(() => {
      kill();
    }, 25_000);

    await pipe(activeStream, res);
    clearTimeout(timeout);
    return;
  } catch (e: any) {
    clearTimeout(timeout);
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

    const msg = typeof e?.message === "string" ? e.message : "Failed";
    const code = msg === "Not signed in" || msg.includes("401") ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}

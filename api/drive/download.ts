import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../_lib/firestore.js";
import { getSession } from "../_lib/session.js";
import { requireDrive } from "../_lib/driveClient.js";
import { first } from "../_lib/query.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Not signed in" });

    const id = first(req.query.id as string | string[]);
    if (!id) return res.status(400).json({ error: "Missing id" });

    const db = getDb();

    const docSnap = await db.collection("drive_files").doc(id).get();

    if (docSnap.exists) {
      const data = docSnap.data() || {};

      if (
        data.webContentLink &&
        !data.mimeType?.startsWith("application/vnd.google-apps.")
      ) {
        res.setHeader("Cache-Control", "private, max-age=3600");
        return res.redirect(302, data.webContentLink);
      }
    }

    const { drive } = await requireDrive(req);

    const meta = await drive.files.get({
      fileId: id,
      fields: "id, name, mimeType, webContentLink, webViewLink",
      supportsAllDrives: true,
    });

    const mimeType = meta.data.mimeType ?? "";

    if (mimeType.startsWith("application/vnd.google-apps.")) {
      if (meta.data.webViewLink) {
        return res.redirect(302, meta.data.webViewLink);
      }
      return res
        .status(400)
        .json({ error: "Cannot download Google Docs files directly" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = (meta.data as any).webContentLink;
    if (!url) return res.status(404).json({ error: "No webContentLink found" });

    res.setHeader("Cache-Control", "private, max-age=60");
    return res.redirect(302, url);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg.includes("Not Found") || msg.includes("404") ? 404 : 500;
    return res.status(status).json({ error: msg });
  }
}

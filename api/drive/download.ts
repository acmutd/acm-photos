/* eslint-disable */
import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import admin from "firebase-admin";
import { requireDrive } from "../_lib/driveClient.js";

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

let dbInstance: admin.firestore.Firestore | null = null;

function getDb() {
  if (dbInstance) return dbInstance;
  if (admin.apps.length) {
    dbInstance = admin.firestore();
    return dbInstance;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

  const sa = JSON.parse(raw);
  if (typeof sa.private_key === "string")
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");

  admin.initializeApp({ credential: admin.credential.cert(sa) });
  dbInstance = admin.firestore();
  return dbInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

    const id = first(req.query.id as any);
    if (!id) return res.status(400).json({ error: "Missing id" });

    const db = getDb();

    const docSnap = await db.collection("drive_files").doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Not indexed" });
    }

    const data = docSnap.data() || {};

    if (
      data.webContentLink &&
      !data.mimeType?.startsWith("application/vnd.google-apps.")
    ) {
      res.setHeader("Cache-Control", "private, max-age=3600");
      return res.redirect(302, data.webContentLink);
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

    const url = (meta.data as any).webContentLink;
    if (!url) return res.status(404).json({ error: "No webContentLink found" });

    res.setHeader("Cache-Control", "private, max-age=60");
    return res.redirect(302, url);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Failed";
    const status = msg.includes("Not Found") || msg.includes("404") ? 404 : 500;
    return res.status(status).json({ error: msg });
  }
}

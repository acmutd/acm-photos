import type { VercelRequest, VercelResponse } from "@vercel/node";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import admin from "firebase-admin";
import { getSession } from "../_lib/session.js"; // Assuming you have a lighter auth check

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Not signed in" });

    const rootId = process.env.MEDIA_ROOT_FOLDER_ID;
    if (!rootId)
      return res.status(500).json({ error: "Missing MEDIA_ROOT_FOLDER_ID" });

    const db = getDb();

    const snap = await db
      .collection("drive_folders")
      .where("rootId", "==", rootId)
      .select("id", "name", "parentId")
      .get();

    const folders = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: data.id ?? d.id,
          name: data.name ?? "(untitled)",
          parentId: data.parentId ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=3600");

    return res.status(200).json({ rootId, folders });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
}

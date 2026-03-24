import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../_lib/firestore.js";
import { getSession } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Not signed in" });

    const rootId = process.env.MEDIA_ROOT_FOLDER_ID || process.env.SHARED_DRIVE_ID;
    if (!rootId)
      return res.status(500).json({ error: "Missing MEDIA_ROOT_FOLDER_ID or SHARED_DRIVE_ID" });

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
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
}

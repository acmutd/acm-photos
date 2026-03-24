import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../_lib/firestore.js";
import { getSession } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Not signed in" });

    const id = String(req.query.id ?? "");
    if (!id) return res.status(400).json({ error: "Missing ID" });

    const db = getDb();
    const docRef = db.collection("requests").doc(id);

    if (req.method === "GET") {
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Request not found" });
      }

      const d = snap.data()!;
      const item = {
        id: snap.id,
        title: d.title ?? "(untitled)",
        description: d.description ?? "",
        division: d.division ?? "Community",
        status: d.status ?? "open",
        createdAt: d.createdAt ?? null,
        createdByEmail: d.createdByEmail ?? "",
        dateNeededBy: d.dateNeededBy ?? undefined,
        attachmentLinks: d.attachmentLinks ?? [],
        deliverableFolderId: d.deliverableFolderId ?? undefined,
        notes: d.notes ?? undefined,
      };

      return res.status(200).json({ item });
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {};

      if (body.status) {
        if (!["open", "in_progress", "done"].includes(body.status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        updateData.status = body.status;
      }

      if (body.deliverableFolderId !== undefined) {
        updateData.deliverableFolderId = body.deliverableFolderId || null;
      }

      if (body.notes !== undefined) {
        updateData.notes = body.notes || null;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      updateData.updatedAt = new Date().toISOString();
      updateData.updatedByEmail = session.email ?? "unknown";

      await docRef.update(updateData);

      const freshSnap = await docRef.get();
      const d = freshSnap.data()!;

      return res.status(200).json({
        item: {
          id: freshSnap.id,
          ...d,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: unknown) {
    console.error(e);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((e as any).code === 5 || (e instanceof Error && e.message?.includes("NOT_FOUND"))) {
      return res.status(404).json({ error: "Request not found" });
    }
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
}

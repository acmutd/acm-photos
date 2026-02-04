/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VercelRequest, VercelResponse } from "@vercel/node";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import admin from "firebase-admin";
import { getSession } from "../_lib/session.js";

type Division =
  | "Development"
  | "Projects"
  | "Research"
  | "Education"
  | "Media"
  | "HackUTD"
  | "Industry"
  | "Community"
  | "Exec"
  | "Finance";

type RequestStatus = "open" | "in_progress" | "done";

const VALID_DIVISIONS = new Set([
  "Development",
  "Projects",
  "Research",
  "Education",
  "Media",
  "HackUTD",
  "Industry",
  "Community",
  "Exec",
  "Finance",
]);

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

  admin.initializeApp({ credential: admin.credential.cert(sa) });
  dbInstance = admin.firestore();
  return dbInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Not signed in" });

    const db = getDb();
    const col = db.collection("requests");

    if (req.method === "GET") {
      const snapshot = await col.orderBy("createdAt", "desc").get();

      const statusFilter = (req.query.status as string) || "all";
      const divisionFilter = (req.query.division as string) || "all";

      const items = snapshot.docs
        .map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title ?? "(untitled)",
            description: d.description ?? "",
            division: d.division ?? "Community",
            status: d.status ?? "open",
            createdAt: d.createdAt ?? new Date().toISOString(),
            createdByEmail: d.createdByEmail ?? "",
            dateNeededBy: d.dateNeededBy ?? undefined,
            attachmentLinks: d.attachmentLinks ?? [],
            deliverableFolderId: d.deliverableFolderId ?? undefined,
            notes: d.notes ?? undefined,
          };
        })
        .filter((item) => {
          if (statusFilter !== "all" && item.status !== statusFilter)
            return false;
          if (divisionFilter !== "all" && item.division !== divisionFilter)
            return false;
          return true;
        });

      return res.status(200).json({ items });
    }

    if (req.method === "POST") {
      const body = req.body || {};

      // Validation
      if (!body.title || !body.description || !body.division) {
        return res
          .status(400)
          .json({ error: "Missing title, description, or division" });
      }

      if (!VALID_DIVISIONS.has(body.division)) {
        return res.status(400).json({ error: "Invalid division" });
      }

      const now = new Date().toISOString();

      const newDoc = {
        createdAt: now,
        createdByEmail: session.email ?? "unknown",

        title: String(body.title).trim(),
        description: String(body.description).trim(),
        division: body.division as Division,
        status: "open",

        dateNeededBy: body.dateNeededBy
          ? String(body.dateNeededBy).trim()
          : null,
        attachmentLinks: Array.isArray(body.attachmentLinks)
          ? body.attachmentLinks.map(String)
          : [],

        deliverableFolderId: null,
        notes: null,
      };

      const ref = await col.add(newDoc);

      return res.status(201).json({
        item: {
          id: ref.id,
          ...newDoc,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    console.error(e);
    const msg =
      typeof e?.message === "string" ? e.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSession } from "./_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Not signed in" });
  return res.status(200).json({ email: session.email });
}

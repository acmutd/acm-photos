import type { VercelRequest } from "@vercel/node";
import { google } from "googleapis";
import { getSession } from "./session.js";

export async function requireDrive(req: VercelRequest) {
  const session = await getSession(req);
  if (!session) throw new Error("Not signed in");

  const driveId = process.env.SHARED_DRIVE_ID;
  if (!driveId) throw new Error("Missing SHARED_DRIVE_ID");

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );

  oauth2.setCredentials({ refresh_token: session.refresh_token });

  const drive = google.drive({ version: "v3", auth: oauth2 });
  return { drive, driveId, oauth2, session };
}

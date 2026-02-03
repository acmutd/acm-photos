import type {VercelRequest, VercelResponse} from '@vercel/node';
import {google} from 'googleapis';
import {getSession} from '../_lib/session.js';

function first(queryVal: string | string[] | undefined) {
    return Array.isArray(queryVal) ? queryVal[0] : queryVal;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const session = await getSession(req);
    if (!session) return res.status(401).json({error: 'Not signed in'});

    const driveId = process.env.SHARED_DRIVE_ID;
    if (!driveId) return res.status(500).json({error: 'Missing SHARED_DRIVE_ID'});

    const parentId =
        first(req.query.parentId as any) ??
        process.env.MEDIA_ROOT_FOLDER_ID;

    if (!parentId) {
        return res.status(400).json({
            error: 'Missing parentId (and MEDIA_ROOT_FOLDER_ID not set)',
        });
    }

    const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
    );

    oauth2.setCredentials({refresh_token: session.refresh_token});

    const drive = google.drive({version: 'v3', auth: oauth2});

    const r = await drive.files.list({
        q: `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
        fields: 'files(id,name,parents,createdTime,modifiedTime)',
        pageSize: 200,

        corpora: 'drive',
        driveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });

    const folders = (r.data.files ?? []).map((f) => ({
        id: f.id!,
        name: f.name ?? '(untitled)',
        parentId: f.parents?.[0] ?? null,
        createdTime: f.createdTime ?? null,
        modifiedTime: f.modifiedTime ?? null,
    }));

    return res.status(200).json({folders});
}

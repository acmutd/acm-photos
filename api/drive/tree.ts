import type {VercelRequest, VercelResponse} from '@vercel/node';
import {requireDrive} from '../_lib/driveClient.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const {drive, driveId} = await requireDrive(req);

        const rootId = process.env.MEDIA_ROOT_FOLDER_ID;
        if (!rootId) return res.status(500).json({error: 'Missing MEDIA_ROOT_FOLDER_ID'});

        const folders: Array<{ id: string; name: string; parentId: string | null }> = [];

        let pageToken: string | undefined;
        do {
            const r = await drive.files.list({
                q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                fields: 'nextPageToken, files(id,name,parents)',
                pageSize: 1000,
                pageToken,

                corpora: 'drive',
                driveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
            });

            for (const f of r.data.files ?? []) {
                if (!f.id) continue;
                folders.push({
                    id: f.id,
                    name: f.name ?? '(untitled)',
                    parentId: f.parents?.[0] ?? null,
                });
            }

            pageToken = r.data.nextPageToken ?? undefined;
        } while (pageToken);

        return res.status(200).json({rootId, folders});
    } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : 'Failed';
        return res.status(msg === 'Not signed in' ? 401 : 500).json({error: msg});
    }
}

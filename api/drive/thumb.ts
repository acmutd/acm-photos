/* eslint-disable */
import type {VercelRequest, VercelResponse} from '@vercel/node';
import {requireDrive} from '../_lib/driveClient.js';

function first(v: string | string[] | undefined) {
    return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const {drive, oauth2} = await requireDrive(req);

        const id = first(req.query.id as any);
        if (!id) return res.status(400).json({error: 'Missing id'});

        const meta = await drive.files.get({
            fileId: id,
            fields: 'thumbnailLink,iconLink',
            supportsAllDrives: true,
        });

        const thumb = meta.data.thumbnailLink ?? '';
        const icon = meta.data.iconLink ?? '';

        const access = await oauth2.getAccessToken();
        const token = typeof access === 'string' ? access : access?.token;

        if (thumb && token) {
            const r = await fetch(thumb, {headers: {Authorization: `Bearer ${token}`}});
            if (r.ok) {
                res.setHeader('Content-Type', r.headers.get('content-type') ?? 'image/jpeg');
                res.setHeader('Cache-Control', 'private, max-age=300');
                const buf = Buffer.from(await r.arrayBuffer());
                return res.status(200).send(buf);
            }
        }

        if (icon) {
            res.statusCode = 302;
            res.setHeader('Location', icon);
            return res.end();
        }

        return res.status(204).end();
    } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : 'Failed';
        return res.status(msg === 'Not signed in' ? 401 : 500).json({error: msg});
    }
}

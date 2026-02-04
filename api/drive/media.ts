/* eslint-disable */
import type {VercelRequest, VercelResponse} from '@vercel/node';
import {requireDrive} from '../_lib/driveClient.js';

function first(v: string | string[] | undefined) {
    return Array.isArray(v) ? v[0] : v;
}

function escapeQ(s: string) {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function mediaTypeFromMime(mime: string): 'photo' | 'video' | 'gif' | 'other' {
    if (mime === 'image/gif') return 'gif';
    if (mime.startsWith('image/')) return 'photo';
    if (mime.startsWith('video/')) return 'video';
    return 'other';
}

function extractTags(name: string): string[] {
    const base = name.toLowerCase();
    const tokens = base
        .split(/[^a-z0-9]+/g)
        .map((t) => t.trim())
        .filter(Boolean);

    const years = base.match(/\b(19|20)\d{2}\b/g) ?? [];
    const uniq = new Set([...tokens, ...years]);
    return Array.from(uniq).slice(0, 30);
}

type CursorState = {
    queue: string[];
    current: string | null;
    pageToken: string | null;
};

function decodeCursor(cursor: string | undefined): CursorState | null {
    if (!cursor) return null;
    try {
        const json = Buffer.from(cursor, 'base64url').toString('utf8');
        const obj = JSON.parse(json);
        if (!obj || !Array.isArray(obj.queue)) return null;
        return {
            queue: obj.queue,
            current: typeof obj.current === 'string' ? obj.current : null,
            pageToken: typeof obj.pageToken === 'string' ? obj.pageToken : null,
        };
    } catch {
        return null;
    }
}

function encodeCursor(state: CursorState): string {
    return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const {drive, driveId} = await requireDrive(req);

        const folderId = first(req.query.folderId as any);
        const text = (first(req.query.text as any) ?? '').trim();
        const type = (first(req.query.type as any) ?? 'all') as 'all' | 'photo' | 'video' | 'gif' | 'other';
        const sort = (first(req.query.sort as any) ?? 'new') as 'new' | 'old';
        const tagsRaw = (first(req.query.tags as any) ?? '').trim();
        const tags = tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [];

        const recursive = first(req.query.recursive as any) === '1';
        const pageSize = Math.min(Math.max(parseInt(first(req.query.pageSize as any) ?? '60', 10) || 60, 1), 200);

        if (!folderId) return res.status(400).json({error: 'Missing folderId'});

        // @ts-ignore
        function matchesType(mime: string) {
            const mt = mediaTypeFromMime(mime);
            return type === 'all' ? true : mt === type;
        }

        // @ts-ignore
        function toItem(f: any) {
            const mime = f.mimeType ?? '';
            const mType = mediaTypeFromMime(mime);
            const title = f.name ?? '(untitled)';
            const derivedTags = extractTags(title);

            return {
                id: f.id!,
                title,
                type: mType,
                tags: derivedTags,
                thumbUrl: `/api/drive/thumb?id=${encodeURIComponent(f.id!)}`,
                viewUrl: f.webViewLink ?? undefined,
                createdAt: f.createdTime ?? undefined,
            };
        }

        if (!recursive) {
            const pageToken = first(req.query.pageToken as any);

            let q = `'${escapeQ(folderId)}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
            if (text) q += ` and name contains '${escapeQ(text)}'`;

            if (type === 'photo') q += ` and mimeType contains 'image/' and mimeType != 'image/gif'`;
            if (type === 'gif') q += ` and mimeType = 'image/gif'`;
            if (type === 'video') q += ` and mimeType contains 'video/'`;

            const r = await drive.files.list({
                q,
                fields: 'nextPageToken, files(id,name,mimeType,createdTime,thumbnailLink,iconLink,webViewLink)',
                pageSize,
                pageToken: pageToken || undefined,
                orderBy: `createdTime ${sort === 'new' ? 'desc' : 'asc'}`,

                corpora: 'drive',
                driveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
            });

            let items = (r.data.files ?? []).filter((f) => !!f.id).map(toItem);

            if (tags.length) items = items.filter((x) => tags.every((t) => x.tags.includes(t)));

            return res.status(200).json({items, nextPageToken: r.data.nextPageToken ?? null});
        }

        const cursor = decodeCursor(first(req.query.cursor as any));
        const state: CursorState = cursor ?? {queue: [folderId], current: null, pageToken: null};

        const out: any[] = [];

        while (out.length < pageSize) {
            if (!state.current) state.current = state.queue.shift() ?? null;
            if (!state.current) break;

            let q = `'${escapeQ(state.current)}' in parents and trashed = false`;
            if (text) q += ` and name contains '${escapeQ(text)}'`;

            const r = await drive.files.list({
                q,
                fields: 'nextPageToken, files(id,name,mimeType,createdTime,webViewLink)',
                pageSize: 200, // internal page size per folder; output size controlled by `pageSize`
                pageToken: state.pageToken ?? undefined,
                orderBy: `createdTime ${sort === 'new' ? 'desc' : 'asc'}`,

                corpora: 'drive',
                driveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
            });

            for (const f of r.data.files ?? []) {
                if (!f?.id) continue;

                const mime = f.mimeType ?? '';
                const isFolder = mime === 'application/vnd.google-apps.folder';

                if (isFolder) {
                    state.queue.push(f.id);
                    continue;
                }

                if (!matchesType(mime)) continue;

                const item = toItem(f);

                if (tags.length && !tags.every((t) => item.tags.includes(t))) continue;

                out.push(item);
                if (out.length >= pageSize) break;
            }

            if (r.data.nextPageToken && out.length < pageSize) {
                state.pageToken = r.data.nextPageToken;
            } else {
                state.current = null;
                state.pageToken = null;
            }
        }

        const hasMore = !!state.current || state.queue.length > 0 || !!state.pageToken;
        return res.status(200).json({
            items: out,
            nextCursor: hasMore ? encodeCursor(state) : null,
        });
    } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : 'Failed';
        const code = msg === 'Not signed in' ? 401 : 500;
        return res.status(code).json({error: msg});
    }
}

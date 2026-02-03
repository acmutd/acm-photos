import type {VercelRequest, VercelResponse} from '@vercel/node';

type RequestStatus = 'open' | 'in_progress' | 'done';

type RequestTicket = {
    id: string;
    createdAt: string;
    createdByEmail: string;
    division: string;
    title: string;
    description: string;
    attachmentLinks: string[];
    status: RequestStatus;
    deliverableFolderId?: string;
    notes?: string;
};

const g = globalThis as any;
g.__acm_requests = g.__acm_requests ?? ([] as RequestTicket[]);
const store: RequestTicket[] = g.__acm_requests;

function readCookie(req: VercelRequest, name: string) {
    const raw = req.headers.cookie ?? '';
    const part = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
    return part ? part.slice(name.length + 1) : null;
}

function getEmailFromSession(req: VercelRequest): string | null {
    const token = readCookie(req, 'acm_session');
    if (!token) return null;
    try {
        const json = Buffer.from(token, 'base64url').toString('utf8');
        const session = JSON.parse(json) as { email: string };
        return session.email ?? null;
    } catch {
        return null;
    }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
    const email = getEmailFromSession(req);
    if (!email) return res.status(401).json({error: 'Not signed in'});

    const id = String(req.query.id ?? '');
    const item = store.find(t => t.id === id);
    if (!item) return res.status(404).json({error: 'Not found'});

    if (req.method === 'GET') {
        return res.status(200).json({item});
    }

    if (req.method === 'PATCH') {
        const body = (req.body ?? {}) as Partial<RequestTicket>;

        if (body.status) item.status = body.status as any;
        if (typeof body.deliverableFolderId === 'string') item.deliverableFolderId = body.deliverableFolderId;
        if (typeof body.notes === 'string') item.notes = body.notes;

        return res.status(200).json({item});
    }

    return res.status(405).json({error: 'Method not allowed'});
}

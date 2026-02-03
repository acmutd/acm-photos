import type {VercelRequest, VercelResponse} from '@vercel/node';

type Division =
    | 'Development' | 'Projects' | 'Research' | 'Education'
    | 'Media' | 'HackUTD' | 'Industry' | 'Community' | 'Exec' | 'Finance';

type RequestStatus = 'open' | 'in_progress' | 'done';

type RequestTicket = {
    id: string;
    createdAt: string;
    createdByEmail: string;
    division: Division;
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

    if (req.method === 'GET') {
        const status = (req.query.status as string | undefined) ?? 'all';
        const division = (req.query.division as string | undefined) ?? 'all';

        const items = store
            .filter(t => (status === 'all' ? true : t.status === status))
            .filter(t => (division === 'all' ? true : t.division === division))
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

        return res.status(200).json({items});
    }

    if (req.method === 'POST') {
        const body = (req.body ?? {}) as Partial<RequestTicket>;

        if (!body.division || !body.title || !body.description) {
            return res.status(400).json({error: 'Missing fields'});
        }

        const now = new Date().toISOString();
        const ticket: RequestTicket = {
            id: crypto.randomUUID(),
            createdAt: now,
            createdByEmail: email,
            division: body.division as Division,
            title: String(body.title),
            description: String(body.description),
            attachmentLinks: Array.isArray(body.attachmentLinks) ? body.attachmentLinks.map(String) : [],
            status: 'open',
        };

        store.push(ticket);
        return res.status(201).json({item: ticket});
    }

    return res.status(405).json({error: 'Method not allowed'});
}

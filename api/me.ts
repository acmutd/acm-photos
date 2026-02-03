import type {VercelRequest, VercelResponse} from '@vercel/node';

function readCookie(req: VercelRequest, name: string) {
    const raw = req.headers.cookie ?? '';
    const part = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
    return part ? part.slice(name.length + 1) : null;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
    const token = readCookie(req, 'acm_session');
    if (!token) return res.status(401).json({error: 'Not signed in'});

    const json = Buffer.from(token, 'base64url').toString('utf8');
    const session = JSON.parse(json) as { email: string };

    return res.status(200).json({email: session.email});
}

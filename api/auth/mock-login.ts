import type {VercelRequest, VercelResponse} from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

    const {email} = (req.body ?? {}) as { email?: string };
    const allowedDomain = process.env.ALLOWED_DOMAIN ?? 'acmutd.co';

    if (!email || !email.endsWith(`@${allowedDomain}`)) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    const value = Buffer.from(JSON.stringify({email})).toString('base64url');

    res.setHeader(
        'Set-Cookie',
        `acm_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );

    return res.status(200).json({ok: true});
}

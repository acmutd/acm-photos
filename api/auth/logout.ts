import type {VercelRequest, VercelResponse} from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
    res.setHeader('Set-Cookie', 'acm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(200).json({ok: true});
}

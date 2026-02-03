import type {VercelRequest, VercelResponse} from '@vercel/node';
import {google} from 'googleapis';
import {setOAuthStateCookie} from '../../_lib/session.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
    const hd = process.env.ALLOWED_DOMAIN ?? 'acmutd.co';

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const state = crypto.randomUUID();
    await setOAuthStateCookie(res, state);

    const url = oauth2.generateAuthUrl({
        scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/drive.readonly',
        ],
        state,
        access_type: 'offline',
        prompt: 'consent',
        hd,
    });

    res.statusCode = 302;
    res.setHeader('Location', url);
    res.end();
}

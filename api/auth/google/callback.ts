import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import {
  clearOAuthStateCookie,
  readOAuthStateCookie,
  setSessionCookie,
} from "../../_lib/session.js";

function first(queryVal: string | string[] | undefined) {
  return Array.isArray(queryVal) ? queryVal[0] : queryVal;
}

function redirect(res: VercelResponse, path: string) {
  res.statusCode = 302;
  res.setHeader("Location", path);
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
  const allowedDomain = process.env.ALLOWED_DOMAIN ?? "acmutd.co";

  const code = first(req.query.code as any);
  const state = first(req.query.state as any);

  const expectedState = readOAuthStateCookie(req);
  clearOAuthStateCookie(res);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect(res, "/?auth=error&reason=state");
  }

  try {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(code);

    const idToken = tokens.id_token;
    const refreshToken = tokens.refresh_token;

    if (!idToken) return redirect(res, "/?auth=error&reason=no_id_token");
    if (!refreshToken) {
      return redirect(res, "/?auth=error&reason=no_refresh_token");
    }

    const ticket = await oauth2.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email ?? "";
    const hd = (payload as any)?.hd as string | undefined;

    if (!email) return redirect(res, "/?auth=error&reason=no_email");
    if (hd !== allowedDomain)
      return redirect(res, "/?auth=error&reason=wrong_domain");

    await setSessionCookie(res, {
      email,
      hd,
      sub: payload?.sub,
      refresh_token: refreshToken,
    });

    return redirect(res, "/?auth=ok");
  } catch (e) {
    return redirect(res, "/?auth=error&reason=exception");
  }
}

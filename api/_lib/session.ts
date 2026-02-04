import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "crypto";
import { EncryptJWT, jwtDecrypt } from "jose";

const SESSION_COOKIE = "acm_session";
const OAUTH_STATE_COOKIE = "acm_oauth_state";

export type SessionPayload = {
  email: string;
  hd?: string;
  sub?: string;
  refresh_token: string;
};

function isProd() {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

function baseCookieAttrs(maxAgeSeconds: number) {
  const secure = isProd();
  return [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
    secure ? `Secure` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

function parseCookie(req: VercelRequest, name: string) {
  const raw = req.headers.cookie ?? "";
  const part = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

function keyFromSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");
  return createHash("sha256").update(secret).digest();
}

export async function setOAuthStateCookie(res: VercelResponse, state: string) {
  res.setHeader(
    "Set-Cookie",
    `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; ${baseCookieAttrs(600)}`,
  );
}

export function readOAuthStateCookie(req: VercelRequest) {
  return parseCookie(req, OAUTH_STATE_COOKIE);
}

export function clearOAuthStateCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${OAUTH_STATE_COOKIE}=; ${baseCookieAttrs(0)}`);
}

export async function setSessionCookie(
  res: VercelResponse,
  payload: SessionPayload,
) {
  const key = keyFromSecret();

  const token = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(key);

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${baseCookieAttrs(60 * 60 * 24 * 7)}`,
  );
}

export async function getSession(
  req: VercelRequest,
): Promise<SessionPayload | null> {
  const raw = parseCookie(req, SESSION_COOKIE);
  if (!raw) return null;

  try {
    const key = keyFromSecret();
    const { payload } = await jwtDecrypt(raw, key);
    const p = payload as unknown as Partial<SessionPayload>;
    if (!p.email || !p.refresh_token) return null;
    return p as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; ${baseCookieAttrs(0)}`);
}

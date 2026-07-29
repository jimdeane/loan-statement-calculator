import { cookies, headers } from "next/headers";
import { database } from "./db";

export type AppUser = {
  id: string; username: string; displayName: string;
  role: "owner" | "accountant" | "viewer";
  mustChangePassword: boolean; scopes: string[];
};
const COOKIE = "loan_session", SESSION_SECONDS = 12 * 60 * 60, ITERATIONS = 100_000;
function b64(bytes: Uint8Array) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
function bytes(value: string) { const s = atob(value); return Uint8Array.from(s, c => c.charCodeAt(0)); }
export async function sha256(value: string) {
  return b64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
export async function hashPassword(password: string, salt?: string, iterations = ITERATIONS) {
  const saltBytes = salt ? bytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations }, key, 256);
  return { hash: b64(new Uint8Array(bits)), salt: b64(saltBytes), iterations };
}
export async function verifyPassword(password: string, hash: string, salt: string, iterations: number) {
  const a = bytes((await hashPassword(password, salt, iterations)).hash), b = bytes(hash);
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
export function validatePassword(password: string) {
  if (password.length < 14) return "Use at least 14 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Include upper-case, lower-case and numeric characters.";
  return null;
}
export const normaliseUsername = (value: string) => value.trim().toLowerCase();
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin"); return Boolean(origin && origin === new URL(request.url).origin);
}
export async function requestFingerprint() {
  const h = await headers(), ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { ipHash: await sha256(ip), userAgent: (h.get("user-agent") ?? "unknown").slice(0, 500), chatgptEmail: h.get("oai-authenticated-user-email") };
}
export async function userCount() {
  const row = await database().prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  return Number(row?.count ?? 0);
}
export async function createSession(userId: string) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const now = Date.now(), fingerprint = await requestFingerprint();
  await database().prepare("INSERT INTO sessions (id,user_id,token_hash,created_at,expires_at,last_seen_at,ip_hash,user_agent) VALUES (?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await sha256(token), now, now + SESSION_SECONDS * 1000, now, fingerprint.ipHash, fingerprint.userAgent).run();
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
}
export async function clearSession() {
  const jar = await cookies(), token = jar.get(COOKIE)?.value;
  if (token) await database().prepare("UPDATE sessions SET revoked_at=? WHERE token_hash=?").bind(Date.now(), await sha256(token)).run();
  jar.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}
export async function getCurrentUser(): Promise<AppUser | null> {
  const token = (await cookies()).get(COOKIE)?.value; if (!token) return null;
  const now = Date.now(), tokenHash = await sha256(token);
  const row = await database().prepare(`SELECT u.id,u.username,u.display_name displayName,u.role,u.must_change_password mustChangePassword,u.scopes
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.is_active=1`)
    .bind(tokenHash, now).first<Record<string, string | number>>();
  if (!row) return null;
  await database().prepare("UPDATE sessions SET last_seen_at=? WHERE token_hash=?").bind(now, tokenHash).run();
  return { id:String(row.id), username:String(row.username), displayName:String(row.displayName), role:row.role as AppUser["role"], mustChangePassword:Boolean(row.mustChangePassword), scopes:JSON.parse(String(row.scopes)) };
}
export async function audit(eventType: string, actorUserId?: string | null, targetUserId?: string | null, metadata: Record<string, unknown> = {}) {
  const fp = await requestFingerprint();
  await database().prepare("INSERT INTO audit_events (id,actor_user_id,event_type,target_user_id,metadata,ip_hash,created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), actorUserId ?? null, eventType, targetUserId ?? null, JSON.stringify(metadata), fp.ipHash, Date.now()).run();
}

import {
  generateId,
  generateRecoveryCodes,
  getSessionSecret,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./crypto.mjs";
import { sessionsStore, usersStore } from "./store.mjs";

const SESSION_DAYS = 30;
const COOKIE_NAME = "wish_session";

export { COOKIE_NAME };

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function cookieOptions(maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts;
}

export function setSessionCookie(token, maxAgeSeconds = SESSION_DAYS * 86400) {
  const parts = cookieOptions(maxAgeSeconds);
  parts[0] = `${COOKIE_NAME}=${encodeURIComponent(token)}`;
  return parts.join("; ");
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function createUser(username, password) {
  const users = usersStore();
  const key = username.toLowerCase();
  const existing = await users.get(key, { retry: false });
  if (existing) {
    const err = new Error("Username already taken");
    err.status = 409;
    throw err;
  }

  const { salt, hash } = hashPassword(password);
  const recoveryCodes = generateRecoveryCodes(8);
  const recoveryHashes = recoveryCodes.map(hashToken);
  const user = {
    id: generateId("usr"),
    username: key,
    displayName: username,
    passwordSalt: salt,
    passwordHash: hash,
    recoveryHashes,
    createdAt: new Date().toISOString(),
  };
  await users.setJSON(key, user);
  await users.setJSON(`id:${user.id}`, { username: key });
  return { user: publicUser(user), recoveryCodes };
}

export async function loginUser(username, password) {
  const users = usersStore();
  const user = await users.get(username.toLowerCase(), { retry: true });
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }
  return publicUser(user);
}

export async function createSession(userId) {
  const sessions = sessionsStore();
  const token = generateId("ses");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString();
  await sessions.setJSON(hashToken(token + getSessionSecret()), {
    userId,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function destroySession(token) {
  if (!token) return;
  const sessions = sessionsStore();
  await sessions.delete(hashToken(token + getSessionSecret()));
}

export async function getUserFromRequest(event) {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const sessions = sessionsStore();
  const session = await sessions.get(hashToken(token + getSessionSecret()), {
    retry: true,
  });
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await sessions.delete(hashToken(token + getSessionSecret()));
    return null;
  }

  const users = usersStore();
  const index = await users.get(`id:${session.userId}`, { retry: true });
  if (!index?.username) return null;
  const user = await users.get(index.username, { retry: true });
  if (!user) return null;
  return publicUser(user);
}

export async function resetPasswordWithCode(username, recoveryCode, newPassword) {
  const users = usersStore();
  const key = username.toLowerCase();
  const user = await users.get(key);
  if (!user) {
    const err = new Error("Invalid username or recovery code");
    err.status = 401;
    throw err;
  }

  const codeHash = hashToken(recoveryCode.trim().toUpperCase());
  const idx = (user.recoveryHashes || []).indexOf(codeHash);
  if (idx === -1) {
    const err = new Error("Invalid username or recovery code");
    err.status = 401;
    throw err;
  }

  const { salt, hash } = hashPassword(newPassword);
  user.passwordSalt = salt;
  user.passwordHash = hash;
  user.recoveryHashes = user.recoveryHashes.filter((_, i) => i !== idx);
  await users.setJSON(key, user);
  return publicUser(user);
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    recoveryCodesRemaining: (user.recoveryHashes || []).length,
    createdAt: user.createdAt,
  };
}

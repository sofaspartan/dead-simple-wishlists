import {
  generateId,
  generateRecoveryCodes,
  getSessionSecret,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./crypto.mjs";
import { avatarsStore, sessionsStore, usersStore } from "./store.mjs";

const SESSION_DAYS = 30;
const COOKIE_NAME = "wish_session";
const MAX_AVATAR_BYTES = 500_000;

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

export function avatarUrlFor(user) {
  if (!user?.hasAvatar) return null;
  const v = user.avatarVersion || 0;
  return `/api/avatars/${user.id}?v=${v}`;
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    recoveryCodesRemaining: (user.recoveryHashes || []).length,
    createdAt: user.createdAt,
    avatarUrl: avatarUrlFor(user),
  };
}

export function publicOwner(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: avatarUrlFor(user),
  };
}

export async function getRawUserById(userId) {
  if (!userId) return null;
  const users = usersStore();
  const index = await users.get(`id:${userId}`, { retry: true });
  if (!index?.username) return null;
  return users.get(index.username, { retry: true });
}

export async function getOwnerById(userId) {
  const user = await getRawUserById(userId);
  return publicOwner(user);
}

function parseDataUrl(image) {
  if (typeof image !== "string" || !image.startsWith("data:")) {
    const err = new Error("Avatar must be a data URL");
    err.status = 400;
    throw err;
  }
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    image.trim()
  );
  if (!match) {
    const err = new Error("Avatar must be a JPEG, PNG, or WebP image");
    err.status = 400;
    throw err;
  }
  const contentType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const base64 = match[2].replace(/\s+/g, "");
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length) {
    const err = new Error("Avatar image is empty");
    err.status = 400;
    throw err;
  }
  if (bytes.length > MAX_AVATAR_BYTES) {
    const err = new Error("Avatar is too large (max 500KB)");
    err.status = 400;
    throw err;
  }
  return { contentType, base64, bytes };
}

export async function setUserAvatar(userId, imageDataUrl) {
  const users = usersStore();
  const user = await getRawUserById(userId);
  if (!user) {
    const err = new Error("Not signed in");
    err.status = 401;
    throw err;
  }
  const { contentType, base64 } = parseDataUrl(imageDataUrl);
  await avatarsStore().setJSON(userId, { contentType, data: base64 });
  user.hasAvatar = true;
  user.avatarVersion = Date.now();
  await users.setJSON(user.username, user);
  return publicUser(user);
}

export async function clearUserAvatar(userId) {
  const users = usersStore();
  const user = await getRawUserById(userId);
  if (!user) {
    const err = new Error("Not signed in");
    err.status = 401;
    throw err;
  }
  try {
    await avatarsStore().delete(userId);
  } catch {
    /* ignore */
  }
  user.hasAvatar = false;
  user.avatarVersion = Date.now();
  await users.setJSON(user.username, user);
  return publicUser(user);
}

export async function getAvatarRecord(userId) {
  const user = await getRawUserById(userId);
  if (!user?.hasAvatar) return null;
  const record = await avatarsStore().get(userId, { retry: true });
  if (!record?.data) return null;
  return {
    contentType: record.contentType || "image/jpeg",
    data: record.data,
  };
}

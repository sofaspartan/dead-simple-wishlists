import {
  clearSessionCookie,
  createSession,
  createUser,
  destroySession,
  getUserFromRequest,
  loginUser,
  resetPasswordWithCode,
  setSessionCookie,
  COOKIE_NAME,
} from "./lib/auth.mjs";
import {
  addItem,
  claimItem,
  createWishlist,
  deleteItem,
  deleteWishlist,
  getOwnedWishlist,
  getSharedWishlist,
  listWishlistsForUser,
  publicWishlist,
  unclaimItem,
  updateItem,
  updateWishlist,
} from "./lib/wishlists.mjs";

const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

function json(status, body, extraHeaders = {}) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function pathParts(event) {
  const raw =
    event.path ||
    event.rawUrl ||
    event.rawPath ||
    "";
  // Matches /api/..., /.netlify/functions/api/..., or bare function path
  const cleaned = raw
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api/, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  return parts;
}

async function readBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function requireFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || String(obj[f]).trim() === "") {
      const err = new Error(`${f} is required`);
      err.status = 400;
      throw err;
    }
  }
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const method = event.httpMethod;
    const parts = pathParts(event);
    const body = ["POST", "PUT", "PATCH", "DELETE"].includes(method)
      ? await readBody(event)
      : {};

    // Auth routes
    if (parts[0] === "auth") {
      if (parts[1] === "signup" && method === "POST") {
        requireFields(body, ["username", "password"]);
        if (String(body.password).length < 8) {
          return json(400, { error: "Password must be at least 8 characters" });
        }
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(body.username)) {
          return json(400, {
            error: "Username must be 3–32 characters (letters, numbers, underscore)",
          });
        }
        const { user, recoveryCodes } = await createUser(body.username, body.password);
        const session = await createSession(user.id);
        return json(
          201,
          { user, recoveryCodes },
          { "Set-Cookie": setSessionCookie(session.token) }
        );
      }

      if (parts[1] === "login" && method === "POST") {
        requireFields(body, ["username", "password"]);
        const user = await loginUser(body.username, body.password);
        const session = await createSession(user.id);
        return json(200, { user }, { "Set-Cookie": setSessionCookie(session.token) });
      }

      if (parts[1] === "logout" && method === "POST") {
        const cookies = event.headers.cookie || event.headers.Cookie || "";
        const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
        if (match) await destroySession(decodeURIComponent(match[1]));
        return json(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
      }

      if (parts[1] === "me" && method === "GET") {
        const user = await getUserFromRequest(event);
        if (!user) return json(401, { error: "Not signed in" });
        return json(200, { user });
      }

      if (parts[1] === "reset" && method === "POST") {
        requireFields(body, ["username", "recoveryCode", "newPassword"]);
        if (String(body.newPassword).length < 8) {
          return json(400, { error: "Password must be at least 8 characters" });
        }
        const user = await resetPasswordWithCode(
          body.username,
          body.recoveryCode,
          body.newPassword
        );
        const session = await createSession(user.id);
        return json(200, { user }, { "Set-Cookie": setSessionCookie(session.token) });
      }
    }

    // Shared public wishlist
    if (parts[0] === "share" && parts[1]) {
      const slug = parts[1];
      if (method === "GET" && !parts[2]) {
        const list = await getSharedWishlist(slug);
        return json(200, { wishlist: list });
      }
      if (parts[2] === "claim" && method === "POST") {
        requireFields(body, ["itemId"]);
        const list = await claimItem(slug, body.itemId, {
          name: body.name,
          anonymous: body.anonymous,
        });
        return json(200, { wishlist: list });
      }
    }

    // Authenticated wishlist routes
    if (parts[0] === "wishlists") {
      const user = await getUserFromRequest(event);
      if (!user) return json(401, { error: "Not signed in" });

      if (!parts[1] && method === "GET") {
        const wishlists = await listWishlistsForUser(user.id);
        return json(200, { wishlists });
      }

      if (!parts[1] && method === "POST") {
        const wishlist = await createWishlist(user.id, body);
        return json(201, { wishlist });
      }

      const wishlistId = parts[1];
      if (!wishlistId) return json(404, { error: "Not found" });

      if (!parts[2] && method === "GET") {
        const list = await getOwnedWishlist(user.id, wishlistId);
        return json(200, { wishlist: publicWishlist(list, { isOwner: true }) });
      }

      if (!parts[2] && method === "PATCH") {
        const wishlist = await updateWishlist(user.id, wishlistId, body);
        return json(200, { wishlist });
      }

      if (!parts[2] && method === "DELETE") {
        await deleteWishlist(user.id, wishlistId);
        return json(200, { ok: true });
      }

      if (parts[2] === "items" && parts[3] && parts[4] === "unclaim" && method === "POST") {
        const wishlist = await unclaimItem(user.id, wishlistId, parts[3]);
        return json(200, { wishlist });
      }

      if (parts[2] === "items" && parts[3] && method === "PATCH") {
        const wishlist = await updateItem(user.id, wishlistId, parts[3], body);
        return json(200, { wishlist });
      }

      if (parts[2] === "items" && parts[3] && method === "DELETE") {
        const wishlist = await deleteItem(user.id, wishlistId, parts[3]);
        return json(200, { wishlist });
      }

      if (parts[2] === "items" && !parts[3] && method === "POST") {
        const wishlist = await addItem(user.id, wishlistId, body);
        return json(201, { wishlist });
      }
    }

    if (parts[0] === "health" && method === "GET") {
      return json(200, {
        ok: true,
        blobs:
          Boolean(process.env.NETLIFY_BLOBS_CONTEXT) ||
          Boolean(process.env.NETLIFY_DEV) ||
          Boolean(process.env.CONTEXT)
            ? "netlify"
            : "local-file-fallback",
      });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    return json(status, { error: err.message || "Server error" });
  }
}

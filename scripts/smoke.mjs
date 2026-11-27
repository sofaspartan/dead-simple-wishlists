/**
 * Local API smoke test against the function handler (file-backed store).
 * Run: node scripts/smoke.mjs
 */
import { handler } from "../netlify/functions/api.mjs";

function event(method, path, { body, cookie } = {}) {
  const [pathname, qs] = path.split("?");
  const queryStringParameters = {};
  if (qs) {
    for (const part of qs.split("&")) {
      const [k, v = ""] = part.split("=");
      queryStringParameters[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }
  return {
    httpMethod: method,
    path: `/api${pathname}`,
    queryStringParameters,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };
}

function getCookie(res) {
  const set = res.headers?.["Set-Cookie"] || res.headers?.["set-cookie"];
  if (!set) return "";
  return String(set).split(";")[0];
}

async function call(method, path, opts) {
  const res = await handler(event(method, path, opts));
  const data = JSON.parse(res.body || "{}");
  if (res.statusCode >= 400) {
    throw new Error(`${method} ${path} → ${res.statusCode}: ${data.error || res.body}`);
  }
  return { res, data, cookie: getCookie(res) };
}

const user = `smoke_${Date.now().toString(36)}`;
const password = "password123";

console.log("1. health");
const health = await call("GET", "/health");
console.log("   blobs:", health.data.blobs);

console.log("2. signup", user);
const signup = await call("POST", "/auth/signup", {
  body: { username: user, password },
});
const cookie = signup.cookie;
if (!signup.data.recoveryCodes?.length) throw new Error("missing recovery codes");
console.log("   codes:", signup.data.recoveryCodes.length);

console.log("3. me");
const me = await call("GET", "/auth/me", { cookie });
console.log("   user:", me.data.user.username);

console.log("4. create wishlist");
const wl = await call("POST", "/wishlists", {
  cookie,
  body: { title: "Birthday", description: "Stuff I want" },
});
const listId = wl.data.wishlist.id;
const slug = wl.data.wishlist.shareSlug;
console.log("   id:", listId, "slug:", slug);

console.log("5. add item");
const withItem = await call("POST", `/wishlists/${listId}/items`, {
  cookie,
  body: { name: "Mug", url: "https://example.com", price: "$12", notes: "Blue" },
});
const itemId = withItem.data.wishlist.items[0].id;

console.log("6. public share + claim");
const shared = await call("GET", `/share/${slug}`);
console.log("   title:", shared.data.wishlist.title);
const claimed = await call("POST", `/share/${slug}/claim`, {
  body: { itemId, name: "Sam" },
});
if (!claimed.data.wishlist.items[0].claimed) throw new Error("claim failed");

console.log("7. double-claim blocked");
const res = await handler(
  event("POST", `/share/${slug}/claim`, { body: { itemId, name: "Other" } })
);
if (res.statusCode !== 409) throw new Error(`expected 409, got ${res.statusCode}`);

console.log("8. owner unclaim");
await call("POST", `/wishlists/${listId}/items/${itemId}/unclaim`, {
  cookie,
  body: {},
});

console.log("9. anonymous claim");
await call("POST", `/share/${slug}/claim`, {
  body: { itemId, anonymous: true },
});

console.log("10. logout + login");
await call("POST", "/auth/logout", { cookie });
const login = await call("POST", "/auth/login", {
  body: { username: user, password },
});

console.log("11. password reset via recovery code");
await call("POST", "/auth/logout", { cookie: login.cookie });
const code = signup.data.recoveryCodes[0];
const reset = await call("POST", "/auth/reset", {
  body: { username: user, recoveryCode: code, newPassword: "newpassword99" },
});
await call("POST", "/auth/logout", { cookie: reset.cookie });
const relogin = await call("POST", "/auth/login", {
  body: { username: user, password: "newpassword99" },
});

console.log("12. update display name");
const renamed = await call("PATCH", "/auth/me", {
  cookie: relogin.cookie,
  body: { displayName: "Smoke Tester" },
});
if (renamed.data.user.displayName !== "Smoke Tester") {
  throw new Error("display name not updated");
}
const meAfter = await call("GET", "/auth/me", { cookie: relogin.cookie });
if (meAfter.data.user.displayName !== "Smoke Tester") {
  throw new Error("display name not persisted");
}

console.log("13. delete wishlist keeps wishes unlisted");
await call("DELETE", `/wishlists/${listId}`, { cookie: relogin.cookie });
const unlisted = await call("GET", "/wishes?filter=unlisted", {
  cookie: relogin.cookie,
});
if (!unlisted.data.wishes.some((w) => w.id === itemId)) {
  throw new Error("wish should survive wishlist delete as unlisted");
}

console.log("14. create unlisted wish + attach to new list");
const lone = await call("POST", "/wishes", {
  cookie: relogin.cookie,
  body: { name: "Solo mug", wishlistIds: [] },
});
const wl2 = await call("POST", "/wishlists", {
  cookie: relogin.cookie,
  body: { title: "Holidays" },
});
await call("PATCH", `/wishes/${lone.data.wish.id}`, {
  cookie: relogin.cookie,
  body: { wishlistIds: [wl2.data.wishlist.id] },
});
const attached = await call("GET", `/wishlists/${wl2.data.wishlist.id}`, {
  cookie: relogin.cookie,
});
if (!attached.data.wishlist.items.some((i) => i.id === lone.data.wish.id)) {
  throw new Error("wish not attached to wishlist");
}

console.log("\nAll smoke checks passed.");

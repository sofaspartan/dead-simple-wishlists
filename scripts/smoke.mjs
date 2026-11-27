/**
 * Local API smoke test against the function handler (file-backed store).
 * Run: node scripts/smoke.mjs
 */
import { handler } from "../netlify/functions/api.mjs";

function event(method, path, { body, cookie } = {}) {
  return {
    httpMethod: method,
    path: `/api${path}`,
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

console.log("12. delete wishlist");
await call("DELETE", `/wishlists/${listId}`, { cookie: relogin.cookie });

console.log("\nAll smoke checks passed.");

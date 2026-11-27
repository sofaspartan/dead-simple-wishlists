# Wish — dead-simple wishlists

Flat, mobile-friendly wishlists with account auth (recovery codes instead of email), public share links, and item claims. Built for Netlify: static Vite/React UI + Netlify Functions + Netlify Blobs.

## Features

- **Auth:** sign up, log in, log out; one-time recovery codes on signup; password reset via those codes (no email)
- **Wishlists:** create / edit / delete multiple lists; add / edit / delete items (name, optional URL, notes, price)
- **Sharing:** each list has a public `/w/:slug` link; visitors can claim with a name or anonymously; double-claim blocked; owner can see claims and unclaim
- **Storage:** Netlify Blobs (with a local `.data/` file fallback when Blobs context is missing)

## Quick start (local)

```bash
npm install
cp .env.example .env   # optional locally; SESSION_SECRET has a dev default
npm run dev            # Netlify Dev → http://localhost:8888
```

`npm run dev` runs Vite behind Netlify Dev so `/api/*` hits Functions and cookies work on one origin.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Full local stack (`netlify dev`) |
| `npm run dev:ui` | Vite only (UI; API will 404 without a proxy) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run typecheck` | TypeScript only |

### Netlify Blobs: local vs deployed

| Environment | Persistence |
|---|---|
| **`netlify dev`** | Prefer real Blobs local context from the CLI. If that context is unavailable, the API falls back to `.data/blobs/` on disk. |
| **Deployed Netlify site** | Netlify Blobs (durable). Set `SESSION_SECRET` in site env. |
| **Vite alone (`dev:ui`)** | Frontend only — Functions/Blobs are not running. |

Smoke-check storage mode: `GET /api/health` → `{ "blobs": "netlify" | "local-file-fallback" }`.

`.data/` is gitignored. Wipe it to reset local accounts/lists.

## Deploy on Netlify

Repo config is already set in `netlify.toml`:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions | `netlify/functions` |
| SPA fallback | `public/_redirects` → `/* /index.html 200` |

### If `https://dead-simple-wishlists.netlify.app/` shows “Page not found”

That Netlify hostname exists but has **no successful publish of this app**. Merging to `main` alone does nothing until the site is **linked to this GitHub repo** (or you deploy manually). There were no Netlify check-runs on the merge commit, which usually means the site is not connected.

**Fix (dashboard — recommended):**

1. Open [Netlify](https://app.netlify.com/) → find or create the site with subdomain `dead-simple-wishlists`.
2. **Site configuration → Build & deploy → Continuous deployment → Link repository** → `sofaspartan/dead-simple-wishlists`, branch `main`.
3. Confirm build settings match the table above (Netlify should read `netlify.toml`).
4. **Site configuration → Environment variables** → add:
   - `SESSION_SECRET` = a long random string (required in production; sessions are weak/predictable without it)
5. **Deploys → Trigger deploy → Deploy site** (or push any commit to `main`).
6. When the deploy is “Published”, verify:
   - `https://dead-simple-wishlists.netlify.app/` shows **Wish**
   - `https://dead-simple-wishlists.netlify.app/api/health` returns JSON

**Fix (CLI — if you have a Netlify personal access token):**

```bash
# one-time
netlify login
# or: export NETLIFY_AUTH_TOKEN=...

npm run build
netlify link          # pick the dead-simple-wishlists site
netlify env:set SESSION_SECRET "$(openssl rand -hex 32)"
netlify deploy --prod --build
```

Agents in this environment are **not** logged into Netlify (`netlify status` → Not logged in), so production publish must be done from your Netlify account.

Blobs work automatically on a real Netlify deploy; no extra Blobs product setup for the default store API. Secure cookies are set when `CONTEXT=production`.

## Env

| Name | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | Production | Signs session cookie tokens. Dev falls back to a fixed default — change before shipping. |

## API sketch

- `POST /api/auth/signup` `{ username, password }` → user + recovery codes + session cookie
- `POST /api/auth/login` / `logout` / `reset`
- `GET /api/auth/me`
- `GET|POST /api/wishlists`, `GET|PATCH|DELETE /api/wishlists/:id`
- `POST /api/wishlists/:id/items`, `PATCH|DELETE .../items/:itemId`, `POST .../unclaim`
- `GET /api/share/:slug`, `POST /api/share/:slug/claim`

Session cookie: `wish_session` (HttpOnly, SameSite=Lax, Secure in production).

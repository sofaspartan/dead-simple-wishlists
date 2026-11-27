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

1. Connect this repo to Netlify (build: `npm run build`, publish: `dist`, functions: `netlify/functions` — already in `netlify.toml`).
2. Site settings → Environment variables:
   - `SESSION_SECRET` — long random string (required in production)
3. Deploy. Blobs are available automatically on Netlify; no extra Blobs setup for the default store API.
4. Optional: enable HTTPS-only / secure cookies are set when `CONTEXT=production`.

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

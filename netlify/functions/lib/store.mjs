import { connectLambda, getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const ON_LAMBDA = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DIR = join(
  ON_LAMBDA ? "/tmp" : process.cwd(),
  ".data",
  "blobs"
);

let initialized = false;

/**
 * Wire Blobs for classic `handler` Functions.
 * Prefer injected NETLIFY_BLOBS_CONTEXT when present. Only call connectLambda
 * when that env is missing (calling it otherwise can overwrite richer context).
 */
export function initBlobsFromEvent(event) {
  if (initialized) return;
  initialized = true;

  if (process.env.NETLIFY_BLOBS_CONTEXT) {
    return;
  }

  if (!event?.blobs) return;

  try {
    connectLambda(event);
  } catch {
    // Local smoke / non-Netlify: fall through to file store via getStore throw.
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Eventual-consistent get with short retries (no uncachedEdgeURL / strong mode). */
async function getWithRetry(store, key, type = "json", attempts = 6) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    last = await store.get(key, { type });
    if (last != null) return last;
    if (i < attempts - 1) await sleep(40 * (i + 1));
  }
  return last;
}

/** File-backed fallback so local smoke tests work without Blobs context. */
function localStore(name) {
  const dir = join(LOCAL_DIR, name);

  async function ensure() {
    await mkdir(dir, { recursive: true });
  }

  function pathFor(key) {
    const safe = encodeURIComponent(key);
    return join(dir, `${safe}.json`);
  }

  return {
    backend: "local-file-fallback",
    async get(key, opts = {}) {
      await ensure();
      try {
        const raw = await readFile(pathFor(key), "utf8");
        if (opts.type === "json" || opts.type === undefined) {
          return JSON.parse(raw);
        }
        return raw;
      } catch {
        return null;
      }
    },
    async setJSON(key, value) {
      await ensure();
      await writeFile(pathFor(key), JSON.stringify(value), "utf8");
    },
    async set(key, value) {
      await ensure();
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      await writeFile(pathFor(key), payload, "utf8");
    },
    async delete(key) {
      await ensure();
      try {
        await unlink(pathFor(key));
      } catch {
        /* ignore */
      }
    },
    async list() {
      await ensure();
      if (!existsSync(dir)) return { blobs: [] };
      const files = await readdir(dir);
      return {
        blobs: files
          .filter((f) => f.endsWith(".json"))
          .map((f) => ({ key: decodeURIComponent(f.replace(/\.json$/, "")) })),
      };
    },
  };
}

function netlifyStore(name) {
  // Default eventual consistency — strong mode needs uncachedEdgeURL which
  // classic Functions context often lacks.
  const s = getStore(name);
  return {
    backend: "netlify",
    async get(key, opts = {}) {
      const type = opts.type || "json";
      if (opts.retry === false) {
        return s.get(key, { type });
      }
      return getWithRetry(s, key, type);
    },
    async setJSON(key, value) {
      await s.setJSON(key, value);
    },
    async set(key, value) {
      await s.set(key, value);
    },
    async delete(key) {
      await s.delete(key);
    },
    async list() {
      return s.list();
    },
  };
}

/**
 * Prefer Netlify Blobs. Fall back to files only when Blobs cannot initialize
 * (local smoke without Netlify context).
 */
export function store(name) {
  try {
    return netlifyStore(name);
  } catch {
    return localStore(name);
  }
}

export function storageBackend() {
  try {
    getStore("_probe");
    return "netlify";
  } catch {
    return "local-file-fallback";
  }
}

export const usersStore = () => store("users");
export const sessionsStore = () => store("sessions");
export const wishlistsStore = () => store("wishlists");
export const slugIndexStore = () => store("slug-index");
export const userWishlistsStore = () => store("user-wishlists");

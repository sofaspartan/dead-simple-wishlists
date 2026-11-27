import { connectLambda, getStore, setEnvironmentContext } from "@netlify/blobs";
import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const ON_LAMBDA = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DIR = join(
  ON_LAMBDA ? "/tmp" : process.cwd(),
  ".data",
  "blobs"
);

let useStrong = false;

/**
 * Configure Blobs from the Lambda event. Prefer full context (including
 * uncachedEdgeURL when the platform sends it) so reads can be strongly
 * consistent — edge-only access can take tens of seconds to become visible.
 */
export function initBlobsFromEvent(event) {
  if (!event?.blobs) return;
  try {
    const data = JSON.parse(Buffer.from(event.blobs, "base64").toString("utf8"));
    const headers = event.headers || {};
    const siteID = headers["x-nf-site-id"] || headers["X-Nf-Site-Id"];
    const deployID = headers["x-nf-deploy-id"] || headers["X-Nf-Deploy-Id"];
    const uncachedEdgeURL =
      data.url_uncached ||
      data.uncached_edge_url ||
      data.uncachedEdgeURL ||
      data.uncached_url ||
      data.uncachedURL ||
      null;

    setEnvironmentContext({
      siteID,
      deployID,
      token: data.token,
      edgeURL: data.url,
      uncachedEdgeURL: uncachedEdgeURL || undefined,
      primaryRegion: data.primary_region || data.primaryRegion,
      apiURL: data.api_url || data.apiURL,
    });
    useStrong = Boolean(uncachedEdgeURL);
  } catch {
    try {
      connectLambda(event);
      useStrong = false;
    } catch {
      // Local smoke without a real Lambda blobs payload
    }
  }
}

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

/**
 * Eventual Blobs can take several seconds to become visible across isolates.
 * Prefer strong reads when uncachedEdgeURL is available; otherwise retry long
 * enough that signup → /me and login work without a long client-side wait.
 */
async function getWithRetry(store, key, type = "json", attempts = 16) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    try {
      last = await store.get(key, {
        type,
        ...(useStrong ? { consistency: "strong" } : {}),
      });
    } catch {
      last = await store.get(key, { type });
    }
    if (last != null) return last;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return last;
}

function netlifyStore(name) {
  const s = getStore(name);
  return {
    backend: "netlify",
    async get(key, opts = {}) {
      const type = opts.type || "json";
      // retry:false for existence probes that expect a miss
      if (opts.retry === false) {
        try {
          return await s.get(key, {
            type,
            ...(useStrong ? { consistency: "strong" } : {}),
          });
        } catch {
          return s.get(key, { type });
        }
      }
      return getWithRetry(s, key, type);
    },
    async setJSON(key, value) {
      await s.setJSON(key, value);
      // Barrier: don't return until the write is readable (or retries exhaust).
      await getWithRetry(s, key, "json");
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

export function blobsUsesStrong() {
  return useStrong;
}

export async function blobsRoundtrip() {
  const probe = store("health");
  const key = `ping_${Date.now()}`;
  await probe.setJSON(key, { ok: true });
  const read = await probe.get(key);
  try {
    await probe.delete(key);
  } catch {
    /* ignore */
  }
  return Boolean(read?.ok);
}

export const usersStore = () => store("users");
export const sessionsStore = () => store("sessions");
export const wishlistsStore = () => store("wishlists");
export const wishesStore = () => store("wishes");
export const slugIndexStore = () => store("slug-index");
export const userWishlistsStore = () => store("user-wishlists");
export const userWishesStore = () => store("user-wishes");
export const avatarsStore = () => store("avatars");

import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const LOCAL_DIR = join(process.cwd(), ".data", "blobs");

function blobsAvailable() {
  return Boolean(
    process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY_DEV ||
      process.env.CONTEXT ||
      process.env.NETLIFY
  );
}

/** File-backed fallback so `netlify functions:serve` / local smoke tests work without Blobs context. */
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

export function store(name) {
  if (blobsAvailable()) {
    try {
      const s = getStore(name);
      return {
        async get(key, opts = {}) {
          return s.get(key, { type: opts.type || "json" });
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
    } catch {
      // Fall through to local store
    }
  }
  return localStore(name);
}

export const usersStore = () => store("users");
export const sessionsStore = () => store("sessions");
export const wishlistsStore = () => store("wishlists");
export const slugIndexStore = () => store("slug-index");
export const userWishlistsStore = () => store("user-wishlists");

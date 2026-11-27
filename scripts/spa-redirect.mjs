/**
 * Append SPA fallback to dist/_redirects after Vite copies public/.
 * Kept out of public/_redirects so `netlify dev` does not rewrite /api or Vite modules.
 */
import { appendFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const file = join(process.cwd(), "dist", "_redirects");
const spa = "\n/*    /index.html   200\n";
const current = await readFile(file, "utf8").catch(() => "");
if (!current.includes("/*") || !current.includes("/index.html")) {
  await appendFile(file, spa);
  console.log("Appended SPA fallback to dist/_redirects");
}

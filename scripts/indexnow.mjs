// Tells Bing (and through it ChatGPT search, Copilot and DuckDuckGo), Yandex, Seznam and Naver that pages changed.
// Run AFTER the site is deployed, so the crawlers fetch the new version:
//   node scripts/indexnow.mjs              every URL in sitemap.xml
//   node scripts/indexnow.mjs /blog /web-development   only these paths
// The key file <KEY>.txt in the site root proves ownership. Don't delete it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.ansariatif.tech";
const KEY = "16b47773609eac29329c718a16ef24ce";

const args = process.argv.slice(2);
const urls = args.length
  ? args.map((p) => SITE + (p.startsWith("/") ? p : `/${p}`))
  : [...readFileSync(join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
// 200 = accepted, 202 = accepted (key check pending), 403 = key file not found, 422 = URLs don't match the host.
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL${urls.length === 1 ? "" : "s"}`);
if (res.status >= 300) process.exitCode = 1;

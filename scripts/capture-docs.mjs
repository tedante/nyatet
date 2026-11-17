// Refresh the docs screenshots. Run the app, then `npm run docs:capture`.
// Override the app URL with CAPTURE_BASE and the output with CAPTURE_OUT.
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import postgres from "postgres";

process.loadEnvFile(".env.local");

const base = process.env.CAPTURE_BASE ?? "http://localhost:3000";
const out = process.env.CAPTURE_OUT ?? "docs/assets";
const chrome = process.env.CHROME_PATH ?? "/usr/bin/google-chrome-stable";
mkdirSync(out, { recursive: true });

const email = `docs-${randomUUID()}@example.test`;
const signup = await fetch(`${base}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Sam", email, password: "password123" }),
});
if (!signup.ok) throw new Error(`signup failed: ${signup.status}`);

const cookie = signup.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .find((value) => value.startsWith("nyatet_session="));
if (!cookie) throw new Error("no session cookie");

const headers = { "Content-Type": "application/json", Cookie: cookie };
const noteResponse = await fetch(`${base}/api/notes`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    content:
      "# Pack for Lisbon\n\nFlights on the 12th, back on the 19th. #travel\n\n- passport\n- adapter\n- the good camera\n\n> Check the weather before the weekend.",
  }),
});
if (!noteResponse.ok) throw new Error(`note failed: ${noteResponse.status}`);
const { note } = await noteResponse.json();
const shareResponse = await fetch(`${base}/api/notes/${note.id}/shares`, {
  method: "POST",
  headers,
  body: JSON.stringify({ expiresInDays: 30 }),
});
if (!shareResponse.ok) throw new Error(`share failed: ${shareResponse.status}`);
const { share } = await shareResponse.json();
const patchResponse = await fetch(`${base}/api/notes/${note.id}/shares/${share.id}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ slug: "lisbon", name: "Travel plan" }),
});
if (!patchResponse.ok) throw new Error(`share patch failed: ${patchResponse.status}`);

const browser = await chromium.launch({ executablePath: chrome });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const [name, value] = cookie.split("=");
await context.addCookies([{ name, value, url: base }]);
const page = await context.newPage();

async function shot(path, file) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${file}`, fullPage: true });
}

await shot("/home", "home.png");
await shot(`/notes/${note.id}`, "note.png");
await context.clearCookies();
await shot(`/s/${share.token}`, "share.png");

await browser.close();

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
await sql`delete from users where email = ${email}`;
await sql.end();

console.log(`captured home.png, note.png and share.png in ${out}`);

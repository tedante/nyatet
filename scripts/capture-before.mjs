import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import postgres from "postgres";

process.loadEnvFile(".env.local");

const base = process.env.CAPTURE_BASE ?? "http://localhost:3100";
const out = process.env.CAPTURE_OUT ?? ".hallmark/before";
mkdirSync(out, { recursive: true });

const email = process.env.CAPTURE_EMAIL ?? `capture-${randomUUID()}@example.test`;
const signup = await fetch(`${base}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Capture User", email, password: "password123" }),
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
  body: JSON.stringify({ content: "# Capture\n\nA note with **markdown**, a list, and #tags.\n\n- first\n- second\n\n> a quote" }),
});
const { note } = await noteResponse.json();
const shareResponse = await fetch(`${base}/api/notes/${note.id}/shares`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "Capture link", expiresInDays: 7 }),
});
const { share } = await shareResponse.json();

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const [name, value] = cookie.split("=");
await context.addCookies([{ name, value, url: base }]);
const page = await context.newPage();

const shots = [
  ["home", "/home"],
  ["note-detail", `/notes/${note.id}`],
];
for (const [slug, path] of shots) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${slug}-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: `${out}/${slug}-375.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
}

const publicPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await publicPage.goto(`${base}/s/${share.token}`, { waitUntil: "domcontentloaded" });
await publicPage.evaluate(() => document.fonts.ready);
await publicPage.screenshot({ path: `${out}/public-share-1440.png`, fullPage: true });
await publicPage.setViewportSize({ width: 375, height: 812 });
await publicPage.screenshot({ path: `${out}/public-share-375.png`, fullPage: true });

await browser.close();

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
await sql`delete from users where email = ${email}`;
await sql.end();

console.log(`captured to ${out}; note ${note.id}`);

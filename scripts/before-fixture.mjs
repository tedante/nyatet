import postgres from "postgres";

process.loadEnvFile(".env.local");

const base = "http://localhost:3100";
const email = "before-record@example.test";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
await sql`delete from users where email = ${email}`;

const signup = await fetch(`${base}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Before Record", email, password: "password123" }),
});
if (!signup.ok) throw new Error(`signup failed: ${signup.status}`);

const cookie = signup.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .find((value) => value.startsWith("nyatet_session="));

const headers = { "Content-Type": "application/json", Cookie: cookie };
const noteResponse = await fetch(`${base}/api/notes`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    content:
      "# A note worth reading\n\nA paragraph with **bold**, a [link](https://example.com), and #tags.\n\n- first item\n- second item\n\n> A quote that runs a little longer than one line, so the measure is visible.\n\n```js\nconst answer = 42;\n```\n\n| Column | Value |\n| --- | --- |\n| One | 1 |\n| Two | 2 |",
  }),
});
const { note } = await noteResponse.json();
const shareResponse = await fetch(`${base}/api/notes/${note.id}/shares`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "Before record", expiresInDays: 30 }),
});
const { share } = await shareResponse.json();

await sql.end();
console.log(JSON.stringify({ email, noteId: note.id, token: share.token }));

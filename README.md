# Nyatet

A small note-taking app: markdown notes, tags, search, and read-only share links. Built to run on the free Vercel tier with a free Neon Postgres database.

## Features

- Email and password accounts with a JWT session cookie
- Markdown notes with `#tags`, pin, edit, delete
- Timeline with text search and tag filter
- Share links with a name, a readable slug, optional expiry, revoke, and a public read-only page at `/s/:token` or `/s/:slug`

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM, Postgres, jose.

## Local development

Requirements: Node.js 20+, Docker.

```bash
cp .env.example .env.local
# set AUTH_SECRET in .env.local: openssl rand -base64 32
docker compose up -d
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000, create an account, and write a note.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run test` | Unit tests against the local database |
| `npm run test:e2e` | Browser tests |
| `npm run db:push` | Apply the schema to the database in `.env.local` |
| `npm run db:generate` | Generate SQL migrations into `drizzle/` |
| `npm run db:studio` | Open Drizzle Studio |

## Deploy to Vercel

1. Create a Neon project and copy the pooled connection string.
2. Push this repo to GitHub and import it in Vercel.
3. Add environment variables in Vercel:
   - `DATABASE_URL`: the Neon pooled connection string
   - `AUTH_SECRET`: output of `openssl rand -base64 32`
4. Create the tables once from your machine:

   ```bash
   DATABASE_URL="postgres://...neon.tech/neondb?sslmode=require" \
     node ./node_modules/drizzle-kit/bin.cjs push
   ```

5. Deploy.

Neon's free tier suspends an idle database, so the first request after a pause is slower.

## Data model

- `users`: id, email, name, password hash
- `notes`: id, user id, markdown content, pinned, timestamps
- `note_shares`: id, note id, random token, optional readable slug, optional name, optional expiry

Tags are derived from note content at read time, not stored.

## Security notes

- Passwords are hashed with scrypt and a random salt.
- The session cookie is httpOnly, SameSite=Lax, and Secure in production.
- Share tokens are 24 random bytes, read-only, revocable, and can expire.
- A share slug is a readable alias and is guessable by nature. The random token stays the private form.
- Markdown is sanitized with `rehype-sanitize` before rendering.
- Auth endpoints have no rate limiting yet.

## Not in this MVP

Password reset, email verification, attachments, comments, reactions, spaces, a public explore timeline, and note history.

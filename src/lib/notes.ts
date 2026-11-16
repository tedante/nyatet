import { randomBytes } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "./db";
import { noteShares, notes, users } from "./db/schema";
import type { Note, Share } from "./types";

const TAG_PATTERN = /(?:^|[\s(])#([\p{L}\p{N}_-]+)/gu;
const DAY_MS = 24 * 60 * 60 * 1000;

export function extractTags(content: string): string[] {
  const tags = new Set<string>();
  for (const match of content.matchAll(TAG_PATTERN)) {
    tags.add(match[1].toLowerCase());
  }
  return [...tags];
}

type NoteRow = typeof notes.$inferSelect;

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    content: row.content,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tags: extractTags(row.content),
  };
}

type ShareRow = typeof noteShares.$inferSelect;

function isExpired(expiresAt: Date | null): boolean {
  return expiresAt ? expiresAt.getTime() <= Date.now() : false;
}

function toShare(row: ShareRow): Share {
  return {
    id: row.id,
    token: row.token,
    slug: row.slug,
    name: row.name,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    expired: isExpired(row.expiresAt),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotes(userId: string): Promise<Note[]> {
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.pinned), desc(notes.createdAt))
    .limit(200);
  return rows.map(toNote);
}

export async function getNote(userId: string, id: string): Promise<Note | null> {
  const [row] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .limit(1);
  return row ? toNote(row) : null;
}

export async function createNote(userId: string, content: string): Promise<Note> {
  const [row] = await db.insert(notes).values({ userId, content }).returning();
  return toNote(row);
}

export async function updateNote(
  userId: string,
  id: string,
  patch: { content?: string; pinned?: boolean },
): Promise<Note | null> {
  const [row] = await db
    .update(notes)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return row ? toNote(row) : null;
}

export async function deleteNote(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });
  return rows.length > 0;
}

export async function listShares(userId: string, noteId: string): Promise<Share[]> {
  const rows = await db
    .select({ share: noteShares })
    .from(noteShares)
    .innerJoin(notes, eq(noteShares.noteId, notes.id))
    .where(and(eq(noteShares.noteId, noteId), eq(notes.userId, userId)))
    .orderBy(desc(noteShares.createdAt));
  return rows.map((row) => toShare(row.share));
}

export async function createShare(
  userId: string,
  noteId: string,
  expiresInDays: number | null,
): Promise<Share | null> {
  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  if (!note) return null;

  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * DAY_MS) : null;

  const [row] = await db
    .insert(noteShares)
    .values({
      noteId,
      token: randomBytes(24).toString("base64url"),
      expiresAt,
    })
    .returning();
  return toShare(row);
}

export async function updateShare(
  userId: string,
  noteId: string,
  shareId: string,
  patch: { slug?: string | null; name?: string | null; expiresInDays?: number | null },
): Promise<Share | null> {
  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  if (!note) return null;

  const values: { slug?: string | null; name?: string | null; expiresAt?: Date | null } = {};
  if (patch.slug !== undefined) values.slug = patch.slug === "" ? null : patch.slug;
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.expiresInDays !== undefined) {
    values.expiresAt =
      patch.expiresInDays === null ? null : new Date(Date.now() + patch.expiresInDays * DAY_MS);
  }

  const [row] = await db
    .update(noteShares)
    .set(values)
    .where(and(eq(noteShares.id, shareId), eq(noteShares.noteId, noteId)))
    .returning();
  return row ? toShare(row) : null;
}

export async function deleteShare(
  userId: string,
  noteId: string,
  shareId: string,
): Promise<boolean> {
  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  if (!note) return false;

  const rows = await db
    .delete(noteShares)
    .where(and(eq(noteShares.id, shareId), eq(noteShares.noteId, noteId)))
    .returning({ id: noteShares.id });
  return rows.length > 0;
}

export async function getSharedNote(
  slugOrToken: string,
): Promise<{ note: Note; author: string } | null> {
  const slug = slugOrToken.toLowerCase();
  const [row] = await db
    .select({ note: notes, share: noteShares, author: users.name })
    .from(noteShares)
    .innerJoin(notes, eq(noteShares.noteId, notes.id))
    .innerJoin(users, eq(notes.userId, users.id))
    .where(or(eq(noteShares.slug, slug), eq(noteShares.token, slugOrToken)))
    .limit(1);

  if (!row) return null;
  if (isExpired(row.share.expiresAt)) return null;

  return { note: toNote(row.note), author: row.author };
}

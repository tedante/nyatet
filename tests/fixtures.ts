import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { noteShares, notes, users } from "@/lib/db/schema";

export function uniqueEmail(): string {
  return `test-${randomUUID()}@example.test`;
}

export async function createUser() {
  const [row] = await db
    .insert(users)
    .values({
      email: uniqueEmail(),
      name: "Test User",
      passwordHash: "scrypt$test$test",
    })
    .returning();
  return row;
}

export async function createNote(userId: string, content = "A test note #tag") {
  const [row] = await db.insert(notes).values({ userId, content }).returning();
  return row;
}

export async function createShare(
  noteId: string,
  values: { name?: string | null; expiresAt?: Date | null } = {},
) {
  const [row] = await db
    .insert(noteShares)
    .values({ noteId, token: randomUUID(), ...values })
    .returning();
  return row;
}

export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export async function deleteUsers(userIds: string[]) {
  while (userIds.length > 0) {
    await deleteUser(userIds.pop()!);
  }
}

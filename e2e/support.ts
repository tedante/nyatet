import { randomUUID } from "node:crypto";
import postgres from "postgres";
import type { BrowserContext } from "@playwright/test";

export const PASSWORD = "password123";

export function uniqueEmail(): string {
  return `e2e-${randomUUID()}@example.test`;
}

export async function signup(
  context: BrowserContext,
  email: string,
  name = "E2E User",
): Promise<void> {
  const response = await context.request.post("/api/auth/signup", {
    data: { name, email, password: PASSWORD },
  });
  if (!response.ok()) {
    throw new Error(`signup failed with ${response.status()}`);
  }
}

export async function deleteAccount(email: string): Promise<void> {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    await sql`delete from users where email = ${email}`;
  } finally {
    await sql.end();
  }
}

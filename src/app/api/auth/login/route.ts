import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  const valid = row ? await verifyPassword(parsed.data.password, row.passwordHash) : false;
  if (!row || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession({ id: row.id, email: row.email, name: row.name });
  return NextResponse.json({ user: { id: row.id, email: row.email, name: row.name } });
}

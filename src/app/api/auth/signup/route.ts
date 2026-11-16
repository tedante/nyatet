import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { users } from "@/lib/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

const schema = z.object({
  email: z.email().trim().toLowerCase(),
  name: z.string().trim().min(1).max(60),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a name, a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const { email, name, password } = parsed.data;

  try {
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash: await hashPassword(password) })
      .returning({ id: users.id, email: users.email, name: users.name });

    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    }
    throw error;
  }
}

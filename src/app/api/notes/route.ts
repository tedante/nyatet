import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createNote, listNotes } from "@/lib/notes";

const schema = z.object({
  content: z.string().trim().min(1).max(10000),
});

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ notes: await listNotes(user.id) });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Note content is required." }, { status: 400 });
  }

  return NextResponse.json({ note: await createNote(user.id, parsed.data.content) }, { status: 201 });
}

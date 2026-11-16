import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { deleteNote, updateNote } from "@/lib/notes";

const schema = z
  .object({
    content: z.string().trim().min(1).max(10000).optional(),
    pinned: z.boolean().optional(),
  })
  .refine((value) => value.content !== undefined || value.pinned !== undefined);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { id } = await params;
  const note = await updateNote(user.id, id, parsed.data);
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  return NextResponse.json({ note });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const removed = await deleteNote(user.id, id);
  if (!removed) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}

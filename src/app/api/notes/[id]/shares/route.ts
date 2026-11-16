import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createShare, getNote, listShares } from "@/lib/notes";

const schema = z.object({
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await getNote(user.id, id))) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json({ shares: await listShares(user.id, id) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid expiry." }, { status: 400 });
  }

  const { id } = await params;
  const share = await createShare(user.id, id, parsed.data.expiresInDays ?? null);
  if (!share) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  return NextResponse.json({ share }, { status: 201 });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteShare } from "@/lib/notes";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, shareId } = await params;
  const removed = await deleteShare(user.id, id, shareId);
  if (!removed) return NextResponse.json({ error: "Share not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}

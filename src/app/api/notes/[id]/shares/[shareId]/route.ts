import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { deleteShare, updateShare } from "@/lib/notes";

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .max(60, "Name must be 60 characters or fewer.")
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .optional(),
    expiresInDays: z
      .number()
      .int("Expiry must be a whole number of days.")
      .min(1, "Expiry must be between 1 and 365 days.")
      .max(365, "Expiry must be between 1 and 365 days.")
      .nullable()
      .optional(),
  })
  .refine((value) => value.name !== undefined || value.expiresInDays !== undefined, {
    message: "Nothing to update.",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nothing to update." },
      { status: 400 },
    );
  }

  const { id, shareId } = await params;
  const share = await updateShare(user.id, id, shareId, parsed.data);
  if (!share) return NextResponse.json({ error: "Share not found." }, { status: 404 });

  return NextResponse.json({ share });
}

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

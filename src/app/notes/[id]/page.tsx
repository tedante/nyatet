import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { NoteDetail } from "@/components/NoteDetail";
import { getSession } from "@/lib/auth";
import { getNote, listShares } from "@/lib/notes";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const note = await getNote(user.id, id);
  if (!note) notFound();

  const shares = await listShares(user.id, id);

  return (
    <>
      <Header name={user.name} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6 sm:px-6">
        <Link href="/home" className="text-sm font-semibold text-ink hover:underline">
          Back to notes
        </Link>
        <div className="mt-6">
          <NoteDetail note={note} shares={shares} />
        </div>
      </main>
    </>
  );
}

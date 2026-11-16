import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";
import { getSharedNote } from "@/lib/notes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SharedNotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shared = await getSharedNote(token);
  if (!shared) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <header className="mb-6 flex items-center justify-between text-sm text-stone-500">
        <span className="text-lg font-semibold tracking-tight text-stone-900">Nyatet</span>
        <span>Shared note</span>
      </header>

      <article className="rounded-xl border border-stone-200 bg-white p-6">
        <Markdown content={shared.note.content} />
        <footer className="mt-6 border-t border-stone-100 pt-3 text-xs text-stone-500">
          Shared by {shared.author} · {formatDate(shared.note.createdAt)}
        </footer>
      </article>
    </main>
  );
}

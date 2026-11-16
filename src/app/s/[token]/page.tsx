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
    <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between border-b-[3px] border-ink pb-3">
        <span className="font-display text-lg font-bold uppercase tracking-[-0.005em] text-ink">
          Nyatet
        </span>
        <span className="text-xs font-semibold text-muted">Shared note</span>
      </div>

      <article className="mt-6 border-[3px] border-ink bg-paper-3 p-5 sm:p-8">
        <Markdown content={shared.note.content} />

        <footer className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-ink pt-3 text-xs text-muted">
          <span>Shared by {shared.author}</span>
          <span>{formatDate(shared.note.createdAt)}</span>
        </footer>
      </article>
    </main>
  );
}

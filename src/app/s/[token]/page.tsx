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
    <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between border-b border-ink pb-3 text-sm">
        <span className="font-display font-bold tracking-[-0.04em] text-ink">Nyatet</span>
        <span className="text-muted">Shared note</span>
      </div>

      <article className="mt-8">
        <Markdown content={shared.note.content} />

        <footer className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule pt-3 text-xs text-muted">
          <span>Shared by {shared.author}</span>
          <span>{formatDate(shared.note.createdAt)}</span>
          <span className="ml-auto font-display font-bold tracking-[-0.04em] text-ink">Nyatet</span>
        </footer>
      </article>
    </main>
  );
}

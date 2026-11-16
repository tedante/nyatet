"use client";

import { useMemo, useState } from "react";
import { NoteCard } from "./NoteCard";
import type { Note } from "@/lib/types";

export function Timeline({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))].sort(),
    [notes],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes.filter(
      (note) =>
        (!tag || note.tags.includes(tag)) &&
        (!needle || note.content.toLowerCase().includes(needle)),
    );
  }, [notes, query, tag]);

  async function refresh() {
    const response = await fetch("/api/notes");
    if (response.ok) {
      const data = await response.json();
      setNotes(data.notes);
    }
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;

    setPosting(true);
    setError(null);
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setPosting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not save the note.");
      return;
    }

    setDraft("");
    await refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={addNote}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={3}
          placeholder="What is on your mind? Use #tags to group notes."
          className="w-full resize-y rounded-[12px] border border-muted bg-paper px-4 py-3 text-md leading-relaxed text-ink placeholder:text-muted"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">Markdown. Ctrl/Cmd + Enter to save.</span>
          <button
            type="submit"
            disabled={posting || !draft.trim()}
            className="rounded-[10px] bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-2 disabled:opacity-50"
          >
            {posting ? "Saving..." : "Save note"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes"
          className="min-w-40 flex-1 rounded-[10px] border border-muted bg-paper px-3 py-2 text-sm text-ink"
        />
        {tag && (
          <button
            onClick={() => setTag(null)}
            className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper"
          >
            #{tag} ×
          </button>
        )}
        {tags
          .filter((item) => item !== tag)
          .map((item) => (
            <button
              key={item}
              onClick={() => setTag(item)}
              className="rounded-full border border-rule px-3 py-1 text-xs font-semibold text-ink-2 hover:border-ink"
            >
              #{item}
            </button>
          ))}
      </div>

      {visible.length === 0 ? (
        <p className="border-t border-ink py-10 text-sm text-muted">
          {notes.length === 0
            ? "No notes yet. Write the first one above."
            : "No notes match this filter."}
        </p>
      ) : (
        <div className="border-t border-ink">
          {visible.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onChanged={refresh}
              onDeleted={refresh}
              onTagClick={setTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

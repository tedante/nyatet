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
    <div className="space-y-5">
      <form onSubmit={addNote} className="rounded-xl border border-stone-200 bg-white p-3">
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
          className="w-full resize-y bg-transparent text-sm outline-none placeholder:text-stone-400"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-stone-400">Markdown, Ctrl/Cmd + Enter to save</span>
          <button
            type="submit"
            disabled={posting || !draft.trim()}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {posting ? "Saving..." : "Save note"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes"
          className="min-w-40 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-teal-600"
        />
        {tag && (
          <button
            onClick={() => setTag(null)}
            className="rounded-full bg-teal-700 px-3 py-1 text-xs text-white"
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
              className="rounded-full bg-white px-3 py-1 text-xs text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
            >
              #{item}
            </button>
          ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          {notes.length === 0 ? "No notes yet. Write the first one above." : "No notes match this filter."}
        </p>
      ) : (
        <div className="space-y-4">
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

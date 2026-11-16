"use client";

import { useState } from "react";
import Link from "next/link";
import { Markdown } from "./Markdown";
import { formatDate } from "@/lib/format";
import { tagFill } from "@/lib/tag-color";
import type { Note } from "@/lib/types";

type Props = {
  note: Note;
  onChanged: () => void;
  onDeleted: () => void;
  onTagClick: (tag: string) => void;
};

export function NoteCard({ note, onChanged, onDeleted, onTagClick }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note.content);
  const [pending, setPending] = useState(false);

  async function patch(body: { content?: string; pinned?: boolean }) {
    setPending(true);
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (response.ok) onChanged();
  }

  async function saveEdit() {
    if (!value.trim()) return;
    await patch({ content: value });
    setEditing(false);
  }

  async function remove() {
    if (!window.confirm("Delete this note?")) return;
    setPending(true);
    const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    setPending(false);
    if (response.ok) onDeleted();
  }

  return (
    <article className="border-b-2 border-ink py-5">
      {editing ? (
        <div>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            className="w-full resize-y bg-transparent text-md leading-relaxed text-ink"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={pending}
              className="border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold uppercase text-paper hover:bg-paper hover:text-ink disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => {
                setValue(note.content);
                setEditing(false);
              }}
              className="border-2 border-ink px-4 py-2 text-sm font-semibold uppercase text-ink hover:bg-ink hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <Markdown content={note.content} />
      )}

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={`border-2 border-ink px-2.5 py-0.5 text-xs font-semibold uppercase ${tagFill(tag)}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
        {note.pinned && (
          <span className="border-2 border-ink bg-ink px-2 py-0.5 text-xs font-semibold text-paper">
            Pinned
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Link
            href={`/notes/${note.id}`}
            className="font-semibold uppercase text-ink underline decoration-2 underline-offset-4 hover:decoration-[3px]"
          >
            Open
          </Link>
          <button
            onClick={() => patch({ pinned: !note.pinned })}
            disabled={pending}
            className="font-semibold uppercase text-ink hover:underline"
          >
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="font-semibold uppercase text-ink hover:underline"
          >
            Edit
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="font-semibold uppercase text-ink hover:underline"
          >
            Delete
          </button>
        </div>
      </footer>
    </article>
  );
}

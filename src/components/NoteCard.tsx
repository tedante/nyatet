"use client";

import { useState } from "react";
import Link from "next/link";
import { Markdown } from "./Markdown";
import { formatDate } from "@/lib/format";
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
    <article className="rounded-xl border border-stone-200 bg-white p-4">
      {editing ? (
        <div>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            className="w-full resize-y rounded-lg border border-stone-300 p-3 text-sm outline-none focus:border-teal-600"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={pending}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => {
                setValue(note.content);
                setEditing(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
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
              className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
        <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
        {note.pinned && <span className="text-teal-700">Pinned</span>}
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/notes/${note.id}`} className="hover:text-stone-900">
            Open
          </Link>
          <button onClick={() => patch({ pinned: !note.pinned })} disabled={pending} className="hover:text-stone-900">
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={() => setEditing(true)} className="hover:text-stone-900">
            Edit
          </button>
          <button onClick={remove} disabled={pending} className="hover:text-red-600">
            Delete
          </button>
        </div>
      </footer>
    </article>
  );
}

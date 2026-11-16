"use client";

import { useState } from "react";
import { Markdown } from "./Markdown";
import { formatDate } from "@/lib/format";
import type { Note, Share } from "@/lib/types";

export function NoteDetail({ note: initialNote, shares: initialShares }: { note: Note; shares: Share[] }) {
  const [note, setNote] = useState(initialNote);
  const [shares, setShares] = useState(initialShares);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote.content);
  const [expiry, setExpiry] = useState("0");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveEdit() {
    if (!draft.trim()) return;
    setPending(true);
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setPending(false);
    if (response.ok) {
      const data = await response.json();
      setNote(data.note);
      setEditing(false);
    }
  }

  async function loadShares() {
    const response = await fetch(`/api/notes/${note.id}/shares`);
    if (response.ok) {
      const data = await response.json();
      setShares(data.shares);
    }
  }

  async function createShare() {
    setPending(true);
    const days = Number(expiry);
    const response = await fetch(`/api/notes/${note.id}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: days > 0 ? days : null }),
    });
    setPending(false);
    if (response.ok) await loadShares();
  }

  async function revokeShare(share: Share) {
    if (!window.confirm("Revoke this link? Anyone using it will lose access.")) return;
    const response = await fetch(`/api/notes/${note.id}/shares/${share.id}`, { method: "DELETE" });
    if (response.ok) await loadShares();
  }

  async function copyLink(share: Share) {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${share.token}`);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-stone-200 bg-white p-5">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={8}
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
                  setDraft(note.content);
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

        <footer className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
          <span>Created {formatDate(note.createdAt)}</span>
          <button onClick={() => setEditing(true)} className="ml-auto hover:text-stone-900">
            Edit
          </button>
        </footer>
      </article>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Share links</h2>
        <p className="mt-1 text-xs text-stone-500">
          Anyone with a link can read this note. No account needed. Revoke a link to stop access.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-teal-600"
          >
            <option value="0">Never expires</option>
            <option value="1">Expires in 1 day</option>
            <option value="7">Expires in 7 days</option>
            <option value="30">Expires in 30 days</option>
          </select>
          <button
            onClick={createShare}
            disabled={pending}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Create link
          </button>
        </div>

        {shares.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No links yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {shares.map((share) => (
              <li key={share.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <code className="text-xs text-stone-600">/s/{share.token}</code>
                <span className="text-xs text-stone-400">
                  {share.expiresAt ? `Expires ${formatDate(share.expiresAt)}` : "Never expires"}
                </span>
                <div className="ml-auto flex items-center gap-3 text-xs">
                  <button onClick={() => copyLink(share)} className="text-teal-700 hover:underline">
                    {copiedId === share.id ? "Copied" : "Copy"}
                  </button>
                  <button onClick={() => revokeShare(share)} className="text-red-600 hover:underline">
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

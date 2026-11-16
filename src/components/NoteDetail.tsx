"use client";

import { useState } from "react";
import { Markdown } from "./Markdown";
import { formatDate } from "@/lib/format";
import type { Note, Share } from "@/lib/types";

const EXPIRY_CHOICES = [
  { value: "0", label: "Never expires" },
  { value: "1", label: "Expires in 1 day" },
  { value: "7", label: "Expires in 7 days" },
  { value: "30", label: "Expires in 30 days" },
];

function daysFromExpiry(value: string): number | null {
  const days = Number(value);
  return days > 0 ? days : null;
}

export function NoteDetail({ note: initialNote, shares: initialShares }: { note: Note; shares: Share[] }) {
  const [note, setNote] = useState(initialNote);
  const [shares, setShares] = useState(initialShares);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote.content);
  const [expiry, setExpiry] = useState("0");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingShareId, setEditingShareId] = useState<string | null>(null);
  const [shareName, setShareName] = useState("");
  const [shareExpiry, setShareExpiry] = useState("keep");
  const [shareError, setShareError] = useState<string | null>(null);

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
    const response = await fetch(`/api/notes/${note.id}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: daysFromExpiry(expiry) }),
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

  function startEditShare(share: Share) {
    setEditingShareId(share.id);
    setShareName(share.name ?? "");
    setShareExpiry("keep");
    setShareError(null);
  }

  function cancelEditShare() {
    setEditingShareId(null);
    setShareName("");
    setShareExpiry("keep");
    setShareError(null);
  }

  async function saveShare(event: React.FormEvent) {
    event.preventDefault();
    if (!editingShareId) return;

    const body: { name: string; expiresInDays?: number | null } = {
      name: shareName.trim(),
    };
    if (shareExpiry !== "keep") {
      body.expiresInDays = daysFromExpiry(shareExpiry);
    }

    setPending(true);
    setShareError(null);
    const response = await fetch(`/api/notes/${note.id}/shares/${editingShareId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setShareError(data.error ?? "Could not save the link.");
      return;
    }

    cancelEditShare();
    await loadShares();
  }

  return (
    <div>
      <article>
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={8}
              className="w-full resize-y bg-transparent text-md leading-relaxed text-ink"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveEdit}
                disabled={pending}
                className="rounded-[10px] bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-2 disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDraft(note.content);
                  setEditing(false);
                }}
                className="rounded-[10px] border border-rule bg-paper-2 px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <Markdown content={note.content} />
        )}

        <footer className="mt-6 flex items-center gap-3 border-t border-rule pt-3 text-xs text-muted">
          <span>Created {formatDate(note.createdAt)}</span>
          <button
            onClick={() => setEditing(true)}
            className="ml-auto font-semibold text-ink hover:underline"
          >
            Edit
          </button>
        </footer>
      </article>

      <section className="mt-12 border-t border-rule pt-6">
        <h2 className="text-sm font-semibold text-ink">Share links</h2>
        <p className="mt-1 text-sm text-muted">
          Anyone with a link can read this note. No account needed. Revoke a link to stop access.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className="rounded-[10px] border border-muted bg-paper px-3 py-2 text-sm text-ink"
          >
            {EXPIRY_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
          <button
            onClick={createShare}
            disabled={pending}
            className="rounded-[10px] bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-2 disabled:opacity-60"
          >
            Create link
          </button>
        </div>

        {shares.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No links yet.</p>
        ) : (
          <ul className="mt-4 border-t border-rule">
            {shares.map((share) => (
              <li key={share.id} className="border-b border-rule-2 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {share.name && <span className="font-semibold text-ink">{share.name}</span>}
                  <code className="font-outlier text-xs text-muted">/s/{share.token}</code>
                  {share.expired ? (
                    <span className="rounded-full border border-rule px-2 py-0.5 text-xs text-muted">
                      Expired
                    </span>
                  ) : (
                    <span className="text-xs text-muted">
                      {share.expiresAt ? `Expires ${formatDate(share.expiresAt)}` : "Never expires"}
                    </span>
                  )}
                  <div className="flex w-full items-center justify-end gap-4 text-xs sm:ml-auto sm:w-auto">
                    <button
                      onClick={() => startEditShare(share)}
                      className="font-semibold text-ink hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => copyLink(share)}
                      className="font-semibold text-ink hover:underline"
                    >
                      {copiedId === share.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => revokeShare(share)}
                      className="font-semibold text-ink hover:underline"
                    >
                      Revoke
                    </button>
                  </div>
                </div>

                {editingShareId === share.id && (
                  <form onSubmit={saveShare} className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="min-w-40 flex-1">
                      <span className="text-xs font-semibold text-ink">Name</span>
                      <input
                        value={shareName}
                        onChange={(event) => setShareName(event.target.value)}
                        placeholder="Who is this link for?"
                        className="mt-1 w-full rounded-[10px] border border-muted bg-paper px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <label>
                      <span className="text-xs font-semibold text-ink">Expiry</span>
                      <select
                        value={shareExpiry}
                        onChange={(event) => setShareExpiry(event.target.value)}
                        className="mt-1 block rounded-[10px] border border-muted bg-paper px-3 py-2 text-sm text-ink"
                      >
                        <option value="keep">Keep current expiry</option>
                        {EXPIRY_CHOICES.map((choice) => (
                          <option key={choice.value} value={choice.value}>
                            {choice.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-[10px] bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-2 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditShare}
                      className="rounded-[10px] border border-rule bg-paper-2 px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {editingShareId === share.id && shareError && (
                  <p className="mt-2 text-xs text-error">{shareError}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

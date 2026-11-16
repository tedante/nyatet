import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

import { PATCH } from "@/app/api/notes/[id]/shares/[shareId]/route";
import { GET } from "@/app/api/notes/[id]/shares/route";
import { getSession } from "@/lib/auth";
import type { Share } from "@/lib/types";
import { createNote, createShare, createUser, deleteUsers } from "./fixtures";

type User = Awaited<ReturnType<typeof createUser>>;

const created: string[] = [];
let user: User;
let note: { id: string };

beforeEach(async () => {
  user = await createUser();
  created.push(user.id);
  note = await createNote(user.id);
  vi.mocked(getSession).mockResolvedValue({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

afterEach(async () => {
  await deleteUsers(created);
  vi.mocked(getSession).mockReset();
});

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/notes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function patch(noteId: string, shareId: string, body: unknown) {
  const response = await PATCH(patchRequest(body), {
    params: Promise.resolve({ id: noteId, shareId }),
  });
  const json = await response.json();
  return { status: response.status, json };
}

async function listShares(noteId: string) {
  const request = new Request("http://localhost/api/notes", { method: "GET" });
  const response = await GET(request, { params: Promise.resolve({ id: noteId }) });
  const json = await response.json();
  return json.shares as Share[];
}

describe("PATCH share", () => {
  it("rejects an unauthenticated request", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const { status } = await patch(randomUUID(), randomUUID(), { name: "Work" });

    expect(status).toBe(401);
  });

  it("hides a note owned by another account", async () => {
    const stranger = await createUser();
    created.push(stranger.id);
    const strangerNote = await createNote(stranger.id);
    const share = await createShare(strangerNote.id);

    const { status } = await patch(strangerNote.id, share.id, { name: "Work" });

    expect(status).toBe(404);
  });

  it("refuses a share that belongs to a different note", async () => {
    const otherNote = await createNote(user.id);
    const share = await createShare(otherNote.id);

    const { status } = await patch(note.id, share.id, { name: "Work" });

    expect(status).toBe(404);
  });

  it("rejects a body with nothing to change", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, {});

    expect(status).toBe(400);
    expect(json.error).toBeTruthy();
  });

  it("rejects a name longer than 60 characters", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { name: "x".repeat(61) });

    expect(status).toBe(400);
    expect(json.error).toContain("60");
  });

  it("names a link and returns the updated share", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { name: "  Work  " });

    expect(status).toBe(200);
    expect(json.share.name).toBe("Work");
    expect(json.share.id).toBe(share.id);
    expect((await listShares(note.id))[0].name).toBe("Work");
  });

  it("clears a name when sent an empty string", async () => {
    const share = await createShare(note.id, { name: "Work" });

    const { status } = await patch(note.id, share.id, { name: "" });

    expect(status).toBe(200);
    expect((await listShares(note.id))[0].name).toBeNull();
  });

  it("leaves the token untouched", async () => {
    const share = await createShare(note.id);

    await patch(note.id, share.id, { name: "Work" });

    expect((await listShares(note.id))[0].token).toBe(share.token);
  });
});

const DAY_MS = 24 * 60 * 60 * 1000;

describe("PATCH share expiry", () => {
  it("sets an expiry seven days out", async () => {
    const share = await createShare(note.id);
    const before = Date.now();

    const { status, json } = await patch(note.id, share.id, { expiresInDays: 7 });

    const after = Date.now();
    expect(status).toBe(200);
    const expiresAt = new Date(json.share.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 7 * DAY_MS - 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + 7 * DAY_MS + 1000);
  });

  it("clears an expiry when sent null", async () => {
    const share = await createShare(note.id, { expiresAt: new Date(Date.now() + DAY_MS) });

    const { status } = await patch(note.id, share.id, { expiresInDays: null });

    expect(status).toBe(200);
    expect((await listShares(note.id))[0].expiresAt).toBeNull();
  });

  it.each([0, 366, 1.5])("rejects an expiry of %s days", async (days) => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { expiresInDays: days });

    expect(status).toBe(400);
    expect(json.error).toBeTruthy();
  });

  it("leaves the expiry untouched when only the name changes", async () => {
    const expiresAt = new Date(Date.now() + 7 * DAY_MS);
    const share = await createShare(note.id, { expiresAt });

    await patch(note.id, share.id, { name: "Work" });

    expect((await listShares(note.id))[0].expiresAt).toBe(expiresAt.toISOString());
  });

  it("leaves the name untouched when only the expiry changes", async () => {
    const share = await createShare(note.id, { name: "Work" });

    await patch(note.id, share.id, { expiresInDays: 1 });

    expect((await listShares(note.id))[0].name).toBe("Work");
  });

  it("leaves the token untouched", async () => {
    const share = await createShare(note.id);

    await patch(note.id, share.id, { expiresInDays: 30 });

    expect((await listShares(note.id))[0].token).toBe(share.token);
  });
});

describe("PATCH share slug", () => {
  it("sets a readable slug and returns it", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { slug: "notes1" });

    expect(status).toBe(200);
    expect(json.share.slug).toBe("notes1");
    expect((await listShares(note.id))[0].slug).toBe("notes1");
  });

  it("folds uppercase to lowercase", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { slug: "Notes1" });

    expect(status).toBe(200);
    expect(json.share.slug).toBe("notes1");
  });

  it("clears a slug when sent an empty string", async () => {
    const share = await createShare(note.id, { slug: "notes1" });

    const { status } = await patch(note.id, share.id, { slug: "" });

    expect(status).toBe(200);
    expect((await listShares(note.id))[0].slug).toBeNull();
  });

  it("rejects a slug shorter than 2 characters", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { slug: "a" });

    expect(status).toBe(400);
    expect(json.error).toContain("2 to 24");
  });

  it("rejects a slug longer than 24 characters", async () => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { slug: "x".repeat(25) });

    expect(status).toBe(400);
    expect(json.error).toContain("2 to 24");
  });

  it.each(["notes 1", "notes!", "-notes"])("rejects the slug %s", async (slug) => {
    const share = await createShare(note.id);

    const { status, json } = await patch(note.id, share.id, { slug });

    expect(status).toBe(400);
    expect(json.error).toContain("lowercase letters");
  });

  it("refuses a slug another link already uses", async () => {
    await createShare(note.id, { slug: "notes1" });
    const second = await createShare(note.id);

    const { status, json } = await patch(note.id, second.id, { slug: "notes1" });

    expect(status).toBe(409);
    expect(json.error).toContain("taken");
  });

  it("leaves the token untouched", async () => {
    const share = await createShare(note.id);

    await patch(note.id, share.id, { slug: "notes1" });

    expect((await listShares(note.id))[0].token).toBe(share.token);
  });

  it("leaves the name and expiry untouched when only the slug changes", async () => {
    const expiresAt = new Date(Date.now() + 7 * DAY_MS);
    const share = await createShare(note.id, { name: "Work", expiresAt });

    await patch(note.id, share.id, { slug: "notes1" });

    const [updated] = await listShares(note.id);
    expect(updated.name).toBe("Work");
    expect(updated.expiresAt).toBe(expiresAt.toISOString());
  });

  it("leaves the slug untouched when only the name changes", async () => {
    const share = await createShare(note.id, { slug: "notes1" });

    await patch(note.id, share.id, { name: "Work" });

    expect((await listShares(note.id))[0].slug).toBe("notes1");
  });

  it("leaves the slug untouched when only the expiry changes", async () => {
    const share = await createShare(note.id, { slug: "notes1" });

    await patch(note.id, share.id, { expiresInDays: 1 });

    expect((await listShares(note.id))[0].slug).toBe("notes1");
  });
});

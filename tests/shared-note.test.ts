import { afterEach, describe, expect, it } from "vitest";
import { getSharedNote, updateShare } from "@/lib/notes";
import { createNote, createShare, createUser, deleteUsers } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("getSharedNote", () => {
  const created: string[] = [];

  afterEach(async () => {
    await deleteUsers(created);
  });

  async function seed(values: { name?: string | null; expiresAt?: Date | null } = {}) {
    const user = await createUser();
    created.push(user.id);
    const note = await createNote(user.id, "Shared body");
    const share = await createShare(note.id, values);
    return { user, note, share };
  }

  it("returns the note for a live link", async () => {
    const { share } = await seed();

    const shared = await getSharedNote(share.token);

    expect(shared?.note.content).toBe("Shared body");
  });

  it("returns nothing for an expired link", async () => {
    const { share } = await seed({ expiresAt: new Date(Date.now() - DAY_MS) });

    expect(await getSharedNote(share.token)).toBeNull();
  });

  it("returns the note again once an expired link is extended", async () => {
    const { user, note, share } = await seed({ expiresAt: new Date(Date.now() - DAY_MS) });

    await updateShare(user.id, note.id, share.id, { expiresInDays: 7 });

    expect(await getSharedNote(share.token)).not.toBeNull();
  });

  it("never exposes the owner's name for the link", async () => {
    const { share } = await seed({ name: "Secret Label" });

    const shared = await getSharedNote(share.token);

    expect(JSON.stringify(shared)).not.toContain("Secret Label");
  });
});

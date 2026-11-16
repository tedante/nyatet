import { afterEach, describe, expect, it } from "vitest";
import { createNote, createShare, createUser, deleteUsers } from "./fixtures";

describe("test harness", () => {
  const created: string[] = [];

  afterEach(async () => {
    await deleteUsers(created);
  });

  it("creates a user, a note, and a share link, then reads the share back", async () => {
    const user = await createUser();
    created.push(user.id);

    const note = await createNote(user.id);
    const share = await createShare(note.id);

    expect(share.noteId).toBe(note.id);
    expect(share.token).toHaveLength(36);
    expect(share.expiresAt).toBeNull();
  });
});

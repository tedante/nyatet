import { afterEach, describe, expect, it } from "vitest";
import { getSharedNote, updateShare } from "@/lib/notes";
import { createNote, createShare, createUser, deleteUsers } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("getSharedNote", () => {
  const created: string[] = [];

  afterEach(async () => {
    await deleteUsers(created);
  });

  async function seed(
    values: { slug?: string | null; name?: string | null; expiresAt?: Date | null } = {},
  ) {
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

  it("resolves a slug", async () => {
    await seed({ slug: "notes1" });

    const shared = await getSharedNote("notes1");

    expect(shared?.note.content).toBe("Shared body");
  });

  it("still resolves the token after a slug is set", async () => {
    const { share } = await seed({ slug: "notes1" });

    expect(await getSharedNote(share.token)).not.toBeNull();
  });

  it("stops resolving the previous slug after a change", async () => {
    const { user, note, share } = await seed({ slug: "notes1" });

    await updateShare(user.id, note.id, share.id, { slug: "notes2" });

    expect(await getSharedNote("notes1")).toBeNull();
    expect(await getSharedNote("notes2")).not.toBeNull();
  });

  it("resolves a slug regardless of case", async () => {
    await seed({ slug: "notes1" });

    expect(await getSharedNote("Notes1")).not.toBeNull();
    expect(await getSharedNote("NOTES1")).not.toBeNull();
  });

  it("resolves the token again after the slug is cleared", async () => {
    const { user, note, share } = await seed({ slug: "notes1" });

    await updateShare(user.id, note.id, share.id, { slug: "" });

    expect(await getSharedNote("notes1")).toBeNull();
    expect(await getSharedNote(share.token)).not.toBeNull();
  });

  it("returns nothing for an unknown slug", async () => {
    await seed();

    expect(await getSharedNote("no-such-link")).toBeNull();
  });

  it("returns nothing for an expired link by slug and by token", async () => {
    const { share } = await seed({
      slug: "notes1",
      expiresAt: new Date(Date.now() - DAY_MS),
    });

    expect(await getSharedNote("notes1")).toBeNull();
    expect(await getSharedNote(share.token)).toBeNull();
  });
});

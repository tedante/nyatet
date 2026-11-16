import { expect, test } from "@playwright/test";
import { deleteAccount, signup, uniqueEmail } from "./support";

test("a share link takes a readable slug and resolves by it", async ({ page, context }) => {
  const email = uniqueEmail();
  const slug = `note-${Date.now()}`;
  try {
    await signup(context, email);
    const response = await context.request.post("/api/notes", {
      data: { content: "Slug body #slug" },
    });
    const { note } = await response.json();

    await page.goto(`/notes/${note.id}`);
    await page.getByRole("button", { name: "Create link" }).click();

    const shareRow = page.getByRole("listitem").filter({ hasText: "/s/" });
    await expect(shareRow).toBeVisible();
    await shareRow.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Link").fill(slug);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(`/s/${slug}`)).toBeVisible();

    await context.clearCookies();
    await page.goto(`/s/${slug}`);
    await expect(page.getByText("Slug body")).toBeVisible();
  } finally {
    await deleteAccount(email);
  }
});

test("opening a note shows it and edit opens an editor", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await signup(context, email);
    const response = await context.request.post("/api/notes", {
      data: { content: "E2E body #e2e" },
    });
    const { note } = await response.json();

    await page.goto(`/notes/${note.id}`);

    await expect(page.getByText("E2E body")).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.locator("textarea")).toBeVisible();
  } finally {
    await deleteAccount(email);
  }
});

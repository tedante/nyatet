import { expect, test } from "@playwright/test";
import { deleteAccount, signup, uniqueEmail } from "./support";

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

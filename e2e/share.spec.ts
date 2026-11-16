import { expect, test } from "@playwright/test";
import { deleteAccount, signup, uniqueEmail } from "./support";

test("a share link resolves on the public page", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await signup(context, email);
    const noteResponse = await context.request.post("/api/notes", {
      data: { content: "Shared E2E body #e2e" },
    });
    const { note } = await noteResponse.json();
    const shareResponse = await context.request.post(`/api/notes/${note.id}/shares`, {
      data: {},
    });
    const { share } = await shareResponse.json();

    await context.clearCookies();
    await page.goto(`/s/${share.token}`);

    await expect(page.getByText("Shared E2E body")).toBeVisible();
    await expect(page.getByText(/Shared by/)).toBeVisible();
  } finally {
    await deleteAccount(email);
  }
});

test("an unknown share token returns not found", async ({ page }) => {
  const response = await page.goto("/s/this-token-does-not-exist");

  expect(response?.status()).toBe(404);
});

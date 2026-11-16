import { expect, test } from "@playwright/test";
import { deleteAccount, signup, uniqueEmail } from "./support";

test("writing a note adds it to the timeline", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await signup(context, email);
    await page.goto("/home");

    const stamp = Date.now();
    const content = `E2E note ${stamp} #e2e`;
    await page.getByPlaceholder("What is on your mind? Use #tags to group notes.").fill(content);
    await page.getByRole("button", { name: "Save note" }).click();

    await expect(page.getByText(`E2E note ${stamp}`)).toBeVisible();
    await expect(page.getByRole("article").getByRole("button", { name: "#e2e" })).toBeVisible();
  } finally {
    await deleteAccount(email);
  }
});

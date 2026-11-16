import { expect, test } from "@playwright/test";
import { PASSWORD, deleteAccount, signup, uniqueEmail } from "./support";

test("sign up lands on the home screen", async ({ page }) => {
  const email = uniqueEmail();
  try {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("button", { name: "Save note" })).toBeVisible();
  } finally {
    await deleteAccount(email);
  }
});

test("sign in with the wrong password shows an error", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await signup(context, email);
    await context.clearCookies();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  } finally {
    await deleteAccount(email);
  }
});

test("sign in lands on the home screen", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await signup(context, email);
    await context.clearCookies();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/home$/);
  } finally {
    await deleteAccount(email);
  }
});

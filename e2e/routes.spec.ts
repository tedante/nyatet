import { expect, test } from "@playwright/test";
import { deleteAccount, signup, uniqueEmail } from "./support";

test("every route renders without a console error", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${page.url()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    errors.push(`${page.url()}: ${error.message}`);
  });

  const email = uniqueEmail();
  try {
    await page.goto("/login");
    await page.goto("/signup");

    await signup(context, email);
    await page.goto("/home");

    const noteResponse = await context.request.post("/api/notes", {
      data: { content: "Route check note" },
    });
    const { note } = await noteResponse.json();
    const shareResponse = await context.request.post(`/api/notes/${note.id}/shares`, {
      data: {},
    });
    const { share } = await shareResponse.json();

    await page.goto(`/notes/${note.id}`);
    await context.clearCookies();
    await page.goto(`/s/${share.token}`);

    expect(errors).toEqual([]);
  } finally {
    await deleteAccount(email);
  }
});

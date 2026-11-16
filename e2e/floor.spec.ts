import { expect, test, type Page } from "@playwright/test";
import { deleteAccount, signup, uniqueEmail } from "./support";

async function fitsViewport(page: Page, width: number): Promise<boolean> {
  await page.setViewportSize({ width, height: 800 });
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

test("no screen scrolls sideways at 375 or 1280", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await page.goto("/login");
    expect(await fitsViewport(page, 375), "login at 375").toBe(true);
    expect(await fitsViewport(page, 1280), "login at 1280").toBe(true);

    await page.goto("/signup");
    expect(await fitsViewport(page, 375), "signup at 375").toBe(true);
    expect(await fitsViewport(page, 1280), "signup at 1280").toBe(true);

    await signup(context, email);
    const { note } = await (
      await context.request.post("/api/notes", { data: { content: "Floor check note #floor" } })
    ).json();
    const { share } = await (
      await context.request.post(`/api/notes/${note.id}/shares`, { data: {} })
    ).json();

    for (const path of ["/home", `/notes/${note.id}`]) {
      await page.goto(path);
      expect(await fitsViewport(page, 375), `${path} at 375`).toBe(true);
      expect(await fitsViewport(page, 1280), `${path} at 1280`).toBe(true);
    }

    await context.clearCookies();
    await page.goto(`/s/${share.token}`);
    expect(await fitsViewport(page, 375), "share at 375").toBe(true);
    expect(await fitsViewport(page, 1280), "share at 1280").toBe(true);
  } finally {
    await deleteAccount(email);
  }
});

test("every control reached by keyboard shows a focus ring", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await page.goto("/login");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const missing: string[] = [];
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        if (element.closest("nextjs-portal")) return null;
        const style = getComputedStyle(element);
        return {
          label: `${element.tagName.toLowerCase()} "${(element.textContent ?? "").trim().slice(0, 16)}"`,
          outlined: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0,
        };
      });
      if (focused && !focused.outlined) missing.push(focused.label);
    }

    expect(missing).toEqual([]);

    await signup(context, email);
    await page.goto("/home");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        if (element.closest("nextjs-portal")) return null;
        const style = getComputedStyle(element);
        return {
          label: `${element.tagName.toLowerCase()} "${(element.textContent ?? "").trim().slice(0, 16)}"`,
          outlined: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0,
        };
      });
      if (focused && !focused.outlined) missing.push(focused.label);
    }

    expect(missing).toEqual([]);
  } finally {
    await deleteAccount(email);
  }
});

test("nothing animates when reduced motion is requested", async ({ page, context }) => {
  const email = uniqueEmail();
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signup(context, email);
    await page.goto("/home");

    const moving = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("*")]
        .filter((element) => {
          const style = getComputedStyle(element);
          return parseFloat(style.transitionDuration) > 0.05 || parseFloat(style.animationDuration) > 0.05;
        })
        .map((element) => element.tagName.toLowerCase()),
    );

    expect(moving).toEqual([]);
  } finally {
    await deleteAccount(email);
  }
});

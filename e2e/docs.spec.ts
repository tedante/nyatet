import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";

const docsDir = join(process.cwd(), "docs");
const pageUrl = `file://${join(docsDir, "index.html")}`;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

async function serveUnderPrefix() {
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    if (!pathname.startsWith("/nyatet/")) {
      response.writeHead(404).end();
      return;
    }
    const relative = pathname.slice("/nyatet/".length) || "index.html";
    try {
      const body = await readFile(join(docsDir, normalize(relative)));
      response.writeHead(200, {
        "Content-Type": TYPES[extname(relative)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return { server, url: `http://localhost:${port}/nyatet/` };
}

test("the docs page renders its content", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(pageUrl, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveTitle(/Nyatet/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Notes in plain black." })).toBeVisible();

  expect(errors).toEqual([]);
});

test("the page names the commands, env vars and tables", async ({ page }) => {
  await page.goto(pageUrl, { waitUntil: "load" });
  const text = (await page.locator("body").textContent()) ?? "";

  for (const needle of [
    "npm run dev",
    "npm run db:push",
    "docker compose up -d",
    "DATABASE_URL",
    "AUTH_SECRET",
    "note_shares",
    "Not in this MVP",
  ]) {
    expect(text, needle).toContain(needle);
  }
});

test("the skip link is the first stop", async ({ page }) => {
  await page.goto(pageUrl, { waitUntil: "load" });
  await page.keyboard.press("Tab");

  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("every anchor and local file resolves", async ({ page }) => {
  await page.goto(pageUrl, { waitUntil: "load" });

  const anchors = await page.$$eval("a[href^='#']", (links) =>
    links.map((link) => link.getAttribute("href") ?? ""),
  );
  expect(anchors.length).toBeGreaterThan(0);
  for (const href of anchors) {
    expect(href.length, "an anchor must name a target").toBeGreaterThan(1);
    await expect(page.locator(href), `anchor ${href}`).toHaveCount(1);
  }

  const images = await page.$$eval("img", (nodes) =>
    nodes.map((node) => ({
      src: node.getAttribute("src") ?? "",
      alt: node.getAttribute("alt") ?? "",
    })),
  );
  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    expect(image.src, "an image needs a source").toBeTruthy();
    expect(image.alt.trim(), `alt text for ${image.src}`).toBeTruthy();
    expect(existsSync(join(docsDir, image.src)), `file for ${image.src}`).toBe(true);
  }

  const links = await page.$$eval("a[href]", (nodes) =>
    nodes.map((node) => node.getAttribute("href") ?? ""),
  );
  for (const href of links) {
    if (href.startsWith("#") || /^(https?:|mailto:)/.test(href)) continue;
    expect(existsSync(join(docsDir, href.split("#")[0])), `file for ${href}`).toBe(true);
  }
});

test("the docs page does not scroll sideways", async ({ page }) => {
  await page.goto(pageUrl, { waitUntil: "load" });

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(fits, `width ${width}`).toBe(true);
  }
});

test("nothing animates under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(pageUrl, { waitUntil: "load" });

  const moving = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("*")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          parseFloat(style.transitionDuration) > 0.05 ||
          parseFloat(style.animationDuration) > 0.05
        );
      })
      .map((element) => element.tagName.toLowerCase()),
  );

  expect(moving).toEqual([]);
});

test("the site works under a repository subpath", async ({ page }) => {
  const { server, url } = await serveUnderPrefix();
  try {
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    for (const id of ["sharing", "public", "scope"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }

    const broken = await page.evaluate(() =>
      [...document.images]
        .filter((image) => !(image.complete && image.naturalWidth > 0))
        .map((image) => image.getAttribute("src")),
    );
    expect(broken).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check("700 20px Jost"))).toBe(true);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

import { expect, test } from "@playwright/test";
import { works } from "../data/site";

const contentRoutes = [
  "/",
  "/research",
  "/archive",
  "/about",
  "/contact",
  ...works.map((work) => `/work/${work.slug}`),
];

async function settlePage(page: import("@playwright/test").Page) {
  await page.waitForTimeout(200);
  await page.evaluate(() => document.fonts.ready);
  const reveals = page.locator(".reveal");
  for (let index = 0; index < await reveals.count(); index += 1) {
    await reveals.nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1_000);
}

for (const profile of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test("home is stable after reveal animation on " + profile.name, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.goto("/");
    await settlePage(page);

    const reveals = page.locator(".reveal");
    expect(await reveals.count()).toBeGreaterThan(0);
    const hiddenReveals = await page.locator(".reveal:not(.is-visible)").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim().slice(0, 80) || "<empty reveal>"),
    );
    expect(hiddenReveals).toEqual([]);
    const simulation = page.locator('[data-simulation="hero"]');
    await expect(simulation).toBeVisible();
    expect(await simulation.getAttribute("width")).not.toBe("0");
    expect(await simulation.getAttribute("height")).not.toBe("0");
    expect(errors).toEqual([]);

    await page.screenshot({
      path: "output/playwright/home-after-settled-" + profile.name + ".png",
      fullPage: true,
      animations: "disabled",
    });
  });
}

test("client navigation rebinds the shared reveal observer", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[href="/about"]').first().click();
  await expect(page).toHaveURL(/\/about$/);
  await settlePage(page);
  expect(await page.locator(".reveal:not(.is-visible)").count()).toBe(0);
});

test("wave propagation scrollbar tracks, jumps, and supports the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const scrollbar = page.getByRole("scrollbar", { name: "Page position" });

  await expect(scrollbar).toBeVisible();
  await expect(scrollbar).toHaveAttribute("data-progress", "0.0000");
  await expect(scrollbar).toHaveAttribute("data-wave-state", "still");
  await expect(scrollbar).toHaveAttribute("data-wave-max-displacement", "0.000");
  await expect(page.locator("html")).toHaveClass(/wave-scrollbar-active/);

  const bounds = await scrollbar.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height * 0.56);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000);
  expect(Number(await scrollbar.getAttribute("data-progress"))).toBeGreaterThan(0.5);
  await expect(scrollbar).toHaveAttribute("data-wave-animating", "true");
  await expect(scrollbar).toHaveAttribute("data-wave-direction", "down");
  await expect(scrollbar).toHaveAttribute("data-wave-propagation", "up");
  expect(Number(await scrollbar.getAttribute("data-wave-max-displacement"))).toBeGreaterThan(0);
  await expect(scrollbar).toHaveAttribute("data-wave-solver", "fdtd-1d");
  await expect(scrollbar).toHaveAttribute("data-wave-grid", "192");
  await expect(scrollbar).toHaveAttribute("data-wave-strands", "3");
  await expect(scrollbar).toHaveAttribute("data-wave-strengths", "0.72,1.00,0.86");
  const movingStep = Number(await scrollbar.getAttribute("data-wave-steps"));
  const movingSignature = await scrollbar.getAttribute("data-wave-signature");
  await expect.poll(async () => Number(await scrollbar.getAttribute("data-wave-steps"))).toBeGreaterThan(movingStep);
  await expect.poll(async () => scrollbar.getAttribute("data-wave-signature")).not.toBe(movingSignature);

  await scrollbar.focus();
  await page.keyboard.press("End");
  await expect.poll(() => page.evaluate(() => {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    return maximum - window.scrollY;
  })).toBeLessThan(4);
  await page.keyboard.press("Home");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(4);
  await expect(scrollbar).toHaveAttribute("data-wave-direction", "up");
  await expect(scrollbar).toHaveAttribute("data-wave-propagation", "down");
  await expect.poll(async () => scrollbar.getAttribute("data-wave-animating"), { timeout: 9_000 }).toBe("false");
  await expect(scrollbar).toHaveAttribute("data-wave-state", "still");
  await expect(scrollbar).toHaveAttribute("data-wave-max-displacement", "0.000");
});

test("wave propagation scrollbar stays still for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const scrollbar = page.getByRole("scrollbar", { name: "Page position" });

  await expect(scrollbar).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
  await expect(scrollbar).toHaveAttribute("data-wave-animating", "false");
  await expect(scrollbar).toHaveAttribute("data-wave-state", "still");
  await expect(scrollbar).toHaveAttribute("data-wave-max-displacement", "0.000");
  await expect(scrollbar).toHaveAttribute("data-wave-energy", "0.0000");
  await expect(scrollbar).toHaveAttribute("data-wave-solver", "fdtd-1d");
});

test("reaction diffusion reverses and accepts pointer perturbations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const simulation = page.locator('[data-simulation="hero"]');

  await expect(simulation).toHaveAttribute("data-phase", "reverse", { timeout: 7_000 });
  const dimensions = await simulation.evaluate((canvas: HTMLCanvasElement) => ({
    renderWidth: canvas.width,
    displayWidth: canvas.clientWidth,
    simulationWidth: Number(canvas.dataset.simulationGrid?.split("x")[0]),
    renderer: canvas.dataset.renderer,
    workMs: Number(canvas.dataset.workMs),
  }));
  expect(["webgl2", "canvas2d"]).toContain(dimensions.renderer);
  expect(dimensions.renderWidth).toBeGreaterThanOrEqual(dimensions.displayWidth);
  expect(dimensions.renderWidth).toBeGreaterThan(dimensions.simulationWidth);
  expect(dimensions.workMs).toBeLessThan(20);
  await expect(simulation).toHaveAttribute("data-interaction-strength", "1.00");

  const bounds = await simulation.boundingBox();
  expect(bounds).not.toBeNull();
  const target = { x: 0.78, y: 0.32 };
  await page.mouse.move(
    bounds!.x + bounds!.width * target.x,
    bounds!.y + bounds!.height * target.y,
  );
  await expect(simulation).toHaveAttribute("data-interacting", "true");
  await expect(simulation).toHaveAttribute("data-history", "84");
  const pointer = await simulation.evaluate((canvas: HTMLCanvasElement) => ({
    x: Number(canvas.dataset.pointerX),
    y: Number(canvas.dataset.pointerY),
  }));
  expect(pointer.x).toBeCloseTo(target.x, 3);
  expect(pointer.y).toBeCloseTo(target.y, 3);
  await expect(simulation).toHaveAttribute("data-interacting", "false", { timeout: 2_000 });
  await expect(simulation).toHaveAttribute("data-history", "84");
});

test("publication field loops independently and responds within its panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.locator('[data-simulation="hero"]');
  const heroInteraction = {
    radius: Number(await hero.getAttribute("data-interaction-radius")),
    strength: await hero.getAttribute("data-interaction-strength"),
  };
  const simulation = page.locator('[data-simulation="publication"]');
  await simulation.scrollIntoViewIfNeeded();

  await expect(simulation).toHaveAttribute("data-phase", "hold-end", { timeout: 14_000 });
  await expect(simulation).toHaveAttribute("data-phase", "reverse", { timeout: 2_000 });
  await expect(simulation).toHaveAttribute("data-renderer", /^(webgl2|canvas2d)$/);
  await expect(simulation).toHaveAttribute("data-history", "280");
  await expect(simulation).toHaveAttribute("data-playback-stride", "3");
  await expect(simulation).toHaveAttribute("data-end-hold-frames", "18");
  expect(Number(await simulation.getAttribute("data-interaction-radius"))).toBe(heroInteraction.radius);
  await expect(simulation).toHaveAttribute("data-interaction-strength", heroInteraction.strength ?? "1.00");
  const bounds = await simulation.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.65, bounds!.y + bounds!.height * 0.5);
  await expect(simulation).toHaveAttribute("data-interacting", "true");
  await expect(simulation).toHaveAttribute("data-history", "280");
  await expect(simulation).toHaveAttribute("data-interacting", "false", { timeout: 2_000 });
  await expect(simulation).toHaveAttribute("data-history", "280");
});

for (const profile of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`every content route renders cleanly on ${profile.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: profile.width, height: profile.height });

    for (const route of contentRoutes) {
      const response = await page.goto(route, { waitUntil: "load" });
      expect(response?.status(), `${route} should return 200`).toBe(200);
      await expect(page.locator("h1"), `${route} should have a visible primary heading`).toBeVisible();

      const images = page.locator("img");
      for (let index = 0; index < await images.count(); index += 1) {
        await images.nth(index).scrollIntoViewIfNeeded();
        await expect(images.nth(index), `${route} image ${index + 1} should load`).toHaveJSProperty("complete", true);
        expect(await images.nth(index).evaluate((image: HTMLImageElement) => image.naturalWidth), `${route} image ${index + 1} should have pixels`).toBeGreaterThan(0);
      }

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(horizontalOverflow, `${route} should not overflow horizontally`).toBeLessThanOrEqual(1);
      if (route === "/" && profile.name === "mobile") {
        const scrollbarColor = await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor);
        expect(scrollbarColor, "the mobile fallback scrollbar should stay themed").not.toBe("auto");
      }
    }

    expect(errors).toEqual([]);
  });
}

test("archive search and filters remain usable", async ({ page }) => {
  await page.goto("/archive");
  const search = page.getByPlaceholder("Search methods, topics, or tools");
  await expect(page.locator(".result-count")).toHaveText(`${works.length} entries`);

  await search.fill("GeoGuesser");
  await expect(page.locator(".result-count")).toHaveText("1 entry");
  await expect(page.locator(".work-row")).toHaveCount(1);

  await search.fill("");
  await page.getByRole("button", { name: "Forks" }).click();
  await expect(page.locator(".result-count")).toHaveText("0 entries");
  await expect(page.locator(".empty-state")).toBeVisible();

  await search.fill("no-such-project");
  await expect(page.locator(".empty-state")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".result-count")).toHaveText(`${works.length} entries`);
});

test("mobile navigation reaches every primary section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  for (const [label, route] of [
    ["Research", "/research"],
    ["Archive", "/archive"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ] as const) {
    const menu = page.locator(".menu-toggle");
    await expect(menu).toHaveAccessibleName("Open menu");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
  }
});

test("contact form reports a successful submission without sending mail", async ({ page }) => {
  let submittedBody: Record<string, string> | undefined;
  await page.route("**/api/contact", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "Test message accepted." }) });
  });
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Release Tester");
  await page.getByLabel("Email").fill("release@example.com");
  await page.getByLabel("What would you like to discuss?").selectOption("engineering");
  await page.getByLabel("Message").fill("This is a safe browser-only release verification message.");
  await page.getByRole("button", { name: /Send message/ }).click();

  await expect(page.getByRole("status")).toHaveText("Test message accepted.");
  expect(submittedBody).toMatchObject({
    name: "Release Tester",
    email: "release@example.com",
    purpose: "engineering",
  });
});

test("metadata endpoints and the not-found boundary respond correctly", async ({ page }) => {
  for (const route of ["/robots.txt", "/sitemap.xml", "/feed.xml", "/opengraph-image"]) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should return 200`).toBe(200);
    expect((await response?.body())?.byteLength, `${route} should not be empty`).toBeGreaterThan(0);
  }

  const response = await page.goto("/__release-check-missing-page__");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This path left the domain." })).toBeVisible();
});

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

const portraitPrototypeRoutes = [
  "/prototypes",
  ...[
    "journal-cover",
    "research-terminal",
    "constellation-map",
    "academic-preprint",
    "specimen-gallery",
    "field-observatory",
    "brutalist-index",
    "research-timeline",
    "lab-notebook",
    "cinematic-monograph",
  ].map((variant) => `/prototypes/${variant}`),
  "/prototypes/physics",
  ...[
    "phase-portrait",
    "vector-field",
    "wave-interference",
    "tensor-manifold",
    "lagrangian-mechanics",
    "topology-lab",
    "hamiltonian-contours",
    "feynman-paths",
    "pde-boundary-lab",
    "fourier-synthesis",
  ].map((variant) => `/prototypes/physics/${variant}`),
  "/prototypes/field-manifold",
  ...[
    "force-fabric",
    "curvature-atlas",
    "tensor-coordinates",
    "method-collider",
  ].map((variant) => `/prototypes/field-manifold/${variant}`),
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
    const topology = page.locator(".atlas-topology-canvas");
    await expect(topology).toBeVisible();
    const topologySize = await topology.evaluate((canvas: HTMLCanvasElement) => ({
      renderWidth: canvas.width,
      renderHeight: canvas.height,
      displayWidth: canvas.clientWidth,
      displayHeight: canvas.clientHeight,
    }));
    expect(topologySize.renderWidth).toBeGreaterThanOrEqual(topologySize.displayWidth);
    expect(topologySize.renderHeight).toBeGreaterThanOrEqual(topologySize.displayHeight);
    expect(topologySize.displayWidth).toBeGreaterThan(240);
    expect(topologySize.displayHeight).toBeGreaterThan(240);
    const fieldTreatment = await page.locator(".atlas-topology-plot").evaluate((plot) => {
      const plotStyle = getComputedStyle(plot);
      const canvasStyle = getComputedStyle(plot.querySelector("canvas")!);
      return {
        borderLeft: plotStyle.borderLeftWidth,
        borderBottom: plotStyle.borderBottomWidth,
        mask: canvasStyle.maskImage || canvasStyle.webkitMaskImage,
      };
    });
    expect(fieldTreatment.borderLeft).toBe("0px");
    expect(fieldTreatment.borderBottom).toBe("0px");
    expect(fieldTreatment.mask).toBe("none");
    const drawnMargins = await topology.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("2d")!;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          if (pixels[(y * canvas.width + x) * 4 + 3] <= 8) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      return [minX, minY, canvas.width - 1 - maxX, canvas.height - 1 - maxY];
    });
    expect(Math.min(...drawnMargins), "the terrain should remain clear of every canvas edge").toBeGreaterThan(10);
    const headerBounds = await page.locator(".atlas-site-header").boundingBox();
    expect(headerBounds).not.toBeNull();
    expect(headerBounds!.x).toBeGreaterThan(0);
    expect(headerBounds!.y).toBeGreaterThan(0);
    expect(headerBounds!.x + headerBounds!.width).toBeLessThan(profile.width);
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
  const railTreatment = await scrollbar.evaluate((rail) => {
    const style = getComputedStyle(rail);
    return { width: style.width, background: style.backgroundColor, borderLeft: style.borderLeftWidth };
  });
  expect(railTreatment).toEqual({ width: "44px", background: "rgba(0, 0, 0, 0)", borderLeft: "0px" });
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height * 0.56);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000);
  await expect.poll(async () => Number(await scrollbar.getAttribute("data-progress"))).toBeGreaterThan(0.5);
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
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
  await expect(scrollbar).toHaveAttribute("data-wave-animating", "false");
  await expect(scrollbar).toHaveAttribute("data-wave-state", "still");
  await expect(scrollbar).toHaveAttribute("data-wave-max-displacement", "0.000");
  await expect(scrollbar).toHaveAttribute("data-wave-energy", "0.0000");
  await expect(scrollbar).toHaveAttribute("data-wave-solver", "fdtd-1d");
});

test("the portrait navigation uses a finite entrance and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/research");
  await settlePage(page);

  const animationNames = await page.locator(".atlas-site-header").evaluate((header) => ({
    geometry: getComputedStyle(header.querySelector(".nav-island-geometry")!).animationName,
    surface: getComputedStyle(header.querySelector(".nav-island-surface")!).animationName,
    content: getComputedStyle(header.querySelector(".wordmark")!).animationName,
  }));
  expect(animationNames).toEqual({
    geometry: "nav-island-reveal",
    surface: "nav-island-settle",
    content: "nav-content-arrive",
  });
  const iterationCounts = await page.locator(".atlas-site-header").evaluate((header) => ({
    geometry: getComputedStyle(header.querySelector(".nav-island-geometry")!).animationIterationCount,
    surface: getComputedStyle(header.querySelector(".nav-island-surface")!).animationIterationCount,
    content: getComputedStyle(header.querySelector(".wordmark")!).animationIterationCount,
  }));
  expect(iterationCounts).toEqual({ geometry: "1", surface: "1", content: "1" });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reducedAnimationNames = await page.locator(".atlas-site-header").evaluate((header) => ({
    geometry: getComputedStyle(header.querySelector(".nav-island-geometry")!).animationName,
    surface: getComputedStyle(header.querySelector(".nav-island-surface")!).animationName,
    content: getComputedStyle(header.querySelector(".wordmark")!).animationName,
  }));
  expect(reducedAnimationNames).toEqual({ geometry: "none", surface: "none", content: "none" });
});

test("portfolio topology selects projects and exposes their evidence coordinate", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const switcher = page.getByRole("navigation", { name: "Select a project coordinate" });
  const orbit = switcher.getByRole("button", { name: /ORBIT-PINN/ });

  await expect(orbit).toHaveAttribute("aria-pressed", "false");
  await orbit.click();
  await expect(orbit).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".atlas-topology-inspector h2")).toHaveText("ORBIT-PINN");
  await expect(page.locator(".atlas-topology-inspector").getByText("Shared-method ridges")).toBeVisible();
  await expect(page.locator(".atlas-topology-inspector").getByRole("link", { name: /Open research record/ })).toHaveAttribute("href", "/work/orbit-pinn");
});

test("portfolio topology rotates without obscuring its practical controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const topology = page.locator(".atlas-topology-canvas");
  const bounds = await topology.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.35, bounds!.y + bounds!.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.62, bounds!.y + bounds!.height * 0.58, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByRole("navigation", { name: "Select a project coordinate" })).toBeVisible();
  await expect(page.locator(".atlas-topology-inspector h2")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("research reference field uses four layers and relocates its source", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/research");
  const field = page.locator(".research-wave-field");
  const canvas = field.locator("canvas");

  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-field-model", "reference");
  await expect(canvas).toHaveAttribute("data-material-layers", "4");
  await expect(canvas).toHaveAttribute("data-target-fps", "30");
  await expect(field.getByRole("button")).toHaveCount(0);
  await expect(field.locator(".research-wave-readout")).toContainText("Reference field");
  await expect(field.locator(".research-wave-readout")).toContainText("Four-layer medium");

  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds!.x + bounds!.width * 0.62, bounds!.y + bounds!.height * 0.34);
  await expect(field.locator(".research-wave-readout")).toContainText(/source 62 . 34/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
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

test("every prototype family remains usable in phone portrait", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of portraitPrototypeRoutes) {
    const response = await page.goto(route, { waitUntil: "load" });
    expect(response?.status(), `${route} should return 200`).toBe(200);
    const headers = response?.headers();
    expect(headers?.["content-security-policy"], `${route} should carry the document CSP`).toContain("default-src 'self'");
    expect(headers?.["strict-transport-security"], `${route} should carry HSTS`).toContain("max-age=63072000");
    expect(headers?.["x-content-type-options"], `${route} should disable MIME sniffing`).toBe("nosniff");
    await expect(page.locator("h1"), `${route} should have a visible primary heading`).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      `${route} should not overflow horizontally`,
    ).toBeLessThanOrEqual(1);
  }

  expect(errors).toEqual([]);
});

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

for (const profile of [
  { name: "phone portrait", width: 390, height: 844 },
  { name: "tablet portrait", width: 768, height: 1024 },
]) {
  test(`interactive surfaces recompose on ${profile.name}`, async ({ page }) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });

    await page.goto("/");
    const topology = page.locator(".atlas-topology-canvas");
    await expect(topology).toBeVisible();
    const topologyBounds = await topology.boundingBox();
    expect(topologyBounds).not.toBeNull();
    expect(topologyBounds!.y, "the topology should begin inside the first portrait viewport").toBeLessThan(profile.height);
    expect(topologyBounds!.height).toBeGreaterThan(300);
    const heroBounds = await page.locator(".atlas-home-hero").boundingBox();
    const inspectorBounds = await page.locator(".atlas-topology-inspector").boundingBox();
    expect(heroBounds).not.toBeNull();
    expect(inspectorBounds).not.toBeNull();
    expect(inspectorBounds!.y + inspectorBounds!.height, "the inspector should remain inside its portrait stage").toBeLessThanOrEqual(heroBounds!.y + heroBounds!.height + 1);
    await expect(page.getByRole("scrollbar", { name: "Page position" })).toBeHidden();

    await page.goto("/research");
    const field = page.locator(".research-wave-field canvas");
    await expect(field).toBeVisible();
    const fieldBounds = await field.boundingBox();
    expect(fieldBounds).not.toBeNull();
    expect(fieldBounds!.y).toBeLessThan(profile.height * 0.65);
    expect(fieldBounds!.height).toBeGreaterThan(profile.height * 0.45);
    const researchCopyBounds = await page.locator(".atlas-research-hero-copy").boundingBox();
    expect(researchCopyBounds).not.toBeNull();
    expect(fieldBounds!.y, "the portrait instrument should begin after the narrative copy").toBeGreaterThanOrEqual(researchCopyBounds!.y + researchCopyBounds!.height);
    await expect(page.locator(".research-wave-readout")).toContainText("source 52");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

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

import { expect, test } from "@playwright/test";

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
    await expect(page.locator(".hero-image img")).toHaveJSProperty("complete", true);
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

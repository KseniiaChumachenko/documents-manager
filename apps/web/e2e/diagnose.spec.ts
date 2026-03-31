import { test, expect } from "@playwright/test";

test("diagnose hydration", async ({ page }) => {
  const errors: string[] = [];
  const networkErrors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push("PAGEERROR: " + err.message));
  page.on("response", r => {
    if (r.status() >= 400) networkErrors.push(`HTTP ${r.status()}: ${r.url()}`);
  });

  await page.goto("/library/settings");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(5000);

  const hydrated = await page.evaluate(() => document.documentElement.getAttribute("data-hydrated"));
  console.log("HYDRATED:", hydrated);
  console.log("NETWORK ERRORS:", JSON.stringify(networkErrors));
  console.log("CONSOLE ERRORS:", JSON.stringify(errors.slice(0,10)));
  expect(hydrated).toBe("true");
});

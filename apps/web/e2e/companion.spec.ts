import { expect, test, type Page } from "@playwright/test";

async function openCompanion(page: Page) {
  await page.goto("/dashboard");
  await page.getByTestId("companion-pet").click();
  // Voice off: deterministic pacing, no audio in CI. Also proves the toggle works.
  await page.getByTestId("voice-toggle").click();
  await expect(page.getByTestId("voice-toggle")).toHaveText("Voice off");
}

async function ask(page: Page, text: string) {
  await page.getByTestId("companion-input").fill(text);
  await page.getByTestId("companion-input").press("Enter");
}

const status = (page: Page) => page.getByTestId("guidance-status");
const progress = (page: Page) => page.getByTestId("guidance-progress");
const bubble = (page: Page) => page.locator('[role="status"]');

test("MCP server is connected over stdio and exposes the Reflect tools", async ({ request }) => {
  const res = await request.get("/api/mcp");
  const body = await res.json();
  expect(body.connected).toBe(true);
  expect(body.tools.map((t: { name: string }) => t.name)).toEqual(
    expect.arrayContaining(["reflect_get_stablecoin_overview", "reflect_get_mint_quote", "reflect_prepare_transaction"]),
  );
});

test("browser bridge refuses tools outside the read-only allow-list", async ({ request }) => {
  const res = await request.post("/api/mcp", { data: { tool: "reflect_prepare_transaction", args: {} } });
  expect(res.status()).toBe(400);
});

test("the pet persists across client-side navigation", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("companion-pet").evaluate((el) => ((window as any).__pet = el));
  await page.locator('[data-companion="nav-mint"]').click();
  await expect(page).toHaveURL(/\/mint$/);
  await page.locator('[data-companion="nav-stats"]').click();
  await expect(page).toHaveURL(/\/stats$/);
  const same = await page.getByTestId("companion-pet").evaluate((el) => el === (window as any).__pet);
  expect(same).toBe(true);
});

test("Demo B: mint guidance uses a live quote and stops before signing", async ({ page }) => {
  await openCompanion(page);
  await ask(page, "Help me mint 100 USDC+");

  await expect(page).toHaveURL(/\/mint$/);
  await expect(status(page)).toHaveText(/fill in the field/);
  // Amount is NOT filled until the user confirms.
  await expect(page.locator('[data-companion="mint-amount"]')).toHaveValue("");
  await page.getByTestId("confirm-fill").click();
  await expect(page.locator('[data-companion="mint-amount"]')).toHaveValue("100");

  await expect(bubble(page)).toContainText("Live quote from Reflect: 100 USDC gets you", { timeout: 45_000 });
  await expect(status(page)).toHaveText(/click the highlighted button/, { timeout: 45_000 });

  // The companion waits; the user clicks.
  await page.locator('[data-companion="mint-review"]').click();
  await expect(page.getByRole("dialog", { name: "Review mint" })).toBeVisible();
  await expect(progress(page)).toHaveText("Complete", { timeout: 30_000 });
  await expect(bubble(page)).toContainText("Only you can sign");
  // Nothing was approved on the user's behalf.
  await expect(page.getByText("Demo: no wallet is connected")).toHaveCount(0);
});

test("Demo C: whitelabel guidance validates input and stops before deploy", async ({ page }) => {
  await openCompanion(page);
  await ask(page, "I want to create my own yieldcoin");
  await expect(page).toHaveURL(/\/whitelabel$/);

  const cmd = page.getByTestId("guidance-input");
  await expect(status(page)).toHaveText(/fill in the field/);
  await cmd.fill("yes");
  await cmd.press("Enter");
  await expect(page.locator('[data-companion="wl-name"]')).toHaveValue("Acme Dollar");

  // Invalid symbol → error state, no progress. Valid → advances.
  await expect(progress(page)).toHaveText("Step 3 of 7");
  await page.locator('[data-companion="wl-symbol"]').fill("a"); // may land before or after the step settles; both must show the error
  await expect(bubble(page)).toContainText("capital letters", { timeout: 5_000 });
  await expect(progress(page)).toHaveText("Step 3 of 7");
  await page.locator('[data-companion="wl-symbol"]').fill("ACME");

  await expect(progress(page)).toHaveText("Step 5 of 7", { timeout: 45_000 });
  await expect(status(page)).toHaveText(/fill in the field/, { timeout: 30_000 });
  await cmd.fill("yes");
  await cmd.press("Enter");
  await expect(page.locator('[data-companion="wl-fee"]')).toHaveValue("50");

  await expect(progress(page)).toHaveText("Complete", { timeout: 30_000 });
  await expect(page.getByText("Configuration valid")).toBeVisible();
  await expect(page.locator('[data-companion="wl-deploy"]')).toBeDisabled();
});

test("Demo A: onboarding tour walks pages and obeys 'stop'", async ({ page }) => {
  await openCompanion(page);
  await ask(page, "I'm new here. Show me how Reflect works.");
  await expect(page.getByTestId("guidance-bar")).toBeVisible();
  await expect(bubble(page)).toContainText("live APY", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/stablecoins\/usdc-plus$/, { timeout: 60_000 });
  await expect(bubble(page)).toContainText("one USDC+ is worth", { timeout: 45_000 });

  const cmd = page.getByTestId("guidance-input");
  await cmd.fill("stop");
  await cmd.press("Enter");
  await expect(page.getByTestId("guidance-bar")).toHaveCount(0);
  // "Bar gone" is also true for a crashed page (a real regression once), so prove the page lived.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await expect(page.getByTestId("companion-pet")).toBeVisible();
});

test("marketing home shows live protocol numbers and opens the app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("save for you");
  await expect(page.locator('[data-companion="home-stats"]')).toContainText("USDC+ APY");
  await page.locator('[data-companion="site-launch-app"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("USDT+ page gives a live quote and never signs", async ({ page }) => {
  await page.goto("/usdt");
  await page.locator('[data-companion="usdt-amount"]').fill("100");
  await expect(page.locator('[data-companion="usdt-quote"]')).toContainText(/\d+\.\d+/, { timeout: 45_000 });
  await page.locator('[data-companion="usdt-review"]').click();
  const dialog = page.getByRole("dialog", { name: "Review mint" });
  await expect(dialog).toContainText("USDT+");
  await page.locator('[data-companion="usdt-sign"]').click();
  await expect(dialog).toContainText("nothing is signed or sent");
  // Redeem is its own addressable tab.
  await page.goto("/usdt?tab=redeem");
  await expect(page.getByRole("button", { name: "Enter an amount" })).toBeVisible();
  await expect(page.locator('label[for="amount"]')).toHaveText("You redeem");
});

test("a new user (no deposit) gets one button that starts the guided tour", async ({ page }) => {
  await page.goto("/dashboard");
  const help = page.getByTestId("new-user-help");
  await expect(help).toContainText("You haven't deposited yet");
  await page.getByTestId("new-user-guide").click();
  await expect(page.getByTestId("guidance-bar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("guidance-bar")).toContainText("Welcome tour");
  await expect(help).toHaveCount(0); // steps aside while guiding
  await page.getByTestId("guide-stop").click();

  // "Not now" is remembered for this visitor.
  await expect(help).toBeVisible();
  await help.getByRole("button", { name: "Not now" }).click();
  await page.reload();
  await expect(page.getByTestId("new-user-help")).toHaveCount(0);
});

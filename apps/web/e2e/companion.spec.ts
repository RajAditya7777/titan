import { expect, test, type Page } from "@playwright/test";

async function openCompanion(page: Page) {
  if (!page.url().includes("/titan/swap")) await page.goto("/titan/swap");
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
const el = (page: Page, id: string) => page.locator(`[data-companion="${id}"]`);
/** Connects the simulated demo wallet (no keys, no signing), like a user would before reviewing. */
async function connectDemoWallet(page: Page) {
  await el(page, "titan-connect-wallet").click();
  await page.getByRole("button", { name: /Phantom/ }).click();
  await page.keyboard.press("Escape");
  await expect(el(page, "titan-swap-review").last()).not.toHaveText(/Connect Wallet/i);
}

/** The pet's few-word reaction above its head. */
const quip = (page: Page, text: string) => page.locator("div.whitespace-nowrap", { hasText: text });

test("MCP server is connected over stdio and exposes the Titan tools", async ({ request }) => {
  const res = await request.get("/api/mcp");
  const body = await res.json();
  expect(body.connected).toBe(true);
  expect(body.tools.map((t: { name: string }) => t.name)).toEqual(
    expect.arrayContaining(["titan_get_quote", "titan_explain_slippage", "titan_diagnose_error"]),
  );
});

test("browser bridge refuses tools outside the read-only allow-list", async ({ request }) => {
  const res = await request.post("/api/mcp", { data: { tool: "titan_sign_and_send", args: {} } });
  expect(res.status()).toBe(400);
  // Only the LLM is live: the old live Reflect API is not reachable from the browser any more.
  const live = await request.post("/api/mcp", { data: { tool: "reflect_get_protocol_stats", args: {} } });
  expect(live.status()).toBe(400);
  // Swap quotes come from the offline Titan tool.
  const quote = await request.post("/api/mcp", { data: { tool: "titan_get_quote", args: { inputToken: "SOL", outputToken: "USDC", amount: "1" } } });
  expect(quote.status()).toBe(200);
});

test("the pet persists across client-side navigation", async ({ page }) => {
  await page.goto("/titan/swap");
  await page.getByTestId("companion-pet").evaluate((node) => ((window as any).__pet = node));
  await el(page, "titan-nav-limit").click();
  await expect(page).toHaveURL(/\/titan\/limit$/);
  await el(page, "titan-nav-swap").click();
  await expect(page).toHaveURL(/\/titan\/swap$/);
  const same = await page.getByTestId("companion-pet").evaluate((node) => node === (window as any).__pet);
  expect(same).toBe(true);
});

test("swap: an amount gives a quote, review is labelled simulated, and approval never signs", async ({ page }) => {
  await page.goto("/titan/swap");
  await connectDemoWallet(page);
  await el(page, "titan-sell-amount-input").fill("2");
  await expect(el(page, "titan-buy-amount-output")).toContainText(/\d+\.\d+/);

  await el(page, "titan-switch-tokens").click();
  await el(page, "titan-sell-amount-input").fill("2");
  await expect(el(page, "titan-buy-amount-output")).toContainText(/\d/);

  await el(page, "titan-swap-review").last().click();
  await expect(page.getByText("Review Swap", { exact: true })).toBeVisible();
  await expect(page.getByText("Simulated", { exact: true })).toBeVisible();
  await el(page, "titan-swap-sign").click();
  await expect(page.getByText("Simulated Swap Approved!")).toBeVisible();
  await expect(page.getByText("would sign this transaction")).toBeVisible();
});

test("the pet reacts to typed amounts and swaps, and walks over to them", async ({ page }) => {
  await page.goto("/titan/swap");
  const pet = page.getByTestId("companion-pet");
  const home = await pet.boundingBox();

  await el(page, "titan-sell-amount-input").fill("25000");
  await expect(quip(page, "Whoa, 25,000!")).toBeVisible();
  // It walks from its corner to beside the input (not over it) and stops there.
  const input = (await el(page, "titan-sell-amount-input").boundingBox())!;
  await expect
    .poll(async () => {
      const at = (await pet.boundingBox())!;
      return at.y < home!.y - 100 && (at.x + at.width <= input.x || at.x >= input.x + input.width);
    })
    .toBe(true);

  await el(page, "titan-switch-tokens").click();
  await expect(quip(page, "Flip!")).toBeVisible();

  await el(page, "titan-sell-amount-input").fill("abc");
  await expect(quip(page, "not a number")).toBeVisible();
});

test("guided swap fills only after yes and stops before signing", async ({ page }) => {
  await page.goto("/titan/swap");
  await connectDemoWallet(page);
  await openCompanion(page);
  // 5, not the default 1: the guide must offer the user's amount, not accept the prefilled one.
  await ask(page, "Help me swap 5 SOL to USDC");

  await expect(page).toHaveURL(/\/titan\/swap$/);
  await expect(page.getByTestId("guidance-bar")).toBeVisible({ timeout: 45_000 });
  await expect(status(page)).toHaveText(/fill in the field/, { timeout: 60_000 });
  await page.getByTestId("confirm-fill").click();
  await expect(el(page, "titan-sell-amount-input")).toHaveValue("5");

  // The companion waits; the user clicks.
  await expect(status(page)).toHaveText(/click the highlighted button/, { timeout: 60_000 });
  await el(page, "titan-swap-review").last().click();
  await expect(progress(page)).toHaveText("Complete", { timeout: 30_000 });
  await expect(bubble(page)).toContainText("never sign");
  // Nothing was approved on the user's behalf.
  await expect(page.getByText("Simulated Swap Approved!")).toHaveCount(0);
});

test("a guide obeys 'stop' and the page survives", async ({ page }) => {
  await openCompanion(page);
  await ask(page, "Help me swap 1 SOL to USDC");
  await expect(page.getByTestId("guidance-bar")).toBeVisible({ timeout: 45_000 });

  const cmd = page.getByTestId("guidance-input");
  await cmd.fill("stop");
  await cmd.press("Enter");
  await expect(page.getByTestId("guidance-bar")).toHaveCount(0);
  // "Bar gone" is also true for a crashed page (a real regression once), so prove the page lived.
  await expect(el(page, "titan-sell-amount-input")).toBeVisible();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await expect(page.getByTestId("companion-pet")).toBeVisible();
});

test("a new user's top question gets a real answer about how Titan differs", async ({ page }) => {
  await openCompanion(page);
  await ask(page, "How is Titan different from other DEXs?");
  await expect(page.getByTestId("companion-panel")).toContainText(/aggregat/i, { timeout: 45_000 });
});

test("'I'm new' starts the first-swap walkthrough", async ({ page }) => {
  await openCompanion(page);
  await ask(page, "I'm new. Show me how Titan works");
  await expect(page.getByTestId("guidance-bar")).toContainText("Your first swap on Titan", { timeout: 45_000 });
  await expect(bubble(page)).toContainText("connect a Solana wallet", { timeout: 60_000 });
  await page.getByTestId("guide-stop").click();
  await expect(page.getByTestId("guidance-bar")).toHaveCount(0);
});

test("rewards: every control works and campaigns open their own page", async ({ page }) => {
  await page.goto("/titan/rewards");
  await expect(page.getByRole("heading", { name: "Connect your wallet" })).toBeVisible();
  await expect(page.getByText("1-6")).toBeVisible();
  await page.getByLabel("Next campaigns").click();
  await expect(page.getByText("PreStocks campaign 4")).toBeVisible();
  await expect(page.getByLabel("Next campaigns")).toBeDisabled();
  await page.getByLabel("Previous campaigns").click();
  await page.getByText("Peaq campaign").click();
  await expect(page).toHaveURL(/\/titan\/rewards\/peaq$/);
  await expect(page.getByText("6,250")).toBeVisible();
  await page.getByRole("tab", { name: /Epoch 3/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Epoch 3");
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/titan\/rewards$/);
});

test("developer docs: sidebar, search, code tabs and page links work", async ({ page }) => {
  await page.goto("/titan/docs/developers-portal/introduction");
  await expect(page.getByRole("heading", { level: 1, name: "Introduction" })).toBeVisible();
  await page.getByRole("tab", { name: "Python" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("import os, requests");
  await page.getByLabel("Search docs").fill("errors");
  await page.getByLabel("Search docs").press("Enter");
  await expect(page).toHaveURL(/developers-portal\/errors$/);
  await expect(page.locator('aside a[aria-current="page"]')).toHaveText("Errors");
  await page.getByRole("link", { name: /Next/ }).click();
  await expect(page).toHaveURL(/developers-portal\/faq$/);
  await expect(page.getByTestId("companion-pet")).toBeVisible();
});

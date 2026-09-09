import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:5180";

const errors = [];
const checks = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function record(step) {
  checks.push(step);
}

async function ensureLocale(page, locale) {
  const btn = page.locator(`.language-switcher__btn`, { hasText: locale.toUpperCase() });
  await btn.waitFor({ timeout: 5000 });
  const pressed = await btn.getAttribute("aria-pressed");
  if (pressed !== "true") {
    await btn.click();
    await page.waitForFunction(
      (loc) => document.documentElement.lang === loc,
      locale,
      { timeout: 3000 },
    );
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("pageerror", (err) => errors.push(`Page error: ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`Console error: ${msg.text()}`);
});

try {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 });
  await ensureLocale(page, "en");

  assert(
    (await page.locator("nav a", { hasText: "Today" }).count()) === 1,
    "Today nav link missing",
  );
  assert(
    (await page.locator(".section-title", { hasText: "Anyone" }).count()) === 1,
    "Anyone section missing",
  );
  record("today shell (en)");

  await page.locator("nav a", { hasText: "Setup" }).click();
  await page.waitForURL("**/setup");

  await page.getByLabel("Name").fill("Emma");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".item-list .item-card, .item-list li").length >= 1,
  );
  await page.getByLabel("Name").fill("");
  await page.getByLabel("Name").fill("Dad");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".item-list .item-card, .item-list li").length >= 2,
  );
  record("members");

  await page.getByRole("tab", { name: "Tasks" }).click();
  await page.getByLabel("Title").fill("Dishes");
  await page.getByRole("option", { name: "🍽️" }).click();
  await page.getByRole("radio", { name: "Daily" }).check();
  await page.getByRole("radio", { name: "Rotation" }).check();
  await page.getByRole("checkbox", { name: "Emma" }).check();
  await page.getByRole("checkbox", { name: "Dad" }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForSelector("text=Dishes", { timeout: 5000 });

  await page.getByLabel("Title").fill("Tidy");
  await page.getByRole("option", { name: "🧹" }).click();
  await page.getByRole("radio", { name: "Pool" }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForSelector("text=Tidy", { timeout: 5000 });
  record("tasks");

  await page.getByRole("tab", { name: "Rewards" }).click();
  await page.getByLabel("Title").fill("Movie night");
  await page.getByLabel("Cost").fill("50");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForSelector("text=Movie night", { timeout: 5000 });
  record("rewards");

  await page.getByRole("tab", { name: "Backup" }).click();
  assert(
    (await page.getByRole("button", { name: "Export backup" }).count()) === 1,
    "Export backup button missing",
  );
  record("backup");

  await page.locator("nav a", { hasText: "Today" }).click();
  await page.waitForURL("**/");

  let rotationDone = false;
  for (const member of ["Emma", "Dad"]) {
    await page.getByRole("tab", { name: new RegExp(member) }).click();
    const taskCheckbox = page.getByRole("checkbox", { name: "Dishes" });
    if (await taskCheckbox.isVisible().catch(() => false)) {
      await taskCheckbox.click();
      rotationDone = true;
      break;
    }
  }
  assert(rotationDone, "Dishes rotation task not visible on Emma or Dad tab");
  await page.waitForSelector("text=+10 pts", { timeout: 3000 });
  record("rotation complete");

  const poolCard = page.getByRole("checkbox", { name: "Tidy" });
  await poolCard.waitFor({ timeout: 5000 });
  await poolCard.click();
  await page.getByRole("dialog", { name: /Who did it/i }).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: /Emma/ }).click();
  await page.waitForSelector("text=+10 pts", { timeout: 3000 });
  record("pool complete");

  await page.getByRole("button", { name: "Rewards" }).click();
  assert(
    (await page.locator("text=Movie night — 50 pts").count()) >= 1,
    "Today rewards list missing active reward",
  );
  record("today rewards");

  await page.locator("nav a", { hasText: "Week" }).click();
  await page.waitForURL("**/week");
  assert(
    (await page.locator(".page-title", { hasText: "This week" }).count()) === 1,
    "Week view title missing",
  );
  assert(
    (await page.locator(".week-grid").getByText("Dishes").count()) >= 1,
    "Week grid missing rotation task",
  );
  record("week view (en)");

  await page.locator("nav a", { hasText: "Coach" }).click();
  await page.waitForURL("**/coach");
  assert(
    (await page.locator(".page-title", { hasText: "Coach" }).count()) === 1,
    "Coach view title missing",
  );
  assert(
    (await page.getByRole("button", { name: "Today's plan" }).count()) === 1,
    "Coach Today's plan button missing",
  );
  record("coach view (en)");

  // Finnish locale smoke
  await ensureLocale(page, "fi");
  assert(
    (await page.locator("nav a", { hasText: "Tänään" }).count()) === 1,
    "Finnish Today nav missing",
  );
  await page.locator("nav a", { hasText: "Asetukset" }).click();
  await page.waitForURL("**/setup");
  assert(
    (await page.getByRole("tab", { name: "Jäsenet" }).count()) === 1,
    "Finnish setup tabs missing",
  );
  record("locale fi");

  await page.screenshot({ path: "scripts/browser-smoke-week.png", fullPage: true });
} finally {
  await browser.close();
}

if (errors.length > 0) {
  console.error("Browser smoke test FAILED:");
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log("Browser smoke test PASSED");
console.log(`  URL: ${BASE}`);
console.log(`  Steps: ${checks.join(" → ")}`);
console.log("  Screenshot: scripts/browser-smoke-week.png");

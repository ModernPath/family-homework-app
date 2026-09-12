// Run against an isolated local container/test deployment, never a real family session.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const base = process.env.APP_URL ?? "http://localhost:8080";
const browser = await chromium.launch();
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));

try {
  assert.equal((await (await fetch(`${base}/agent-api/health`)).json()).mode, "stateless-demo");
  await page.goto(`${base}/setup`);
  await page.locator(".language-switcher__btn", { hasText: "EN" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Hosting Learner");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Hosting Learner", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Tasks", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Hosting dishes");
  await page.getByRole("option", { name: "🍽️" }).click();
  await page.getByRole("radio", { name: "Daily", exact: true }).check();
  await page.getByRole("radio", { name: "Pool", exact: true }).check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Hosting dishes", { exact: true }).waitFor();
  await page.locator("nav a", { hasText: "Coach" }).click();
  const reply = page.waitForResponse(r => r.url().endsWith("/agent-api/coach/ask"));
  await page.getByRole("button", { name: "Today's plan", exact: true }).click();
  const response = await reply;
  assert.equal(response.status(), 200);
  const result = await response.json();
  assert.equal(result.plan.by_member[0].member_name, "Hosting Learner");
  assert.equal(result.plan.open_pool[0].title, "Hosting dishes");
  if (process.env.HOSTING_DOCKER_PROJECT) {
    execFileSync("docker", ["compose", "-p", process.env.HOSTING_DOCKER_PROJECT, "restart", "app"]);
    let healthy = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      healthy = await fetch(`${base}/agent-api/health`).then(r => r.ok).catch(() => false);
      if (healthy) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert(healthy, "Container did not recover after restart");
  }
  await page.reload();
  const again = page.waitForResponse(r => r.url().endsWith("/agent-api/coach/ask"));
  await page.getByRole("button", { name: "Today's plan", exact: true }).click();
  assert.equal((await (await again).json()).plan.by_member[0].member_name, "Hosting Learner");
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/hosting-coach.png", fullPage: true });
  const other = await browser.newContext({ locale: "en-US" });
  const otherPage = await other.newPage();
  await otherPage.goto(`${base}/setup`);
  await otherPage.getByLabel("Name", { exact: true }).waitFor();
  assert.equal(await otherPage.getByText("Hosting Learner", { exact: true }).count(), 0);
  await other.close();
  assert.deepEqual(errors, []);
  console.log("PASS: hosted deep link, real task/coach request, reload persistence, separate browser; artifacts/hosting-coach.png");
  if (process.env.HOSTING_DOCKER_PROJECT) console.log("PASS: same browser retained household across container restart");
} finally {
  await browser.close();
}

const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { join } = require("node:path");
const { writeFileSync } = require("node:fs");

module.exports = async function designReview(base, artifacts) {
  const browser = await chromium.launch({
    executablePath: process.env.CLASSALL_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const results = [],
    issues = [],
    errors = [],
    accessibility = [];
  const routes = [
    ["landing", "/", 1],
    ["learner", "/app", 1],
    ["pulse", "/app/pulse", 1],
    ["discovery", "/app/explore", 1],
    ["groups", "/app/groups", 1],
    ["application", "/app/applications", 2],
    ["review", "/app/applications", 3],
    ["tutor", "/app", 2],
    ["teaching", "/app/teaching", 2],
    ["attendance-feedback", "/app/sessions", 1],
    ["portfolio", "/app/impact", 2],
    ["history", "/app/impact", 1],
    ["faculty", "/app/insights", 3],
    ["actions", "/app/actions", 3],
    ["studio", "/app/studio", 3],
  ];
  try {
    for (const language of ["en", "es"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        timezoneId: "Europe/Paris",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base);
      const history = await (
        await page.request.get(base + "/api/learning/history", {
          headers: { "X-Demo-User-Id": "1" },
        })
      ).json();
      const booking = history.items.find((item) => item.pre.result);
      assert(
        booking,
        "Complete the real core journey before inspecting a saved Learning Check",
      );
      for (const [name, path, user] of [
        ...routes,
        ["check", `/app/checks/${booking.booking_id}/pre`, 1],
      ]) {
        await page.evaluate(
          ({ language, user }) => {
            localStorage.setItem("classall.language", language);
            localStorage.setItem("classall-demo-user", String(user));
          },
          { language, user },
        );
        await page.goto(base + path);
        await page.locator("h1").waitFor();
        await page.waitForLoadState("networkidle");
        await page
          .locator(".loading, .spinner")
          .first()
          .waitFor({ state: "hidden" });
        if (name === "application") {
          await page.locator(".page-title button").click();
          await page
            .locator(".core-question")
            .first()
            .waitFor({ state: "attached" });
          const draft =
            language === "en"
              ? "Chain rule — my draft"
              : "Regla de la cadena — mi borrador";
          await page.locator('[name="proposed_topic"]').fill(draft);
          const teaching = page.locator(".application-stage").nth(1);
          await teaching.locator(":scope > summary").click();
          await page
            .locator('[name="motivation"]')
            .fill("I want to share a worked example with peers.");
          await teaching.locator(":scope > summary").click();
          await teaching.locator(":scope > summary").click();
          assert.equal(
            await page.locator('[name="proposed_topic"]').inputValue(),
            draft,
          );
          const languageSelect = page.locator(".language-select select");
          await languageSelect.selectOption(language === "en" ? "es" : "en");
          assert.equal(
            await page.locator('[name="proposed_topic"]').inputValue(),
            draft,
          );
          assert.equal(
            await page.locator('[name="motivation"]').inputValue(),
            "I want to share a worked example with peers.",
          );
          await languageSelect.selectOption(language);
          assert(
            await page
              .locator(
                '.application-form button[type="submit"], .application-form .action-row button',
              )
              .first()
              .isDisabled(),
            "Partial application cannot be submitted",
          );
          await teaching.locator(":scope > summary").click();
        }
        if (name === "studio") {
          await page
            .getByRole("button", {
              name:
                language === "en"
                  ? "Open prepared example"
                  : "Abrir ejemplo preparado",
              exact: true,
            })
            .click();
          await page.locator(".studio-question").first().waitFor();
        }
        for (const width of [1440, 768, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.evaluate(() => window.scrollTo(0, 0));
          const overflow = await page.evaluate(() => ({
            width: innerWidth,
            actual: document.body.scrollWidth,
            nodes: [...document.querySelectorAll("main *")]
              .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
              .slice(0, 8)
              .map((el) => el.className),
          }));
          if (overflow.actual > width)
            issues.push({ name, language, width, overflow });
          const smallButtons = await page
            .locator("main .button:visible")
            .evaluateAll((buttons) =>
              buttons
                .filter(
                  (button) => button.getBoundingClientRect().height < 43.5,
                )
                .map((button) => ({
                  text: button.textContent,
                  height: button.getBoundingClientRect().height,
                })),
            );
          if (smallButtons.length)
            issues.push({ name, language, width, smallButtons });
          await page.screenshot({
            path: join(artifacts, `v6-${language}-${name}-${width}.png`),
            fullPage: true,
          });
          await page.screenshot({
            path: join(
              artifacts,
              `v6-${language}-${name}-${width}-viewport.png`,
            ),
            fullPage: false,
          });
          results.push({
            name,
            language,
            width,
            overflow: overflow.actual > width,
          });
        }
        if (process.env.CLASSALL_AXE_SOURCE) {
          await page.addScriptTag({ path: process.env.CLASSALL_AXE_SOURCE });
          const violations = await page.evaluate(async () =>
            (
              await window.axe.run(document, {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21aa"],
                },
              })
            ).violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
          );
          writeFileSync(
            join(artifacts, `axe-${language}-${name}.json`),
            JSON.stringify(violations, null, 2),
          );
          if (violations.length)
            accessibility.push({ name, language, violations });
        }
      }
      // The mobile menu traps focus, hides the background and restores the trigger on Escape.
      await page.goto(base + "/app");
      await page.locator("#main-content").waitFor();
      const menu = page.getByRole("button", {
        name: language === "en" ? "Open navigation" : "Abrir navegación",
        exact: true,
      });
      await menu.click();
      assert.equal(await page.locator(".app-area").getAttribute("inert"), "");
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press("Tab");
        assert(
          await page.evaluate(() =>
            document.querySelector(".sidebar").contains(document.activeElement),
          ),
        );
      }
      await page.keyboard.press("Escape");
      assert(await menu.evaluate((el) => el === document.activeElement));
      assert.equal(await page.locator(".app-area").getAttribute("inert"), null);
      await context.close();
    }
    writeFileSync(
      join(artifacts, "v6-layout-results.json"),
      JSON.stringify({ results, issues, errors, accessibility }, null, 2),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(issues, []);
    assert.deepEqual(accessibility, []);
    console.log(
      `V6 design review passed: ${results.length} route/language/viewport combinations; mobile keyboard checks EN/ES.`,
    );
  } finally {
    await browser.close();
  }
};

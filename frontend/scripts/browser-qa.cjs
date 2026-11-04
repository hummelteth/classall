const assert = require("node:assert/strict");
const { chromium } = require("playwright");
async function runStudioJourney(base, artifacts) {
  const browser = await chromium.launch({
    executablePath: process.env.CLASSALL_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "Europe/Paris",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(base + "/app");
    await page.getByLabel("Demo role").selectOption("3");
    await page
      .getByRole("link", { name: "AI Learning Studio", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "AI Learning Studio", exact: true })
      .waitFor();
    await page
      .getByLabel("Interface language", { exact: true })
      .selectOption("es");
    await page
      .getByRole("heading", {
        name: "Estudio de aprendizaje con IA",
        exact: true,
      })
      .waitFor();
    await page.reload();
    await page
      .getByRole("heading", {
        name: "Estudio de aprendizaje con IA",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.getByLabel("Idioma de la interfaz").inputValue(),
      "es",
    );
    await page.getByLabel("Idioma del contenido educativo").selectOption("es");
    // Upload original PDF through the real browser and inspect locally extracted passages.
    await page
      .getByLabel("PDF con texto seleccionable")
      .setInputFiles(
        require("node:path").resolve(
          __dirname,
          "../../docs/demo/chain-rule.pdf",
        ),
      );
    await page.getByRole("button", { name: "Subir PDF", exact: true }).click();
    await page
      .getByText(
        "Texto del PDF extraído. Selecciona los fragmentos que deseas analizar.",
      )
      .waitFor();
    await page.getByRole("button", { name: "Abrir ejemplo preparado" }).click();
    await page
      .getByText(
        "Ejemplo preparado cargado. No se ha generado contenido con IA en tiempo real. Revisa cada pregunta antes de publicar.",
      )
      .waitFor();
    await page.locator(".studio-question").first().waitFor();
    assert.equal(await page.locator(".studio-question").count(), 4);
    await page.locator(".studio-source summary").first().click();
    await page
      .locator(".studio-source blockquote")
      .first()
      .waitFor({ state: "visible" });
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert(
        await page.evaluate(() => document.body.scrollWidth <= innerWidth),
        "Spanish Studio overflow at " + width,
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: require("node:path").join(
          artifacts,
          `studio-es-overview-${width}.png`,
        ),
        fullPage: false,
      });
      await page.screenshot({
        path: require("node:path").join(artifacts, `studio-es-${width}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert(
      await page
        .getByRole("button", { name: "Aprobar y publicar ambas evaluaciones" })
        .isDisabled(),
    );
    const first = page.locator(".studio-question").first();
    await first
      .getByRole("textbox", { name: "Pregunta", exact: true })
      .fill("En (3x + 1)², identifica la función interior.");
    assert(
      await first
        .getByRole("button", { name: "Aprobar pregunta" })
        .isDisabled(),
    );
    await first
      .getByRole("button", { name: "Guardar cambios como borrador" })
      .click();
    await first.getByRole("button", { name: "Aprobar pregunta" }).waitFor();
    for (let i = 0; i < 4; i++) {
      const button = page
        .getByRole("button", { name: "Aprobar pregunta", exact: true })
        .nth(i);
      await button.click();
      await page.waitForFunction(
        (index) =>
          document.querySelectorAll(".studio-review-actions button")[index * 2]
            ?.disabled,
        i,
      );
      await page.waitForFunction(
        () => !document.querySelector(".studio-progress"),
      );
    }
    await page
      .getByRole("checkbox", {
        name: "He verificado el contenido académico y apruebo ambos conjuntos de preguntas para el alumnado.",
      })
      .check();
    await page
      .getByRole("button", { name: "Aprobar y publicar ambas evaluaciones" })
      .click();
    await page
      .getByRole("button", { name: "Crear una nueva versión en borrador" })
      .waitFor();
    // Create a clean session so seeded/historical submissions never need to be reset.
    const sid = await page.evaluate(async () => {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Demo-User-Id": "2" },
        body: JSON.stringify({
          topic_id: 1,
          title: "Studio browser assignment",
          description:
            "An original synthetic session for reviewed learning practice.",
          goals: ["Apply the chain rule"],
          starts_at: new Date(Date.now() + 42 * 86400000).toISOString(),
          duration_minutes: 60,
          capacity: 5,
          format: "In person",
          location: "Synthetic library",
        }),
      });
      if (!response.ok) throw Error(await response.text());
      return (await response.json()).id;
    });
    await page.reload();
    await page.getByLabel("Evaluaciones guardadas").selectOption({ index: 1 });
    await page
      .getByLabel("Sesión de tutoría compatible")
      .selectOption(String(sid));
    await page
      .getByRole("button", { name: "Asignar ambas evaluaciones publicadas" })
      .click();
    await page
      .getByText(
        "Evaluación asignada. El alumnado puede abrirla desde su sesión reservada.",
      )
      .waitFor();
    const bid = await page.evaluate(async (sid) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Demo-User-Id": "1" },
        body: JSON.stringify({ session_id: sid }),
      });
      if (!response.ok) throw Error(await response.text());
      return (await response.json()).id;
    }, sid);
    await page.getByLabel("Rol de demostración").selectOption("1");
    await page.goto(base + `/app/checks/${bid}/pre`);
    await page
      .getByText("Ejemplo preparado · Materiales revisados por el profesorado")
      .waitFor();
    await page.getByRole("radio", { name: "3x + 1", exact: true }).check();
    await page.getByRole("radio", { name: "6(2x + 1)²", exact: true }).check();
    assert.equal(await page.locator(".quiz-explanation").count(), 0);
    await page
      .getByRole("button", { name: "Enviar evaluación de aprendizaje" })
      .click();
    await page
      .getByRole("heading", { name: "Tu resultado guardado" })
      .waitFor();
    assert.equal(await page.locator(".quiz-explanation").count(), 2);
    await page.reload();
    await page
      .getByRole("heading", { name: "Tu resultado guardado" })
      .waitFor();
    for (const role of ["1", "2", "3"]) {
      await page.getByLabel("Rol de demostración").selectOption(role);
      const routes =
        role === "3"
          ? [
              "/app",
              "/app/courses",
              "/app/insights",
              "/app/actions",
              "/app/studio",
            ]
          : role === "2"
            ? [
                "/app",
                "/app/teaching",
                "/app/publish",
                "/app/pulse",
                "/app/groups",
                "/app/explore",
                "/app/sessions",
                "/app/impact",
              ]
            : [
                "/app",
                "/app/pulse",
                "/app/groups",
                "/app/explore",
                "/app/sessions",
                "/app/impact",
              ];
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of routes) {
          await page.goto(base + route);
          await page.locator("main h1").waitFor();
          await page.waitForLoadState("networkidle");
          assert(
            await page.evaluate(() => document.body.scrollWidth <= innerWidth),
            `Spanish overflow ${role} ${width} ${route}: ` +
              JSON.stringify(
                await page.evaluate(() =>
                  [...document.querySelectorAll("body *")]
                    .filter(
                      (e) =>
                        e.getBoundingClientRect().right > innerWidth + 1 &&
                        getComputedStyle(e).position !== "fixed",
                    )
                    .map((e) => ({
                      tag: e.tagName,
                      cls: e.className,
                      text: e.textContent.slice(0, 100),
                      right: e.getBoundingClientRect().right,
                    }))
                    .slice(0, 12),
                ),
              ),
          );
          assert.equal(await page.getByRole("alert").count(), 0);
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS Spanish persistence, PDF upload, editable review, immutable publication, tutoring assignment, learner scoring and 57 Spanish viewport checks",
    );
  } catch (error) {
    await page.screenshot({
      path: require("node:path").join(artifacts, "studio-failure.png"),
      fullPage: true,
    });
    throw error;
  } finally {
    await browser.close();
  }
}

async function runJourney(base, artifacts) {
  const browser = await chromium.launch({
    executablePath: process.env.CLASSALL_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "Europe/Paris",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const stamp = Date.now();
  try {
    await page.goto(base + "/app/pulse");
    await page.getByRole("radio", { name: /I'm struggling/ }).check();
    await page
      .getByRole("button", { name: "Save check-in", exact: true })
      .click();
    await page.getByRole("button", { name: "Update check-in" }).waitFor();
    await page
      .getByRole("button", { name: "Request help with this topic" })
      .click();
    await page.getByText("Request open", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("Request open", { exact: true }).waitFor();
    assert(
      await page.getByRole("radio", { name: /I'm struggling/ }).isChecked(),
    );
    console.log("PASS Pulse, request and reload");
    await page.goto(base + "/app/groups?topic_id=1");
    const card = page.locator(".group-card").first();
    await card.getByRole("button", { name: "Join group" }).click();
    await card.getByRole("button", { name: "Leave group" }).waitFor();
    assert((await card.innerText()).includes("3 places available"));
    await page.goto(base + "/app");
    await page.getByText(/1 upcoming group in your learning space/).waitFor();
    await page.goto(base + "/app/groups?mine=true");
    await page.getByRole("button", { name: "Leave group" }).click();
    await page.getByText("No groups match these filters.").waitFor();
    console.log("PASS Group join, personal dashboard and leave");
    await page.goto(base + "/app/groups");
    await page.getByRole("button", { name: "Create a study group" }).click();
    await fillEvent(
      page,
      "Browser practice circle " + stamp,
      futureDate(15),
      false,
    );
    await page.getByRole("button", { name: "Publish study group" }).click();
    await page
      .getByRole("heading", { name: "Browser practice circle " + stamp })
      .waitFor();
    const created = page.locator(".group-card").filter({
      has: page.getByRole("heading", {
        name: "Browser practice circle " + stamp,
      }),
    });
    await created.getByRole("button", { name: "Edit group" }).click();
    await page
      .getByLabel("Title", { exact: true })
      .fill("Browser edited circle " + stamp);
    await page.getByRole("button", { name: "Save group" }).click();
    await page
      .getByRole("heading", { name: "Browser edited circle " + stamp })
      .waitFor();
    const edited = page.locator(".group-card").filter({
      has: page.getByRole("heading", {
        name: "Browser edited circle " + stamp,
      }),
    });
    await edited
      .getByRole("button", { name: "Cancel group", exact: true })
      .click();
    await edited.getByRole("button", { name: "Yes, cancel" }).click();
    await edited.waitFor({ state: "detached" });
    console.log("PASS Group create, edit and cancel");
    await page.getByRole("combobox", { name: "Demo role" }).selectOption("2");
    await page
      .locator("nav")
      .getByRole("link", { name: "Create a session", exact: true })
      .click();
    await fillEvent(page, "Browser tutoring " + stamp, futureDate(16), true);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page
      .getByRole("heading", { name: "Browser tutoring " + stamp })
      .waitFor();
    console.log("PASS Approved tutor publishes");
    await page.getByRole("combobox", { name: "Demo role" }).selectOption("1");
    await page.goto(base + "/app/explore?topic=1");
    await page
      .getByRole("button", { name: "Browser tutoring " + stamp, exact: false })
      .click();
    await page.getByRole("button", { name: "Book a free seat" }).waitFor();
    await page.keyboard.press("Tab");
    assert(
      await page
        .getByRole("dialog")
        .evaluate((e) => e.contains(document.activeElement)),
    );
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page
      .getByRole("button", { name: "Browser tutoring " + stamp, exact: false })
      .click();
    await page.getByRole("button", { name: "Book a free seat" }).click();
    await page.getByRole("heading", { name: "Your seat is saved!" }).waitFor();
    await page
      .getByRole("link", { name: "Start pre-session Learning Check" })
      .click();
    await page.getByRole("radio", { name: "3x + 1", exact: true }).check();
    await page.getByRole("radio", { name: "6(2x + 1)²", exact: true }).check();
    await page.getByRole("button", { name: "Submit Learning Check" }).click();
    await page.getByText("2/2 · 100%", { exact: true }).first().waitFor();
    await page
      .getByRole("link", { name: "See progress & demo follow-up" })
      .click();
    await page
      .getByRole("button", { name: "Demo: simulate completed session" })
      .click();
    await page.getByRole("link", { name: "Start post-session check" }).click();
    await page.getByRole("radio", { name: "4x", exact: true }).check();
    await page.getByRole("radio", { name: "10(5x − 2)", exact: true }).check();
    await page.getByRole("button", { name: "Submit Learning Check" }).click();
    await page.getByText("2/2 · 100%", { exact: true }).first().waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Your saved result" }).waitFor();
    console.log(
      "PASS Learner reservation, pre/post checks, simulation and refresh",
    );
    await page.getByRole("combobox", { name: "Demo role" }).selectOption("3");
    assert(
      (await page
        .getByRole("link", { name: "Study groups", exact: true })
        .count()) === 0,
    );
    await page
      .getByRole("link", { name: "Learning insights", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Understand the need. Choose the next step.",
      })
      .waitFor();
    await page.goto(base + "/app/actions?topic=1");
    await page.locator("select[name=action_type]").selectOption("ta_session");
    await page
      .getByLabel("Rationale from observable evidence")
      .fill(
        "Synthetic voluntary requests indicate a topic that deserves additional support.",
      );
    await page
      .getByRole("checkbox", { name: /I reviewed the available evidence/ })
      .check();
    await page.getByRole("button", { name: "Save confirmed action" }).click();
    await page
      .getByRole("button", { name: "Organize synthetic TA session" })
      .click();
    await page.getByLabel("Approved synthetic host").waitFor();
    await fillEvent(
      page,
      "Browser faculty support " + stamp,
      futureDate(17),
      true,
    );
    await page
      .getByRole("checkbox", { name: /I confirm this synthetic faculty/ })
      .check();
    await page
      .getByRole("button", { name: "Publish synthetic TA session" })
      .click();
    await page
      .getByRole("heading", { name: "Browser faculty support " + stamp })
      .waitFor();
    console.log(
      "PASS Professor evidence, human confirmation and faculty publishing",
    );
    await page.getByRole("combobox", { name: "Demo role" }).selectOption("2");
    await page
      .getByRole("heading", { name: "Browser faculty support " + stamp })
      .waitFor();
    await page.getByRole("combobox", { name: "Demo role" }).selectOption("1");
    await page.goto(base + "/app/explore?topic=1");
    await page
      .getByRole("button", { name: "Browser faculty support " + stamp })
      .click();
    await page.getByRole("button", { name: "Book a free seat" }).click();
    await page.getByRole("heading", { name: "Your seat is saved!" }).waitFor();
    await page.getByRole("link", { name: "See my sessions" }).click();
    await page
      .getByRole("button", { name: "Browser faculty support " + stamp })
      .waitFor();
    console.log(
      "PASS Faculty offering in tutor schedule and learner reservation",
    );
    for (const uid of ["1", "2", "3"]) {
      await page.getByRole("combobox", { name: "Demo role" }).selectOption(uid);
      const routes =
        uid === "3"
          ? ["/app", "/app/courses", "/app/insights", "/app/actions"]
          : uid === "2"
            ? [
                "/app",
                "/app/pulse",
                "/app/groups",
                "/app/teaching",
                "/app/publish",
                "/app/explore",
                "/app/sessions",
                "/app/impact",
              ]
            : [
                "/app",
                "/app/pulse",
                "/app/groups",
                "/app/explore",
                "/app/sessions",
                "/app/impact",
              ];
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const path of routes) {
          await page.goto(base + path);
          await page.locator("main h1").waitFor();
          await page.waitForLoadState("networkidle");
          assert(
            await page.evaluate(() => document.body.scrollWidth <= innerWidth),
            `overflow ${uid} ${width} ${path}`,
          );
          assert.equal(
            await page.getByRole("alert").count(),
            0,
            `alert ${uid} ${path}`,
          );
        }
        await page.screenshot({
          path: require("node:path").join(
            artifacts,
            `role-${uid}-${width}.png`,
          ),
          fullPage: true,
        });
        if (width === 390) {
          if (uid === "1" || uid === "3") {
            await page.goto(
              base + (uid === "1" ? "/app/groups" : "/app/actions"),
            );
            await page
              .getByRole("button", {
                name:
                  uid === "1"
                    ? "Create a study group"
                    : "Create support action",
              })
              .click();
            await page.locator(".form-panel form").waitFor();
            assert(
              await page.evaluate(
                () => document.body.scrollWidth <= innerWidth,
              ),
              `mobile form overflow role ${uid}`,
            );
            await page.screenshot({
              path: require("node:path").join(
                artifacts,
                `role-${uid}-mobile-form.png`,
              ),
              fullPage: true,
            });
          }

          await page.getByRole("button", { name: "Open navigation" }).click();
          await page
            .getByRole("link", {
              name:
                uid === "3"
                  ? "Teaching dashboard"
                  : uid === "2"
                    ? "Tutor dashboard"
                    : "My learning space",
              exact: true,
            })
            .click();
          assert.equal(
            await page
              .getByRole("button", { name: "Open navigation" })
              .getAttribute("aria-expanded"),
            "false",
          );
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS 54 role/route/viewport checks, mobile navigation and zero browser errors",
    );
    await page.screenshot({
      path: require("node:path").join(artifacts, "professor-desktop.png"),
      fullPage: true,
    });
  } catch (error) {
    await page.screenshot({
      path: require("node:path").join(artifacts, "failure.png"),
      fullPage: true,
    });
    throw error;
  } finally {
    await browser.close();
  }
}
async function fillEvent(page, title, date, session) {
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "A synthetic learning circle with practical examples and space for questions.",
    );
  if (session)
    await page
      .getByLabel(/Learning objectives/)
      .fill("Apply the chain rule to a fresh example");
  await page.getByLabel(/Date and time/).fill(date);
  await page.getByLabel(/^Location/).fill("Library · Room 8");
}

function futureDate(offset) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10) + "T10:00";
}
const { spawn } = require("node:child_process");
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { createServer } = require("node:net");
const { setTimeout: delay } = require("node:timers/promises");
async function port() {
  return new Promise((done, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => done(p));
    });
  });
}
async function waitReady(url, child) {
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null)
      throw Error("Test service exited before startup");
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error("Test service did not start: " + url);
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const ended = new Promise((done) => child.once("exit", done));
  child.kill("SIGTERM");
  await Promise.race([ended, delay(3000)]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await ended;
  }
}
(async () => {
  const root = resolve(__dirname, "../..");
  const directory = mkdtempSync(join(tmpdir(), "classall-browser-"));
  const artifacts =
    process.env.CLASSALL_ARTIFACTS || join(root, "work", "browser-qa");
  mkdirSync(artifacts, { recursive: true });
  const design = process.argv.includes("--design");
  const core = process.argv.includes("--core") || design;
  const apiPort = await port(),
    frontPort = await port();
  let api, frontend;
  let logs = "";
  try {
    const python =
      process.env.CLASSALL_PYTHON ||
      join(
        root,
        ".venv",
        process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
      );
    const database = join(
      directory,
      core ? "classall-v5-presentation.sqlite3" : "test.sqlite3",
    );
    if (core) {
      const result = require("node:child_process").spawnSync(
        python,
        ["-m", "app.presentation", "--database", database],
        {
          cwd: root,
          env: { ...process.env, PYTHONPATH: join(root, "backend") },
          encoding: "utf8",
        },
      );
      if (result.status !== 0)
        throw Error(result.stderr || String(result.error));
    }
    api = spawn(
      python,
      [
        "-m",
        "uvicorn",
        "app.main:app",
        "--app-dir",
        "backend",
        "--host",
        "127.0.0.1",
        "--port",
        String(apiPort),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          CLASSALL_DB_PATH: database,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    api.on("error", (e) => (logs += String(e)));
    api.stdout.on("data", (s) => (logs += s));
    api.stderr.on("data", (s) => (logs += s));
    await waitReady(`http://127.0.0.1:${apiPort}/api/health`, api);
    frontend = spawn(
      process.execPath,
      [
        join(root, "frontend/node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        String(frontPort),
        "--strictPort",
      ],
      {
        cwd: join(root, "frontend"),
        env: {
          ...process.env,
          CLASSALL_API_TARGET: `http://127.0.0.1:${apiPort}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    frontend.on("error", (e) => (logs += String(e)));
    frontend.stdout.on("data", (s) => (logs += s));
    frontend.stderr.on("data", (s) => (logs += s));
    await waitReady(`http://127.0.0.1:${frontPort}`, frontend);
    if (core) {
      await require("./core-journey.cjs")(
        `http://127.0.0.1:${frontPort}`,
        artifacts,
        process.argv.includes("--spanish"),
      );
      if (design)
        await require("./design-qa.cjs")(
          `http://127.0.0.1:${frontPort}`,
          artifacts,
        );
      return;
    }
    if (!process.env.CLASSALL_STUDIO_ONLY)
      await runJourney(`http://127.0.0.1:${frontPort}`, artifacts);
    await runStudioJourney(`http://127.0.0.1:${frontPort}`, artifacts);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await stop(frontend);
    await stop(api);
    writeFileSync(join(artifacts, "services.log"), logs);
    rmSync(directory, { recursive: true, force: true });
  }
})();

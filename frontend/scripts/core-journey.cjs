const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { join } = require("node:path");
module.exports = async function runCoreJourney(
  base,
  artifacts,
  spanish = false,
) {
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
  const catalog = require("../src/lib/locales/es.json");
  const L = (en) => (spanish ? (catalog[en] ?? en) : en);
  const button = (en, es) =>
    page.getByRole("button", { name: L(en, es), exact: true });
  const link = (en, es) =>
    page.getByRole("link", { name: L(en, es), exact: true });
  const label = (en, es) => page.getByLabel(L(en, es), { exact: true });
  async function role(id) {
    await label("Demo role", "Rol de demostración").selectOption(String(id));
  }
  async function layout(name) {
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        await page.evaluate(() => document.body.scrollWidth <= innerWidth),
        `${name} overflow at ${width}`,
      );
      await page.screenshot({
        path: join(
          artifacts,
          `v5-${spanish ? "es" : "en"}-${name}-${width}.png`,
        ),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  try {
    await page.goto(base + "/app");
    if (spanish)
      await page
        .getByLabel("Interface language", { exact: true })
        .selectOption("es");
    // Laura: express a learning need using the existing connected pathway.
    await link("Learning Pulse", "Pulso de aprendizaje").click();
    await page
      .getByLabel(L("I'm struggling and would like support."), { exact: false })
      .check();
    await button("Save check-in").click();
    await button("Request help with this topic").click();
    console.log("PASS Laura expresses a learning need");
    // David begins without Mathematics approval in the dedicated scenario.
    await role(2);
    await link("My teaching", "Mis tutorías").click();
    await button("Create a session", "Crear una sesión").click();
    await label("Course", "Asignatura").selectOption("5"); // Statistics remains approved.
    assert(
      !(await label("Course", "Asignatura")
        .locator('option[value="1"]')
        .count()),
    );
    await link("Become a Tutor", "Hazte tutor").click();
    await button("Start an application", "Iniciar una solicitud").click();
    const form = page.locator("form").first();
    for (const [en, es, value] of [
      [
        "Why would you like to help?",
        "¿Por qué te gustaría ayudar?",
        "I want to help peers feel welcome asking about calculus.",
      ],
      [
        "Relevant knowledge or experience",
        "Conocimientos o experiencia relevantes",
        "I have studied calculus and helped my study group.",
      ],
      [
        "Proposed tutoring topic",
        "Tema de tutoría propuesto",
        "Chain rule together",
      ],
      [
        "Learning objectives",
        "Objetivos de aprendizaje",
        "Recognize inner functions and explain the inner derivative.",
      ],
      [
        "Brief teaching plan",
        "Breve plan docente",
        "Start with a diagram, practise a worked example, then invite a question.",
      ],
      [
        "Teaching approach or activities",
        "Enfoque o actividades de enseñanza",
        "Use a visual analogy, paired practice and a short reflection.",
      ],
    ])
      await form.getByLabel(L(en, es), { exact: true }).fill(value);
    for (const fieldset of await form.locator("fieldset").all())
      await fieldset.getByRole("radio").first().check();
    await form
      .locator('textarea[name="explanation"]')
      .fill(
        "The outer function changes as its input changes. The inner function also changes with x, so we multiply the two rates. Try (2x+1)^3: 3(2x+1)^2 times 2.",
      );
    await button("Submit application", "Enviar solicitud").click();
    await page.locator(".application-card").waitFor();
    await button(
      "Open prepared review checklist",
      "Abrir guía de revisión preparada",
    ).click();
    await page
      .getByRole("heading", {
        name: L(
          "Prepared review checklist — no live AI evaluation",
          "Guía de revisión preparada — sin evaluación de IA en tiempo real",
        ),
      })
      .waitFor();
    await page.reload();
    await page.getByText(L("Pending", "Pendiente"), { exact: true }).waitFor();
    await layout("application");
    // Professor: inspect evidence, explicitly approve and persist a human decision.
    await role(3);
    await link("Tutor applications", "Solicitudes de tutoría").click();
    await label(
      "Comments for the applicant",
      "Comentarios para el solicitante",
    ).fill(
      "Reviewed the knowledge responses and teaching plan; approved for synthetic peer tutoring.",
    );
    await label("Decision", "Decisión").selectOption("approved");
    await label(
      "I have reviewed the responses and teaching plan. This is my human decision.",
      "He revisado las respuestas y el plan docente. Esta es mi decisión humana.",
    ).check();
    await button(
      "Save professor decision",
      "Guardar decisión del profesorado",
    ).click();
    await page.getByText(L("Approved", "Aprobada"), { exact: true }).waitFor();
    await layout("professor-review");
    // David: this exact subject now appears in the existing publishing form.
    await role(2);
    await link("My teaching", "Mis tutorías").click();
    await button("Create a session", "Crear una sesión").click();
    await label("Course", "Asignatura").selectOption("1");
    const title = spanish
      ? "Tutoría V5 de regla de la cadena"
      : "V5 chain rule peer tutoring";
    await label("Title", "Título").fill(title);
    await label("Description", "Descripción").fill(
      "A friendly synthetic session to practise the chain rule together.",
    );
    await page
      .locator('textarea[name="goals"]')
      .fill("Identify the inner function\nApply the chain rule step by step");
    const start = new Date(Date.now() + 15 * 86400000);
    start.setUTCHours(11, 0, 0, 0);
    // Browser is Europe/Paris; datetime-local input is interpreted in that zone.
    const local = new Date(start.getTime() + 60 * 60000)
      .toISOString()
      .slice(0, 16);
    await page.locator('input[name="starts_at"]').fill(local);
    await page.locator('input[name="location"]').fill("Fictional library");
    await button("Publish", "Publicar").click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    // Laura: book the newly published session, save optional pre-check.
    await role(1);
    await link("Find support", "Buscar apoyo").click();
    await label("Search tutoring sessions").fill(title);
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await page.getByRole("dialog").waitFor();
    await button("Book a free seat", "Reservar una plaza gratis").click();
    await page
      .getByRole("heading", { name: L("Your seat is saved!") })
      .waitFor();
    await button("Close session details").click();
    await link("My sessions", "Mis sesiones").click();
    const row = page.locator(".booking-row").filter({ hasText: title });
    await row
      .getByRole("link", {
        name: L(
          "Open Learning Check & saved result",
          "Abrir evaluación y resultado guardado",
        ),
      })
      .click();
    await page.locator(".quiz-question").first().waitFor();
    for (const fieldset of await page.locator(".quiz-question").all())
      await fieldset.getByRole("radio").first().check();
    await button("Submit Learning Check").click();
    await page.getByRole("heading", { name: L("Your saved result") }).waitFor();
    const postUrl = page.url().replace("/pre", "/post");
    // David proposes attendance; no contribution before learner confirmation.
    await role(2);
    await link("My teaching", "Mis tutorías").click();
    const card = page
      .locator(".teaching-management")
      .filter({ hasText: title });
    await card
      .getByRole("button", {
        name: L(
          "Synthetic attendance confirmation",
          "Confirmación de asistencia sintética",
        ),
      })
      .click();
    await card.getByRole("checkbox").first().check();
    await card.getByRole("checkbox").last().check();
    await card
      .getByRole("button", {
        name: L(
          "Propose synthetic attendance",
          "Proponer asistencia sintética",
        ),
      })
      .click();
    await page
      .getByText(
        L(
          "Synthetic attendance proposed. Participants must confirm separately; points are awarded once after the first confirmation.",
          "Asistencia sintética propuesta. Los participantes deben confirmar por separado; los puntos se conceden una sola vez tras la primera confirmación.",
        ),
      )
      .waitFor();
    await layout("attendance");
    // Laura confirms and gives feedback; the pre/post simulation was not used.
    await role(1);
    await link("My sessions", "Mis sesiones").click();
    await label(
      "I confirm my fictional participation in this synthetic demonstration.",
      "Confirmo mi participación ficticia en esta demostración sintética.",
    ).check();
    await button(
      "Confirm my synthetic attendance",
      "Confirmar mi asistencia sintética",
    ).click();
    await label(
      "Clarity of explanations",
      "Claridad de las explicaciones",
    ).selectOption("3");
    await label(
      "Preparation and organization",
      "Preparación y organización",
    ).selectOption("2");
    await label(
      "Supportive learning atmosphere",
      "Ambiente de aprendizaje de apoyo",
    ).selectOption("3");
    await label(
      "Optional private reflection",
      "Reflexión privada opcional",
    ).fill("Private: a diagram would help me next time.");
    await button(
      "Send constructive feedback",
      "Enviar comentarios constructivos",
    ).click();
    await page
      .getByText(
        L(
          "Your constructive feedback is saved. Your private comment is visible only to you.",
          "Tus comentarios constructivos están guardados. Tu comentario privado solo es visible para ti.",
        ),
      )
      .waitFor();
    await page.goto(postUrl);
    await page.locator(".quiz-question").first().waitFor();
    for (const fieldset of await page.locator(".quiz-question").all())
      await fieldset.getByRole("radio").last().check();
    await button("Submit Learning Check").click();
    await page.getByRole("heading", { name: L("Your saved result") }).waitFor();
    // David's portfolio reflects 40 preserved + 20 new points, with tiny feedback suppressed.
    await role(2);
    await link("My impact", "Mi impacto").click();
    await page
      .getByRole("heading", {
        name: L(
          "Private competency portfolio",
          "Portafolio privado de competencias",
        ),
      })
      .waitFor();
    assert.equal(
      await page
        .locator(".stats-grid article")
        .first()
        .locator("strong")
        .textContent(),
      "60",
    );
    assert(
      !(await page
        .getByText("Private: a diagram would help me next time.")
        .count()),
    );
    await page.reload();
    await page
      .getByText(
        L(
          "Two-party synthetic confirmation",
          "Confirmación sintética de ambas partes",
        ),
        { exact: false },
      )
      .waitFor();
    await layout("portfolio");
    // Faculty completes the story using existing aggregate signals and actions.
    await role(3);
    await link("Support actions", "Acciones de apoyo").click();
    await button("Create support action", "Crear acción de apoyo").click();
    await page
      .locator('textarea[name="rationale"]')
      .fill(
        "Observed aggregate support demand warrants another optional practice resource.",
      );
    await page.locator('input[type="checkbox"]').last().check();
    await button("Save confirmed action").click();
    await page
      .getByText(
        "Observed aggregate support demand warrants another optional practice resource.",
      )
      .waitFor();
    await layout("faculty-action");
    assert.deepEqual(errors, []);
    console.log(
      `V5 ${spanish ? "Spanish" : "English"} complete browser journey passed at desktop/tablet/mobile widths.`,
    );
  } catch (error) {
    await page.screenshot({
      path: join(artifacts, "v5-failure.png"),
      fullPage: true,
    });
    require("node:fs").writeFileSync(
      join(artifacts, "v5-failure.txt"),
      await page.locator("body").innerText(),
    );
    throw error;
  } finally {
    await browser.close();
  }
};

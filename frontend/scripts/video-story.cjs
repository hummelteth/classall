const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { join } = require("node:path");
module.exports = async function recordStory(
  base,
  artifacts,
  spanish = true,
) {
  const browser = await chromium.launch({
    executablePath: process.env.CLASSALL_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const fs = require('node:fs');
  const errors = [];
  let page, context, scene = 0, beats = [], sceneStart;
  let nextUrl = base + '/';
  let state;
  const manifest = [];
  async function startScene(number) {
    if (context) {
      state = await context.storageState();
      nextUrl = page.url();
      await endScene();
    }
    scene = number;
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1, locale: 'es-ES', timezoneId: 'Europe/Paris',
      storageState: state,
      recordVideo: { dir: join(artifacts, 'raw'), size: {width:1920,height:1080} }
    });
    sceneStart = Date.now();
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if(r.url().includes('/api/') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(nextUrl);
    await page.getByRole('main').waitFor();
    beats = [];
  }
  async function hold(note, seconds=2) {
    assert.deepEqual(errors, [], 'Application error; stop recording');
    await page.waitForTimeout(300);
    const alerts = await page.locator('[role="alert"]').allTextContents();
    assert(!alerts.some(t => /error|failed|no se pudo/i.test(t)), alerts.join(' '));
    await page.screenshot({path:join(artifacts, 'frames', `scene-${String(scene).padStart(2,'0')}-${beats.length+1}.png`)});
    beats.push({note, at:(Date.now()-sceneStart)/1000});
    await page.waitForTimeout(seconds*1000);
  }
  async function endScene() {
    const video = page.video();
    await context.close();
    const path = join(artifacts, 'raw', `scene-${String(scene).padStart(2,'0')}.webm`);
    await video.saveAs(path);
    await video.delete();
    manifest.push({number:scene, source:require('node:path').relative(artifacts,path), beats});
    fs.writeFileSync(join(artifacts,'recording.json'), JSON.stringify(manifest,null,2));
    context = null;
  }
  const catalog = require("../src/lib/locales/es.json");
  const L = (en) => (spanish ? (catalog[en] ?? en) : en);
  const button = (en, es) =>
    page.getByRole("button", { name: L(en, es), exact: true });
  const link = (en, es) =>
    page.getByRole("link", { name: L(en, es), exact: true });
  const label = (en, es) => page.getByLabel(L(en, es), { exact: true });
  async function role(id) {
    // Leave a private learner check before selecting a different demo identity.
    if(page.url().includes('/checks/')) await page.goto(base + '/app');
    await label("Demo role", "Rol de demostración").selectOption(String(id));
  }
  async function layout(name) { await hold(name, 3); }
  try {
    await startScene(1);
    if (spanish)
      await page
        .getByLabel("Interface language", { exact: true })
        .selectOption("es");
    await hold('¿Y si aprender fuera una experiencia compartida?', 5);
    await startScene(2);
    await page.goto(base + '/app');
    // Laura: express a learning need using the existing connected pathway.
    await link("Learning Pulse", "Pulso de aprendizaje").click();
    await page
      .getByLabel(L("I'm struggling and would like support."), { exact: false })
      .check();
    await hold("Laura necesita apoyo con la regla de la cadena", 3);
    await button("Save check-in").click();
    await hold("Reflexión guardada", 2);
    await button("Request help with this topic").click();
    await hold("Solicitud de apoyo guardada", 2);
    await page.locator(".support-options").scrollIntoViewIfNeeded();
    await hold("De una necesidad a oportunidades de apoyo", 3);
    console.log("PASS Laura expresses a learning need");
    await startScene(3);
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
    await hold("Matemáticas requiere autorización", 2);
    await link("Become a Tutor", "Hazte tutor").click();
    await button("Start an application", "Iniciar una solicitud").click();
    const form = page.locator("form").first();
    // Progressive sections keep every response mounted; open them for this complete journey.
    for (const section of await form.locator(".application-stage").all()) {
      if ((await section.getAttribute("open")) === null)
        await section.locator(":scope > summary").click();
    }
    for (const [en, es, value] of [
      [
        "Why would you like to help?",
        "¿Por qué te gustaría ayudar?",
        "Quiero que mis compañeros se sientan cómodos al hacer preguntas.",
      ],
      [
        "Relevant knowledge or experience",
        "Conocimientos o experiencia relevantes",
        "He estudiado cálculo y he colaborado con nuestro grupo de estudio.",
      ],
      [
        "Proposed tutoring topic",
        "Tema de tutoría propuesto",
        "Comprender la regla de la cadena",
      ],
      [
        "Learning objectives",
        "Objetivos de aprendizaje",
        "Identificar la función interior y explicar por qué se multiplican las derivadas.",
      ],
      [
        "Brief teaching plan",
        "Breve plan docente",
        "Empezar con un diagrama, resolver un ejemplo y practicar juntos.",
      ],
      [
        "Teaching approach or activities",
        "Enfoque o actividades de enseñanza",
        "Pedir al estudiante que identifique cada función y explique el siguiente paso.",
      ],
    ])
      await form.getByLabel(L(en, es), { exact: true }).fill(value);
    const knowledge = await form.locator('fieldset').all();
    assert.equal(knowledge.length, 2);
    await knowledge[0].getByRole('radio', {name:'3x + 1',exact:true}).check();
    await knowledge[1].getByRole('radio', {name:'6(2x + 1)²',exact:true}).check();
    await form
      .locator('textarea[name="explanation"]')
      .fill(
        "Un cambio en x modifica la función interior y después la exterior. Multiplicamos ambas tasas. En (2x + 1)³, multiplicamos 3(2x + 1)² por 2 y obtenemos 6(2x + 1)². Dibujemos las etapas y probemos otro ejemplo.",
      );
    const stages = await form.locator('.application-stage').all();
    for (const section of stages) {
      for(const other of stages) {
        if(await other.getAttribute('open') !== null) await other.locator(':scope > summary').click();
      }
      await section.locator(':scope > summary').click();
      await section.scrollIntoViewIfNeeded();
      await hold('Solicitud: ' + await section.locator(':scope > summary').innerText(), 3);
    }
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
    await layout("Solicitud pendiente y guía preparada");
    await startScene(4);
    // Professor: inspect evidence, explicitly approve and persist a human decision.
    await role(3);
    await link("Tutor applications", "Solicitudes de tutoría").click();
    await hold("Elena revisa la propuesta docente", 2);
    for(const name of ['Knowledge responses','Teaching explanation']) {
      const summary=page.locator('summary').filter({hasText:L(name)});
      await summary.click();
      await summary.locator('..').scrollIntoViewIfNeeded();
      await hold('Elena revisa: '+L(name),2);
    }
    await label(
      "Comments for the applicant",
      "Comentarios para el solicitante",
    ).fill(
      "He revisado los conocimientos y el plan docente. Autorizo las tutorías sintéticas de Matemáticas.",
    );
    await label("Decision", "Decisión").selectOption("approved");
    await label(
      "I have reviewed the responses and teaching plan. This is my human decision.",
      "He revisado las respuestas y el plan docente. Esta es mi decisión humana.",
    ).check();
    await hold("La decisión académica es humana", 3);
    await button(
      "Save professor decision",
      "Guardar decisión del profesorado",
    ).click();
    await page.getByText(L("Approved", "Aprobada"), { exact: true }).waitFor();
    await layout("Autorización aprobada por Elena");
    await startScene(5);
    // David: this exact subject now appears in the existing publishing form.
    await role(2);
    await link("My teaching", "Mis tutorías").click();
    await button("Create a session", "Crear una sesión").click();
    await label("Course", "Asignatura").selectOption("1");
    const title = spanish
      ? "Regla de la cadena: aprender juntos"
      : "V5 chain rule peer tutoring";
    await label("Title", "Título").fill(title);
    await label("Description", "Descripción").fill(
      "Una sesión sintética para comprender y practicar juntos la regla de la cadena.",
    );
    await page
      .locator('textarea[name="goals"]')
      .fill("Identificar la función interior\nAplicar la regla de la cadena paso a paso");
    const start = new Date(Date.now() + 15 * 86400000);
    start.setUTCHours(11, 0, 0, 0);
    // Browser is Europe/Paris; datetime-local input is interpreted in that zone.
    const local = new Date(start.getTime() + 60 * 60000)
      .toISOString()
      .slice(0, 16);
    await page.locator('input[name="starts_at"]').fill(local);
    await page.locator('input[name="location"]').fill("Biblioteca ficticia");
    await hold("Matemáticas autorizada: una nueva oportunidad", 3);
    await button("Publish", "Publicar").click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await hold("Sesión publicada", 3);
    // Laura: book the newly published session, save optional pre-check.
    await role(1);
    await link("Find support", "Buscar apoyo").click();
    await label("Search tutoring sessions").fill(title);
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await page.getByRole("dialog").waitFor();
    await hold("Laura encuentra la sesión de David", 2);
    await button("Book a free seat", "Reservar una plaza gratis").click();
    await page
      .getByRole("heading", { name: L("Your seat is saved!") })
      .waitFor();
    await hold("Reserva confirmada", 3);
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
    await hold("Evaluación formativa opcional", 2);
    await button("Submit Learning Check").click();
    await page.getByRole("heading", { name: L("Your saved result") }).waitFor();
    await hold("Resultado guardado", 3);
    await startScene(6);
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
    await hold("David propone asistencia sintética", 3);
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
    await layout("Propuesta sintética guardada");
    // Laura confirms and gives feedback; the pre/post simulation was not used.
    await role(1);
    await link("My sessions", "Mis sesiones").click();
    await label(
      "I confirm my fictional participation in this synthetic demonstration.",
      "Confirmo mi participación ficticia en esta demostración sintética.",
    ).check();
    await hold("Laura confirma por separado su participación ficticia", 3);
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
    ).fill("Un diagrama me ayudaría a visualizar mejor las etapas la próxima vez.");
    await hold("Comentarios para mejorar la enseñanza", 3);
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
    // David's portfolio reflects 40 preserved + 20 new points, with tiny feedback suppressed.
    await role(2);
    await link("My impact", "Mi impacto").click();
    await page
      .getByRole("heading", {
        name: L(
          "Small acts. Lasting contribution.",
          "Pequeños gestos. Contribuciones que cuentan.",
        ),
      })
      .waitFor();
    assert.equal(
      await page.locator(".impact-points strong").textContent(),
      "60",
    );
    assert(
      !(await page
        .getByText("Un diagrama me ayudaría a visualizar mejor las etapas la próxima vez.")
        .count()),
    );
    await page.locator(".impact-points").scrollIntoViewIfNeeded();
    await hold("Mi impacto: valores reales del registro", 4);
    await page.reload();
    await page
      .locator(".contribution-timeline details")
      .first()
      .waitFor({ state: "attached" });
    for (const detail of await page
      .locator(".contribution-timeline details")
      .all())
      await detail.locator("summary").click();
    await page
      .getByText(
        L(
          "Two-party synthetic confirmation",
          "Confirmación sintética de ambas partes",
        ),
        { exact: false },
      )
      .waitFor();
    await layout("Origen de las contribuciones documentadas");
    await startScene(7);
    // Faculty completes the story using existing aggregate signals and actions.
    await role(3);
    await link("Learning insights").click();
    await hold("Observación → Interpretación → Acción humana", 4);
    await link("Support actions", "Acciones de apoyo").click();
    await button("Create support action", "Crear acción de apoyo").click();
    await page
      .locator('textarea[name="rationale"]')
      .fill(
        "La demanda agregada de apoyo sobre la regla de la cadena justifica ofrecer materiales de práctica adicionales.",
      );
    await page.locator('input[type="checkbox"]').last().check();
    await hold("Una acción confirmada por la profesora", 2);
    await button("Save confirmed action").click();
    await page
      .getByText(
        "La demanda agregada de apoyo sobre la regla de la cadena justifica ofrecer materiales de práctica adicionales.",
      )
      .waitFor();
    // Open the saved action's evidence through the existing disclosure control.
    const actionEvidence=page.locator('.evidence-details').first();
    await actionEvidence.locator(':scope > summary').click();
    await actionEvidence.scrollIntoViewIfNeeded();
    await layout("Acción guardada con evidencia agregada");
    await startScene(8);
    await page.goto(base + '/');
    await hold('Aprender juntos. Reconocer fortalezas. Apoyar a tiempo.', 5);
    await endScene();
    assert.deepEqual(errors, []);
    console.log(
      `Spanish 1080p production journey passed; all eight scenes captured.`,
    );
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({
      path: join(artifacts, "failure.png"),
      fullPage: true,
    });
    if(page && !page.isClosed()) require("node:fs").writeFileSync(
      join(artifacts, "failure.txt"),
      await page.locator("body").innerText(),
    );
    throw error;
  } finally {
    if(context) await context.close();
    await browser.close();
  }
};

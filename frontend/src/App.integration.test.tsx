import { transferableAbortController } from "node:util";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import App from "./App";
import type { Booking, Session } from "./lib/types";

// Full React → HTTP → Python → SQLite flow, without pretending JSDOM is a browser.
const actualFetch = globalThis.fetch;
let backend: ChildProcess | undefined;
let directory: string;
let base: string;
let serverLogs = "";

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "classall-integration-"));
  const port = await new Promise<number>((resolvePort, reject) => {
    const socket = createServer();
    socket.on("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const address = socket.address();
      const port = typeof address === "object" && address ? address.port : 0;
      socket.close(() => resolvePort(port));
    });
  });
  base = `http://127.0.0.1:${port}`;
  const root = resolve(process.cwd(), "..");
  const python =
    process.env.CLASSALL_PYTHON ||
    join(
      root,
      ".venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
  backend = spawn(
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
      String(port),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        CLASSALL_DB_PATH: join(directory, "demo.sqlite3"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  backend.on("error", (error) => {
    serverLogs += String(error);
  });
  backend.stdout?.on("data", (chunk) => {
    serverLogs += String(chunk);
  });
  backend.stderr?.on("data", (chunk) => {
    serverLogs += String(chunk);
  });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      ready = (await actualFetch(`${base}/api/health`)).ok;
    } catch {
      /* Wait for ASGI startup. */
    }
    if (ready) break;
    if (backend.exitCode !== null || backend.pid === undefined) break;
    await delay(100);
  }
  if (!ready)
    throw new Error(
      `Could not start the Python API. Install backend/requirements.txt into the root .venv. ${serverLogs}`,
    );
  vi.stubGlobal("fetch", (input: RequestInfo | URL, options?: RequestInit) => {
    // Node's HTTP client and JSDOM have separate AbortSignal implementations.
    const controller = transferableAbortController();
    const abort = () => controller.abort();
    if (options?.signal?.aborted) abort();
    options?.signal?.addEventListener("abort", abort, { once: true });
    return actualFetch(new URL(String(input), base).toString(), {
      ...options,
      signal: controller.signal,
    }).finally(() => options?.signal?.removeEventListener("abort", abort));
  });
}, 20000);

afterAll(async () => {
  vi.unstubAllGlobals();
  if (backend && backend.exitCode === null) {
    const exited = new Promise<void>((done) =>
      backend!.once("exit", () => done()),
    );
    backend.kill("SIGTERM");
    const stopped = await Promise.race([
      exited.then(() => true),
      delay(3000).then(() => false),
    ]);
    if (!stopped) {
      backend.kill("SIGKILL");
      await exited;
    }
  }
  if (directory) rmSync(directory, { recursive: true, force: true });
});

it("persists a learner booking, updates faculty counts, and releases the seat through the UI", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/app/explore"]}>
      <App />
    </MemoryRouter>,
  );
  const before = (await actualFetch(`${base}/api/sessions/1`).then((r) =>
    r.json(),
  )) as Session;
  await user.click(
    await screen.findByRole("button", { name: /Make sense of the chain rule/ }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Book a free seat" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Your seat is saved!" }),
  ).toBeInTheDocument();
  const stored = (await actualFetch(`${base}/api/bookings`, {
    headers: { "X-Demo-User-Id": "1" },
  }).then((r) => r.json())) as Booking[];
  const booking = stored.find((b) => b.session.id === 1);
  expect(booking?.status).toBe("confirmed");
  const reserved = (await actualFetch(`${base}/api/sessions/1`).then((r) =>
    r.json(),
  )) as Session;
  expect(reserved.available_seats).toBe(before.available_seats - 1);
  await user.click(screen.getByRole("link", { name: "See my sessions" }));
  expect(
    await screen.findByRole("button", { name: "Cancel booking" }),
  ).toBeInTheDocument();
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Demo role" }),
    "3",
  );
  const meter = await screen.findByRole("meter", {
    name: "Mathematics seats booked",
  });
  expect(meter).toHaveAttribute(
    "aria-valuenow",
    String(before.booked_seats + 1),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Demo role" }),
    "1",
  );
  await screen.findByRole("heading", { name: /A good day to grow, Laura/ });
  await user.click(screen.getByRole("link", { name: "My sessions" }));
  await user.click(
    await screen.findByRole("button", { name: "Cancel booking" }),
  );
  await user.click(screen.getByRole("button", { name: "Yes, cancel" }));
  expect(
    await screen.findByText("Your next chapter is open."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancelled" }));
  const row = await screen.findByText(/Mathematics · CANCELLED/);
  expect(
    within(row.closest("article")!).getByRole("button", {
      name: /Make sense of the chain rule/,
    }),
  ).toBeInTheDocument();
  await waitFor(async () => {
    const released = (await actualFetch(`${base}/api/sessions/1`).then((r) =>
      r.json(),
    )) as Session;
    expect(released.available_seats).toBe(before.available_seats);
  });
}, 20000);

it("runs pre and demo post checks through the real API, reviews progress, and updates privacy-safe teacher insights", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/app/explore"]}>
      <App />
    </MemoryRouter>,
  );
  await user.click(
    await screen.findByRole("button", { name: /Make sense of the chain rule/ }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Book a free seat" }),
  );
  await user.click(
    await screen.findByRole("link", {
      name: "Start pre-session Learning Check",
    }),
  );
  expect(
    await screen.findByRole("heading", { name: "Pre-session Learning Check" }),
  ).toBeInTheDocument();
  const submit = await screen.findByRole("button", {
    name: "Submit Learning Check",
  });
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "3x + 1" }));
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "3(2x + 1)²" }));
  await user.click(submit);
  expect(
    await screen.findByRole("heading", { name: "Your saved result" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("1/2 · 50%")).toBeInTheDocument();
  expect(screen.getByText(/Multiply the outer derivative/)).toBeInTheDocument();
  await user.click(
    screen.getByRole("link", { name: "See progress & demo follow-up" }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: "Demo: simulate completed session",
    }),
  );
  await user.click(
    await screen.findByRole("link", { name: "Start post-session check" }),
  );
  await user.click(await screen.findByRole("radio", { name: "sin(x)" }));
  await user.click(screen.getByRole("radio", { name: "2(5x − 2)" }));
  await user.click(
    screen.getByRole("button", { name: "Submit Learning Check" }),
  );
  await screen.findByRole("heading", { name: "Your saved result" });
  expect(
    await screen.findByText(
      /Difference on these checks: -50 percentage points/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/This describes your answers on different questions/),
  ).toBeInTheDocument();
  const stored = (
    await actualFetch(`${base}/api/learning/history`, {
      headers: { "X-Demo-User-Id": "1" },
    }).then((r) => r.json())
  ).items;
  const item = stored.find(
    (i: { booking_status: string }) => i.booking_status === "confirmed",
  );
  expect(item.pre.result.percent).toBe(50);
  expect(item.post.result.percent).toBe(0);
  expect(item.simulated).toBe(true);
  expect(item.change_percentage_points).toBe(-50);
  await user.click(
    screen.getByRole("link", { name: "See progress & demo follow-up" }),
  );
  const reviewLinks = await screen.findAllByRole("link", {
    name: "Review post-session check",
  });
  await user.click(reviewLinks[0]);
  expect(
    await screen.findByRole("heading", { name: "Your saved result" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Submit Learning Check" }),
  ).not.toBeInTheDocument();
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Demo role" }),
    "3",
  );
  await screen.findByRole("heading", { name: "See where support can begin." });
  await user.click(screen.getByRole("link", { name: "Learning insights" }));
  expect(
    await screen.findByText("Post-session checks · n=3 of 3"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: /Consider additional practice materials/,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText(/Advisory · Human review required/).length,
  ).toBeGreaterThanOrEqual(2);
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Multiply the outer derivative/),
  ).not.toBeInTheDocument();
}, 20000);

it("connects Pulse, groups, tutor publishing and a human-confirmed faculty session through SQLite", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/app/pulse"]}>
      <App />
    </MemoryRouter>,
  );
  await user.click(
    await screen.findByRole("radio", {
      name: "I'm struggling and would like support. You don’t have to work it out alone.",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Save check-in" }));
  expect(
    await screen.findByRole("button", { name: "Withdraw response" }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Request help with this topic" }),
  );
  expect(await screen.findByText("Request open")).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Study groups" }));
  const join = await screen.findAllByRole("button", { name: "Join group" });
  await user.click(join[0]);
  expect(
    await screen.findByRole("button", { name: "Leave group" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Leave group" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Demo role" }),
    "2",
  );
  await user.click(
    within(screen.getByRole("navigation")).getByRole("link", {
      name: "Create a session",
    }),
  );
  await screen.findByRole("heading", { name: "Publish a tutoring session" });
  await user.type(
    await screen.findByLabelText("Title"),
    "Integration tutoring circle",
  );
  await user.type(
    screen.getByLabelText("Description"),
    "A small synthetic practice session with patient explanations.",
  );
  await user.type(
    screen.getByLabelText(/Learning objectives/),
    "Apply the chain rule",
  );
  const dateInput = screen.getByLabelText(/Date and time/);
  // Native datetime input entry is browser-dependent; React receives a real change event.
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.change(dateInput, { target: { value: "2099-12-01T10:00" } });
  await user.type(screen.getByLabelText(/^Location/), "Library room 7");
  await user.click(screen.getByRole("button", { name: "Publish" }));
  expect(
    await screen.findByRole("heading", { name: "Integration tutoring circle" }),
  ).toBeInTheDocument();
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Demo role" }),
    "1",
  );
  await user.click(screen.getByRole("link", { name: "Find support" }));
  await user.click(
    await screen.findByRole("button", { name: /Integration tutoring circle/ }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Book a free seat" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Your seat is saved!" }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Close session details" }),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Demo role" }),
    "3",
  );
  await user.click(screen.getByRole("link", { name: "Support actions" }));
  await user.click(
    screen.getByRole("button", { name: "Create support action" }),
  );
  await user.selectOptions(screen.getByLabelText("Action"), "ta_session");
  await user.type(
    screen.getByLabelText("Rationale from observable evidence"),
    "Three voluntary requests indicate demand worth reviewing.",
  );
  const confirm = screen.getByRole("checkbox", {
    name: /I reviewed the available evidence/,
  });
  expect(confirm).toBeRequired();
  await user.click(confirm);
  await user.click(
    screen.getByRole("button", { name: "Save confirmed action" }),
  );
  expect(
    await screen.findByRole("heading", { name: "TA-led support session" }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Organize synthetic TA session" }),
  );
  await screen.findByRole("combobox", { name: "Approved synthetic host" });
  await user.type(
    screen.getByLabelText("Title"),
    "Integration faculty support circle",
  );
  await user.type(
    screen.getByLabelText("Description"),
    "Synthetic faculty-organized practice with an approved peer tutor.",
  );
  await user.type(
    screen.getByLabelText(/Learning objectives/),
    "Practice a fresh composite function",
  );
  fireEvent.change(screen.getByLabelText(/Date and time/), {
    target: { value: "2099-12-02T10:00" },
  });
  await user.type(screen.getByLabelText(/^Location/), "Library room 8");
  await user.click(
    screen.getByRole("checkbox", { name: /I confirm this synthetic faculty/ }),
  );
  await user.click(
    screen.getByRole("button", { name: "Publish synthetic TA session" }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "Integration faculty support circle",
    }),
  ).toBeInTheDocument();
  const actions = await actualFetch(`${base}/api/support-actions`, {
    headers: { "X-Demo-User-Id": "3" },
  }).then((r) => r.json());
  expect(actions[0].evidence.human_review_required).toBe(true);
  expect(actions[0].status).toBe("active");
  const offering = await actualFetch(
    `${base}/api/sessions/${actions[0].session_id}`,
  ).then((r) => r.json());
  expect(offering.kind).toBe("faculty");
  expect(offering.organizer_id).toBe(3);
  expect(offering.tutor.id).toBe(2);
}, 30000);

it("reviews and publishes a prepared Studio pair through React and SQLite", async () => {
  const user = userEvent.setup();
  localStorage.setItem("classall-demo-user", "3");
  render(
    <MemoryRouter initialEntries={["/app/studio"]}>
      <App />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", {
    name: "AI Learning Studio",
  });
  await user.click(
    screen.getByRole("button", { name: "Open prepared example" }),
  );
  await screen.findByText(
    "Prepared example loaded. No live AI generation was performed. Review every question before publishing.",
  );
  const publishName = "Approve & publish complete pair";
  expect(
    await screen.findByRole("button", { name: publishName }),
  ).toBeDisabled();
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(".studio-question"),
  );
  expect(cards).toHaveLength(4);
  await user.click(within(cards[0]).getByText(/Inspect source passage/));
  expect(
    within(cards[0]).getByText(/ClassAll - Original synthetic course notes/),
  ).toBeInTheDocument();
  const prompt = within(cards[0]).getByRole("textbox", {
    name: "Question",
  });
  await user.clear(prompt);
  await user.type(
    prompt,
    "Which expression is the inner function in (3x + 1)²?",
  );
  expect(
    within(cards[0]).getByRole("button", { name: "Approve question" }),
  ).toBeDisabled();
  await user.click(
    within(cards[0]).getByRole("button", { name: "Save changes as draft" }),
  );
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: "Approve question" })[0],
    ).toBeEnabled(),
  );
  for (let i = 0; i < 4; i++) {
    await user.click(
      screen.getAllByRole("button", { name: "Approve question" })[i],
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Approve question" })[i],
      ).toBeDisabled(),
    );
  }
  await user.click(
    screen.getByRole("checkbox", {
      name: "I have verified the academic content and approve both assessment sets for learners.",
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: publishName })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: publishName }));
  await screen.findByText(
    "Published as an immutable snapshot. Assign it to a compatible tutoring session.",
  );
  expect(
    await screen.findByRole("button", { name: "Create new draft revision" }),
  ).toBeInTheDocument();
  const workspace = await actualFetch(`${base}/api/studio/workspace`, {
    headers: { "X-Demo-User-Id": "3" },
  }).then((r) => r.json());
  expect(workspace.assessments[0].status).toBe("published");
  expect(workspace.publications).toHaveLength(1);
}, 15000);

it("connects learner qualification, faculty approval, two-party attendance and private feedback through React and SQLite", async () => {
  const user = userEvent.setup();
  localStorage.setItem("classall-demo-user", "1");
  render(
    <MemoryRouter initialEntries={["/app/applications"]}>
      <App />
    </MemoryRouter>,
  );
  await user.click(
    await screen.findByRole("button", { name: "Start an application" }),
  );
  const values: Record<string, string> = {
    "Why would you like to help?": "Help fellow students feel welcome.",
    "Relevant knowledge or experience": "Two years of calculus study.",
    "Proposed tutoring topic": "Chain rule practice",
    "Learning objectives": "Apply inner and outer derivatives.",
    "Brief teaching plan": "Diagram first, practise, then reflect.",
    "Teaching approach or activities": "Use a diagram and paired practice.",
  };
  for (const [name, value] of Object.entries(values))
    await user.type(await screen.findByRole("textbox", { name }), value);
  const qualification = await screen.findAllByRole("group");
  const questions = qualification.filter(
    (f) => within(f).queryAllByRole("radio").length === 3,
  );
  expect(questions).toHaveLength(2);
  for (const q of questions)
    await user.click(within(q).getAllByRole("radio")[0]);
  await user.type(
    document.querySelector('textarea[name="explanation"]')!,
    "First explain that both rates change. Multiply the outer derivative by the inner derivative and work through an example.",
  );
  await user.click(screen.getByRole("button", { name: "Submit application" }));
  await screen.findByText("Pending", { exact: true });
  await user.click(
    screen.getByRole("button", { name: "Open prepared review checklist" }),
  );
  await screen.findByRole("heading", {
    name: "Prepared review checklist — no live AI evaluation",
  });
  await user.selectOptions(screen.getByLabelText("Demo role"), "3");
  await user.click(screen.getByRole("link", { name: "Tutor applications" }));
  await user.type(
    await screen.findByLabelText("Comments for the applicant"),
    "Add a short learner activity.",
  );
  await user.click(
    screen.getByLabelText(
      "I have reviewed the responses and teaching plan. This is my human decision.",
    ),
  );
  await user.click(
    screen.getByRole("button", { name: "Save professor decision" }),
  );
  await screen.findByText("Changes requested", { exact: true });
  await user.selectOptions(screen.getByLabelText("Demo role"), "1");
  await user.click(screen.getByRole("link", { name: "Become a Tutor" }));
  await user.click(
    await screen.findByRole("button", { name: "Revise and resubmit" }),
  );
  const approach = screen.getByRole("textbox", {
    name: "Teaching approach or activities",
  });
  await user.clear(approach);
  await user.type(
    approach,
    "Use a diagram and invite the learner to solve a new example.",
  );
  await user.click(screen.getByRole("button", { name: "Submit application" }));
  await screen.findByText("Pending", { exact: true });
  await user.selectOptions(screen.getByLabelText("Demo role"), "3");
  await user.click(screen.getByRole("link", { name: "Tutor applications" }));
  await user.type(
    await screen.findByLabelText("Comments for the applicant"),
    "Reviewed revised plan; approved.",
  );
  await user.selectOptions(screen.getByLabelText("Decision"), "approved");
  await user.click(
    screen.getByLabelText(
      "I have reviewed the responses and teaching plan. This is my human decision.",
    ),
  );
  await user.click(
    screen.getByRole("button", { name: "Save professor decision" }),
  );
  await screen.findByText("Approved", { exact: true });
  await user.selectOptions(screen.getByLabelText("Demo role"), "1");
  await user.click(screen.getByRole("link", { name: "Create a session" }));
  const title = "Learner to tutor V5 integration";
  await user.type(await screen.findByRole("textbox", { name: "Title" }), title);
  await user.type(
    screen.getByRole("textbox", { name: "Description" }),
    "A friendly synthetic session for new derivatives.",
  );
  await user.type(
    document.querySelector('textarea[name="goals"]')!,
    "Apply the chain rule",
  );
  const date = document.querySelector<HTMLInputElement>(
    'input[name="starts_at"]',
  )!;
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.change(date, {
    target: {
      value: new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 16),
    },
  });
  await user.type(
    document.querySelector('input[name="location"]')!,
    "Fictional library",
  );
  await user.click(screen.getByRole("button", { name: "Publish" }));
  await screen.findByRole("heading", { name: title });
  await user.selectOptions(screen.getByLabelText("Demo role"), "2");
  await user.click(screen.getByRole("link", { name: "Find support" }));
  await user.click(
    await screen.findByRole("button", { name: new RegExp(title) }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Book a free seat" }),
  );
  await screen.findByRole("heading", { name: "Your seat is saved!" });
  await user.click(
    screen.getByRole("button", { name: "Close session details" }),
  );
  await user.selectOptions(screen.getByLabelText("Demo role"), "1");
  await user.click(screen.getByRole("link", { name: "My teaching" }));
  const card = (await screen.findByRole("heading", { name: title })).closest(
    "article",
  )!;
  await user.click(
    within(card).getByRole("button", {
      name: "Synthetic attendance confirmation",
    }),
  );
  await waitFor(() =>
    expect(within(card).getAllByRole("checkbox")).toHaveLength(2),
  );
  for (const c of within(card).getAllByRole("checkbox")) await user.click(c);
  await user.click(
    within(card).getByRole("button", { name: "Propose synthetic attendance" }),
  );
  await screen.findByText(
    "Synthetic attendance proposed. Participants must confirm separately; points are awarded once after the first confirmation.",
  );
  const before = await actualFetch(`${base}/api/portfolio`, {
    headers: { "X-Demo-User-Id": "1" },
  }).then((r) => r.json());
  expect(before.points).toBe(0);
  await user.selectOptions(screen.getByLabelText("Demo role"), "2");
  await user.click(screen.getByRole("link", { name: "My sessions" }));
  await user.click(
    await screen.findByLabelText(
      "I confirm my fictional participation in this synthetic demonstration.",
    ),
  );
  await user.click(
    screen.getByRole("button", { name: "Confirm my synthetic attendance" }),
  );
  for (const name of [
    "Clarity of explanations",
    "Preparation and organization",
    "Supportive learning atmosphere",
  ])
    await user.selectOptions(await screen.findByLabelText(name), "3");
  await user.type(
    screen.getByLabelText("Optional private reflection"),
    "Keep this private.",
  );
  await user.click(
    screen.getByRole("button", { name: "Send constructive feedback" }),
  );
  await screen.findByText(
    "Your constructive feedback is saved. Your private comment is visible only to you.",
  );
  await user.selectOptions(screen.getByLabelText("Demo role"), "1");
  await user.click(
    screen.getByRole("link", { name: "My learning and impact" }),
  );
  await screen.findByRole("heading", {
    name: "Small acts. Lasting contribution.",
  });
  await screen.findByText(
    "Summaries require at least 3 distinct learners. Individual ratings and private comments are hidden.",
  );
  const after = await actualFetch(`${base}/api/portfolio`, {
    headers: { "X-Demo-User-Id": "1" },
  }).then((r) => r.json());
  expect(after.points).toBe(20);
  expect(after.confirmed_sessions).toBe(1);
  expect(screen.queryByText("Keep this private.")).not.toBeInTheDocument();
}, 30000);

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
  expect(
    await screen.findByText("Post-session checks · n=3 of 3"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: /Consider additional practice materials/,
    }),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/Advisory · Human review required/)).toHaveLength(
    2,
  );
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Multiply the outer derivative/),
  ).not.toBeInTheDocument();
}, 20000);

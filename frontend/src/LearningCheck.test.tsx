import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { LearningCheck } from "./pages/LearningCheck";

const demo = vi.hoisted(() => ({
  user: { id: 1, role: "learner" },
  version: 0,
  refresh: vi.fn(),
}));
vi.mock("./lib/demo", () => ({ useDemo: () => demo }));
const payload = {
  booking_id: 9,
  stage: "pre",
  status: "pending",
  result: null,
  reason: null,
  questions: [
    {
      id: 100,
      prompt: "First practice question?",
      objective_id: 10,
      options: [
        { id: 1000, label: "First option" },
        { id: 1001, label: "Second option" },
      ],
    },
    {
      id: 101,
      prompt: "Second practice question?",
      objective_id: 11,
      options: [
        { id: 1010, label: "Another option" },
        { id: 1011, label: "Last option" },
      ],
    },
  ],
};
function mount() {
  return render(
    <MemoryRouter initialEntries={["/checks/9/pre"]}>
      <Routes>
        <Route path="/checks/:bookingId/:stage" element={<LearningCheck />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  demo.user = { id: 1, role: "learner" };
  demo.version = 0;
  demo.refresh.mockClear();
});

it("preserves selected answers and displays an actionable submission failure", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (input: string, options?: RequestInit) =>
        new Response(
          JSON.stringify(
            options?.method === "POST"
              ? {
                  detail:
                    "This booking is cancelled. Saved results remain available; new checks are closed.",
                }
              : input.includes("history")
                ? { items: [], note: "Synthetic" }
                : payload,
          ),
          { status: options?.method === "POST" ? 409 : 200 },
        ),
    ),
  );
  const user = userEvent.setup();
  mount();
  const button = await screen.findByRole("button", {
    name: "Submit Learning Check",
  });
  expect(button).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "First option" }));
  await user.click(screen.getByRole("radio", { name: "Another option" }));
  await user.click(button);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This booking is cancelled.",
  );
  expect(screen.getByRole("radio", { name: "First option" })).toBeChecked();
  expect(demo.refresh).not.toHaveBeenCalled();
});

it("removes an earlier learner's rendered result immediately when the demo identity changes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, options?: RequestInit) => {
      if (
        options?.headers &&
        (options.headers as Record<string, string>)["X-Demo-User-Id"] === "2"
      )
        return new Response(
          JSON.stringify({
            detail: "Learning Check not found for this demo learner.",
          }),
          { status: 404 },
        );
      return new Response(
        JSON.stringify(
          input.includes("history")
            ? { items: [], note: "Synthetic" }
            : {
                ...payload,
                status: "completed",
                result: { correct: 2, total: 2, percent: 100 },
                questions: payload.questions.map((q) => ({
                  ...q,
                  selected_option_id: q.options[0].id,
                  correct_option_id: q.options[0].id,
                  explanation: "Private saved explanation.",
                })),
              },
        ),
      );
    }),
  );
  const view = mount();
  await screen.findByRole("heading", { name: "Your saved result" });
  demo.user = { id: 2, role: "tutor" };
  view.rerender(
    <MemoryRouter initialEntries={["/checks/9/pre"]}>
      <Routes>
        <Route path="/checks/:bookingId/:stage" element={<LearningCheck />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    screen.queryByText("Private saved explanation."),
  ).not.toBeInTheDocument();
  expect(
    await screen.findByText("Learning Check not found for this demo learner."),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "Your saved result" }),
    ).not.toBeInTheDocument(),
  );
});

it("labels a locked post-check without rendering its questions or a submit action", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (input: string) =>
        new Response(
          JSON.stringify(
            input.includes("history")
              ? { items: [], note: "Synthetic" }
              : {
                  ...payload,
                  status: "locked",
                  questions: [],
                  reason:
                    "Complete the pre-session check first so you have a comparison.",
                },
          ),
        ),
    ),
  );
  mount();
  expect(
    await screen.findByText(/Complete the pre-session check first/),
  ).toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Submit Learning Check" }),
  ).not.toBeInTheDocument();
});

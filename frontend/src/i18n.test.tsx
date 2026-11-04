import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import Shell from "./components/Shell";
import { currentLanguage, setLanguage, t } from "./lib/i18n";
import { dateLabel } from "./lib/api";

const demo = vi.hoisted(() => ({
  user: {
    id: 1,
    role: "learner",
    name: "Laura",
    initials: "LM",
    color: "sage",
  },
  users: [{ id: 1, role: "learner" }],
  selectUser: vi.fn(),
}));
vi.mock("./lib/demo", () => ({
  useDemo: () => demo,
  DemoProvider: ({ children }: { children: React.ReactNode }) => children,
}));
beforeEach(() => {
  setLanguage("en");
});
afterEach(() => {
  setLanguage("en");
});

it("switches landing language immediately, preserves the page, and saves the preference", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const main = screen.getByRole("main");
  await user.selectOptions(screen.getByLabelText("Interface language"), "es");
  expect(
    screen.getByRole("link", { name: "Explorar la demostración" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("main")).toBe(main);
  expect(document.documentElement.lang).toBe("es");
  expect(localStorage.getItem("classall.language")).toBe("es");
  await user.selectOptions(
    screen.getByLabelText("Idioma de la interfaz"),
    "en",
  );
  expect(
    screen.getByRole("link", { name: "Explore the demo" }),
  ).toBeInTheDocument();
});

it.each([
  ["learner", "Mi espacio de aprendizaje", "Pulso de aprendizaje"],
  ["tutor", "Panel de tutoría", "Mis tutorías"],
  ["professor", "Panel docente", "Estudio de aprendizaje con IA"],
])(
  "translates navigation and accessibility labels for %s",
  (role, heading, link) => {
    demo.user.role = role;
    act(() => setLanguage("es"));
    render(
      <MemoryRouter>
        <Shell />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: link })).toBeInTheDocument();
    expect(screen.getByLabelText("Navegación principal")).toBeInTheDocument();
    expect(screen.getByLabelText("Rol de demostración")).toBeInTheDocument();
  },
);

it("uses Spanish date conventions and translates dynamic explanatory messages", () => {
  setLanguage("es");
  expect(dateLabel("2026-11-04T12:00:00Z", { month: "long" })).toBe(
    "noviembre",
  );
  expect(
    t("4 distinct learners have confirmed topic bookings (demand)."),
  ).toContain("4 estudiantes");
  expect(t("A good day to grow, {{0}}.", { 0: "Laura" })).toBe(
    "Un buen día para aprender, Laura.",
  );
  expect(t("My original course title")).toBe("My original course title");
  expect(currentLanguage()).toBe("es");
});

it("localizes native required-field validation and updates it when language changes", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
      <form onSubmit={(event) => event.preventDefault()}>
        <label>
          Test field
          <input required name="test" />
        </label>
        <button>Validate</button>
      </form>
    </MemoryRouter>,
  );
  const input = screen.getByRole("textbox", {
    name: "Test field",
  }) as HTMLInputElement;
  act(() => setLanguage("es"));
  await user.click(screen.getByRole("button", { name: "Validate" }));
  expect(input.validationMessage).toBe("Completa este campo.");
  act(() => setLanguage("en"));
  expect(input.validationMessage).toBe("Please complete this field.");
  await user.type(input, "Ready");
  expect(input.checkValidity()).toBe(true);
});

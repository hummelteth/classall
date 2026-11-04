import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Booking, DemoUser, Session, Subject } from "./lib/types";

const users: DemoUser[] = [
  {
    id: 1,
    name: "Laura Martín",
    role: "learner",
    initials: "LM",
    color: "peach",
    programme: "Computer Science",
    year: "Year 2",
  },
  {
    id: 2,
    name: "David Chen",
    role: "tutor",
    initials: "DC",
    color: "violet",
    programme: "Mathematics",
    year: "Year 4",
  },
  {
    id: 3,
    name: "Professor Elena García",
    role: "professor",
    initials: "EG",
    color: "sage",
    programme: "Mathematics",
    year: "Faculty",
  },
];
const subjects: Subject[] = [
  {
    id: 1,
    name: "Mathematics",
    code: "MATH 201",
    category: "Sciences",
    symbol: "∑",
    color: "violet",
  },
  {
    id: 2,
    name: "Computer Science",
    code: "CS 102",
    category: "Technology",
    symbol: "</>",
    color: "peach",
  },
];
const session: Session = {
  id: 1,
  title: "Make sense of the chain rule",
  description: "A friendly calculus session.",
  goals: ["Apply the chain rule"],
  starts_at: "2099-11-05T14:00:00+00:00",
  duration_minutes: 60,
  capacity: 6,
  format: "In person",
  location: "Library · Room 2.04",
  level: "Beginner",
  status: "upcoming",
  subject: subjects[0],
  tutor: users[1],
  approved: true,
  booked_seats: 2,
  available_seats: 4,
};
const python: Session = {
  ...session,
  id: 2,
  title: "Python for everyone",
  subject: subjects[1],
  tutor: { ...users[1], id: 4, name: "Amira Hassan" },
  format: "Online",
};
let bookings: Booking[];
let calls: { url: string; options: RequestInit }[];
let conflict = false;

beforeEach(() => {
  bookings = [];
  calls = [];
  conflict = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, options: RequestInit = {}) => {
      const url = String(input);
      calls.push({ url, options });
      const parsed = new URL(url, "http://localhost");
      let data: unknown;
      let status = 200;
      if (parsed.pathname === "/api/demo-users") data = users;
      else if (parsed.pathname === "/api/subjects") data = subjects;
      else if (parsed.pathname === "/api/sessions")
        data = [session, python]
          .filter(
            (s) =>
              !parsed.searchParams.get("subject_id") ||
              String(s.subject.id) === parsed.searchParams.get("subject_id"),
          )
          .filter(
            (s) =>
              !parsed.searchParams.get("delivery") ||
              s.format === parsed.searchParams.get("delivery"),
          );
      else if (parsed.pathname.startsWith("/api/sessions/"))
        data = [session, python].find(
          (s) => s.id === Number(parsed.pathname.split("/").pop()),
        );
      else if (parsed.pathname.endsWith("/cancel")) {
        bookings[0] = { ...bookings[0], status: "cancelled" };
        data = bookings[0];
      } else if (
        parsed.pathname === "/api/bookings" &&
        options.method === "POST"
      ) {
        if (conflict) {
          data = {
            detail: "This session is full. Please choose another session.",
          };
          status = 409;
        } else {
          bookings.push({
            id: 15,
            status: "confirmed",
            created_at: new Date().toISOString(),
            session,
          });
          data = bookings[0];
          status = 201;
        }
      } else if (parsed.pathname === "/api/bookings") data = bookings;
      else if (parsed.pathname === "/api/tutor/overview")
        data = {
          sessions: [session],
          engagement_points: 40,
          teaching_minutes: 120,
          completed_sessions: 2,
          approved_subjects: [subjects[0]],
        };
      else if (parsed.pathname === "/api/insights")
        data = {
          courses: [
            {
              subject: subjects[0],
              sessions: 1,
              bookings: 2,
              capacity: 6,
              available_seats: 4,
            },
          ],
          note: "Booking demand is not evidence of academic difficulty.",
        };
      else {
        status = 404;
        data = { detail: "Not found" };
      }
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
const mount = (path = "/app/explore") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe("ClassAll demo flows", () => {
  it("offers a landing page without needing a backend", async () => {
    mount("/");
    expect(
      screen.getByRole("heading", { name: /Great minds learn together/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Find your learning community" }),
    ).toHaveAttribute("href", "/app");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("opens bookmarked subject filters without showing unrelated sessions", async () => {
    mount("/app/explore?subject=2");
    expect(
      await screen.findByRole("button", { name: /Python for everyone/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Computer Science" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: /Make sense of the chain rule/ }),
    ).not.toBeInTheDocument();
  });
  it("filters by subject, search and delivery, and recovers from empty results", async () => {
    const user = userEvent.setup();
    mount();
    expect(
      await screen.findByRole("button", {
        name: /Make sense of the chain rule/,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Computer Science" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Make sense of the chain rule/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole("button", { name: /Python for everyone/ }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Search tutoring sessions" }),
      "does not exist",
    );
    expect(
      screen.getByText("Let’s try a different direction."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(
      await screen.findByRole("button", {
        name: /Make sense of the chain rule/,
      }),
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Session format" }),
      "Online",
    );
    expect(
      await screen.findByRole("button", { name: /Python for everyone/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Make sense of the chain rule/ }),
      ).not.toBeInTheDocument(),
    );
  });
  it("books through REST, shows confirmation, navigates to schedule, and cancels", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(
      await screen.findByRole("button", {
        name: /Make sense of the chain rule/,
      }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      await within(dialog).findByRole("button", { name: "Book a free seat" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Your seat is saved!" }),
    ).toBeInTheDocument();
    const post = calls.find(
      (c) => c.url === "/api/bookings" && c.options.method === "POST",
    );
    expect(post?.options.body).toBe('{"session_id":1}');
    expect(post?.options.headers).toMatchObject({ "X-Demo-User-Id": "1" });
    await user.click(screen.getByRole("link", { name: "See my sessions" }));
    expect(
      await screen.findByRole("button", { name: "Cancel booking" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    await user.click(screen.getByRole("button", { name: "Yes, cancel" }));
    expect(
      await screen.findByText("Your next chapter is open."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelled" }));
    expect(
      await screen.findByText(/Mathematics · CANCELLED/),
    ).toBeInTheDocument();
  });
  it("shows backend booking conflicts without claiming success", async () => {
    conflict = true;
    const user = userEvent.setup();
    mount();
    await user.click(
      await screen.findByRole("button", {
        name: /Make sense of the chain rule/,
      }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Book a free seat" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This session is full.",
    );
    expect(screen.queryByText("Your seat is saved!")).not.toBeInTheDocument();
  });
  it("navigates all three roles and shows only relevant primary navigation", async () => {
    const user = userEvent.setup();
    mount("/app");
    expect(
      await screen.findByRole("heading", { name: /A good day to grow, Laura/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("No real authentication.")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Demo role" }),
      "2",
    );
    expect(
      await screen.findByRole("heading", {
        name: "A little of your time. A lot of impact.",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("40")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Demo role" }),
      "3",
    );
    expect(
      await screen.findByRole("heading", {
        name: "See where support can begin.",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Booking demand is not evidence of academic difficulty.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Study groups" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "My sessions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Support actions" }),
    ).toHaveAttribute("href", "/app/actions");
    expect(
      screen.getByRole("link", { name: "Learning insights" }),
    ).toHaveAttribute("href", "/app/insights");
  });
  it("provides a recoverable startup failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new TypeError("network unavailable"),
    );
    const user = userEvent.setup();
    mount("/app");
    expect(await screen.findByText("Let’s get connected.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry connection" }));
    expect(
      await screen.findByRole("heading", { name: /A good day to grow, Laura/ }),
    ).toBeInTheDocument();
  });
});

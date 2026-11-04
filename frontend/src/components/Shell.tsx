import { t as tr } from "../lib/i18n";
import { LanguageSelector } from "../lib/i18n";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Compass,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { useDemo } from "../lib/demo";
import { Avatar, Brand } from "./ui";
import { GuidedDemo } from "./ExperienceUI";

export default function Shell() {
  const { user, users, selectUser } = useDemo();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const appArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    appArea.current?.setAttribute("inert", "");
    const focusFrame = requestAnimationFrame(() =>
      sidebar.current?.querySelector<HTMLElement>("button")?.focus(),
    );
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab") return;
      const controls = [
        ...(sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href],button,select",
        ) ?? []),
      ].filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!sidebar.current?.contains(document.activeElement)) {
        event.preventDefault();
        first?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const viewport = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => {
      if (viewport.matches) setMenuOpen(false);
    };
    viewport.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(focusFrame);
      viewport.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = previousOverflow;
      appArea.current?.removeAttribute("inert");
      menuButton.current?.focus();
    };
  }, [menuOpen]);
  const navigate = useNavigate();
  const links =
    user.role === "professor"
      ? [
          {
            to: "/app",
            label: tr("Teaching dashboard"),
            icon: LayoutDashboard,
            end: true,
          },
          {
            to: "/app/applications",
            label: tr("Tutor applications"),
            icon: GraduationCap,
          },
          { to: "/app/studio", label: tr("AI Learning Studio"), icon: Sprout },
          { to: "/app/courses", label: tr("My courses"), icon: GraduationCap },
          { to: "/app/insights", label: tr("Learning insights"), icon: Sprout },
          {
            to: "/app/actions",
            label: tr("Support actions"),
            icon: HeartHandshake,
          },
        ]
      : [
          {
            to: "/app",
            label:
              user.role === "tutor"
                ? tr("Tutor dashboard")
                : tr("My learning space"),
            icon: LayoutDashboard,
            end: true,
          },

          {
            to: "/app/teaching",
            label: tr("My teaching"),
            icon: GraduationCap,
          },
          {
            to: "/app/publish",
            label: tr("Create a session"),
            icon: CalendarDays,
          },

          {
            to: "/app/applications",
            label: tr("Become a Tutor"),
            icon: HeartHandshake,
          },
          { to: "/app/explore", label: tr("Find support"), icon: Compass },
          {
            to: "/app/pulse",
            label: tr("Learning Pulse"),
            icon: HeartHandshake,
          },
          { to: "/app/sessions", label: tr("My sessions"), icon: CalendarDays },
          { to: "/app/groups", label: tr("Study groups"), icon: Users },
          {
            to: "/app/impact",
            label:
              user.role === "tutor"
                ? tr("My impact")
                : tr("My learning and impact"),
            icon: Sprout,
          },
        ];
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        tabIndex={menuOpen ? -1 : undefined}
        aria-hidden={menuOpen || undefined}
      >
        {tr("Skip to content")}
      </a>
      <div
        className={`sidebar-shade ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        ref={sidebar}
        id="campus-navigation"
        className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
        aria-label={tr("Main navigation")}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label={tr("Close navigation")}
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="campus-label">
          <span className="campus-icon">
            <GraduationCap size={18} />
          </span>
          <div>
            {tr("Demo University")}
            <small>{tr("Your learning community")}</small>
          </div>
        </div>
        <nav>
          {(user.role === "professor"
            ? [
                {
                  title: "Teaching overview",
                  paths: ["/app", "/app/courses", "/app/applications"],
                },
                {
                  title: "Support in time",
                  paths: ["/app/insights", "/app/actions", "/app/studio"],
                },
              ]
            : [
                {
                  title: "My learning",
                  paths: [
                    "/app",
                    "/app/explore",
                    "/app/pulse",
                    "/app/sessions",
                    "/app/groups",
                  ],
                },
                {
                  title: "Share my strengths",
                  paths: ["/app/applications", "/app/teaching", "/app/publish"],
                },
                { title: "My journey", paths: ["/app/impact"] },
              ]
          ).map((group) => (
            <div className="nav-group" key={group.title}>
              <span className="nav-caption">{tr(group.title)}</span>
              {group.paths
                .map((path) => links.find((link) => link.to === path)!)
                .map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    end={end}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={19} />
                    <span>{tr(label)}</span>
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <GuidedDemo />
        <div className="sidebar-note">
          <span className="note-spark">✳</span>
          <h3>
            {tr("A little help.")}
            <br />
            {tr("A bigger possibility.")}
          </h3>
          <p>
            {tr("Everyone has something to learn. And something to share.")}
          </p>
          <NavLink
            to={user.role === "professor" ? "/app/actions" : "/app/explore"}
          >
            {user.role === "professor"
              ? tr("Create support opportunities")
              : tr("Find your people")}
            <ArrowUpRight size={15} />
          </NavLink>
        </div>
        <div className="sidebar-footer">
          <HeartHandshake size={17} />
          <span>{tr("Made for learning, together.")}</span>
        </div>
      </aside>
      <div className="app-area" ref={appArea}>
        <header className="app-header">
          <div className="header-left">
            <button
              ref={menuButton}
              className="icon-button mobile-only"
              aria-label={tr("Open navigation")}
              aria-expanded={menuOpen}
              aria-controls="campus-navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="header-breadcrumb">
              {tr("Your campus")}
              <span>/</span>
              <strong>
                {user.role === "professor"
                  ? tr("Faculty workspace")
                  : user.role === "tutor"
                    ? tr("Tutor workspace")
                    : tr("Learning space")}
              </strong>
            </span>
          </div>
          <div className="header-right">
            <LanguageSelector />
            <div className="role-control">
              <label htmlFor="role-switch">
                <span className="dot violet" />
                {tr("Demo access")}
              </label>
              <div className="role-select">
                <select
                  id="role-switch"
                  aria-label={tr("Demo role")}
                  value={user.id}
                  onChange={(e) => {
                    selectUser(Number(e.target.value));
                    navigate("/app");
                    setMenuOpen(false);
                  }}
                >
                  {users.map((u) => (
                    <option value={u.id} key={u.id}>
                      {u.role === "professor"
                        ? tr("Professor")
                        : u.role === "tutor"
                          ? tr("Tutor")
                          : tr("Learner")}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="profile-divider" />
            <Avatar user={user} small />
          </div>
        </header>
        <div className="demo-strip">
          <span className="demo-tag">{tr("DEMO CAMPUS")}</span>
          <span>
            {tr("Synthetic examples. Persistent local interactions.")}{" "}
            <strong>{tr("No real authentication.")}</strong>
          </span>
          <span className="hackathon-label">
            {tr("Hack4Edu 2026 ")}
            <span>↗</span>
          </span>
        </div>
        <main id="main-content" className="app-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>{tr("ClassAll · Learning is a shared strength.")}</span>
          <span>
            {tr("Free for students. Built for community.")}
            <span className="footer-star">✳</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

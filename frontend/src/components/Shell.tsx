import { t as tr } from "../lib/i18n";
import { LanguageSelector } from "../lib/i18n";
import { useState } from "react";
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

export default function Shell() {
  const { user, users, selectUser } = useDemo();
  const [menuOpen, setMenuOpen] = useState(false);
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
          ...(user.role === "tutor"
            ? [
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
              ]
            : []),
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
            label: user.role === "tutor" ? tr("My impact") : tr("My progress"),
            icon: Sprout,
          },
        ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {tr("Skip to content")}
      </a>
      <div
        className={`sidebar-shade ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
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
        <span className="nav-caption">{tr("YOUR CAMPUS, CONNECTED")}</span>
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
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
        </nav>
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
      <div className="app-area">
        <header className="app-header">
          <div className="header-left">
            <button
              className="icon-button mobile-only"
              aria-label={tr("Open navigation")}
              aria-expanded={menuOpen}
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

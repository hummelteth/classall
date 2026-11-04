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
  const links = [
    { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/explore", label: "Find tutoring", icon: Compass },
    {
      to: "/app/sessions",
      label: user.role === "tutor" ? "My schedule" : "My sessions",
      icon: CalendarDays,
    },
    {
      to: "/app/impact",
      label:
        user.role === "professor" ? "Course insights" : "My learning & impact",
      icon: Sprout,
    },
    { to: "/app/groups", label: "Study groups", icon: Users, soon: true },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div
        className={`sidebar-shade ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
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
            Demo University<small>Your learning community</small>
          </div>
        </div>
        <span className="nav-caption">YOUR CAMPUS, CONNECTED</span>
        <nav>
          {links.map(({ to, label, icon: Icon, end, soon }) => (
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
              <span>{label}</span>
              {soon && <span className="soon-dot" aria-hidden="true" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-spark">✳</span>
          <h3>
            A little help.
            <br />A bigger possibility.
          </h3>
          <p>Everyone has something to learn. And something to share.</p>
          <NavLink to="/app/explore">
            Find your people
            <ArrowUpRight size={15} />
          </NavLink>
        </div>
        <div className="sidebar-footer">
          <HeartHandshake size={17} />
          <span>Made for learning, together.</span>
        </div>
      </aside>
      <div className="app-area">
        <header className="app-header">
          <div className="header-left">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="header-breadcrumb">
              Your campus<span>/</span>
              <strong>
                {user.role === "professor"
                  ? "Faculty workspace"
                  : user.role === "tutor"
                    ? "Tutor workspace"
                    : "Learning space"}
              </strong>
            </span>
          </div>
          <div className="header-right">
            <div className="role-control">
              <label htmlFor="role-switch">
                <span className="dot violet" />
                Demo access
              </label>
              <div className="role-select">
                <select
                  id="role-switch"
                  aria-label="Demo role"
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
                        ? "Professor"
                        : u.role === "tutor"
                          ? "Tutor"
                          : "Learner"}
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
          <span className="demo-tag">DEMO CAMPUS</span>
          <span>
            Synthetic people. Real local bookings.{" "}
            <strong>No real authentication.</strong>
          </span>
          <span className="hackathon-label">
            Hack4Edu 2026 <span>↗</span>
          </span>
        </div>
        <main id="main-content" className="app-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>ClassAll · Learning is a shared strength.</span>
          <span>
            Free for students. Built for community.
            <span className="footer-star">✳</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

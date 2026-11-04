import { t as tr } from "./lib/i18n";
import { LanguageSelector } from "./lib/i18n";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "./components/ui";
import StudyArt from "./components/StudyArt";

export default function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#landing-main">
        {tr("Skip to content")}
      </a>
      <header className="landing-header">
        <Brand />
        <nav aria-label={tr("Landing navigation")}>
          <LanguageSelector />
          <a href="#how-it-works">{tr("How it works")}</a>
          <a href="#for-everyone">{tr("For everyone")}</a>
          <Link className="button secondary small" to="/app">
            {tr("Explore the demo")}
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
      <main id="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="pill hero-pill">
              <span className="dot violet" />
              {tr("A campus full of possibility")}
            </span>
            <h1>
              {tr("Great minds")}
              <br />
              {tr("learn")}{" "}
              <span className="underline-word">
                {tr("together.")}
                <svg viewBox="0 0 400 20" preserveAspectRatio="none">
                  <path
                    d="M4 12C100 0 230 1 393 9M36 18C159 6 259 5 371 14"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p>
              {tr("Find a little guidance. Share what you know.")}
              <br />
              {tr("Free peer tutoring that brings your university together.")}
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/app">
                {tr("Find your learning community")}
                <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#how-it-works">
                {tr("See how it works")}
                <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} />
                {tr("Always free for students")}
              </span>
              <span>
                <Check size={15} />
                {tr("Built around your courses")}
              </span>
            </div>
          </div>
          <StudyArt />
        </section>
        <div className="landing-ribbon">
          <span>{tr("EVERY QUESTION BELONGS HERE")}</span>
          <span className="ribbon-star">✳</span>
          <span>{tr("KNOWLEDGE GROWS WHEN IT’S SHARED")}</span>
          <span className="ribbon-star">✳</span>
          <span>{tr("A LITTLE SUPPORT GOES A LONG WAY")}</span>
        </div>
        <section className="landing-section" id="how-it-works">
          <div className="landing-section-heading">
            <span className="eyebrow">
              {tr("SMALL STEPS. SHARED PROGRESS.")}
            </span>
            <h2>{tr("Your next “aha!” is closer than you think.")}</h2>
            <p>
              {tr(
                "No pressure. No price tag. Just people helping people learn.",
              )}
            </p>
          </div>
          <div className="how-grid">
            {[
              {
                n: "01",
                icon: GraduationCap,
                title: tr("Find your subject"),
                text: tr(
                  "Explore focused sessions in your university subjects, from calculus to coding.",
                ),
                color: "violet",
              },
              {
                n: "02",
                icon: HeartHandshake,
                title: tr("Save yourself a seat"),
                text: tr(
                  "Choose a peer tutor, find a time that works and book a free spot.",
                ),
                color: "peach",
              },
              {
                n: "03",
                icon: Sparkles,
                title: tr("Make progress, together"),
                text: tr(
                  "Ask that question, untangle that problem and build your confidence.",
                ),
                color: "sage",
              },
            ].map(({ n, icon: Icon, title, text, color }) => (
              <article key={n}>
                <div className={`how-icon tone-${color}`}>
                  <Icon size={27} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="everyone-section" id="for-everyone">
          <div>
            <span className="eyebrow">
              {tr("ONE COMMUNITY. MANY STRENGTHS.")}
            </span>
            <h2>
              {tr("Something to learn.")}
              <br />
              {tr("Something to give.")}
            </h2>
            <p>
              {tr("You don’t have to have all the answers to belong here.")}
            </p>
            <Link className="text-link" to="/app">
              {tr("Try the three demo roles")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="role-intros">
            <article>
              <span className="mini-number">{tr("L")}</span>
              <div>
                <h3>{tr("For learners")}</h3>
                <p>
                  {tr("Find friendly support and book free peer tutoring.")}
                </p>
              </div>
            </article>
            <article>
              <span className="mini-number peach">{tr("T")}</span>
              <div>
                <h3>{tr("For tutors")}</h3>
                <p>
                  {tr(
                    "Share your strengths and explore your contribution portfolio.",
                  )}
                </p>
              </div>
            </article>
            <article>
              <span className="mini-number sage">{tr("P")}</span>
              <div>
                <h3>{tr("For professors")}</h3>
                <p>
                  {tr(
                    "See aggregated session demand across your demo courses.",
                  )}
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className="landing-cta">
          <ShieldCheck size={30} />
          <h2>
            {tr("A real first step.")}
            <br />
            {tr("An honest demo.")}
          </h2>
          <p>
            {tr("This Hack4Edu prototype uses fictional people and subjects.")}
            <br />
            {tr(
              "Bookings persist locally. AI checks and study groups are on the roadmap.",
            )}
          </p>
          <Link to="/app" className="button primary">
            {tr("Step inside ClassAll")}
            <ArrowRight size={18} />
          </Link>
          <small>
            {tr("Demo access only · No sign-up · No real student data")}
          </small>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>{tr("Learning is a shared strength.")}</p>
        <span>{tr("Hack4Edu 2026 · Local MVP")}</span>
      </footer>
    </div>
  );
}

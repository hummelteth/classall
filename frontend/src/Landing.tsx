import { t as tr } from "./lib/i18n";
import { LanguageSelector } from "./lib/i18n";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Brand } from "./components/ui";
import StudyArt from "./components/StudyArt";
import { Pillars, FlowSteps } from "./components/ExperienceUI";

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
              {tr("Learn together. Recognize strengths. Support in time.")}
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
              {tr("Your university’s needs and strengths, connected.")}
              <br />
              {tr(
                "Free peer support. Recognized contributions. Human decisions.",
              )}
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/app">
                {tr("Find your learning community")}
                <ArrowRight size={18} />
              </Link>
              <a className="button secondary" href="#how-it-works">
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
          <span>{tr("Learn together")}</span>
          <span className="ribbon-star">✳</span>
          <span>{tr("Recognize strengths")}</span>
          <span className="ribbon-star">✳</span>
          <span>{tr("Support in time")}</span>
        </div>
        <section className="landing-section" id="how-it-works">
          <div className="landing-section-heading">
            <span className="eyebrow">
              {tr("SMALL STEPS. SHARED PROGRESS.")}
            </span>
            <h2>{tr("One community. Three ways to grow.")}</h2>
            <p>
              {tr(
                "No pressure. No price tag. Just people helping people learn.",
              )}
            </p>
          </div>
          <Pillars linked />
          <div className="learning-story">
            <span className="eyebrow">{tr("A SHARED LEARNING CIRCLE")}</span>
            <FlowSteps
              label="The ClassAll learning circle"
              steps={[
                "A learner asks",
                "A peer shares",
                "A professor supports",
              ]}
            />
            <p>
              {tr("Today you ask a question. Tomorrow you share a strength.")}
            </p>
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
            <Link className="button secondary" to="/app">
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
              "Bookings, study groups and reviewed Learning Checks work with local demo data.",
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

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
        Skip to content
      </a>
      <header className="landing-header">
        <Brand />
        <nav aria-label="Landing navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-everyone">For everyone</a>
          <Link className="button secondary small" to="/app">
            Explore the demo
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
      <main id="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="pill hero-pill">
              <span className="dot violet" />A campus full of possibility
            </span>
            <h1>
              Great minds
              <br />
              learn{" "}
              <span className="underline-word">
                together.
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
              Find a little guidance. Share what you know.
              <br />
              Free peer tutoring that brings your university together.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/app">
                Find your learning community
                <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#how-it-works">
                See how it works
                <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} />
                Always free for students
              </span>
              <span>
                <Check size={15} />
                Built around your courses
              </span>
            </div>
          </div>
          <StudyArt />
        </section>
        <div className="landing-ribbon">
          <span>EVERY QUESTION BELONGS HERE</span>
          <span className="ribbon-star">✳</span>
          <span>KNOWLEDGE GROWS WHEN IT’S SHARED</span>
          <span className="ribbon-star">✳</span>
          <span>A LITTLE SUPPORT GOES A LONG WAY</span>
        </div>
        <section className="landing-section" id="how-it-works">
          <div className="landing-section-heading">
            <span className="eyebrow">SMALL STEPS. SHARED PROGRESS.</span>
            <h2>Your next “aha!” is closer than you think.</h2>
            <p>No pressure. No price tag. Just people helping people learn.</p>
          </div>
          <div className="how-grid">
            {[
              {
                n: "01",
                icon: GraduationCap,
                title: "Find your subject",
                text: "Explore focused sessions in your university subjects, from calculus to coding.",
                color: "violet",
              },
              {
                n: "02",
                icon: HeartHandshake,
                title: "Save yourself a seat",
                text: "Choose a peer tutor, find a time that works and book a free spot.",
                color: "peach",
              },
              {
                n: "03",
                icon: Sparkles,
                title: "Make progress, together",
                text: "Ask that question, untangle that problem and build your confidence.",
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
            <span className="eyebrow">ONE COMMUNITY. MANY STRENGTHS.</span>
            <h2>
              Something to learn.
              <br />
              Something to give.
            </h2>
            <p>You don’t have to have all the answers to belong here.</p>
            <Link className="text-link" to="/app">
              Try the three demo roles
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="role-intros">
            <article>
              <span className="mini-number">L</span>
              <div>
                <h3>For learners</h3>
                <p>Find friendly support and book free peer tutoring.</p>
              </div>
            </article>
            <article>
              <span className="mini-number peach">T</span>
              <div>
                <h3>For tutors</h3>
                <p>
                  Share your strengths and explore your contribution portfolio.
                </p>
              </div>
            </article>
            <article>
              <span className="mini-number sage">P</span>
              <div>
                <h3>For professors</h3>
                <p>See aggregated session demand across your demo courses.</p>
              </div>
            </article>
          </div>
        </section>
        <section className="landing-cta">
          <ShieldCheck size={30} />
          <h2>
            A real first step.
            <br />
            An honest demo.
          </h2>
          <p>
            This Hack4Edu prototype uses fictional people and subjects.
            <br />
            Bookings persist locally. AI checks and study groups are on the
            roadmap.
          </p>
          <Link to="/app" className="button primary">
            Step inside ClassAll
            <ArrowRight size={18} />
          </Link>
          <small>Demo access only · No sign-up · No real student data</small>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>Learning is a shared strength.</p>
        <span>Hack4Edu 2026 · Local MVP</span>
      </footer>
    </div>
  );
}

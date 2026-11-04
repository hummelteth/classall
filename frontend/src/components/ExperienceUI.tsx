import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  HeartHandshake,
  Sprout,
  X,
} from "lucide-react";
import { t as tr } from "../lib/i18n";
import { useDemo } from "../lib/demo";

export function FlowSteps({
  steps,
  current,
  label,
}: {
  steps: string[];
  current?: number;
  label: string;
}) {
  return (
    <ol className="flow-steps" aria-label={tr(label)}>
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={current === index ? "step" : undefined}
          className={current !== undefined && index < current ? "complete" : ""}
        >
          <span aria-hidden="true">{index + 1}</span>
          <strong>{tr(step)}</strong>
        </li>
      ))}
    </ol>
  );
}

export function Pillars({ linked = false }: { linked?: boolean }) {
  const pillars = [
    {
      title: "Learn together",
      text: "Find free tutoring and a study community.",
      icon: BookOpen,
      to: "/app/explore",
      tone: "violet",
    },
    {
      title: "Recognize strengths",
      text: "Share your knowledge. Document your contribution.",
      icon: Sprout,
      to: "/app/applications",
      tone: "apricot",
    },
    {
      title: "Support in time",
      text: "Notice learning needs. Choose a human next step.",
      icon: HeartHandshake,
      to: "/app/pulse",
      tone: "teal",
    },
  ];
  return (
    <div className="pillar-grid">
      {pillars.map(({ title, text, icon: Icon, to, tone }) => {
        const content = (
          <>
            <span className="pillar-icon">
              <Icon size={24} />
            </span>
            <h3>{tr(title)}</h3>
            <p>{tr(text)}</p>
            {linked && <ArrowUpRight size={18} />}
          </>
        );
        return linked ? (
          <Link className={`pillar-card pillar-${tone}`} key={title} to={to}>
            {content}
          </Link>
        ) : (
          <article className={`pillar-card pillar-${tone}`} key={title}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

export function GuidedDemo() {
  const { user, selectUser } = useDemo();
  const [open, setOpen] = useState(false);
  const stages = [
    {
      user: 1,
      title: "Laura finds support",
      goal: "Reflect on a topic, then request help.",
      to: "/app/pulse",
    },
    {
      user: 2,
      title: "David shares a strength",
      goal: "Apply for subject approval with your teaching ideas.",
      to: "/app/applications",
    },
    {
      user: 3,
      title: "García reviews",
      goal: "Read the responses and record a human decision.",
      to: "/app/applications",
    },
    {
      user: 1,
      title: "Learn and contribute",
      goal: "Book support; both participants confirm synthetic attendance.",
      to: "/app/explore",
    },
    {
      user: 3,
      title: "Act on the evidence",
      goal: "Review aggregate needs and plan support.",
      to: "/app/insights",
    },
  ];
  return (
    <section className="demo-guide" aria-label={tr("Guided demo")}>
      <button
        className="guide-toggle"
        aria-expanded={open}
        aria-controls="demo-guide-stages"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">✳</span>
        {tr("Guided demo")}
        <span>{open ? <X size={16} /> : <ArrowUpRight size={16} />}</span>
      </button>
      {open && (
        <div id="demo-guide-stages" className="guide-content">
          <p>
            {tr(
              "Choose a scene. Actions still need to be completed in the app.",
            )}
          </p>
          <ol>
            {stages.map((s, i) => (
              <li key={s.title}>
                <Link
                  to={s.to}
                  onClick={() => {
                    if (user.id !== s.user) selectUser(s.user);
                  }}
                >
                  <span>{i + 1}</span>
                  <div>
                    <strong>{tr(s.title)}</strong>
                    <small>{tr(s.goal)}</small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              </li>
            ))}
          </ol>
          <p>{tr("David’s recorded contributions are in My impact.")}</p>
        </div>
      )}
    </section>
  );
}

import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  HeartHandshake,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { TeachingRow } from "../components/TeachingRow";
import { TutorStats } from "../components/TutorStats";
import { useDemo } from "../lib/demo";
import { useRemote } from "../lib/api";
import {
  EmptyState,
  ErrorState,
  Loading,
  SectionHeading,
} from "../components/ui";
import type { TutorOverview } from "../lib/types";

export function TutorHome() {
  const { user, version } = useDemo();
  const remote = useRemote<TutorOverview>("/tutor/overview", user.id, version);
  return (
    <>
      <PageTitle
        eyebrow="YOUR TUTOR WORKSPACE"
        title={`A little of your time. A lot of impact.`}
        description={`Welcome back, ${user.name.split(" ")[0]}. Thanks for making learning a shared experience.`}
      />
      <section className="tutor-banner">
        <span className="tutor-banner-icon">
          <HeartHandshake size={42} />
        </span>
        <div>
          <span className="eyebrow">SHARE WHAT YOU KNOW</span>
          <h2>
            Someone’s next breakthrough
            <br />
            could start with you.
          </h2>
          <p>
            Offer a new session in your approved subjects and welcome learners
            into your teaching space.
          </p>
        </div>
        <Link className="button primary" to="/app/teaching?create=true">
          Create a session
        </Link>
      </section>
      {remote.loading ? (
        <Loading label="Loading your workspace" />
      ) : remote.error ? (
        <ErrorState message={remote.error} retry={remote.retry} />
      ) : (
        remote.data && (
          <>
            <TutorStats data={remote.data} />
            <div className="workspace-columns">
              <section>
                <SectionHeading
                  title="Your upcoming teaching"
                  link={{
                    to: "/app/teaching",
                    label: "Manage teaching & bookings",
                  }}
                />
                {remote.data.sessions.length ? (
                  <div className="teaching-list">
                    {remote.data.sessions.map((s) => (
                      <TeachingRow key={s.id} session={s} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="A little space in your schedule.">
                    No upcoming teaching sessions in the demo dataset.
                  </EmptyState>
                )}
              </section>
              <aside className="approval-card">
                <ShieldCheck size={26} />
                <h3>Your approved subjects</h3>
                <p>Subject-specific approvals in the fictional dataset.</p>
                {remote.data.approved_subjects.map((s) => (
                  <div className="approved-subject" key={s.id}>
                    <span className={`subject-mini-symbol tone-${s.color}`}>
                      {s.symbol}
                    </span>
                    <span>
                      {s.name}
                      <small>{s.code}</small>
                    </span>
                    <Check size={16} />
                  </div>
                ))}
                <span className="fine-print">
                  Real application reviews and AI-assisted qualification are not
                  active.
                </span>
              </aside>
            </div>
          </>
        )
      )}
      <div className="reciprocity-note">
        <Sprout size={24} />
        <div>
          <h3>Tutors have questions, too.</h3>
          <p>
            You can book sessions in other subjects using this same demo
            profile.
          </p>
        </div>
        <Link className="text-link" to="/app/explore">
          Find tutoring
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}

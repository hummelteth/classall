import { TeacherLearningInsights } from "../components/TeacherLearningInsights";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sprout } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { useDemo } from "../lib/demo";
import { useRemote } from "../lib/api";
import {
  ComingSoon,
  ErrorState,
  Loading,
  SectionHeading,
} from "../components/ui";
import type { Insights } from "../lib/types";

export function ProfessorHome() {
  const { user, version } = useDemo();
  const remote = useRemote<Insights>("/insights", user.id, version);
  return (
    <>
      <PageTitle
        eyebrow="YOUR FACULTY WORKSPACE"
        title="See where support can begin."
        description="A shared view of tutoring participation across your assigned demo courses."
      />
      <div className="faculty-banner">
        <span className="faculty-icon">
          <Sprout size={33} />
        </span>
        <div>
          <h2>Notice the need. Keep it human.</h2>
          <p>
            Explore booking counts and available support. You decide what they
            mean.
          </p>
        </div>
        <span className="pill neutral">Synthetic data only</span>
      </div>
      {remote.loading ? (
        <Loading label="Loading course insights" />
      ) : remote.error ? (
        <ErrorState message={remote.error} retry={remote.retry} />
      ) : (
        remote.data && (
          <>
            <div className="stats-grid">
              <article>
                <span className="stat-label">Assigned courses</span>
                <strong>{remote.data.courses.length}</strong>
                <p>Mathematics & Statistics</p>
              </article>
              <article>
                <span className="stat-label">Confirmed bookings</span>
                <strong>
                  {remote.data.courses.reduce((n, c) => n + c.bookings, 0)}
                </strong>
                <p>Across upcoming course sessions</p>
              </article>
              <article>
                <span className="stat-label">Seats still available</span>
                <strong>
                  {remote.data.courses.reduce(
                    (n, c) => n + c.available_seats,
                    0,
                  )}
                </strong>
                <p>Capacity in upcoming sessions</p>
              </article>
            </div>
            <SectionHeading
              eyebrow="AGGREGATED, COURSE-LEVEL VIEW"
              title="A snapshot of peer support"
            >
              Live local counts from the demo database. No individual learning
              records.
            </SectionHeading>
            <div className="insight-grid">
              {remote.data.courses.map((c) => (
                <article className="insight-card" key={c.subject.id}>
                  <div className="insight-card-top">
                    <span
                      className={`subject-mini-symbol tone-${c.subject.color}`}
                    >
                      {c.subject.symbol}
                    </span>
                    <span className="pill neutral">{c.subject.code}</span>
                  </div>
                  <h3>{c.subject.name}</h3>
                  <p>
                    {c.sessions} upcoming{" "}
                    {c.sessions === 1 ? "session" : "sessions"} · {c.capacity}{" "}
                    total seats
                  </p>
                  <div className="insight-value">
                    <strong>{c.bookings}</strong>
                    <span>confirmed bookings</span>
                    <small>{c.available_seats} seats open</small>
                  </div>
                  <div
                    className="capacity-track"
                    role="meter"
                    aria-label={`${c.subject.name} seats booked`}
                    aria-valuenow={c.bookings}
                    aria-valuemin={0}
                    aria-valuemax={c.capacity || 1}
                  >
                    <span
                      style={{
                        width: `${c.capacity ? (c.bookings / c.capacity) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="bar-key">
                    <span>
                      <i />
                      Booked
                    </span>
                    <span>
                      <i />
                      Available
                    </span>
                  </div>
                  <Link
                    to={`/app/explore?subject=${c.subject.id}`}
                    className="text-link"
                  >
                    Explore course sessions
                    <ArrowRight size={15} />
                  </Link>
                  <TeacherLearningInsights
                    topics={c.topics ?? []}
                    subjectId={c.subject.id}
                  />
                </article>
              ))}
            </div>
            <p className="insight-note">
              <ShieldCheck size={20} />
              {remote.data.note}
            </p>
          </>
        )
      )}
      <div className="future-grid">
        <ComingSoon title="Additional TA sessions">
          A future faculty workflow will let instructors respond to unmet demand
          with extra teaching support. No scheduling or invitations are active.
        </ComingSoon>
      </div>
    </>
  );
}

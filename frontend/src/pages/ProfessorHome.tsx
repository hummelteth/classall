import { t as tr } from "../lib/i18n";
import type { SupportAction, SupportSignal } from "../lib/types";
import { PulseInsights } from "../components/PulseInsights";
import { TeacherLearningInsights } from "../components/TeacherLearningInsights";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sprout } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { useDemo } from "../lib/demo";
import { useRemote } from "../lib/api";
import { ErrorState, Loading, SectionHeading } from "../components/ui";
import type { Insights } from "../lib/types";

export function ProfessorHome({
  mode = "overview",
}: {
  mode?: "overview" | "courses" | "insights";
}) {
  const { user, version } = useDemo();
  const remote = useRemote<Insights>("/insights", user.id, version);
  const actions = useRemote<SupportAction[]>(
    "/support-actions",
    user.id,
    version,
  );
  const signals = useRemote<SupportSignal[]>(
    "/professor/signals",
    user.id,
    version,
  );
  return (
    <>
      <PageTitle
        eyebrow={tr("YOUR FACULTY WORKSPACE")}
        title={
          mode === "overview"
            ? tr("See where support can begin.")
            : mode === "courses"
              ? tr("Your courses, connected.")
              : tr("Understand the need. Choose the next step.")
        }
        description={tr(
          "Notice support needs, review the evidence and create opportunities in your assigned courses.",
        )}
      />
      <div className="faculty-banner">
        <span className="faculty-icon">
          <Sprout size={33} />
        </span>
        <div>
          <h2>{tr("Notice the need. Keep it human.")}</h2>
          <p>
            {tr(
              "Explore booking counts and available support. You decide what they mean.",
            )}
          </p>
        </div>
        <span className="pill neutral">{tr("Synthetic data only")}</span>
      </div>
      {remote.loading ? (
        <Loading label={tr("Loading course insights")} />
      ) : remote.error ? (
        <ErrorState message={tr(remote.error)} retry={remote.retry} />
      ) : (
        remote.data && (
          <>
            <div className="stats-grid">
              <article>
                <span className="stat-label">{tr("Assigned courses")}</span>
                <strong>{remote.data.courses.length}</strong>
                <p>{tr("Mathematics & Statistics")}</p>
              </article>
              <article>
                <span className="stat-label">{tr("Confirmed bookings")}</span>
                <strong>
                  {remote.data.courses.reduce((n, c) => n + c.bookings, 0)}
                </strong>
                <p>{tr("Across upcoming course sessions")}</p>
              </article>
              <article>
                <span className="stat-label">
                  {tr("Seats still available")}
                </span>
                <strong>
                  {remote.data.courses.reduce(
                    (n, c) => n + c.available_seats,
                    0,
                  )}
                </strong>
                <p>{tr("Capacity in upcoming sessions")}</p>
              </article>
            </div>
            <SectionHeading
              eyebrow={tr("AGGREGATED, COURSE-LEVEL VIEW")}
              title={tr("A snapshot of peer support")}
            >
              {tr(
                "Live local counts from the demo database. No individual learning records.",
              )}
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
                  <h3>{tr(c.subject.name)}</h3>
                  <p>
                    {c.sessions}
                    {tr(" upcoming")}{" "}
                    {c.sessions === 1 ? tr("session") : tr("sessions")} ·{" "}
                    {c.capacity} {tr("total seats")}
                  </p>
                  <div className="insight-value">
                    <strong>{c.bookings}</strong>
                    <span>{tr("confirmed bookings")}</span>
                    <small>
                      {c.available_seats}
                      {tr(" seats open")}
                    </small>
                  </div>
                  <div
                    className="capacity-track"
                    role="meter"
                    aria-label={tr("{{0}} seats booked", {
                      0: tr(c.subject.name),
                    })}
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
                      {tr("Booked")}
                    </span>
                    <span>
                      <i />
                      {tr("Available")}
                    </span>
                  </div>
                  <Link
                    to={`/app/explore?subject=${c.subject.id}`}
                    className="text-link"
                  >
                    {tr("Explore course sessions")}
                    <ArrowRight size={15} />
                  </Link>
                  {mode === "insights" && (
                    <>
                      <PulseInsights subjectId={c.subject.id} />
                      <TeacherLearningInsights
                        topics={c.topics ?? []}
                        subjectId={c.subject.id}
                      />
                    </>
                  )}
                  {mode !== "insights" && (
                    <Link className="text-link" to="/app/insights">
                      {tr("Review topic evidence & voluntary demand")}
                    </Link>
                  )}
                </article>
              ))}
            </div>
            <details className="evidence-details">
              <summary>{tr("How to interpret these signals")}</summary>
              <p className="insight-note">
                <ShieldCheck size={20} />
                {tr(remote.data.note)}
              </p>
            </details>
          </>
        )
      )}
      <div className="connections-strip">
        <div>
          <h2>{tr("What needs human review?")}</h2>
          <p>
            {tr(
              "Check topic evidence before deciding what additional support could help.",
            )}
          </p>
          {signals.loading && <Loading label={tr("Loading topic demand")} />}
          {signals.error && (
            <ErrorState message={signals.error} retry={signals.retry} />
          )}
          {signals.data
            ?.filter((s) => s.open_requests !== null)
            .map((s) => (
              <small key={s.topic.id}>
                {tr(s.topic.name)}: {s.open_requests}
                {tr(" open requests · review suggested.")}
              </small>
            ))}
          <Link className="text-link" to="/app/insights">
            {tr("Review learning insights")}
          </Link>
        </div>
        <div>
          <h2>{tr("From evidence to action")}</h2>
          <p>
            {tr(
              "Plan practice, a follow-up review or synthetic faculty-supported tutoring.",
            )}
          </p>
          {actions.loading && <Loading label={tr("Loading support actions")} />}
          {actions.error && (
            <ErrorState message={actions.error} retry={actions.retry} />
          )}
          {actions.data && (
            <small>
              {actions.data.filter((a) => a.status === "planned").length}{" "}
              {tr("planned ·")}{" "}
              {actions.data.filter((a) => a.status === "active").length}
              {tr(" active · ")}
              {actions.data.filter((a) => a.status === "completed").length}{" "}
              {tr("completed")}
            </small>
          )}
          <Link className="text-link" to="/app/actions">
            {tr("Manage support actions")}
          </Link>
        </div>
      </div>
    </>
  );
}

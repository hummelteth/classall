import { t as tr } from "../lib/i18n";
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
        eyebrow={tr("YOUR TUTOR WORKSPACE")}
        title={tr("A little of your time. A lot of impact.")}
        description={tr(
          "Welcome back, {{0}}. Thanks for making learning a shared experience.",
          { 0: user.name.split(" ")[0] },
        )}
      />
      <section className="tutor-banner">
        <span className="tutor-banner-icon">
          <HeartHandshake size={42} />
        </span>
        <div>
          <span className="eyebrow">{tr("SHARE WHAT YOU KNOW")}</span>
          <h2>
            {tr("Someone’s next breakthrough")}
            <br />
            {tr("could start with you.")}
          </h2>
          <p>
            {tr(
              "Offer a new session in your approved subjects and welcome learners into your teaching space.",
            )}
          </p>
        </div>
        <Link className="button primary" to="/app/teaching?create=true">
          {tr("Create a session")}
        </Link>
      </section>
      {remote.loading ? (
        <Loading label={tr("Loading your workspace")} />
      ) : remote.error ? (
        <ErrorState message={tr(remote.error)} retry={remote.retry} />
      ) : (
        remote.data && (
          <>
            <TutorStats data={remote.data} />
            <div className="workspace-columns">
              <section>
                <SectionHeading
                  title={tr("Your upcoming teaching")}
                  link={{
                    to: "/app/teaching",
                    label: tr("Manage teaching & bookings"),
                  }}
                />
                {remote.data.sessions.length ? (
                  <div className="teaching-list">
                    {remote.data.sessions.map((s) => (
                      <TeachingRow key={s.id} session={s} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title={tr("A little space in your schedule.")}>
                    {tr("No upcoming teaching sessions in the demo dataset.")}
                  </EmptyState>
                )}
              </section>
              <aside className="approval-card">
                <ShieldCheck size={26} />
                <h3>{tr("Your approved subjects")}</h3>
                <p>
                  {tr("Subject-specific approvals in the fictional dataset.")}
                </p>
                {remote.data.approved_subjects.map((s) => (
                  <div className="approved-subject" key={s.id}>
                    <span className={`subject-mini-symbol tone-${s.color}`}>
                      {s.symbol}
                    </span>
                    <span>
                      {tr(s.name)}
                      <small>{s.code}</small>
                    </span>
                    <Check size={16} />
                  </div>
                ))}
                <span className="fine-print">
                  {tr(
                    "Real application reviews and AI-assisted qualification are not active.",
                  )}
                </span>
              </aside>
            </div>
          </>
        )
      )}
      <div className="reciprocity-note">
        <Sprout size={24} />
        <div>
          <h3>{tr("Tutors have questions, too.")}</h3>
          <p>
            {tr(
              "You can book sessions in other subjects using this same demo profile.",
            )}
          </p>
        </div>
        <Link className="text-link" to="/app/explore">
          {tr("Find tutoring")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}

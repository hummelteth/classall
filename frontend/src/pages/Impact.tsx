import { t as tr } from "../lib/i18n";
import { LearningProgress } from "../components/LearningProgress";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { useBookings, activeBooking } from "../lib/bookings";
import { TutorStats } from "../components/TutorStats";
import { ProfessorHome } from "./ProfessorHome";
import { useDemo } from "../lib/demo";
import { useRemote } from "../lib/api";
import { ComingSoon, ErrorState, Loading } from "../components/ui";
import type { TutorOverview } from "../lib/types";

export function Impact() {
  const { user, version } = useDemo();
  const bookings = useBookings();
  const tutor = useRemote<TutorOverview>(
    "/tutor/overview",
    user.id,
    version,
    user.role === "tutor",
  );
  if (user.role === "professor") return <ProfessorHome />;
  if (user.role === "tutor")
    return (
      <>
        <PageTitle
          eyebrow={tr("MY LEARNING & IMPACT")}
          title={tr("Your contribution has a story.")}
          description={tr(
            "A private starting point for a future competency portfolio.",
          )}
        />
        {tutor.loading ? (
          <Loading label={tr("Loading your impact")} />
        ) : tutor.error ? (
          <ErrorState message={tutor.error} retry={tutor.retry} />
        ) : (
          tutor.data && (
            <>
              <TutorStats data={tutor.data} />
              <section className="portfolio-card">
                <span className="pill neutral">
                  {tr("Synthetic portfolio")}
                </span>
                <h2>{tr("Learning facilitator")}</h2>
                <p>
                  {tr("Demonstration experience in")}{" "}
                  {tutor.data.approved_subjects
                    .map((s) => s.name)
                    .join(" and ")}
                  .
                </p>
                <div className="portfolio-tags">
                  <span>{tr("Peer explanation")}</span>
                  <span>{tr("Small-group facilitation")}</span>
                  <span>{tr("Subject communication")}</span>
                </div>
                <p className="fine-print">
                  {tr(
                    "Illustrative competencies only. These have not been assessed or endorsed by a university.",
                  )}
                </p>
              </section>
            </>
          )
        )}
        <LearningProgress />
        <ComingSoon title={tr("Recognition that means something")}>
          {tr(
            "Attendance verification, reviewed competencies and an exportable portfolio are planned. Engagement points are illustrative and cannot be exchanged for credit or rewards.",
          )}
        </ComingSoon>
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow={tr("MY LEARNING & IMPACT")}
        title={tr("Every small step counts.")}
        description={tr(
          "Your own space to see how you’re making time for learning.",
        )}
      />
      {bookings.loading ? (
        <Loading label={tr("Loading your learning")} />
      ) : bookings.error ? (
        <ErrorState message={bookings.error} retry={bookings.retry} />
      ) : (
        <div className="stats-grid">
          <article>
            <span className="stat-label">{tr("Upcoming sessions")}</span>
            <strong>{bookings.data?.filter(activeBooking).length ?? 0}</strong>
            <p>{tr("Time set aside for your next breakthrough")}</p>
          </article>
          <article>
            <span className="stat-label">{tr("Past sessions")}</span>
            <strong>
              {bookings.data?.filter(
                (b) => b.status === "confirmed" && !activeBooking(b),
              ).length ?? 0}
            </strong>
            <p>{tr("Booked in the synthetic dataset")}</p>
          </article>
          <article>
            <span className="stat-label">{tr("Subjects explored")}</span>
            <strong>
              {
                new Set(
                  bookings.data
                    ?.filter((b) => b.status === "confirmed")
                    .map((b) => b.session.subject.id),
                ).size
              }
            </strong>
            <p>{tr("Across your confirmed bookings")}</p>
          </article>
        </div>
      )}
      <LearningProgress />
      <div className="future-grid">
        <ComingSoon title={tr("Share your strengths")}>
          {tr(
            "Future subject-specific tutor applications will help you contribute. For now, switch to the Tutor demo to explore the workspace.",
          )}
        </ComingSoon>
      </div>
      <Link className="button primary" to="/app/explore">
        {tr("Keep exploring")}
        <ArrowRight size={16} />
      </Link>
    </>
  );
}

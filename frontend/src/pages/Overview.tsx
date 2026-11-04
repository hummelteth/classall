import { t as tr } from "../lib/i18n";
import { LearningConnections } from "../components/LearningConnections";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  HeartHandshake,
  Sprout,
  Sparkles,
} from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { useBookings, activeBooking } from "../lib/bookings";
import { SessionCollection } from "../components/SessionCollection";
import { TutorHome } from "./TutorHome";
import { ProfessorHome } from "./ProfessorHome";
import { useDemo } from "../lib/demo";
import { dateLabel, timeLabel, useRemote } from "../lib/api";
import { Avatar, ErrorState, Loading, SectionHeading } from "../components/ui";
import type { Session, Subject } from "../lib/types";
import StudyArt from "../components/StudyArt";

export function Overview() {
  const { user } = useDemo();
  if (user.role === "tutor") return <TutorHome />;
  if (user.role === "professor") return <ProfessorHome />;
  return <LearnerHome />;
}

function LearnerHome() {
  const { user, version } = useDemo();
  const sessions = useRemote<Session[]>("/sessions", undefined, version);
  const bookings = useBookings();
  const subjects = useRemote<Subject[]>("/subjects");
  const next = bookings.data?.filter(activeBooking)[0];
  return (
    <>
      <PageTitle
        eyebrow={tr("YOUR LEARNING SPACE")}
        title={tr("A good day to grow, {{0}}.", { 0: user.name.split(" ")[0] })}
        description={tr(
          "A little support can make all the difference. Let’s find yours.",
        )}
      >
        <Link className="button primary" to="/app/pulse">
          {tr("Request support")}
          <ArrowUpRight size={18} />
        </Link>
      </PageTitle>
      <section className="welcome-banner">
        <div>
          <span className="pill banner-pill">
            <Sparkles size={13} />
            {tr("BETTER, TOGETHER")}
          </span>
          <h2>
            {tr("You don’t have to")}
            <br />
            {tr("figure it out alone.")}
          </h2>
          <p>
            {tr("Friendly faces. Fresh perspectives.")}
            <br />
            {tr("Find free peer tutoring for your next breakthrough.")}
          </p>
          <Link to="/app/explore" className="button dark">
            {tr("Find a session")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <StudyArt compact />
        <span className="banner-scribble" aria-hidden="true">
          {tr("learn.")}
          <br />
          {tr("connect.")}
          <br />
          {tr("grow.")}
        </span>
      </section>
      <div className="home-columns">
        <div className="home-left">
          <SectionHeading title={tr("A little direction")} />
          <div className="quick-grid">
            <Link to="/app/explore" className="quick-card">
              <span className="quick-icon tone-violet">
                <Compass size={22} />
              </span>
              <strong>{tr("Find your next session")}</strong>
              <p>{tr("Get support in your subjects.")}</p>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/sessions" className="quick-card">
              <span className="quick-icon tone-peach">
                <CalendarDays size={22} />
              </span>
              <strong>{tr("Your learning, planned")}</strong>
              <p>
                {bookings.data
                  ? tr("{{0}} upcoming {{1}} in your calendar.", {
                      0: bookings.data.filter(activeBooking).length,
                      1:
                        bookings.data.filter(activeBooking).length === 1
                          ? tr("session")
                          : tr("sessions"),
                    })
                  : tr("See your booked sessions.")}
              </p>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/applications" className="quick-card pillar-apricot">
              <span className="quick-icon tone-peach">
                <HeartHandshake size={22} />
              </span>
              <strong>{tr("Become a Tutor")}</strong>
              <p>{tr("Share a strength in your subject.")}</p>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/impact" className="quick-card pillar-teal">
              <span className="quick-icon tone-sage">
                <Sprout size={22} />
              </span>
              <strong>{tr("My learning and impact")}</strong>
              <p>{tr("Your practice and contributions, in one place.")}</p>
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <SectionHeading
            title={tr("Explore your subjects")}
            link={{ to: "/app/explore", label: tr("View all") }}
          />
          <div className="subject-mini-grid">
            {subjects.loading ? (
              <Loading label={tr("Loading subjects")} />
            ) : subjects.error ? (
              <ErrorState message={subjects.error} retry={subjects.retry} />
            ) : (
              subjects.data?.slice(0, 4).map((s) => (
                <Link
                  to={`/app/explore?subject=${s.id}`}
                  className="subject-mini"
                  key={s.id}
                >
                  <span className={`subject-mini-symbol tone-${s.color}`}>
                    {s.symbol}
                  </span>
                  <strong>{tr(s.name)}</strong>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            )}
          </div>
        </div>
        <aside className="next-card">
          <div className="mini-heading">
            <span className="eyebrow">{tr("UP NEXT")}</span>
            <CalendarDays size={17} />
          </div>
          {bookings.loading ? (
            <Loading label={tr("Loading your schedule")} />
          ) : bookings.error ? (
            <ErrorState message={bookings.error} retry={bookings.retry} />
          ) : next ? (
            <>
              <span className="next-date">
                {dateLabel(next.session.starts_at)}
              </span>
              <h3>{next.session.title}</h3>
              <p>
                {timeLabel(next.session.starts_at)} ·{" "}
                {next.session.duration_minutes}
                {tr(" min")}
              </p>
              <div className="next-tutor">
                <Avatar user={next.session.tutor} small />
                <span>
                  {tr("with ")}
                  {next.session.tutor.name}
                </span>
              </div>
              <Link className="text-link" to="/app/sessions">
                {tr("View my sessions")}
                <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <div className="calendar-illustration" aria-hidden="true">
                <CalendarDays size={42} />
                <span>✳</span>
              </div>
              <h3>{tr("Make room for an “aha!”")}</h3>
              <p>
                {tr(
                  "Your first session is waiting to happen. Find a topic you’d love a hand with.",
                )}
              </p>
              <Link to="/app/explore" className="text-link">
                {tr("Explore sessions")}
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </aside>
      </div>
      <LearningConnections />
      <SectionHeading
        eyebrow={tr("A GOOD PLACE TO START")}
        title={tr("Find your next breakthrough")}
        link={{ to: "/app/explore", label: tr("Explore all sessions") }}
      >
        {tr("Upcoming peer sessions, open to a curious mind.")}
      </SectionHeading>
      {sessions.loading ? (
        <Loading />
      ) : sessions.error ? (
        <ErrorState message={sessions.error} retry={sessions.retry} />
      ) : (
        <SessionCollection
          sessions={sessions.data ?? []}
          bookings={bookings.data ?? []}
          limit={3}
        />
      )}
      <div className="community-line">
        <HeartHandshake size={21} />
        <span>{tr("You belong here, questions and all.")}</span>
        <span>{tr("Every session is free. Every question matters.")}</span>
      </div>
    </>
  );
}

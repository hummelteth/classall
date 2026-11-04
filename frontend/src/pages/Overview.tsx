import { LearningConnections } from "../components/LearningConnections";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  HeartHandshake,
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
        eyebrow="YOUR LEARNING SPACE"
        title={`A good day to grow, ${user.name.split(" ")[0]}.`}
        description="A little support can make all the difference. Let’s find yours."
      >
        <span className="greeting-spark">✳</span>
      </PageTitle>
      <section className="welcome-banner">
        <div>
          <span className="pill banner-pill">
            <Sparkles size={13} />
            BETTER, TOGETHER
          </span>
          <h2>
            You don’t have to
            <br />
            figure it out alone.
          </h2>
          <p>
            Friendly faces. Fresh perspectives.
            <br />
            Find free peer tutoring for your next breakthrough.
          </p>
          <Link to="/app/explore" className="button dark">
            Find a session
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <StudyArt compact />
        <span className="banner-scribble" aria-hidden="true">
          learn.
          <br />
          connect.
          <br />
          grow.
        </span>
      </section>
      <LearningConnections />
      <div className="home-columns">
        <div className="home-left">
          <SectionHeading title="A little direction" />
          <div className="quick-grid">
            <Link to="/app/explore" className="quick-card">
              <span className="quick-icon tone-violet">
                <Compass size={22} />
              </span>
              <strong>Find your next session</strong>
              <p>Get support in your subjects.</p>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/sessions" className="quick-card">
              <span className="quick-icon tone-peach">
                <CalendarDays size={22} />
              </span>
              <strong>Your learning, planned</strong>
              <p>
                {bookings.data
                  ? `${bookings.data.filter(activeBooking).length} upcoming ${bookings.data.filter(activeBooking).length === 1 ? "session" : "sessions"} in your calendar.`
                  : "See your booked sessions."}
              </p>
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <SectionHeading
            title="Explore your subjects"
            link={{ to: "/app/explore", label: "View all" }}
          />
          <div className="subject-mini-grid">
            {subjects.loading ? (
              <Loading label="Loading subjects" />
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
                  <strong>{s.name}</strong>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            )}
          </div>
        </div>
        <aside className="next-card">
          <div className="mini-heading">
            <span className="eyebrow">UP NEXT</span>
            <CalendarDays size={17} />
          </div>
          {bookings.loading ? (
            <Loading label="Loading your schedule" />
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
                {next.session.duration_minutes} min
              </p>
              <div className="next-tutor">
                <Avatar user={next.session.tutor} small />
                <span>with {next.session.tutor.name}</span>
              </div>
              <Link className="text-link" to="/app/sessions">
                View my sessions
                <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <div className="calendar-illustration" aria-hidden="true">
                <CalendarDays size={42} />
                <span>✳</span>
              </div>
              <h3>Make room for an “aha!”</h3>
              <p>
                Your first session is waiting to happen. Find a topic you’d love
                a hand with.
              </p>
              <Link to="/app/explore" className="text-link">
                Explore sessions
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </aside>
      </div>
      <SectionHeading
        eyebrow="A GOOD PLACE TO START"
        title="Find your next breakthrough"
        link={{ to: "/app/explore", label: "Explore all sessions" }}
      >
        Upcoming peer sessions, open to a curious mind.
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
        <span>You belong here, questions and all.</span>
        <span>Every session is free. Every question matters.</span>
      </div>
    </>
  );
}

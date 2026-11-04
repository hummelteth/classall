import { t as tr } from "../lib/i18n";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { useBookings, activeBooking } from "../lib/bookings";
import { TeachingRow } from "../components/TeachingRow";
import { useDemo } from "../lib/demo";
import {
  dateLabel,
  request,
  timeLabel,
  timezoneLabel,
  useRemote,
} from "../lib/api";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Loading,
  SectionHeading,
} from "../components/ui";
import type { Booking, TutorOverview } from "../lib/types";
import BookingDialog from "../components/BookingDialog";

function CancelAction({ booking }: { booking: Booking }) {
  const { user, refresh } = useDemo();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const cancel = async () => {
    setPending(true);
    setError("");
    try {
      await request(`/bookings/${booking.id}/cancel`, user.id, {
        method: "POST",
      });
      refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tr("Could not cancel this booking."),
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="cancel-action">
      {confirm ? (
        <>
          <span>{tr("Release your seat?")}</span>
          <button
            className="text-button danger"
            onClick={cancel}
            disabled={pending}
          >
            {pending ? tr("Cancelling…") : tr("Yes, cancel")}
          </button>
          <button
            className="text-button"
            onClick={() => setConfirm(false)}
            disabled={pending}
          >
            {tr("Keep it")}
          </button>
        </>
      ) : (
        <button className="text-button muted" onClick={() => setConfirm(true)}>
          {tr("Cancel booking")}
        </button>
      )}
      {error && (
        <p className="form-error" role="alert">
          {tr(error)}
        </p>
      )}
    </div>
  );
}

export function MySessions() {
  const { user, version } = useDemo();
  const bookings = useBookings();
  const teaching = useRemote<TutorOverview>(
    "/tutor/overview",
    user.id,
    version,
    user.role === "tutor",
  );
  const [tab, setTab] = useState("upcoming");
  const [selected, setSelected] = useState<number | null>(null);
  const filtered =
    bookings.data?.filter((b) =>
      tab === "upcoming"
        ? activeBooking(b)
        : tab === "cancelled"
          ? b.status === "cancelled"
          : b.status === "confirmed" && !activeBooking(b),
    ) ?? [];
  return (
    <>
      <PageTitle
        eyebrow={tr("YOUR TIME TO LEARN")}
        title={
          user.role === "tutor"
            ? tr("Your learning. Your teaching.")
            : tr("Good things on your calendar.")
        }
        description={tr(
          "Your booked sessions, all in one place. Times follow your device’s time zone.",
        )}
      >
        <Link className="button secondary" to="/app/explore">
          {tr("Find tutoring")}
          <ArrowUpRight size={16} />
        </Link>
      </PageTitle>
      {user.role === "professor" ? (
        <EmptyState
          title={tr("Explore the learner experience.")}
          action={
            <Link className="button secondary" to="/app/impact">
              {tr("View course insights")}
              <ArrowRight size={16} />
            </Link>
          }
        >
          {tr(
            "Professor demo access has no learner bookings. Use the role switcher to try booking as Laura or David.",
          )}
        </EmptyState>
      ) : (
        <>
          {user.role === "tutor" && (
            <section className="teaching-section">
              <SectionHeading title={tr("Your teaching schedule")}>
                {tr(
                  "Demo sessions you’re hosting. Attendance and session editing are planned.",
                )}
              </SectionHeading>
              {teaching.loading ? (
                <Loading label={tr("Loading teaching schedule")} />
              ) : teaching.error ? (
                <ErrorState message={teaching.error} retry={teaching.retry} />
              ) : (
                <div className="teaching-list">
                  {teaching.data?.sessions.map((s) => (
                    <TeachingRow key={s.id} session={s} />
                  ))}
                </div>
              )}
            </section>
          )}
          {user.role === "tutor" && (
            <SectionHeading title={tr("Your learner bookings")} />
          )}
          <div className="tabs" role="group" aria-label={tr("Booking status")}>
            {["upcoming", "past", "cancelled"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {tr(t.charAt(0).toUpperCase() + t.slice(1))}
                {t === "upcoming" && (
                  <span>
                    {bookings.data?.filter(activeBooking).length ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
          {bookings.loading ? (
            <Loading label={tr("Loading your bookings")} />
          ) : bookings.error ? (
            <ErrorState message={bookings.error} retry={bookings.retry} />
          ) : filtered.length ? (
            <div className="booking-list">
              {filtered.map((b) => (
                <article key={b.id} className="booking-row">
                  <div
                    className={`booking-date tone-${b.session.subject.color}`}
                  >
                    <small>
                      {dateLabel(b.session.starts_at, { month: "short" })}
                    </small>
                    <strong>
                      {dateLabel(b.session.starts_at, { day: "numeric" })}
                    </strong>
                  </div>
                  <div className="booking-row-main">
                    <span className="eyebrow">
                      {tr(b.session.subject.name)} ·{" "}
                      {b.status === "cancelled"
                        ? "CANCELLED"
                        : activeBooking(b)
                          ? "CONFIRMED"
                          : tr("PAST DEMO SESSION")}
                    </span>
                    <button
                      className="row-title"
                      onClick={() => setSelected(b.session.id)}
                    >
                      {b.session.title}
                      <ArrowUpRight size={17} />
                    </button>
                    <div className="booking-row-details">
                      <span>
                        <Clock3 size={14} />
                        {timeLabel(b.session.starts_at)} ·{" "}
                        {b.session.duration_minutes}
                        {tr(" min")}
                      </span>
                      <span>
                        <MapPin size={14} />
                        {b.session.location}
                      </span>
                    </div>
                    {b.session.learning_check_available && (
                      <Link
                        className="text-link"
                        to={`/app/checks/${b.id}/pre`}
                      >
                        {tr("Open Learning Check & saved result")}
                      </Link>
                    )}
                    <div className="booking-host">
                      <Avatar user={b.session.tutor} small />
                      <span>
                        {tr("with ")}
                        {b.session.tutor.name}
                      </span>
                      <small>
                        {tr("Booking #")}
                        {b.id}
                      </small>
                    </div>
                  </div>
                  {activeBooking(b) && <CancelAction booking={b} />}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                tab === "upcoming"
                  ? tr("Your next chapter is open.")
                  : tab === "cancelled"
                    ? tr("No cancelled bookings.")
                    : tr("Your learning story starts here.")
              }
              action={
                tab === "upcoming" ? (
                  <Link className="button primary" to="/app/explore">
                    {tr("Find your first session")}
                    <ArrowRight size={17} />
                  </Link>
                ) : undefined
              }
            >
              {tab === "upcoming"
                ? tr(
                    "Find a friendly peer tutor and save a free seat. Your upcoming sessions will appear here.",
                  )
                : tab === "cancelled"
                  ? tr("Any bookings you cancel will be listed here.")
                  : tr("Completed and past bookings will appear here.")}
            </EmptyState>
          )}
        </>
      )}
      {selected !== null && (
        <BookingDialog
          key={`${selected}-${user.id}`}
          sessionId={selected}
          booked={
            bookings.data?.some(
              (b) => b.session.id === selected && b.status === "confirmed",
            ) ?? false
          }
          onClose={() => setSelected(null)}
        />
      )}
      <p className="page-note">
        {timezoneLabel}
        {tr(
          " · Online sessions have no live meeting link in this local demonstration.",
        )}
      </p>
    </>
  );
}

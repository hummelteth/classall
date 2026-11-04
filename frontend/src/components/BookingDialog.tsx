import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useDemo } from "../lib/demo";
import {
  dateLabel,
  request,
  timeLabel,
  timezoneLabel,
  useRemote,
  upcoming,
} from "../lib/api";
import type { Booking, Session } from "../lib/types";
import { Avatar, ErrorState, Loading } from "./ui";

export default function BookingDialog({
  sessionId,
  booked,
  onClose,
}: {
  sessionId: number;
  booked: boolean;
  onClose: () => void;
}) {
  const { user, refresh } = useDemo();
  const remote = useRemote<Session>(`/sessions/${sessionId}`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Booking | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    const el = dialog.current;
    mounted.current = true;
    el?.showModal();
    return () => {
      mounted.current = false;
      el?.close();
    };
  }, []);
  const book = async () => {
    setPending(true);
    setError("");
    try {
      const result = await request<Booking>("/bookings", user.id, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (mounted.current) setSuccess(result);
      else refresh();
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not book. Please try again.",
        );
        remote.retry();
      }
    } finally {
      if (mounted.current) setPending(false);
    }
  };
  const close = () => {
    if (success) refresh();
    onClose();
  };
  const s = remote.data;
  return (
    <dialog
      ref={dialog}
      className="booking-dialog"
      aria-labelledby="booking-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      <button
        className="icon-button dialog-close"
        aria-label="Close session details"
        onClick={close}
      >
        <X size={21} />
      </button>
      {success ? (
        <div className="booking-success">
          <span className="success-icon">
            <CheckCircle2 size={42} />
          </span>
          <span className="eyebrow">ONE STEP CLOSER</span>
          <h2 id="booking-title">Your seat is saved!</h2>
          <p>
            You’re booked for <strong>{success.session.title}</strong> with{" "}
            {success.session.tutor.name.split(" ")[0]}.
          </p>
          <div className="confirmation-box">
            <CalendarDays size={21} />
            <div>
              <strong>{dateLabel(success.session.starts_at)}</strong>
              <span>
                {timeLabel(success.session.starts_at)} ·{" "}
                {success.session.duration_minutes} min
              </span>
              <span>{success.session.location}</span>
            </div>
          </div>
          <p className="fine-print">
            Booking #{success.id} · Saved in the local demo database.
            <br />
            No email or calendar invitation is sent.
          </p>
          <Link className="button primary" to="/app/sessions" onClick={close}>
            See my sessions
            <ArrowRight size={17} />
          </Link>
          <button className="text-button" onClick={close}>
            Keep exploring
          </button>
        </div>
      ) : (
        <>
          <div className={`dialog-banner tone-${s?.subject.color ?? "violet"}`}>
            <span className="dialog-symbol">{s?.subject.symbol ?? "✳"}</span>
            <span className="pill neutral">Free peer tutoring</span>
          </div>
          <div className="dialog-content">
            {remote.loading ? (
              <>
                <h2 id="booking-title">Session details</h2>
                <Loading />
              </>
            ) : remote.error ? (
              <>
                <h2 id="booking-title">Session details</h2>
                <ErrorState message={remote.error} retry={remote.retry} />
              </>
            ) : (
              s && (
                <>
                  <span className="eyebrow">
                    {s.subject.code} · {s.subject.name}
                  </span>
                  <h2 id="booking-title">{s.title}</h2>
                  <div className="dialog-tutor">
                    <Avatar user={s.tutor} />
                    <div>
                      <strong>{s.tutor.name}</strong>
                      <span>
                        {s.tutor.programme} · {s.tutor.year}
                      </span>
                    </div>
                    <span className="approved-note">
                      <ShieldCheck size={15} />
                      Demo approval
                    </span>
                  </div>
                  <p className="dialog-description">{s.description}</p>
                  <div className="session-facts">
                    <div>
                      <CalendarDays size={18} />
                      <span>
                        {dateLabel(s.starts_at)}
                        <small>
                          {timeLabel(s.starts_at)} · {timezoneLabel}
                        </small>
                      </span>
                    </div>
                    <div>
                      <Clock3 size={18} />
                      <span>
                        {s.duration_minutes} minutes
                        <small>{s.level} friendly</small>
                      </span>
                    </div>
                    <div>
                      <MapPin size={18} />
                      <span>
                        {s.location}
                        <small>
                          {s.format === "Online"
                            ? "No live meeting is provided"
                            : "Fictional demo campus location"}
                        </small>
                      </span>
                    </div>
                    <div>
                      <Users size={18} />
                      <span>
                        {s.available_seats} spots available
                        <small>Small group · {s.capacity} seats total</small>
                      </span>
                    </div>
                  </div>
                  <h3>What we’ll work on</h3>
                  <ul className="goals">
                    {s.goals.map((g) => (
                      <li key={g}>
                        <Check size={16} />
                        {g}
                      </li>
                    ))}
                  </ul>
                  <p className="demo-disclosure">
                    Demo booking as <strong>{user.name}</strong>. This reserves
                    a local demo seat only.
                  </p>
                  {error && (
                    <p role="alert" className="form-error">
                      {error}
                    </p>
                  )}
                  {user.role === "professor" ? (
                    <p className="info-box">
                      Switch to the Learner or Tutor demo role to book a
                      session.
                    </p>
                  ) : s.tutor.id === user.id ? (
                    <p className="info-box">
                      You’re hosting this session. Find it in your teaching
                      schedule.
                    </p>
                  ) : (
                    <button
                      className="button primary full-width"
                      onClick={book}
                      disabled={
                        pending ||
                        booked ||
                        s.available_seats === 0 ||
                        s.status !== "upcoming" ||
                        !upcoming(s.starts_at)
                      }
                    >
                      {pending
                        ? "Saving your seat…"
                        : booked
                          ? "You’re already booked ✓"
                          : s.status !== "upcoming" || !upcoming(s.starts_at)
                            ? "This session has ended"
                            : s.available_seats === 0
                              ? "This session is full"
                              : "Book a free seat"}
                      {!pending && !booked && s.available_seats > 0 && (
                        <ArrowRight size={17} />
                      )}
                    </button>
                  )}
                </>
              )
            )}
          </div>
        </>
      )}
    </dialog>
  );
}

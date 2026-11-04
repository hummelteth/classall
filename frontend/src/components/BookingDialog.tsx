import { t as tr } from "../lib/i18n";
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
            : tr("Could not book. Please try again."),
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
        aria-label={tr("Close session details")}
        onClick={close}
      >
        <X size={21} />
      </button>
      {success ? (
        <div className="booking-success">
          <span className="success-icon">
            <CheckCircle2 size={42} />
          </span>
          <span className="eyebrow">{tr("ONE STEP CLOSER")}</span>
          <h2 id="booking-title">{tr("Your seat is saved!")}</h2>
          <p>
            {tr("You’re booked for ")}
            <strong>{success.session.title}</strong>
            {tr(" with")} {success.session.tutor.name.split(" ")[0]}.
          </p>
          <div className="confirmation-box">
            <CalendarDays size={21} />
            <div>
              <strong>{dateLabel(success.session.starts_at)}</strong>
              <span>
                {timeLabel(success.session.starts_at)} ·{" "}
                {success.session.duration_minutes}
                {tr(" min")}
              </span>
              <span>{success.session.location}</span>
            </div>
          </div>
          <p className="fine-print">
            {tr("Booking #")}
            {success.id}
            {tr(" · Saved in the local demo database.")}
            <br />
            {tr("No email or calendar invitation is sent.")}
          </p>
          {success.session.learning_check_available && (
            <Link
              className="button secondary"
              to={`/app/checks/${success.id}/pre`}
              onClick={close}
            >
              {tr("Start pre-session Learning Check")}
            </Link>
          )}
          <Link className="button primary" to="/app/sessions" onClick={close}>
            {tr("See my sessions")}
            <ArrowRight size={17} />
          </Link>
          <button className="text-button" onClick={close}>
            {tr("Keep exploring")}
          </button>
        </div>
      ) : (
        <>
          <div className={`dialog-banner tone-${s?.subject.color ?? "violet"}`}>
            <span className="dialog-symbol">{s?.subject.symbol ?? "✳"}</span>
            <span className="pill neutral">
              {s?.kind === "faculty"
                ? tr("Faculty-organized · synthetic TA support")
                : tr("Free peer tutoring")}
            </span>
          </div>
          <div className="dialog-content">
            {remote.loading ? (
              <>
                <h2 id="booking-title">{tr("Session details")}</h2>
                <Loading />
              </>
            ) : remote.error ? (
              <>
                <h2 id="booking-title">{tr("Session details")}</h2>
                <ErrorState message={tr(remote.error)} retry={remote.retry} />
              </>
            ) : (
              s && (
                <>
                  <span className="eyebrow">
                    {s.subject.code} · {tr(s.subject.name)}
                  </span>
                  <h2 id="booking-title">{s.title}</h2>
                  <div className="dialog-tutor">
                    <Avatar user={s.tutor} />
                    <div>
                      <strong>{s.tutor.name}</strong>
                      <span>
                        {tr(s.tutor.programme)} · {tr(s.tutor.year)}
                      </span>
                    </div>
                    <span className="approved-note">
                      <ShieldCheck size={15} />
                      {tr("Demo approval")}
                    </span>
                  </div>
                  {s.kind === "faculty" && (
                    <p className="fine-print">
                      {tr(
                        "Faculty-organized synthetic support with an approved demo tutor. This is not an official university offering.",
                      )}
                    </p>
                  )}
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
                        {s.duration_minutes}
                        {tr(" minutes")}
                        <small>
                          {tr(s.level)}
                          {tr(" friendly")}
                        </small>
                      </span>
                    </div>
                    <div>
                      <MapPin size={18} />
                      <span>
                        {s.location}
                        <small>
                          {s.format === "Online"
                            ? tr("No live meeting is provided")
                            : tr("Fictional demo campus location")}
                        </small>
                      </span>
                    </div>
                    <div>
                      <Users size={18} />
                      <span>
                        {s.available_seats}
                        {tr(" spots available")}
                        <small>
                          {tr("Small group · ")}
                          {s.capacity}
                          {tr(" seats total")}
                        </small>
                      </span>
                    </div>
                  </div>
                  <h3>{tr("What we’ll work on")}</h3>
                  <ul className="goals">
                    {s.goals.map((g) => (
                      <li key={g}>
                        <Check size={16} />
                        {g}
                      </li>
                    ))}
                  </ul>
                  <p className="demo-disclosure">
                    {tr("Demo booking as ")}
                    <strong>{user.name}</strong>
                    {tr(". This reserves a local demo seat only.")}
                  </p>
                  {error && (
                    <p role="alert" className="form-error">
                      {tr(error)}
                    </p>
                  )}
                  {user.role === "professor" ? (
                    <p className="info-box">
                      {tr(
                        "Switch to the Learner or Tutor demo role to book a session.",
                      )}
                    </p>
                  ) : s.tutor.id === user.id ? (
                    <p className="info-box">
                      {tr(
                        "You’re hosting this session. Find it in your teaching schedule.",
                      )}
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
                        ? tr("Saving your seat…")
                        : booked
                          ? tr("You’re already booked ✓")
                          : s.status !== "upcoming" || !upcoming(s.starts_at)
                            ? tr("This session has ended")
                            : s.available_seats === 0
                              ? tr("This session is full")
                              : tr("Book a free seat")}
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

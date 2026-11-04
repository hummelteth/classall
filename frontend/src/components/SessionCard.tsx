import { t as tr } from "../lib/i18n";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Session } from "../lib/types";
import { dateLabel, timeLabel } from "../lib/api";
import { Avatar } from "./ui";

export function SessionCard({
  session,
  onSelect,
  booked = false,
}: {
  session: Session;
  onSelect: (session: Session) => void;
  booked?: boolean;
}) {
  return (
    <article className="session-card">
      <div className={`card-art tone-${session.subject.color}`}>
        <span className="subject-symbol">{session.subject.symbol}</span>
        <span className="card-art-orbit" />
        <span className="pill card-level">{tr(session.level)}</span>
        <span className="card-art-star">✳</span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className={`subject-label text-${session.subject.color}`}>
            {tr(session.subject.name)}
          </span>
          <span className="free-label">{tr("Free")}</span>
        </div>
        <button className="card-title" onClick={() => onSelect(session)}>
          {session.title}
          <ArrowUpRight size={18} />
        </button>
        <span className="offering-label">
          {session.kind === "faculty"
            ? tr("Faculty-organized · synthetic TA support")
            : tr("Peer tutoring")}{" "}
          ·{" "}
          {session.source === "demo-interaction"
            ? tr("Demo interaction")
            : tr("Synthetic example")}
        </span>
        <p className="card-description">{session.description}</p>
        <div className="tutor-line">
          <Avatar user={session.tutor} small />
          <span>
            <strong>{session.tutor.name}</strong>
            <small>
              {tr(session.tutor.year)}
              {tr(" · Peer tutor")}
            </small>
          </span>
          {session.approved && (
            <ShieldCheck
              className="approval-icon"
              size={18}
              aria-label={tr("Subject approved in demo data")}
            />
          )}
        </div>
        <div className="card-details">
          <span>
            <CalendarDays size={14} />
            {dateLabel(session.starts_at)} · {timeLabel(session.starts_at)}
          </span>
          <span>
            <Clock3 size={14} />
            {session.duration_minutes}
            {tr(" min")}
            <span className="detail-dot">·</span>
            {session.format === "Online" ? (
              <Monitor size={14} />
            ) : (
              <MapPin size={14} />
            )}{" "}
            {tr(session.format)}
          </span>
        </div>
        <div className="card-bottom">
          <span
            className={session.available_seats <= 2 ? "seats low" : "seats"}
          >
            <Users size={14} />
            {session.available_seats === 0
              ? tr("Session full")
              : tr("{{0}} of {{1}} spots left", {
                  0: session.available_seats,
                  1: session.capacity,
                })}
          </span>
          <button
            className={`button small ${booked ? "booked-button" : "soft"}`}
            onClick={() => onSelect(session)}
          >
            {booked ? tr("Booked ✓") : tr("View session")}
            {!booked && <ArrowUpRight size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
}

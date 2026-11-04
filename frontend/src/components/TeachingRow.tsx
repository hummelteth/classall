import { Users } from "lucide-react";
import { dateLabel, timeLabel } from "../lib/api";
import type { Session } from "../lib/types";

export function TeachingRow({ session: s }: { session: Session }) {
  return (
    <article className="teaching-row">
      <span className={`teaching-symbol tone-${s.subject.color}`}>
        {s.subject.symbol}
      </span>
      <div>
        <span className="eyebrow">{s.subject.name}</span>
        <h3>{s.title}</h3>
        <p>
          {dateLabel(s.starts_at)} · {timeLabel(s.starts_at)} ·{" "}
          {s.duration_minutes} min
        </p>
      </div>
      <span className="teaching-attendance">
        <Users size={16} />
        {s.booked_seats}/{s.capacity}
        <small>seats booked</small>
      </span>
    </article>
  );
}

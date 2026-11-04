import { t as tr } from "../lib/i18n";
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
        <span className="eyebrow">{tr(s.subject.name)}</span>
        <h3>{s.title}</h3>
        <p>
          {dateLabel(s.starts_at)} · {timeLabel(s.starts_at)} ·{" "}
          {s.duration_minutes}
          {tr(" min")}
        </p>
      </div>
      <span className="teaching-attendance">
        <Users size={18} aria-hidden="true" />
        <strong>
          {s.booked_seats}/{s.capacity}
        </strong>
        <small>{tr("seats booked")}</small>
      </span>
    </article>
  );
}

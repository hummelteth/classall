import { t as tr } from "../lib/i18n";
import { BookOpen, Clock3, Sparkles } from "lucide-react";
import type { TutorOverview } from "../lib/types";

export function TutorStats({ data }: { data: TutorOverview }) {
  return (
    <>
      <div className="stats-grid">
        <article>
          <span className="stat-icon tone-violet">
            <Sparkles size={20} />
          </span>
          <span className="stat-label">{tr("Engagement points")}</span>
          <strong>
            {data.engagement_points}
            <small>{tr("pts")}</small>
          </strong>
          <p>{tr("Stored contribution ledger")}</p>
        </article>
        <article>
          <span className="stat-icon tone-peach">
            <Clock3 size={20} />
          </span>
          <span className="stat-label">{tr("Time shared")}</span>
          <strong>
            {data.teaching_minutes / 60}
            <small>{tr("hours")}</small>
          </strong>
          <p>{tr("From synthetic teaching history")}</p>
        </article>
        <article>
          <span className="stat-icon tone-sage">
            <BookOpen size={20} />
          </span>
          <span className="stat-label">{tr("Sessions completed")}</span>
          <strong>{data.completed_sessions}</strong>
          <p>{tr("Fictional learning moments")}</p>
        </article>
      </div>
      <p className="stats-note">
        {tr(
          "Demo recognition only · No points for new bookings · No university credentials or credits.",
        )}
      </p>
    </>
  );
}

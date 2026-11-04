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
          <span className="stat-label">Engagement points</span>
          <strong>
            {data.engagement_points}
            <small>pts</small>
          </strong>
          <p>20 per completed demo session</p>
        </article>
        <article>
          <span className="stat-icon tone-peach">
            <Clock3 size={20} />
          </span>
          <span className="stat-label">Time shared</span>
          <strong>
            {data.teaching_minutes / 60}
            <small>hours</small>
          </strong>
          <p>From synthetic teaching history</p>
        </article>
        <article>
          <span className="stat-icon tone-sage">
            <BookOpen size={20} />
          </span>
          <span className="stat-label">Sessions completed</span>
          <strong>{data.completed_sessions}</strong>
          <p>Fictional learning moments</p>
        </article>
      </div>
      <p className="stats-note">
        Demo recognition only · No points for new bookings · No university
        credentials or credits.
      </p>
    </>
  );
}

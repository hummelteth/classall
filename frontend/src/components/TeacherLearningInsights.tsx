import { Link } from "react-router-dom";
import type { AssessmentAggregate, TopicInsight } from "../lib/types";

function Aggregate({
  label,
  data,
  eligible,
}: {
  label: string;
  data: AssessmentAggregate;
  eligible: number;
}) {
  return (
    <div className="learning-score">
      <span>
        {label} · n={data.n} of {eligible}
      </span>
      <strong>
        {data.suppressed
          ? data.n === 0
            ? "No submitted checks"
            : "Suppressed: fewer than 3 learners"
          : `${data.mean_percent}% mean`}
      </strong>
      {!data.suppressed && (
        <progress
          aria-label={`${label} mean`}
          value={data.mean_percent ?? 0}
          max={100}
        />
      )}
      <small>
        {eligible - data.n} missing; missing checks are not zero scores.
      </small>
    </div>
  );
}
export function TeacherLearningInsights({
  topics,
  subjectId: _subjectId,
}: {
  topics: TopicInsight[];
  subjectId: number;
}) {
  return (
    <div className="teacher-learning">
      {topics.map((t) => (
        <section className="topic-insight" key={t.topic.id}>
          <h4>{t.topic.name}</h4>
          <p>
            {t.confirmed_bookings} confirmed topic bookings ·{" "}
            {t.distinct_booked_learners} distinct demo learners. Booking demand
            indicates interest in support; it does not prove difficulty.
          </p>
          <p>
            {t.booked_places} booked places · {t.available_places} available ·{" "}
            {t.capacity} total in upcoming topic sessions.
          </p>
          <Aggregate
            label="Pre-session checks"
            data={t.pre}
            eligible={t.distinct_booked_learners}
          />
          <Aggregate
            label="Post-session checks"
            data={t.post}
            eligible={t.distinct_booked_learners}
          />
          <p>
            {t.paired.suppressed
              ? `Matched comparison: ${t.paired.n === 0 ? "no complete pairs" : "suppressed (fewer than 3 learners)"} · n=${t.paired.n}.`
              : `Matched comparison · n=${t.paired.n}: ${t.paired.pre_mean_percent}% before → ${t.paired.post_mean_percent}% after; difference ${t.paired.mean_change_percentage_points! > 0 ? "+" : ""}${t.paired.mean_change_percentage_points} percentage points.`}
          </p>
          <p className="fine-print">
            Stage means may use different participants. Matched comparisons use
            the same learners and booking in both checks; differences do not
            establish a tutoring effect.
          </p>
          <aside className="teaching-advice">
            <span className="pill neutral">
              Advisory · Human review required
            </span>
            <h4>{t.recommendation.text}</h4>
            <p>Observable signals:</p>
            <ul>
              {t.recommendation.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <Link className="text-link" to={`/app/actions?topic=${t.topic.id}`}>
              Create a human-reviewed support action
            </Link>
            <p className="fine-print">
              You can organize synthetic TA support from Support actions. No
              learner is labeled or contacted.
            </p>
          </aside>
        </section>
      ))}
    </div>
  );
}

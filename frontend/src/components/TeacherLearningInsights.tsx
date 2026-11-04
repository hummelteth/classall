import { t as tr } from "../lib/i18n";
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
        {tr(label)}
        {tr(" · n=")}
        {data.n}
        {tr(" of ")}
        {eligible}
      </span>
      <strong>
        {data.suppressed
          ? data.n === 0
            ? tr("No submitted checks")
            : tr("Suppressed: fewer than 3 learners")
          : tr("{{0}}% mean", { 0: data.mean_percent })}
      </strong>
      {!data.suppressed && (
        <progress
          aria-label={tr("{{0}} mean", { 0: label })}
          value={data.mean_percent ?? 0}
          max={100}
        />
      )}
      <small>
        {eligible - data.n}
        {tr(" missing; missing checks are not zero scores.")}
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
          <h4>{tr(t.topic.name)}</h4>
          <p>
            {t.confirmed_bookings}
            {tr(" confirmed topic bookings ·")} {t.distinct_booked_learners}
            {tr(
              " distinct demo learners. Booking demand indicates interest in support; it does not prove difficulty.",
            )}
          </p>
          <p>
            {t.booked_places}
            {tr(" booked places · ")}
            {t.available_places}
            {tr(" available ·")} {t.capacity}
            {tr(" total in upcoming topic sessions.")}
          </p>
          <Aggregate
            label={tr("Pre-session checks")}
            data={t.pre}
            eligible={t.distinct_booked_learners}
          />
          <Aggregate
            label={tr("Post-session checks")}
            data={t.post}
            eligible={t.distinct_booked_learners}
          />
          <p>
            {t.paired.suppressed
              ? tr("Matched comparison: {{0}} · n={{1}}.", {
                  0:
                    t.paired.n === 0
                      ? "no complete pairs"
                      : "suppressed (fewer than 3 learners)",
                  1: t.paired.n,
                })
              : tr(
                  "Matched comparison · n={{0}}: {{1}}% before → {{2}}% after; difference {{3}}{{4}} percentage points.",
                  {
                    0: t.paired.n,
                    1: t.paired.pre_mean_percent,
                    2: t.paired.post_mean_percent,
                    3: t.paired.mean_change_percentage_points! > 0 ? "+" : "",
                    4: t.paired.mean_change_percentage_points,
                  },
                )}
          </p>
          <p className="fine-print">
            {tr(
              "Stage means may use different participants. Matched comparisons use the same learners and booking in both checks; differences do not establish a tutoring effect.",
            )}
          </p>
          <aside className="teaching-advice">
            <span className="pill neutral">
              {tr("Advisory · Human review required")}
            </span>
            <h4>{tr(t.recommendation.text)}</h4>
            <p>{tr("Observable signals:")}</p>
            <ul>
              {t.recommendation.signals.map((s) => (
                <li key={s}>{tr(s)}</li>
              ))}
            </ul>
            <Link className="text-link" to={`/app/actions?topic=${t.topic.id}`}>
              {tr("Create a human-reviewed support action")}
            </Link>
            <p className="fine-print">
              {tr(
                "You can organize synthetic TA support from Support actions. No learner is labeled or contacted.",
              )}
            </p>
          </aside>
        </section>
      ))}
    </div>
  );
}

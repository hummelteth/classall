import { t as tr } from "../lib/i18n";
import { useState } from "react";
import { Link } from "react-router-dom";
import { request, useRemote } from "../lib/api";
import { useDemo } from "../lib/demo";
import type { CheckScore, LearningHistory, LearningItem } from "../lib/types";
import { EmptyState, ErrorState, Loading, SectionHeading } from "./ui";

export function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: CheckScore | null;
}) {
  return (
    <div className="learning-score">
      <span>{tr(label)}</span>
      <strong>
        {score
          ? `${score.correct}/${score.total} · ${score.percent}%`
          : tr("Not completed")}
      </strong>
      {score && (
        <progress
          aria-label={tr("{{0}} result", { 0: label })}
          max={100}
          value={score.percent}
        />
      )}
    </div>
  );
}

export function LearningCard({ item }: { item: LearningItem }) {
  const { user, refresh } = useDemo();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const simulate = async () => {
    setBusy(true);
    setError("");
    try {
      await request(
        `/bookings/${item.booking_id}/simulate-completion`,
        user.id,
        { method: "POST" },
      );
      refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tr("Could not unlock the demo follow-up. Try again."),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="learning-card">
      <span className="pill neutral">
        {item.topics.map((t) => t.name).join(" · ")}
      </span>
      <h3>{item.title}</h3>
      <p>
        {tr("Booking #")}
        {item.booking_id}
        {item.booking_status === "cancelled"
          ? " · Cancelled; saved results retained"
          : ""}
      </p>
      <ul>
        {item.objectives.map((o) => (
          <li key={o.id}>
            {o.id >= 10 && o.id <= 61 && o.id % 10 <= 1
              ? tr(o.description)
              : o.description}
          </li>
        ))}
      </ul>
      <div className="learning-comparison">
        <ScoreBar label={tr("Before tutoring")} score={item.pre.result} />
        <ScoreBar label={tr("After tutoring")} score={item.post.result} />
      </div>
      <p>
        {item.change_percentage_points === null
          ? tr(
              "Comparison pending: complete both checks to compare your answers.",
            )
          : tr("Difference on these checks: {{0}}{{1}} percentage points.", {
              0: item.change_percentage_points > 0 ? "+" : "",
              1: item.change_percentage_points,
            })}
      </p>
      {item.change_percentage_points !== null && (
        <p className="fine-print">
          {tr(
            "Two questions per check give a limited snapshot. This is not a validated measure of learning improvement.",
          )}
        </p>
      )}
      <div className="learning-actions">
        {(["pre", "post"] as const).map(
          (stage) =>
            item[stage].status !== "locked" && (
              <Link
                key={stage}
                className="button secondary"
                to={`/app/checks/${item.booking_id}/${stage}`}
              >
                {item[stage].status === "completed"
                  ? tr("Review")
                  : tr("Start")}{" "}
                {stage === "pre" ? tr("pre-session") : tr("post-session")}
                {tr(" check")}
              </Link>
            ),
        )}
      </div>
      {item.post.status === "locked" && (
        <p className="fine-print">{tr(item.post.reason)}</p>
      )}
      {item.booking_status === "confirmed" &&
        item.pre.result &&
        !item.post.result &&
        !item.simulated && (
          <div className="learning-demo">
            <strong>{tr("Demonstration only")}</strong>
            <p>
              {tr(
                "Simulate a completed session to try the follow-up now. This does not record real attendance or award tutor points.",
              )}
            </p>
            <button
              className="button secondary"
              onClick={simulate}
              disabled={busy}
            >
              {busy ? tr("Unlocking…") : tr("Demo: simulate completed session")}
            </button>
          </div>
        )}
      {item.simulated && (
        <p className="fine-print">
          {tr("Demo completion simulated · no real attendance recorded.")}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {tr(error)}
        </p>
      )}
      <p className="learning-suggestion">
        {tr("Next step: ")}
        {tr(item.suggestion)}{" "}
        <Link to={`/app/explore?subject=${item.topics[0]?.subject_id}`}>
          {tr("Find more tutoring")}
        </Link>
      </p>
    </article>
  );
}

export function LearningProgress() {
  const { user, version } = useDemo();
  const remote = useRemote<LearningHistory>(
    "/learning/history",
    user.id,
    version,
  );
  const practicedTopics = [
    ...new Map(
      remote.data?.items
        .filter((i) => i.pre.result || i.post.result)
        .flatMap((i) => i.topics)
        .map((t) => [t.id, t.name]) ?? [],
    ).values(),
  ];
  return (
    <section className="learning-section">
      <SectionHeading
        eyebrow={tr("YOUR PRIVATE PRACTICE SPACE")}
        title={tr("Your Learning Checks")}
      >
        {tr(
          "Short, optional checks help you decide what to practise. No rankings, grades or points.",
        )}
      </SectionHeading>
      {remote.loading ? (
        <Loading label={tr("Loading Learning Checks")} />
      ) : remote.error ? (
        <ErrorState message={tr(remote.error)} retry={remote.retry} />
      ) : (
        remote.data && (
          <>
            <p className="info-box">
              {practicedTopics.length}
              {tr(" practiced topics ·")}{" "}
              {remote.data.items.reduce(
                (n, i) => n + Number(!!i.pre.result) + Number(!!i.post.result),
                0,
              )}{" "}
              {tr("completed checks ·")}{" "}
              {remote.data.items.reduce(
                (n, i) =>
                  n +
                  Number(i.pre.status === "pending") +
                  Number(
                    i.post.status !== "completed" &&
                      i.booking_status === "confirmed",
                  ),
                0,
              )}{" "}
              {tr("pending checks (including locked follow-ups).")}
            </p>
            {practicedTopics.length > 0 && (
              <p>
                {tr("Topics practiced: ")}
                {practicedTopics.join(" · ")}
              </p>
            )}
            {remote.data.items.length ? (
              <div className="learning-grid">
                {remote.data.items.map((i) => (
                  <LearningCard key={`${user.id}-${i.booking_id}`} item={i} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={tr("A small check, a useful starting point.")}
                action={
                  <Link className="button primary" to="/app/explore">
                    {tr("Find a tutoring session")}
                  </Link>
                }
              >
                {tr(
                  "Book one of the six upcoming demo sessions to access its Learning Checks. Older demo sessions without a question bank have no checks.",
                )}
              </EmptyState>
            )}
            <p className="fine-print">{tr(remote.data.note)}</p>
          </>
        )
      )}
    </section>
  );
}

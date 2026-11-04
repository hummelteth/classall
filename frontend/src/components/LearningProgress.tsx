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
      <span>{label}</span>
      <strong>
        {score
          ? `${score.correct}/${score.total} · ${score.percent}%`
          : "Not completed"}
      </strong>
      {score && (
        <progress
          aria-label={`${label} result`}
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
          : "Could not unlock the demo follow-up. Try again.",
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
        Booking #{item.booking_id}
        {item.booking_status === "cancelled"
          ? " · Cancelled; saved results retained"
          : ""}
      </p>
      <ul>
        {item.objectives.map((o) => (
          <li key={o.id}>{o.description}</li>
        ))}
      </ul>
      <div className="learning-comparison">
        <ScoreBar label="Before tutoring" score={item.pre.result} />
        <ScoreBar label="After tutoring" score={item.post.result} />
      </div>
      <p>
        {item.change_percentage_points === null
          ? "Comparison pending: complete both checks to compare your answers."
          : `Difference on these checks: ${item.change_percentage_points > 0 ? "+" : ""}${item.change_percentage_points} percentage points.`}
      </p>
      {item.change_percentage_points !== null && (
        <p className="fine-print">
          Two questions per check give a limited snapshot. This is not a
          validated measure of learning improvement.
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
                {item[stage].status === "completed" ? "Review" : "Start"}{" "}
                {stage === "pre" ? "pre-session" : "post-session"} check
              </Link>
            ),
        )}
      </div>
      {item.post.status === "locked" && (
        <p className="fine-print">{item.post.reason}</p>
      )}
      {item.booking_status === "confirmed" &&
        item.pre.result &&
        !item.post.result &&
        !item.simulated && (
          <div className="learning-demo">
            <strong>Demonstration only</strong>
            <p>
              Simulate a completed session to try the follow-up now. This does
              not record real attendance or award tutor points.
            </p>
            <button
              className="button secondary"
              onClick={simulate}
              disabled={busy}
            >
              {busy ? "Unlocking…" : "Demo: simulate completed session"}
            </button>
          </div>
        )}
      {item.simulated && (
        <p className="fine-print">
          Demo completion simulated · no real attendance recorded.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="learning-suggestion">
        Next step: {item.suggestion}{" "}
        <Link to={`/app/explore?subject=${item.topics[0]?.subject_id}`}>
          Find more tutoring
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
        eyebrow="YOUR PRIVATE PRACTICE SPACE"
        title="Your Learning Checks"
      >
        Short, optional checks help you decide what to practise. No rankings,
        grades or points.
      </SectionHeading>
      {remote.loading ? (
        <Loading label="Loading Learning Checks" />
      ) : remote.error ? (
        <ErrorState message={remote.error} retry={remote.retry} />
      ) : (
        remote.data && (
          <>
            <p className="info-box">
              {practicedTopics.length} practiced topics ·{" "}
              {remote.data.items.reduce(
                (n, i) => n + Number(!!i.pre.result) + Number(!!i.post.result),
                0,
              )}{" "}
              completed checks ·{" "}
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
              pending checks (including locked follow-ups).
            </p>
            {practicedTopics.length > 0 && (
              <p>Topics practiced: {practicedTopics.join(" · ")}</p>
            )}
            {remote.data.items.length ? (
              <div className="learning-grid">
                {remote.data.items.map((i) => (
                  <LearningCard key={`${user.id}-${i.booking_id}`} item={i} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="A small check, a useful starting point."
                action={
                  <Link className="button primary" to="/app/explore">
                    Find a tutoring session
                  </Link>
                }
              >
                Book one of the six upcoming demo sessions to access its
                Learning Checks. Older demo sessions without a question bank
                have no checks.
              </EmptyState>
            )}
            <p className="fine-print">{remote.data.note}</p>
          </>
        )
      )}
    </section>
  );
}

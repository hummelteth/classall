import { t as tr } from "../lib/i18n";
import { useLanguage } from "../lib/i18n";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageTitle } from "../components/PageTitle";
import { ErrorState, Loading } from "../components/ui";
import { ScoreBar } from "../components/LearningProgress";
import { request, useRemote } from "../lib/api";
import { useDemo } from "../lib/demo";
import type { CheckPayload, LearningHistory } from "../lib/types";

export function LearningCheck() {
  const { bookingId, stage } = useParams();
  const { user } = useDemo();
  if (!/^\d+$/.test(bookingId ?? "") || (stage !== "pre" && stage !== "post"))
    return (
      <ErrorState
        message={tr(
          "This Learning Check link is invalid. Open a check from My learning & impact.",
        )}
        retry={() => window.history.back()}
      />
    );
  if (user.role === "professor")
    return (
      <p className="info-box">
        {tr(
          "Professor demo access uses aggregated insights. Switch to the Learner demo to try a private check.",
        )}
      </p>
    );
  return (
    <CheckForm
      key={`${user.id}-${bookingId}-${stage}`}
      bookingId={Number(bookingId)}
      stage={stage}
    />
  );
}

function CheckForm({
  bookingId,
  stage,
}: {
  bookingId: number;
  stage: "pre" | "post";
}) {
  const { user, version, refresh } = useDemo();
  const language = useLanguage();
  const remote = useRemote<CheckPayload>(
    `/bookings/${bookingId}/learning-checks/${stage}?language=${language}`,
    user.id,
    version,
  );
  const history = useRemote<LearningHistory>(
    "/learning/history",
    user.id,
    version,
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const check = remote.data;
  const item = history.data?.items.find((i) => i.booking_id === bookingId);
  const completed = check?.status === "completed";
  useEffect(() => {
    if (completed) resultHeading.current?.focus();
  }, [completed]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      await request<CheckPayload>(
        `/bookings/${bookingId}/learning-checks/${stage}?language=${language}`,
        user.id,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
          signal: abort.signal,
        },
      );
      if (!abort.signal.aborted) refresh();
    } catch (err) {
      if (!abort.signal.aborted) {
        setError(
          err instanceof Error
            ? err.message
            : tr(
                "Could not submit. Your selections are still here; try again.",
              ),
        );
        if (err instanceof Error && err.message.includes("already submitted"))
          refresh();
      }
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow={tr("SYNTHETIC DEMO · OPTIONAL PRACTICE")}
        title={tr("{{0}} Learning Check", {
          0: tr(stage === "pre" ? "Pre-session" : "Post-session"),
        })}
        description={
          item?.title ??
          tr(
            "A short snapshot of your understanding. Your answers stay in your demo learning space.",
          )
        }
      />
      <Link className="text-link" to="/app/impact">
        {tr("Back to My learning & impact")}
      </Link>
      {remote.loading ? (
        <Loading label={tr("Loading your Learning Check")} />
      ) : remote.error ? (
        <ErrorState message={tr(remote.error)} retry={remote.retry} />
      ) : (
        check && (
          <section className="learning-card quiz-card">
            {check.course && (
              <p>
                <strong>{tr(check.course)}</strong> ·{" "}
                {check.topics?.join(" · ")} ·{" "}
                {check.content_language?.toUpperCase()}
              </p>
            )}
            {check.professor_reviewed && (
              <p className="info-box">
                {check.provenance === "prepared-demo"
                  ? tr(
                      "Prepared demonstration · Professor-reviewed course materials",
                    )
                  : tr("AI-generated · Professor-reviewed course materials")}
              </p>
            )}
            {item && (
              <>
                <h2>{tr("What you’ll practise")}</h2>
                <ul>
                  {item.objectives.map((o) => (
                    <li key={o.id}>
                      {o.id >= 10 && o.id <= 61 && o.id % 10 <= 1
                        ? tr(o.description)
                        : o.description}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {check.status === "locked" ? (
              <p className="info-box">{tr(check.reason)}</p>
            ) : (
              <>
                {completed ? (
                  <div aria-live="polite">
                    <h2 tabIndex={-1} ref={resultHeading}>
                      {tr("Your saved result")}
                    </h2>
                    <ScoreBar
                      label={
                        stage === "pre"
                          ? tr("Before tutoring")
                          : tr("After tutoring")
                      }
                      score={check.result}
                    />
                    <p>
                      {check.result && check.result.percent < 67
                        ? tr(
                            "These questions point to useful practice. Take your time with the explanations below.",
                          )
                        : tr(
                            "A useful starting point. Try explaining the reasoning in your own words.",
                          )}
                    </p>
                    <p className="fine-print">
                      {tr(
                        "This short check is not a grade or a validated measure of learning improvement.",
                      )}
                    </p>
                  </div>
                ) : (
                  <p aria-live="polite">
                    {Object.keys(answers).length}
                    {tr(" of ")}
                    {check.questions.length}{" "}
                    {tr(
                      "answered · Answer every question, then submit once. Your draft remains here until you leave this page; only submitted checks are saved.",
                    )}
                  </p>
                )}
                <form onSubmit={submit}>
                  {check.questions.map((q, index) => (
                    <fieldset
                      key={q.id}
                      className="quiz-question"
                      disabled={busy || completed}
                    >
                      <legend>
                        {index + 1}. {q.prompt}
                      </legend>
                      {q.options.map((o) => (
                        <label className="quiz-option" key={o.id}>
                          <input
                            type="radio"
                            required
                            name={`question-${q.id}`}
                            value={o.id}
                            checked={
                              completed
                                ? q.selected_option_id === o.id
                                : answers[String(q.id)] === o.id
                            }
                            onChange={() =>
                              setAnswers((a) => ({
                                ...a,
                                [String(q.id)]: o.id,
                              }))
                            }
                          />
                          <span>
                            {o.label}
                            {completed && q.correct_option_id === o.id
                              ? tr(" · Correct answer")
                              : ""}
                            {completed && q.selected_option_id === o.id
                              ? tr(" · Your answer")
                              : ""}
                          </span>
                        </label>
                      ))}
                      {completed && (
                        <p className="quiz-explanation">{q.explanation}</p>
                      )}
                    </fieldset>
                  ))}
                  {error && (
                    <p role="alert" className="form-error">
                      {tr(error)}
                    </p>
                  )}
                  {!completed && (
                    <button
                      className="button primary"
                      disabled={
                        busy ||
                        Object.keys(answers).length !== check.questions.length
                      }
                    >
                      {busy
                        ? tr("Saving your answers…")
                        : tr("Submit Learning Check")}
                    </button>
                  )}
                </form>
                {completed && item && (
                  <div className="learning-followup">
                    <p>{tr(item.suggestion)}</p>
                    {item.change_percentage_points !== null ? (
                      <>
                        <ScoreBar
                          label={tr("Before tutoring")}
                          score={item.pre.result}
                        />
                        <ScoreBar
                          label={tr("After tutoring")}
                          score={item.post.result}
                        />
                        <p>
                          {tr("Difference on these checks:")}{" "}
                          {item.change_percentage_points > 0 ? "+" : ""}
                          {item.change_percentage_points}
                          {tr(
                            " percentage points. This describes your answers on different questions; it does not establish a tutoring effect.",
                          )}
                        </p>
                      </>
                    ) : (
                      <p>
                        {tr(
                          "Comparison pending until both checks are complete.",
                        )}
                      </p>
                    )}
                    <Link className="button secondary" to="/app/impact">
                      {tr("See progress & demo follow-up")}
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        )
      )}
    </>
  );
}

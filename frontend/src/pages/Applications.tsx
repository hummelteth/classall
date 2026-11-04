import { useState } from "react";
import { Link } from "react-router-dom";
import { t as tr, useLanguage } from "../lib/i18n";
import { useDemo } from "../lib/demo";
import { request, useRemote, dateLabel } from "../lib/api";
import { PageTitle } from "../components/PageTitle";
import {
  RemoteContent,
  TopicSelect,
  useMutation,
} from "../components/ConnectedUI";
import type { Topic } from "../lib/types";
import type { Application, Qualification } from "../lib/core-types";

const fields = [
  ["motivation", "Why would you like to help?"],
  ["experience", "Relevant knowledge or experience"],
  ["proposed_topic", "Proposed tutoring topic"],
  ["objectives", "Learning objectives"],
  ["teaching_plan", "Brief teaching plan"],
  ["approach", "Teaching approach or activities"],
] as const;
const statuses = {
  pending: "Pending",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};
const criteria: Record<string, string> = {
  accuracy: "Subject accuracy",
  clarity: "Clarity",
  reasoning: "Educational reasoning",
  learner_fit: "Appropriateness for the learner",
  cautions: "Missing or misleading explanations",
};

export function Applications() {
  const { user, version } = useDemo();
  const remote = useRemote<Application[]>(
    "/tutor-applications",
    user.id,
    version,
  );
  const topics = useRemote<Topic[]>("/learning/topics");
  const [editing, setEditing] = useState<Application | null>(null);
  const [open, setOpen] = useState(false);
  const faculty = user.role === "professor";
  return (
    <>
      <PageTitle
        eyebrow={tr("STUDENTS HELPING STUDENTS")}
        title={tr(faculty ? "Tutor application review" : "Become a Tutor")}
        description={tr(
          "Share what you know. Subject approval is a human decision, supported by a short knowledge check and your teaching ideas.",
        )}
      >
        {!faculty && (
          <button
            className="button primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            {tr("Start an application")}
          </button>
        )}
      </PageTitle>
      <p className="page-note">
        {tr(
          "Prepared qualification example from the V4 curated bank. Illustrative reviewed answers; not a validated qualification or university endorsement.",
        )}
      </p>
      {open && !faculty && (
        <RemoteContent remote={topics}>
          {(data) => (
            <ApplicationForm
              key={`${user.id}-${editing?.id}`}
              topics={data}
              initial={editing}
              close={() => setOpen(false)}
            />
          )}
        </RemoteContent>
      )}
      <RemoteContent remote={remote}>
        {(data) => (
          <div className="core-stack">
            {!data.length && (
              <section className="form-panel">
                <p>
                  {tr(
                    faculty
                      ? "No applications for your assigned subjects yet."
                      : "Your applications and professor feedback will appear here.",
                  )}
                </p>
              </section>
            )}
            {data.map((a) => (
              <ApplicationCard
                key={`${user.id}-${a.id}`}
                application={a}
                revise={() => {
                  setEditing(a);
                  setOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </RemoteContent>
      {!faculty && (
        <p>
          <Link className="text-link" to="/app/teaching">
            {tr("Open my teaching workspace")}
          </Link>
        </p>
      )}
    </>
  );
}

function ApplicationForm({
  topics,
  initial,
  close,
}: {
  topics: Topic[];
  initial: Application | null;
  close: () => void;
}) {
  const { user } = useDemo();
  const language = useLanguage();
  const mutation = useMutation();
  const [tid, setTid] = useState(initial?.topic_id ?? topics[0]?.id ?? 0);
  const q = useRemote<Qualification>(
    `/qualifications/${tid}?language=${language}`,
    user.id,
    0,
    !!tid,
  );
  const [answers, setAnswers] = useState<number[]>(
    initial?.answers ?? [-1, -1],
  );
  return (
    <section className="form-panel">
      <h2>
        {tr(
          initial
            ? "Revise your application"
            : "Your subject and teaching ideas",
        )}
      </h2>
      {mutation.feedback}
      <form
        className="connected-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const content = Object.fromEntries([
            ...fields.map(([key]) => [key, String(data.get(key) ?? "")]),
            ["explanation", String(data.get("explanation") ?? "")],
          ]);
          const result = await mutation.run(
            () =>
              request(
                initial
                  ? `/tutor-applications/${initial.id}`
                  : "/tutor-applications",
                user.id,
                {
                  method: initial ? "PUT" : "POST",
                  body: JSON.stringify({
                    ...content,
                    topic_id: tid,
                    language,
                    answers,
                  }),
                },
              ),
            tr("Application submitted for professor review."),
          );
          if (result) close();
        }}
      >
        {initial ? (
          <p>
            {tr("Qualification topic")}:{" "}
            {tr(topics.find((t) => t.id === tid)?.name)}
          </p>
        ) : (
          <TopicSelect
            topics={topics}
            value={tid}
            onChange={(id) => {
              setTid(id);
              setAnswers([-1, -1]);
            }}
          />
        )}
        <div className="form-grid">
          {fields.map(([key, label]) => (
            <label key={key}>
              {tr(label)}
              <textarea
                name={key}
                required
                minLength={key === "proposed_topic" ? 5 : 10}
                maxLength={
                  key === "teaching_plan"
                    ? 1500
                    : key === "proposed_topic"
                      ? 200
                      : 1000
                }
                rows={2}
                defaultValue={initial?.content[key]}
              />
            </label>
          ))}
        </div>
        <RemoteContent remote={q}>
          {(qualification) => (
            <>
              <h3>{tr("Subject knowledge check")}</h3>
              {qualification.questions.map((question, index) => (
                <fieldset key={question.id} className="core-question">
                  <legend>{question.prompt}</legend>
                  {question.options.map((option, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name={`question-${index}`}
                        required
                        checked={answers[index] === i}
                        onChange={() =>
                          setAnswers((prev) =>
                            prev.map((v, n) => (n === index ? i : v)),
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              ))}
              <label>
                {tr("Teaching explanation")}
                <p>{qualification.explanation_task}</p>
                <textarea
                  name="explanation"
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={4}
                  defaultValue={initial?.content.explanation}
                />
              </label>
              <details>
                <summary>{tr("Assessment rubric")}</summary>
                <ul>
                  {Object.entries(qualification.rubric).map(([key, value]) => (
                    <li key={key}>
                      <strong>{tr(criteria[key])}: </strong>
                      {tr(value)}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </RemoteContent>
        <div className="action-row">
          <button
            className="button primary"
            disabled={
              mutation.busy ||
              q.loading ||
              !!q.error ||
              answers.some((a) => a < 0)
            }
          >
            {tr(mutation.busy ? "Saving…" : "Submit application")}
          </button>
          <button type="button" className="button secondary" onClick={close}>
            {tr("Close form")}
          </button>
        </div>
      </form>
    </section>
  );
}

function ApplicationCard({
  application: a,
  revise,
}: {
  application: Application;
  revise: () => void;
}) {
  const { user } = useDemo();
  const mutation = useMutation();
  const faculty = user.role === "professor";
  return (
    <article className="form-panel application-card">
      <span className="pill neutral">{tr(statuses[a.status])}</span>
      <h2>
        {a.applicant_name} · {tr(a.subject_name)}
      </h2>
      {mutation.feedback}
      {a.comments && (
        <blockquote>
          <strong>{tr("Professor feedback")}: </strong>
          {a.comments}
          <br />
          <small>
            {tr("Reviewer")} #{a.reviewer_id} ·{" "}
            {a.decided_at && dateLabel(a.decided_at)}
          </small>
        </blockquote>
      )}
      <details open={faculty}>
        <summary>{tr("Application and qualification responses")}</summary>
        <dl>
          {[...fields, ["explanation", "Teaching explanation"]].map(
            ([key, label]) => (
              <div key={key}>
                <dt>{tr(label)}</dt>
                <dd>{a.content[key]}</dd>
              </div>
            ),
          )}
        </dl>
        {a.qualification.questions.map((q, i) => (
          <div className="core-question" key={q.id}>
            <p>{q.prompt}</p>
            <p>
              {tr("Applicant response")}: {q.options[a.answers[i]]}
            </p>
            <p>
              {tr("Prepared reference answer")}: {q.options[q.correct ?? 0]}
            </p>
            <small>{q.explanation}</small>
          </div>
        ))}
      </details>
      {a.advisory && (
        <section className="core-advisory">
          <h3>
            {tr(
              a.advisory.mode === "prepared-review-checklist"
                ? "Prepared review checklist — no live AI evaluation"
                : "Local AI draft feedback — advisory only",
            )}
          </h3>
          <p>
            {tr(
              "This supports professor review. It does not approve, reject or certify anyone.",
            )}
          </p>
          <ul>
            {Object.entries(a.advisory.criteria).map(([key, value]) => (
              <li key={key}>
                <strong>{tr(criteria[key])}: </strong>
                {a.advisory?.mode === "prepared-review-checklist"
                  ? tr(value)
                  : value}
              </li>
            ))}
          </ul>
        </section>
      )}
      {a.status === "pending" && (
        <div className="action-row">
          <button
            className="button secondary small"
            disabled={mutation.busy}
            onClick={() =>
              void mutation.run(
                () =>
                  request(
                    `/tutor-applications/${a.id}/advisory?mode=prepared`,
                    user.id,
                    { method: "POST" },
                  ),
                tr("Prepared checklist saved. No live inference was used."),
              )
            }
          >
            {tr("Open prepared review checklist")}
          </button>
          <button
            className="button secondary small"
            disabled={mutation.busy}
            onClick={() =>
              void mutation.run(
                () =>
                  request(
                    `/tutor-applications/${a.id}/advisory?mode=live`,
                    user.id,
                    { method: "POST" },
                  ),
                tr("Local advisory feedback saved for human review."),
              )
            }
          >
            {tr(mutation.busy ? "Working…" : "Optional local AI feedback")}
          </button>
        </div>
      )}
      {faculty && a.status === "pending" && (
        <form
          className="connected-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void mutation.run(
              () =>
                request(`/tutor-applications/${a.id}/review`, user.id, {
                  method: "POST",
                  body: JSON.stringify({
                    status: data.get("decision"),
                    comments: data.get("comments"),
                    human_confirmed: true,
                  }),
                }),
              tr(
                "Professor decision saved. Approved subjects can now be published.",
              ),
            );
          }}
        >
          <label>
            {tr("Comments for the applicant")}
            <textarea name="comments" required minLength={5} maxLength={1500} />
          </label>
          <label>
            {tr("Decision")}
            <select name="decision" aria-label={tr("Decision")}>
              <option value="changes_requested">{tr("Request changes")}</option>
              <option value="approved">
                {tr("Approve subject authorization")}
              </option>
              <option value="rejected">{tr("Reject application")}</option>
            </select>
          </label>
          <label className="core-consent">
            <input type="checkbox" required />
            {tr(
              "I have reviewed the responses and teaching plan. This is my human decision.",
            )}
          </label>
          <button className="button primary" disabled={mutation.busy}>
            {tr("Save professor decision")}
          </button>
        </form>
      )}
      {!faculty && a.status === "changes_requested" && (
        <button className="button primary" onClick={revise}>
          {tr("Revise and resubmit")}
        </button>
      )}
      {!faculty && a.status === "approved" && (
        <Link className="button primary" to="/app/publish">
          {tr("Publish in your approved subject")}
        </Link>
      )}
      <details>
        <summary>{tr("Decision history")}</summary>
        <ul>
          {a.events.map((e) => (
            <li key={e.id}>
              {tr(
                (
                  {
                    submitted: "Submitted",
                    advisory: "Advisory feedback",
                    ...statuses,
                  } as Record<string, string>
                )[e.event] ?? e.event,
              )}{" "}
              · {tr("Actor")} #{e.actor_id} ·{" "}
              {dateLabel(e.created_at, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

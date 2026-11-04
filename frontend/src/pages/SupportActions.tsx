import { t as tr } from "../lib/i18n";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, CalendarPlus } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { FlowSteps } from "../components/ExperienceUI";
import {
  EventForm,
  TopicSelect,
  ConfirmButton,
  RemoteContent,
  useMutation,
} from "../components/ConnectedUI";
import { EmptyState } from "../components/ui";
import { useDemo } from "../lib/demo";
import { request, useRemote, dateLabel } from "../lib/api";
import type {
  Topic,
  SupportAction,
  SupportSignal,
  Session,
} from "../lib/types";
export function SupportActions() {
  const { user, version } = useDemo();
  const [params] = useSearchParams();
  const [create, setCreate] = useState(params.has("topic"));
  const [tid, setTid] = useState(Number(params.get("topic")) || 1);
  const [publish, setPublish] = useState<SupportAction | null>(null);
  const mutation = useMutation();
  const signals = useRemote<SupportSignal[]>(
    "/professor/signals",
    user.id,
    version,
    user.role === "professor",
  );
  const topics = useRemote<Topic[]>("/learning/topics");
  const actions = useRemote<SupportAction[]>(
    "/support-actions",
    user.id,
    version,
    user.role === "professor",
  );
  const allowed =
    topics.data?.filter((t) =>
      signals.data?.some((s) => s.topic.id === t.id),
    ) ?? [];
  if (user.role !== "professor")
    return (
      <EmptyState
        title={tr("Support decisions belong to the responsible professor.")}
      >
        <Link className="text-link" to="/app/pulse">
          {tr("Request learning support")}
        </Link>
      </EmptyState>
    );
  return (
    <>
      <PageTitle
        eyebrow={tr("HUMAN-LED SUPPORT")}
        title={tr("Turn an observation into an opportunity.")}
        description={tr(
          "Review the evidence, choose an action and follow up. Every decision stays with you.",
        )}
      >
        <button className="button primary" onClick={() => setCreate(!create)}>
          <Plus size={17} />
          {tr("Create support action")}
        </button>
      </PageTitle>
      <FlowSteps label="Evidence to support" steps={["Observation", "Interpretation", "Human action"]} />
      <div className="connected-intro">
        <p>
          {tr(
            "All people, evidence and faculty-organized offerings are synthetic. These are demo support opportunities without university endorsement.",
          )}
        </p>
        <Link className="text-link" to="/app/insights">
          {tr("Review learning insights")}
        </Link>
      </div>
      {mutation.feedback}
      {create && (
        <section className="form-panel">
          <h2>{tr("Plan a support action")}</h2>
          <form
            className="connected-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const result = await mutation.run(
                () =>
                  request("/support-actions", user.id, {
                    method: "POST",
                    body: JSON.stringify({
                      topic_id: tid,
                      action_type: form.get("action_type"),
                      rationale: form.get("rationale"),
                      follow_up_date: form.get("follow_up_date") || null,
                      notes: form.get("notes"),
                      human_confirmed: true,
                    }),
                  }),
                tr(
                  "Support action recorded with a snapshot of current aggregate evidence.",
                ),
              );
              if (result) setCreate(false);
            }}
          >
            <TopicSelect topics={allowed} value={tid} onChange={setTid} />
            <label>
              {tr("Action")}
              <select name="action_type">
                <option value="review">
                  {tr("Review a topic-level need")}
                </option>
                <option value="practice">
                  {tr("Recommend additional practice materials")}
                </option>
                <option value="ta_session">
                  {tr("Organize a TA-led support session")}
                </option>
                <option value="follow_up">
                  {tr("Record a follow-up review")}
                </option>
              </select>
            </label>
            <label>
              {tr("Rationale from observable evidence")}
              <textarea
                name="rationale"
                required
                minLength={10}
                maxLength={1000}
                rows={3}
                placeholder={tr(
                  "What did you observe, and why is this action appropriate?",
                )}
              />
            </label>
            <label>
              {tr("Follow-up date (optional)")}
              <input type="date" name="follow_up_date" />
            </label>
            <label>
              {tr("Notes or practice instructions (optional)")}
              <textarea name="notes" maxLength={1000} rows={2} />
            </label>
            <label className="check-label">
              <input type="checkbox" required />
              {tr(
                "I reviewed the available evidence and its limitations. I confirm this support action.",
              )}
            </label>
            <div className="action-row">
              <button
                disabled={mutation.busy || !allowed.some((t) => t.id === tid)}
                className="button primary"
              >
                {tr("Save confirmed action")}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreate(false)}
              >
                {tr("Close form")}
              </button>
            </div>
          </form>
        </section>
      )}
      {publish && (
        <FacultyForm
          action={publish}
          topics={allowed.filter((t) => t.id === publish.topic_id)}
          close={() => setPublish(null)}
        />
      )}
      <RemoteContent remote={actions}>
        {(data) =>
          data.length ? (
            <div className="action-list">
              {data.map((a) => (
                <article key={a.id} className="group-card">
                  <div className="card-meta">
                    <span className="eyebrow">
                      {a.subject_name} · {a.topic_name}
                    </span>
                    <span className="pill neutral">{tr(a.status)}</span>
                  </div>
                  <h2>
                    {
                      (
                        {
                          practice: tr("Practice materials"),
                          ta_session: tr("TA-led support session"),
                          review: tr("Topic review"),
                          follow_up: tr("Follow-up review"),
                        } as Record<string, string>
                      )[a.action_type]
                    }
                  </h2>
                  <p>{a.rationale}</p>
                  <small>
                    {tr("Created ")}
                    {dateLabel(a.created_at)}
                    {tr(" · Human-confirmed demo action")}
                    {a.follow_up_date
                      ? tr(" · Follow up {{0}}", {
                          0: dateLabel(a.follow_up_date + "T12:00:00", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }),
                        })
                      : ""}
                  </small>
                  <details className="evidence-details">
                    <summary>
                      {tr("Evidence at the time of this decision")}
                    </summary>
                    <p>
                      {a.evidence.participants}
                      {tr(" voluntary participants ·")}{" "}
                      {a.evidence.open_requests ?? tr("Suppressed (<3)")}
                      {tr(" open requests · ")}
                      {a.evidence.tutoring_places}
                      {tr(" tutoring places ·")} {a.evidence.study_group_places}
                      {tr(" study group places.")}
                    </p>
                    <p>{tr(a.evidence.rule)}</p>
                    <p>{tr(a.evidence.missing_data)}</p>
                    {a.evidence.learning_checks && (
                      <p>
                        {tr("Learning Check snapshot: pre n=")}
                        {a.evidence.learning_checks.pre.n},{" "}
                        {a.evidence.learning_checks.pre.suppressed
                          ? tr("mean suppressed")
                          : tr("{{0}}% mean", {
                              0: a.evidence.learning_checks.pre.mean_percent,
                            })}
                        {tr("; post n=")}
                        {a.evidence.learning_checks.post.n},{" "}
                        {a.evidence.learning_checks.post.suppressed
                          ? tr("mean suppressed")
                          : tr("{{0}}% mean", {
                              0: a.evidence.learning_checks.post.mean_percent,
                            })}
                        {tr(
                          ". Missing checks are excluded; differences do not establish a tutoring effect.",
                        )}
                      </p>
                    )}
                    <p>
                      {tr("Snapshot: ")}
                      {dateLabel(a.evidence.captured_at)}
                      {tr(
                        ". Learning Check details are retained in the aggregate snapshot; review current results in Learning insights. No individual responses or histories are included.",
                      )}
                    </p>
                    <Link className="text-link" to="/app/insights">
                      {tr("Review current insights")}
                    </Link>
                  </details>
                  {a.session_id ? (
                    <LinkedSession id={a.session_id} />
                  ) : (
                    a.action_type === "ta_session" &&
                    !["completed", "cancelled"].includes(a.status) && (
                      <button
                        className="button primary small"
                        onClick={() => setPublish(a)}
                      >
                        <CalendarPlus size={16} />
                        {tr("Organize synthetic TA session")}
                      </button>
                    )
                  )}
                  <ActionFollowUp
                    key={`${a.id}-${a.status}-${a.notes}-${a.follow_up_date}`}
                    action={a}
                  />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={tr(
                "Your next support opportunity starts with a decision.",
              )}
            >
              {tr(
                "Review the topic signals and record a human-confirmed action.",
              )}
            </EmptyState>
          )
        }
      </RemoteContent>
    </>
  );
}
function FacultyForm({
  action,
  topics,
  close,
}: {
  action: SupportAction;
  topics: Topic[];
  close: () => void;
}) {
  const { user } = useDemo();
  const mutation = useMutation();
  const [host, setHost] = useState(0);
  const hosts = useRemote<{ id: number; name: string }[]>(
    `/professor/hosts?topic_id=${action.topic_id}`,
    user.id,
  );
  return (
    <section className="form-panel">
      <h2>{tr("Organize faculty-supported tutoring")}</h2>
      <p>
        {tr(
          "Publish under your own professor identity with an approved synthetic tutor as host. The session uses ordinary reservations and appears on the host’s teaching schedule.",
        )}
      </p>
      {mutation.feedback}
      <RemoteContent remote={hosts}>
        {(data) => (
          <EventForm
            topics={topics}
            session
            busy={mutation.busy}
            onCancel={close}
            submitLabel="Publish synthetic TA session"
            onSave={async (body) => {
              const result = await mutation.run(
                () =>
                  request(`/support-actions/${action.id}/session`, user.id, {
                    method: "POST",
                    body: JSON.stringify({
                      ...body,
                      host_id: host || data[0]?.id,
                    }),
                  }),
                tr(
                  "The faculty-organized session is published. Learners can now book it.",
                ),
              );
              if (result) close();
            }}
          >
            <label>
              {tr("Approved synthetic host")}
              <select
                required
                value={host || data[0]?.id || ""}
                onChange={(e) => setHost(Number(e.target.value))}
              >
                {!data.length && (
                  <option value="">{tr("No approved host available")}</option>
                )}
                {data.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-label">
              <input type="checkbox" required />
              {tr(
                "I confirm this synthetic faculty-organized support offering.",
              )}
            </label>
          </EventForm>
        )}
      </RemoteContent>
    </section>
  );
}
function ActionFollowUp({ action: a }: { action: SupportAction }) {
  const { user } = useDemo();
  const mutation = useMutation();
  if (["completed", "cancelled"].includes(a.status))
    return (
      <p className="fine-print">
        {a.notes || tr("No additional follow-up notes.")}
      </p>
    );
  return (
    <details className="evidence-details">
      <summary>{tr("Update status & follow-up")}</summary>
      {mutation.feedback}
      <form
        className="connected-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void mutation.run(
            () =>
              request(`/support-actions/${a.id}`, user.id, {
                method: "PATCH",
                body: JSON.stringify({
                  status: f.get("status"),
                  notes: f.get("notes"),
                  follow_up_date: f.get("follow_up_date") || null,
                }),
              }),
            tr("Follow-up saved."),
          );
        }}
      >
        <label>
          {tr("Status")}
          <select name="status" defaultValue={tr(a.status)}>
            <option value="planned">{tr("Planned")}</option>
            <option value="active">{tr("Active")}</option>
            <option value="completed">{tr("Completed")}</option>
            {!a.session_id && (
              <option value="cancelled">{tr("Cancelled")}</option>
            )}
          </select>
        </label>
        <label>
          {tr("Follow-up date")}
          <input
            type="date"
            name="follow_up_date"
            defaultValue={a.follow_up_date ?? ""}
          />
        </label>
        <label>
          {tr("Notes")}
          <textarea name="notes" defaultValue={a.notes} maxLength={1000} />
        </label>
        <button className="button secondary small" disabled={mutation.busy}>
          {tr("Save follow-up")}
        </button>
      </form>
    </details>
  );
}
function LinkedSession({ id }: { id: number }) {
  const { user, version } = useDemo();
  const mutation = useMutation();
  const remote = useRemote<Session>(`/sessions/${id}`, undefined, version);
  return (
    <RemoteContent remote={remote}>
      {(s) => (
        <div className="linked-session">
          <span className="eyebrow">{tr("FACULTY-ORGANIZED · SYNTHETIC")}</span>
          <h3>{s.title}</h3>
          <p>
            {dateLabel(s.starts_at)} · {s.booked_seats}/{s.capacity}
            {tr(" booked ·")} {tr(s.status)}
          </p>
          <Link
            className="text-link"
            to={`/app/explore?topic=${s.topics?.[0]?.id ?? ""}`}
          >
            {tr("View in shared catalog")}
          </Link>
          {mutation.feedback}
          {s.status === "upcoming" && new Date(s.starts_at) > new Date() && (
            <ConfirmButton
              disabled={mutation.busy}
              onConfirm={() =>
                void mutation.run(
                  () =>
                    request(`/sessions/${s.id}/cancel`, user.id, {
                      method: "POST",
                    }),
                  tr("Faculty session and its reservations cancelled."),
                )
              }
            >
              {tr("Cancel faculty session & reservations")}
            </ConfirmButton>
          )}
        </div>
      )}
    </RemoteContent>
  );
}

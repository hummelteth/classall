import { t as tr } from "../lib/i18n";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HeartHandshake, ArrowUpRight } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import {
  TopicSelect,
  RemoteContent,
  useMutation,
} from "../components/ConnectedUI";
import { useDemo } from "../lib/demo";
import { request, useRemote, dateLabel } from "../lib/api";
import type {
  Topic,
  Pulse as PulseType,
  SupportRequest,
  Session,
  StudyGroup,
} from "../lib/types";
import { EmptyState } from "../components/ui";

const responses = [
  ["confident", tr("I feel confident."), tr("Keep sharing your strengths.")],
  [
    "practice",
    tr("I understand some of it, but need more practice."),
    tr("A fresh example can help."),
  ],
  [
    "support",
    tr("I'm struggling and would like support."),
    tr("You don’t have to work it out alone."),
  ],
] as const;
export function Pulse() {
  const { user, version } = useDemo();
  const [params, setParams] = useSearchParams();
  const tid = Number(params.get("topic")) || 1;
  const mutation = useMutation();
  const topics = useRemote<Topic[]>("/learning/topics");
  const pulses = useRemote<PulseType[]>(
    "/pulses",
    user.id,
    version,
    user.role !== "professor",
  );
  const requests = useRemote<SupportRequest[]>(
    "/support-requests",
    user.id,
    version,
    user.role !== "professor",
  );
  const suggestions = useRemote<{
    sessions: Session[];
    groups: StudyGroup[];
    practice: { id: number; description: string }[];
  }>(`/topics/${tid}/support`, user.id, version, user.role !== "professor");
  if (user.role === "professor")
    return (
      <EmptyState title={tr("Private reflection belongs to learners.")}>
        <Link className="button secondary small" to="/app/insights">
          {tr("Open aggregated learning insights")}
        </Link>
      </EmptyState>
    );
  const saved = pulses.data?.find((p) => p.topic_id === tid);
  const active = requests.data?.find(
    (r) => r.topic_id === tid && r.status !== "withdrawn",
  );
  return (
    <>
      <PageTitle
        eyebrow={tr("YOUR LEARNING PULSE")}
        title={tr("A small check-in. A useful next step.")}
        description={tr(
          "Share how a topic feels today. Participation is optional; you can update or withdraw at any time.",
        )}
      />
      <div className="pulse-layout">
        <section className="form-panel">
          <RemoteContent remote={topics}>
            {(data) => (
              <TopicSelect
                topics={data}
                value={tid}
                onChange={(id) => setParams({ topic: String(id) })}
              />
            )}
          </RemoteContent>
          <h2>{tr("How are you feeling about this topic?")}</h2>
          <RemoteContent remote={pulses}>
            {() => (
              <PulseResponse
                key={`${tid}-${saved?.updated_at ?? "new"}`}
                initial={saved?.response}
                busy={mutation.busy}
                onSave={async (response) => {
                  await mutation.run(
                    () =>
                      request(`/pulses/${tid}`, user.id, {
                        method: "PUT",
                        body: JSON.stringify({ response }),
                      }),
                    tr(
                      "Your check-in is saved. Choose a next step that works for you.",
                    ),
                  );
                }}
              />
            )}
          </RemoteContent>
          {saved && (
            <div className="action-row">
              <small>
                {tr("Updated ")}
                {dateLabel(saved.updated_at)} ·{" "}
                {saved.source === "seeded-synthetic"
                  ? tr("Synthetic example")
                  : tr("Demo interaction")}
              </small>
              <button
                className="button secondary small"
                disabled={mutation.busy}
                onClick={() =>
                  void mutation.run(
                    () =>
                      request(`/pulses/${tid}`, user.id, { method: "DELETE" }),
                    tr(
                      "Your response was withdrawn and removed from current aggregates.",
                    ),
                  )
                }
              >
                {tr("Withdraw response")}
              </button>
            </div>
          )}
          {mutation.feedback}
          <p className="fine-print">
            {tr(
              "A voluntary reflection is not a grade or an assessment of academic performance. Faculty see aggregated responses only, with small groups suppressed.",
            )}
          </p>
        </section>
        <aside className="next-card">
          <HeartHandshake size={30} />
          <h2>{tr("Let’s find a little support.")}</h2>
          <p>{tr("You can request help even when no session is available.")}</p>
          {active ? (
            <>
              <span className="pill sage">
                {tr("Request ")}
                {tr(active.status)}
              </span>
              <p>
                {active.status === "matched"
                  ? tr("You booked a session or joined a group for this topic.")
                  : tr("Your request contributes to aggregated course demand.")}
              </p>
              <button
                disabled={mutation.busy}
                className="button secondary small"
                onClick={() =>
                  void mutation.run(
                    () =>
                      request(
                        `/support-requests/${active.id}/withdraw`,
                        user.id,
                        { method: "POST" },
                      ),
                    tr("Your support request was withdrawn."),
                  )
                }
              >
                {tr("Withdraw support request")}
              </button>
            </>
          ) : (
            <button
              disabled={mutation.busy || requests.loading || !!requests.error}
              className="button primary"
              onClick={() =>
                void mutation.run(
                  () =>
                    request("/support-requests", user.id, {
                      method: "POST",
                      body: JSON.stringify({ topic_id: tid }),
                    }),
                  tr("Your request is open. You can withdraw it at any time."),
                )
              }
            >
              {tr("Request help with this topic")}
            </button>
          )}
          {requests.error && (
            <p role="alert">
              {tr(requests.error)}
              <button className="button secondary small" onClick={requests.retry}>
                {tr("Try again")}
              </button>
            </p>
          )}
        </aside>
      </div>
      <section className="support-options">
        <h2>{tr("Your next step, your choice.")}</h2>
        <RemoteContent remote={suggestions}>
          {(data) => (
            <div className="group-grid">
              <article className="group-card">
                <span className="eyebrow">{tr("LEARN WITH A TUTOR")}</span>
                <h3>
                  {data.sessions.length}
                  {tr(" relevant")}{" "}
                  {data.sessions.length === 1 ? tr("session") : tr("sessions")}
                </h3>
                {data.sessions.slice(0, 3).map((s) => (
                  <Link
                    className="support-result"
                    key={s.id}
                    to={`/app/explore?subject=${s.subject.id}&topic=${tid}`}
                  >
                    {s.title}
                    <small>
                      {dateLabel(s.starts_at)} · {s.available_seats}
                      {tr(" places")}
                    </small>
                  </Link>
                ))}
                {!data.sessions.length && (
                  <p>
                    {tr(
                      "No matching places right now. Your support request can help faculty recognize demand.",
                    )}
                  </p>
                )}
                <Link className="button secondary small" to={`/app/explore?topic=${tid}`}>
                  {tr("Find tutoring ")}
                  <ArrowUpRight size={15} />
                </Link>
              </article>
              <article className="group-card">
                <span className="eyebrow">{tr("WORK IT OUT TOGETHER")}</span>
                <h3>
                  {data.groups.length}
                  {tr(" relevant study")}{" "}
                  {data.groups.length === 1 ? tr("group") : tr("groups")}
                </h3>
                {data.groups.slice(0, 3).map((g) => (
                  <Link
                    className="support-result"
                    key={g.id}
                    to={`/app/groups?topic_id=${tid}`}
                  >
                    {g.title}
                    <small>
                      {g.available_places}
                      {tr(" places available")}
                    </small>
                  </Link>
                ))}
                {!data.groups.length && (
                  <p>
                    {tr(
                      "No open circle for this topic yet. You can start one.",
                    )}
                  </p>
                )}
                <Link className="button secondary small" to={`/app/groups?topic_id=${tid}`}>
                  {tr("Explore study groups ")}
                  <ArrowUpRight size={15} />
                </Link>
              </article>
              <article className="group-card">
                <span className="eyebrow">{tr("MAKE ROOM FOR PRACTICE")}</span>
                <h3>{tr("Try one small step")}</h3>
                {data.practice.map((p) => (
                  <p key={p.id} className="support-result">
                    {p.id >= 10 && p.id <= 61 && p.id % 10 <= 1
                      ? tr(p.description)
                      : p.description}
                  </p>
                ))}
                <p className="fine-print">
                  {tr(
                    "Use these objectives to guide practice. Curated Learning Checks are available through relevant tutoring bookings.",
                  )}
                </p>
                <Link className="button secondary small" to="/app/impact">
                  {tr("Review my Learning Checks ")}
                  <ArrowUpRight size={15} />
                </Link>
              </article>
            </div>
          )}
        </RemoteContent>
      </section>
    </>
  );
}
function PulseResponse({
  initial,
  busy,
  onSave,
}: {
  initial?: string;
  busy: boolean;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(value);
      }}
    >
      <fieldset className="pulse-choices">
        <legend className="sr-only">{tr("Choose how you feel")}</legend>
        {responses.map(([id, label, copy]) => (
          <label key={id} className={value === id ? "selected" : ""}>
            <input
              type="radio"
              name="response"
              value={id}
              checked={value === id}
              onChange={() => setValue(id)}
              required
            />
            <span>
              <strong>{tr(label)}</strong>
              <small>{tr(copy)}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <button className="button primary" disabled={busy || !value}>
        {busy
          ? tr("Saving…")
          : initial
            ? tr("Update check-in")
            : tr("Save check-in")}
      </button>
    </form>
  );
}

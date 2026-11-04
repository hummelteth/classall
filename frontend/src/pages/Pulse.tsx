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
  ["confident", "I feel confident.", "Keep sharing your strengths."],
  [
    "practice",
    "I understand some of it, but need more practice.",
    "A fresh example can help.",
  ],
  [
    "support",
    "I'm struggling and would like support.",
    "You don’t have to work it out alone.",
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
      <EmptyState title="Private reflection belongs to learners.">
        <Link className="text-link" to="/app/insights">
          Open aggregated learning insights
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
        eyebrow="YOUR LEARNING PULSE"
        title="A small check-in. A useful next step."
        description="Share how a topic feels today. Participation is optional; you can update or withdraw at any time."
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
          <h2>How are you feeling about this topic?</h2>
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
                    "Your check-in is saved. Choose a next step that works for you.",
                  );
                }}
              />
            )}
          </RemoteContent>
          {saved && (
            <div className="action-row">
              <small>
                Updated {dateLabel(saved.updated_at)} ·{" "}
                {saved.source === "seeded-synthetic"
                  ? "Synthetic example"
                  : "Demo interaction"}
              </small>
              <button
                className="text-link"
                disabled={mutation.busy}
                onClick={() =>
                  void mutation.run(
                    () =>
                      request(`/pulses/${tid}`, user.id, { method: "DELETE" }),
                    "Your response was withdrawn and removed from current aggregates.",
                  )
                }
              >
                Withdraw response
              </button>
            </div>
          )}
          {mutation.feedback}
          <p className="fine-print">
            A voluntary reflection is not a grade or an assessment of academic
            performance. Faculty see aggregated responses only, with small
            groups suppressed.
          </p>
        </section>
        <aside className="next-card">
          <HeartHandshake size={30} />
          <h2>Let’s find a little support.</h2>
          <p>You can request help even when no session is available.</p>
          {active ? (
            <>
              <span className="pill sage">Request {active.status}</span>
              <p>
                {active.status === "matched"
                  ? "You booked a session or joined a group for this topic."
                  : "Your request contributes to aggregated course demand."}
              </p>
              <button
                disabled={mutation.busy}
                className="text-link"
                onClick={() =>
                  void mutation.run(
                    () =>
                      request(
                        `/support-requests/${active.id}/withdraw`,
                        user.id,
                        { method: "POST" },
                      ),
                    "Your support request was withdrawn.",
                  )
                }
              >
                Withdraw support request
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
                  "Your request is open. You can withdraw it at any time.",
                )
              }
            >
              Request help with this topic
            </button>
          )}
          {requests.error && (
            <p role="alert">
              {requests.error}
              <button className="text-link" onClick={requests.retry}>
                Try again
              </button>
            </p>
          )}
        </aside>
      </div>
      <section className="support-options">
        <h2>Your next step, your choice.</h2>
        <RemoteContent remote={suggestions}>
          {(data) => (
            <div className="group-grid">
              <article className="group-card">
                <span className="eyebrow">LEARN WITH A TUTOR</span>
                <h3>
                  {data.sessions.length} relevant{" "}
                  {data.sessions.length === 1 ? "session" : "sessions"}
                </h3>
                {data.sessions.slice(0, 3).map((s) => (
                  <Link
                    className="support-result"
                    key={s.id}
                    to={`/app/explore?subject=${s.subject.id}&topic=${tid}`}
                  >
                    {s.title}
                    <small>
                      {dateLabel(s.starts_at)} · {s.available_seats} places
                    </small>
                  </Link>
                ))}
                {!data.sessions.length && (
                  <p>
                    No matching places right now. Your support request can help
                    faculty recognize demand.
                  </p>
                )}
                <Link className="text-link" to={`/app/explore?topic=${tid}`}>
                  Find tutoring <ArrowUpRight size={15} />
                </Link>
              </article>
              <article className="group-card">
                <span className="eyebrow">WORK IT OUT TOGETHER</span>
                <h3>
                  {data.groups.length} relevant study{" "}
                  {data.groups.length === 1 ? "group" : "groups"}
                </h3>
                {data.groups.slice(0, 3).map((g) => (
                  <Link
                    className="support-result"
                    key={g.id}
                    to={`/app/groups?topic_id=${tid}`}
                  >
                    {g.title}
                    <small>{g.available_places} places available</small>
                  </Link>
                ))}
                {!data.groups.length && (
                  <p>No open circle for this topic yet. You can start one.</p>
                )}
                <Link className="text-link" to={`/app/groups?topic_id=${tid}`}>
                  Explore study groups <ArrowUpRight size={15} />
                </Link>
              </article>
              <article className="group-card">
                <span className="eyebrow">MAKE ROOM FOR PRACTICE</span>
                <h3>Try one small step</h3>
                {data.practice.map((p) => (
                  <p key={p.id} className="support-result">
                    {p.description}
                  </p>
                ))}
                <p className="fine-print">
                  Use these objectives to guide practice. Curated Learning
                  Checks are available through relevant tutoring bookings.
                </p>
                <Link className="text-link" to="/app/impact">
                  Review my Learning Checks <ArrowUpRight size={15} />
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
        <legend className="sr-only">Choose how you feel</legend>
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
              <strong>{label}</strong>
              <small>{copy}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <button className="button primary" disabled={busy || !value}>
        {busy ? "Saving…" : initial ? "Update check-in" : "Save check-in"}
      </button>
    </form>
  );
}

import { useState } from "react";
import { t as tr } from "../lib/i18n";
import { useDemo } from "../lib/demo";
import { request, useRemote, dateLabel } from "../lib/api";
import { RemoteContent, useMutation } from "./ConnectedUI";
import type { Attendance, PortfolioData } from "../lib/core-types";

export function SyntheticAttendance({
  sessionId,
  proposed,
}: {
  sessionId: number;
  proposed: boolean;
}) {
  const { user, version } = useDemo();
  const mutation = useMutation();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<number[]>([]);
  const attendees = useRemote<
    { id: number; name: string; reservation_id: number }[]
  >(`/sessions/${sessionId}/attendees`, user.id, version, open);
  if (proposed)
    return (
      <p className="success-note">
        {tr(
          "Synthetic attendance proposed. Participants must confirm separately; points are awarded once after the first confirmation.",
        )}
      </p>
    );
  return (
    <div className="core-attendance">
      <button
        className="button secondary small"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {tr("Synthetic attendance confirmation")}
      </button>
      {open && (
        <>
          <p>
            {tr(
              "Fictional demonstration only. Select booked participants who attended. Each learner must also confirm; this is not independent attendance verification.",
            )}
          </p>
          {mutation.feedback}
          <RemoteContent remote={attendees}>
            {(data) =>
              data.length ? (
                <form
                  className="connected-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void mutation.run(
                      () =>
                        request(
                          `/sessions/${sessionId}/synthetic-attendance`,
                          user.id,
                          {
                            method: "POST",
                            body: JSON.stringify({
                              booking_ids: chosen,
                              synthetic_confirmed: true,
                            }),
                          },
                        ),
                      tr(
                        "Attendance proposal saved. Switch to the learner to confirm.",
                      ),
                    );
                  }}
                >
                  {data.map((a) => (
                    <label className="core-consent" key={a.reservation_id}>
                      <input
                        type="checkbox"
                        checked={chosen.includes(a.reservation_id)}
                        onChange={(e) =>
                          setChosen((prev) =>
                            e.target.checked
                              ? [...prev, a.reservation_id]
                              : prev.filter((id) => id !== a.reservation_id),
                          )
                        }
                      />
                      {a.name} · {tr("Booking #")}
                      {a.reservation_id}
                    </label>
                  ))}
                  <label className="core-consent">
                    <input type="checkbox" required />
                    {tr(
                      "I understand this records synthetic attendance for the fictional demo.",
                    )}
                  </label>
                  <button
                    className="button primary"
                    disabled={mutation.busy || !chosen.length}
                  >
                    {tr("Propose synthetic attendance")}
                  </button>
                </form>
              ) : (
                <p>{tr("No confirmed bookings yet.")}</p>
              )
            }
          </RemoteContent>
        </>
      )}
    </div>
  );
}

export function LearnerAttendance() {
  const { user, version } = useDemo();
  const remote = useRemote<Attendance[]>(
    "/attendance/mine",
    user.id,
    version,
    user.role !== "professor",
  );
  if (user.role === "professor") return null;
  return (
    <RemoteContent remote={remote}>
      {(data) =>
        data.length ? (
          <section className="core-stack">
            <h2>{tr("Attendance and reflection")}</h2>
            {data.map((a) => (
              <LearnerRecord
                key={`${user.id}-${a.booking_id}`}
                attendance={a}
              />
            ))}
          </section>
        ) : null
      }
    </RemoteContent>
  );
}
function LearnerRecord({ attendance: a }: { attendance: Attendance }) {
  const { user } = useDemo();
  const mutation = useMutation();
  const eligible =
    a.booking_status === "confirmed" && a.session_status !== "cancelled";
  return (
    <article className="form-panel">
      <h3>{a.title}</h3>
      <p>
        {tr(
          "Synthetic demonstration attendance. Separate from Learning Check simulation.",
        )}
      </p>
      {mutation.feedback}
      {!eligible ? (
        <p>
          {tr(
            "This booking or session was cancelled. Attendance and feedback are closed.",
          )}
        </p>
      ) : !a.confirmed_at ? (
        <form
          className="connected-form"
          onSubmit={(e) => {
            e.preventDefault();
            void mutation.run(
              () =>
                request(
                  `/bookings/${a.booking_id}/confirm-synthetic-attendance`,
                  user.id,
                  {
                    method: "POST",
                    body: JSON.stringify({ synthetic_confirmed: true }),
                  },
                ),
              tr(
                "Synthetic attendance confirmed. You can now reflect on the session.",
              ),
            );
          }}
        >
          <label className="core-consent">
            <input type="checkbox" required />
            {tr(
              "I confirm my fictional participation in this synthetic demonstration.",
            )}
          </label>
          <button className="button primary" disabled={mutation.busy}>
            {tr("Confirm my synthetic attendance")}
          </button>
        </form>
      ) : a.feedback ? (
        <p className="success-note">
          {tr(
            "Your constructive feedback is saved. Your private comment is visible only to you.",
          )}
        </p>
      ) : (
        <form
          className="connected-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void mutation.run(
              () =>
                request(`/bookings/${a.booking_id}/feedback`, user.id, {
                  method: "POST",
                  body: JSON.stringify({
                    clarity: Number(form.get("clarity")),
                    preparation: Number(form.get("preparation")),
                    atmosphere: Number(form.get("atmosphere")),
                    comment: form.get("comment"),
                  }),
                }),
              tr("Thank you. Your feedback has been saved."),
            );
          }}
        >
          <p>
            {tr(
              "Reflect on the teaching experience. Feedback is not evidence of academic improvement and never changes contribution points.",
            )}
          </p>
          <div className="form-grid">
            {[
              ["clarity", "Clarity of explanations"],
              ["preparation", "Preparation and organization"],
              ["atmosphere", "Supportive learning atmosphere"],
            ].map(([key, label]) => (
              <label key={key}>
                {tr(label)}
                <select
                  name={key}
                  aria-label={tr(label)}
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    {tr("Choose a response")}
                  </option>
                  <option value="1">{tr("Could be improved")}</option>
                  <option value="2">{tr("Helpful")}</option>
                  <option value="3">{tr("Very helpful")}</option>
                </select>
              </label>
            ))}
          </div>
          <label>
            {tr("Optional private reflection")}
            <textarea name="comment" maxLength={1000} rows={2} />
          </label>
          <p className="fine-print">
            {tr(
              "Private comments stay with you. Tutors see summaries only after at least three distinct learners; this illustrative threshold is not production privacy protection.",
            )}
          </p>
          <button className="button primary" disabled={mutation.busy}>
            {tr("Send constructive feedback")}
          </button>
        </form>
      )}
    </article>
  );
}
const names: Record<string, string> = {
  clarity: "Clear communication",
  preparation: "Preparation and organization",
  atmosphere: "Supportive teaching",
};
export function ContributionPortfolio() {
  const { user, version } = useDemo();
  const remote = useRemote<PortfolioData>(
    "/portfolio",
    user.id,
    version,
    user.role !== "professor",
  );
  if (user.role === "professor") return null;
  return (
    <RemoteContent remote={remote}>
      {(data) => (
        <section
          className="core-stack"
          aria-label={tr("Private competency portfolio")}
        >
          <h2>{tr("Private competency portfolio")}</h2>
          <p>
            {tr(
              "A record of contribution and experience, with suggested strengths kept separate from formally certified competencies.",
            )}
          </p>
          <div className="stats-grid">
            <article>
              <span>{tr("Contribution points")}</span>
              <strong>{data.points}</strong>
              <p>{tr("Stored contribution ledger")}</p>
            </article>
            <article>
              <span>{tr("Documented sessions")}</span>
              <strong>{data.confirmed_sessions}</strong>
              <p>{tr("Includes labeled synthetic history")}</p>
            </article>
            <article>
              <span>{tr("Documented teaching hours")}</span>
              <strong>{(data.teaching_minutes / 60).toFixed(1)}</strong>
              <p>
                {data.learners_supported === 1
                  ? tr("1 learner confirmed synthetic attendance")
                  : tr(
                      "{{0}} distinct learners confirmed synthetic attendance",
                      {
                        0: data.learners_supported,
                      },
                    )}
              </p>
            </article>
          </div>
          <section className="form-panel">
            <h3>{tr("Verified activity and its limits")}</h3>
            <p>
              {tr(
                "Subject authorization is recorded by a professor or the original fictional seed. Attendance is synthetic; independently verified sessions: {{0}}.",
                { 0: data.independently_verified_sessions },
              )}
            </p>
            <p>
              {tr("Approved tutoring subjects")}:{" "}
              {data.approved_subjects.map((s) => tr(s.name)).join(", ") ||
                tr("None yet")}
            </p>
            <h3>{tr("Documented experience")}</h3>
            <p>
              {data.topics.map((t) => tr(t.name)).join(", ") ||
                tr("Confirmed teaching topics will appear here.")}
            </p>
            <h3>{tr("Suggested strengths")}</h3>
            <p>
              {data.suggested_strengths.map((s) => tr(names[s])).join(", ") ||
                tr("More feedback is needed before suggesting strengths.")}
            </p>
            <h3>{tr("Constructive feedback summary")}</h3>
            {data.feedback_summary ? (
              <ul>
                {Object.entries(data.feedback_summary).map(([key, value]) => (
                  <li key={key}>
                    {tr(names[key])}: {value}/3
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {tr(
                  "Summaries require at least {{0}} distinct learners. Individual ratings and private comments are hidden.",
                  { 0: data.feedback_minimum },
                )}
              </p>
            )}
            <h3>{tr("Personal teaching milestones")}</h3>
            <p>
              {data.milestones
                .map((n) =>
                  n === 1
                    ? tr("First documented session")
                    : tr("{{0}} documented sessions", { 0: n }),
                )
                .join(" · ") ||
                tr("Your first documented contribution is ahead.")}
            </p>
            <p className="fine-print">
              {tr(
                "No public rankings, monetary value, academic credit, certificate or university endorsement.",
              )}
            </p>
          </section>
          <section className="form-panel">
            <h3>{tr("Contribution history")}</h3>
            {data.entries.length ? (
              <ul>
                {data.entries.map((e) => (
                  <li key={e.id}>
                    <strong>{e.title}</strong> · +{e.points} ·{" "}
                    {tr(
                      e.provenance === "legacy-synthetic-history"
                        ? "Original synthetic history"
                        : "Two-party synthetic confirmation",
                    )}{" "}
                    · {dateLabel(e.created_at)} · {tr("Session")} #
                    {e.session_id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {tr(
                  "A completed session with host and learner confirmation creates one contribution entry.",
                )}
              </p>
            )}
          </section>
        </section>
      )}
    </RemoteContent>
  );
}

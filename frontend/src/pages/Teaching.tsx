import { FlowSteps } from "../components/ExperienceUI";
import { SyntheticAttendance } from "../components/CoreExperience";
import { t as tr } from "../lib/i18n";
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import {
  EventForm,
  ConfirmButton,
  RemoteContent,
  useMutation,
} from "../components/ConnectedUI";
import { EmptyState } from "../components/ui";
import { useDemo } from "../lib/demo";
import { request, useRemote, dateLabel, timeLabel } from "../lib/api";
import type { Session, Topic, TutorOverview } from "../lib/types";
export function Teaching({
  initialCreate = false,
}: {
  initialCreate?: boolean;
}) {
  const navigate = useNavigate();
  const { user, version } = useDemo();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Session | null>(null);
  const mutation = useMutation();
  const tutor = useRemote<TutorOverview>(
    "/tutor/overview",
    user.id,
    version,
    user.role !== "professor",
  );
  const records = useRemote<(Session & { attendance_proposed: boolean })[]>(
    "/teaching/records",
    user.id,
    version,
    user.role !== "professor",
  );
  const topics = useRemote<Topic[]>("/learning/topics");
  if (user.role === "professor")
    return (
      <EmptyState title={tr("An approved subject is the starting point.")}>
        <Link className="text-link" to="/app">
          {tr("Back to my workspace")}
        </Link>
      </EmptyState>
    );
  const show = initialCreate || params.get("create") === "true" || !!editing;
  const closeForm = () => {
    setEditing(null);
    setParams({});
    if (initialCreate) navigate("/app/teaching");
  };
  const allowed =
    topics.data?.filter((t) =>
      tutor.data?.approved_subjects.some((s) => s.id === t.subject_id),
    ) ?? [];
  return (
    <>
      <PageTitle
        eyebrow={tr("MY TEACHING")}
        title={tr("Make space for someone’s next breakthrough.")}
        description={tr(
          "Publish free tutoring in your approved subjects. You can still find support for your own learning.",
        )}
      >
        <button
          className="button primary"
          onClick={() => {
            setEditing(null);
            setParams({ create: "true" });
          }}
        >
          <Plus size={17} />
          {tr("Create a session")}
        </button>
      </PageTitle>
      <FlowSteps
        label="Synthetic attendance pathway"
        steps={[
          "Session published",
          "Learner booked",
          "Tutor proposes attendance",
          "Learner confirms",
          "Contribution recorded",
        ]}
      />
      <p className="fine-print">
        {tr(
          "Process guide only. A booking is not attendance; recognition follows two-party synthetic confirmation.",
        )}
      </p>
      {mutation.feedback}
      {tutor.data && (
        <div className="teaching-subjects">
          <h2>{tr("Your approved subjects")}</h2>
          <div className="chip-list">
            {tutor.data.approved_subjects.map((subject) => (
              <span className="pill sage" key={subject.id}>
                {tr(subject.name)}
              </span>
            ))}
            {!tutor.data.approved_subjects.length && (
              <p>{tr("Apply for subject approval before publishing.")}</p>
            )}
          </div>
        </div>
      )}
      <p>
        <Link
          className="button secondary application-link"
          to="/app/applications"
        >
          {tr("Apply for subject approval or view your applications")}
        </Link>
      </p>
      {show && (
        <section className="form-panel">
          <h2>
            {editing
              ? tr("Edit your tutoring session")
              : tr("Publish a tutoring session")}
          </h2>
          <p className="fine-print">
            {tr(
              "With bookings, only text, objectives and increased capacity may change. Cancellation releases all reservations and remains visible in booking history.",
            )}
          </p>
          {allowed.length ? (
            <EventForm
              key={editing?.id ?? "new"}
              topics={allowed}
              initial={
                editing
                  ? {
                      ...editing,
                      topic_id: editing.topics?.[0]?.id ?? allowed[0]?.id ?? 0,
                      format: editing.format as "Online" | "In person",
                    }
                  : undefined
              }
              session
              busy={mutation.busy}
              onCancel={closeForm}
              onSave={async (value) => {
                const result = await mutation.run(
                  () =>
                    request(
                      editing ? `/sessions/${editing.id}` : "/sessions",
                      user.id,
                      {
                        method: editing ? "PUT" : "POST",
                        body: JSON.stringify(value),
                      },
                    ),
                  tr(
                    "Your tutoring session is saved and visible in the catalog.",
                  ),
                );
                if (result) closeForm();
              }}
            />
          ) : (
            <p>
              {tutor.loading
                ? tr("Loading your approved topics…")
                : tr("Apply for subject approval before publishing.")}
            </p>
          )}
        </section>
      )}

      <RemoteContent remote={tutor}>
        {(data) =>
          data.sessions.length ? (
            <div className="teaching-list">
              {data.sessions.map((s) => (
                <article className="teaching-management" key={s.id}>
                  <div>
                    <span className="eyebrow">
                      {tr(s.subject.name)} ·{" "}
                      {s.kind === "faculty"
                        ? tr("Faculty-organized synthetic support")
                        : tr("Peer tutoring")}
                    </span>
                    <h2>{s.title}</h2>
                    <span className="pill neutral">
                      {tr(
                        records.data?.find((record) => record.id === s.id)
                          ?.attendance_proposed
                          ? "Waiting for learner confirmation"
                          : s.booked_seats > 0
                            ? "Learner booked"
                            : "Session published",
                      )}
                    </span>
                    <p>
                      {dateLabel(s.starts_at)} · {timeLabel(s.starts_at)} ·{" "}
                      {s.duration_minutes}
                      {tr(" min")}
                    </p>
                    <p>
                      {s.booked_seats}/{s.capacity}
                      {tr(" booked · ")}
                      {s.location}
                    </p>
                  </div>
                  <div className="action-row">
                    {s.kind !== "faculty" && (
                      <>
                        <button
                          className="button secondary small"
                          onClick={() => {
                            setEditing(s);
                            setParams({});
                          }}
                        >
                          {tr("Edit session")}
                        </button>
                        <ConfirmButton
                          disabled={mutation.busy}
                          onConfirm={() =>
                            void mutation.run(
                              () =>
                                request(`/sessions/${s.id}/cancel`, user.id, {
                                  method: "POST",
                                }),
                              tr(
                                "Session cancelled. All confirmed reservations have been cancelled.",
                              ),
                            )
                          }
                        >
                          {tr("Cancel session")}
                        </ConfirmButton>
                      </>
                    )}
                    <Attendees sessionId={s.id} />
                    <SyntheticAttendance
                      sessionId={s.id}
                      proposed={
                        records.data?.find((r) => r.id === s.id)
                          ?.attendance_proposed ?? false
                      }
                    />
                  </div>
                  {s.kind === "faculty" && (
                    <small>
                      {tr(
                        "Organized by faculty. The professor manages changes to this offering.",
                      )}
                    </small>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={tr("Your next teaching opportunity starts here.")}
            >
              {tr("Create a session in one of your approved subjects.")}
            </EmptyState>
          )
        }
      </RemoteContent>
      <RemoteContent remote={records}>
        {(data) => (
          <section className="core-stack">
            <h2>{tr("Teaching history")}</h2>
            {data
              .filter((s) => s.status !== "upcoming")
              .map((s) => (
                <article className="form-panel" key={s.id}>
                  <span className="pill neutral">
                    {tr(s.status === "completed" ? "Completed" : "Cancelled")}
                  </span>
                  <h3>{s.title}</h3>
                  <p>
                    {dateLabel(s.starts_at)} · {s.duration_minutes} {tr("min")}
                  </p>
                  <p>
                    {tr(
                      s.status === "cancelled"
                        ? "Cancelled session — no contribution awarded"
                        : s.attendance_proposed
                          ? "Two-party synthetic confirmation"
                          : "Original synthetic history",
                    )}
                  </p>
                  <Link className="text-link" to="/app/impact">
                    {tr("View private portfolio")}
                  </Link>
                </article>
              ))}
          </section>
        )}
      </RemoteContent>
    </>
  );
}
function Attendees({ sessionId }: { sessionId: number }) {
  const { user, version } = useDemo();
  const [open, setOpen] = useState(false);
  const remote = useRemote<
    { id: number; name: string; reservation_id: number }[]
  >(`/sessions/${sessionId}/attendees`, user.id, version, open);
  return (
    <div className="attendance-panel">
      <button
        className="button secondary small"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? tr("Hide attendees") : tr("View bookings")}
      </button>
      {open && (
        <RemoteContent remote={remote}>
          {(data) =>
            data.length ? (
              <ul>
                {data.map((a) => (
                  <li key={a.reservation_id}>
                    {a.name}
                    {tr(" · reservation #")}
                    {a.reservation_id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{tr("No confirmed bookings yet.")}</p>
            )
          }
        </RemoteContent>
      )}
    </div>
  );
}

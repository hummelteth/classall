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
    user.role === "tutor",
  );
  const topics = useRemote<Topic[]>("/learning/topics");
  if (user.role !== "tutor")
    return (
      <EmptyState title="An approved subject is the starting point.">
        <Link className="text-link" to="/app">
          Back to my workspace
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
        eyebrow="MY TEACHING"
        title="Make space for someone’s next breakthrough."
        description="Publish free tutoring in your approved subjects. You can still find support for your own learning."
      >
        <button
          className="button primary"
          onClick={() => {
            setEditing(null);
            setParams({ create: "true" });
          }}
        >
          <Plus size={17} />
          Create a session
        </button>
      </PageTitle>
      {mutation.feedback}
      {show && (
        <section className="form-panel">
          <h2>
            {editing
              ? "Edit your tutoring session"
              : "Publish a tutoring session"}
          </h2>
          <p className="fine-print">
            With bookings, only text, objectives and increased capacity may
            change. Cancellation releases all reservations and remains visible
            in booking history.
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
                  "Your tutoring session is saved and visible in the catalog.",
                );
                if (result) closeForm();
              }}
            />
          ) : (
            <p>Loading your approved topics…</p>
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
                      {s.subject.name} ·{" "}
                      {s.kind === "faculty"
                        ? "Faculty-organized synthetic support"
                        : "Peer tutoring"}
                    </span>
                    <h2>{s.title}</h2>
                    <p>
                      {dateLabel(s.starts_at)} · {timeLabel(s.starts_at)} ·{" "}
                      {s.duration_minutes} min
                    </p>
                    <p>
                      {s.booked_seats}/{s.capacity} booked · {s.location}
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
                          Edit session
                        </button>
                        <ConfirmButton
                          disabled={mutation.busy}
                          onConfirm={() =>
                            void mutation.run(
                              () =>
                                request(`/sessions/${s.id}/cancel`, user.id, {
                                  method: "POST",
                                }),
                              "Session cancelled. All confirmed reservations have been cancelled.",
                            )
                          }
                        >
                          Cancel session
                        </ConfirmButton>
                      </>
                    )}
                    <Attendees sessionId={s.id} />
                  </div>
                  {s.kind === "faculty" && (
                    <small>
                      Organized by faculty. The professor manages changes to
                      this offering.
                    </small>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Your next teaching opportunity starts here.">
              Create a session in one of your approved subjects.
            </EmptyState>
          )
        }
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
        className="text-link"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide attendees" : "View bookings"}
      </button>
      {open && (
        <RemoteContent remote={remote}>
          {(data) =>
            data.length ? (
              <ul>
                {data.map((a) => (
                  <li key={a.reservation_id}>
                    {a.name} · reservation #{a.reservation_id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No confirmed bookings yet.</p>
            )
          }
        </RemoteContent>
      )}
    </div>
  );
}

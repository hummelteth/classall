import { t as tr } from "../lib/i18n";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Users, Plus, MapPin } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import {
  ConfirmButton,
  EventForm,
  RemoteContent,
  useMutation,
} from "../components/ConnectedUI";
import { EmptyState } from "../components/ui";
import { useDemo } from "../lib/demo";
import { request, useRemote, dateLabel, timeLabel } from "../lib/api";
import type { StudyGroup, Topic, Subject } from "../lib/types";

export function Groups() {
  const { user, version } = useDemo();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<StudyGroup | "new" | null>(null);
  const mutation = useMutation();
  const query = new URLSearchParams(params);
  const mine = params.get("mine") === "true";
  const groups = useRemote<StudyGroup[]>(
    `/groups?${query}`,
    user.id,
    version,
    user.role !== "professor",
  );
  const topics = useRemote<Topic[]>("/learning/topics");
  const subjects = useRemote<Subject[]>("/subjects");
  if (user.role === "professor")
    return (
      <EmptyState title={tr("Student-organized learning")}>
        <Link className="text-link" to="/app/actions">
          {tr("Review course support actions")}
        </Link>
      </EmptyState>
    );
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "subject_id") next.delete("topic_id");
    setParams(next);
  };
  const operation = async (gid: number, op: string) => {
    await mutation.run(
      () => request(`/groups/${gid}/${op}`, user.id, { method: "POST" }),
      op === "join"
        ? tr("You have a place. Bring your questions!")
        : op === "leave"
          ? tr("You left the group. Your place is available again.")
          : tr("Group cancelled. Members will see the change in their groups."),
    );
  };
  return (
    <>
      <PageTitle
        eyebrow={tr("LEARN WITH YOUR PEOPLE")}
        title={tr("Different perspectives. Shared progress.")}
        description={tr(
          "Student-organized study circles. Everyone can contribute; no tutor approval needed.",
        )}
      >
        <button className="button primary" onClick={() => setEditing("new")}>
          <Plus size={17} />
          {tr("Create a study group")}
        </button>
      </PageTitle>
      <div className="connected-intro">
        <Users size={25} />
        <p>
          {tr(
            "Study groups are collaborative peer activities, separate from approved tutoring. Online groups use a demo discussion format with no live meeting integration.",
          )}
        </p>
      </div>
      {mutation.feedback}
      {editing && (
        <section className="form-panel">
          <h2>
            {editing === "new"
              ? tr("Start a study circle")
              : tr("Edit your group")}
          </h2>
          <p className="fine-print">
            {tr(
              "Once others join, only title, description and capacity can change. The creator holds one place.",
            )}
          </p>
          <RemoteContent remote={topics}>
            {(data) => (
              <EventForm
                topics={data}
                initial={editing === "new" ? undefined : editing}
                busy={mutation.busy}
                onCancel={() => setEditing(null)}
                submitLabel={
                  editing === "new"
                    ? tr("Publish study group")
                    : tr("Save group")
                }
                onSave={async (value) => {
                  const { goals: _, ...body } = value;
                  const result = await mutation.run(
                    () =>
                      request(
                        editing === "new" ? "/groups" : `/groups/${editing.id}`,
                        user.id,
                        {
                          method: editing === "new" ? "POST" : "PUT",
                          body: JSON.stringify(body),
                        },
                      ),
                    tr("Your study group is saved."),
                  );
                  if (result) setEditing(null);
                }}
              />
            )}
          </RemoteContent>
        </section>
      )}
      <div className="tab-list">
        <button
          className={!mine ? "active" : ""}
          onClick={() => filter("mine", "")}
        >
          {tr("Explore groups")}
        </button>
        <button
          className={mine ? "active" : ""}
          onClick={() => filter("mine", "true")}
        >
          {tr("My groups")}
        </button>
      </div>
      <div className="connected-filters">
        <label>
          {tr("Subject")}
          <select
            value={params.get("subject_id") ?? ""}
            onChange={(e) => filter("subject_id", e.target.value)}
          >
            <option value="">{tr("All subjects")}</option>
            {subjects.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {tr(s.name)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr("Topic")}
          <select
            value={params.get("topic_id") ?? ""}
            onChange={(e) => filter("topic_id", e.target.value)}
          >
            <option value="">{tr("All topics")}</option>
            {topics.data
              ?.filter(
                (t) =>
                  !params.get("subject_id") ||
                  String(t.subject_id) === params.get("subject_id"),
              )
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {tr(t.name)}
                </option>
              ))}
          </select>
        </label>
        <label>
          {tr("Date (UTC)")}
          <input
            type="date"
            value={params.get("date") ?? ""}
            onChange={(e) => filter("date", e.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={params.get("available") === "true"}
            onChange={(e) =>
              filter("available", e.target.checked ? "true" : "")
            }
          />
          {tr("Places available")}
        </label>
        <button
          className="text-link"
          onClick={() => setParams(mine ? { mine: "true" } : {})}
        >
          {tr("Clear filters")}
        </button>
      </div>
      <RemoteContent remote={groups}>
        {(data) =>
          data.length ? (
            <div className="group-grid">
              {data.map((g) => (
                <article className="group-card" key={g.id}>
                  <div className="card-meta">
                    <span className="eyebrow">{g.subject_name}</span>
                    <span className="pill neutral">
                      {g.source === "seeded-synthetic"
                        ? tr("Synthetic example")
                        : tr("Demo interaction")}
                    </span>
                  </div>
                  <h2>{g.title}</h2>
                  <span className="topic-label">{g.topic_name}</span>
                  <p>{g.description}</p>
                  <div className="group-details">
                    <span>
                      <CalendarDays size={16} />
                      {dateLabel(g.starts_at)} · {timeLabel(g.starts_at)} ·{" "}
                      {g.duration_minutes}
                      {tr(" min")}
                    </span>
                    <span>
                      <MapPin size={16} />
                      {g.location}
                    </span>
                    <span>
                      <Users size={16} />
                      {g.available_places}
                      {tr(" places available · ")}
                      {g.member_count}/{g.capacity}
                      {tr(" joined")}
                    </span>
                  </div>
                  {g.status === "cancelled" ? (
                    <p className="pill neutral">
                      {tr("Cancelled · no longer meeting")}
                    </p>
                  ) : new Date(g.starts_at) <= new Date() ? (
                    <p>{tr("Past study group")}</p>
                  ) : (
                    <div className="action-row">
                      {g.creator_id === user.id ? (
                        <>
                          <span className="pill sage">
                            {tr("You organize this")}
                          </span>
                          <button
                            className="button secondary small"
                            onClick={() => setEditing(g)}
                          >
                            {tr("Edit group")}
                          </button>
                          <ConfirmButton
                            disabled={mutation.busy}
                            onConfirm={() => void operation(g.id, "cancel")}
                          >
                            {tr("Cancel group")}
                          </ConfirmButton>
                        </>
                      ) : g.joined ? (
                        <>
                          <span className="pill sage">{tr("You're in")}</span>
                          <button
                            disabled={mutation.busy}
                            className="button secondary small"
                            onClick={() => void operation(g.id, "leave")}
                          >
                            {tr("Leave group")}
                          </button>
                        </>
                      ) : (
                        <button
                          className="button primary small"
                          disabled={!g.available_places || mutation.busy}
                          onClick={() => void operation(g.id, "join")}
                        >
                          {g.available_places
                            ? tr("Join group")
                            : tr("Group full")}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={tr("Make a little space for learning.")}>
              {tr(
                "No groups match these filters. Clear them or start a new circle.",
              )}
            </EmptyState>
          )
        }
      </RemoteContent>
    </>
  );
}

import { useState } from "react";
import type { ReactNode } from "react";
import { useDemo } from "../lib/demo";
import { useRemote } from "../lib/api";
import { ErrorState, Loading } from "./ui";
import type { EventData, Topic, Subject } from "../lib/types";

export function useMutation() {
  const { refresh } = useDemo();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function run<T>(
    action: () => Promise<T>,
    success: string,
  ): Promise<T | undefined> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      setMessage(success);
      refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    message,
    run,
    feedback: (
      <>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="success-note">
            {message}
          </p>
        )}
      </>
    ),
  };
}

export function ConfirmButton({
  children,
  onConfirm,
  disabled = false,
}: {
  children: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <span className="action-row">
      <span>Confirm cancellation?</span>
      <button
        className="button secondary small"
        disabled={disabled}
        onClick={() => {
          onConfirm();
          setConfirm(false);
        }}
      >
        Yes, cancel
      </button>
      <button className="text-link" onClick={() => setConfirm(false)}>
        Keep it
      </button>
    </span>
  ) : (
    <button
      className="text-link"
      disabled={disabled}
      onClick={() => setConfirm(true)}
    >
      {children}
    </button>
  );
}

export function TopicSelect({
  topics,
  value,
  onChange,
}: {
  topics: Topic[];
  value: number;
  onChange: (id: number) => void;
}) {
  const subjects = useRemote<Subject[]>("/subjects");
  const selected = topics.find((t) => t.id === value);
  const subjectIds = [...new Set(topics.map((t) => t.subject_id))];
  return (
    <div className="form-grid">
      <label>
        Course
        <select
          value={selected?.subject_id ?? ""}
          required
          onChange={(e) =>
            onChange(
              topics.find((t) => t.subject_id === Number(e.target.value))?.id ??
                0,
            )
          }
        >
          <option value="" disabled>
            Choose a course
          </option>
          {subjectIds.map((id) => (
            <option value={id} key={id}>
              {subjects.data?.find((s) => s.id === id)?.name ?? `Course ${id}`}
            </option>
          ))}
        </select>
      </label>
      <label>
        Topic
        <select
          value={value || ""}
          required
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <option value="" disabled>
            Choose a topic
          </option>
          {topics
            .filter((t) => !selected || t.subject_id === selected.subject_id)
            .map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}

export function EventForm({
  topics,
  initial,
  onSave,
  onCancel,
  busy,
  session = false,
  submitLabel = "Publish",
  children,
}: {
  topics: Topic[];
  initial?: EventData & { goals?: string[] };
  onSave: (value: EventData & { goals: string[] }) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
  session?: boolean;
  submitLabel?: string;
  children?: ReactNode;
}) {
  const [tid, setTid] = useState(initial?.topic_id ?? topics[0]?.id ?? 0);
  const localValue = (value: string) => {
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  return (
    <form
      className="connected-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        await onSave({
          topic_id: tid,
          title: String(data.get("title")).trim(),
          description: String(data.get("description")).trim(),
          starts_at: new Date(String(data.get("starts_at"))).toISOString(),
          duration_minutes: Number(data.get("duration")),
          capacity: Number(data.get("capacity")),
          format: data.get("format") as EventData["format"],
          location: String(data.get("location") ?? "").trim(),
          goals: String(data.get("goals") ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
    >
      <TopicSelect topics={topics} value={tid} onChange={setTid} />
      <label>
        Title
        <input
          name="title"
          required
          minLength={5}
          maxLength={120}
          defaultValue={initial?.title}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={1500}
          rows={3}
          defaultValue={initial?.description}
        />
      </label>
      {session && (
        <label>
          Learning objectives <small>One per line; up to five.</small>
          <textarea
            name="goals"
            required
            maxLength={1200}
            rows={3}
            defaultValue={initial?.goals?.join("\n")}
          />
        </label>
      )}
      <div className="form-grid">
        <label>
          Date and time{" "}
          <small>{Intl.DateTimeFormat().resolvedOptions().timeZone}</small>
          <input
            type="datetime-local"
            name="starts_at"
            required
            min={localValue(new Date(Date.now() + 60000).toISOString())}
            defaultValue={initial ? localValue(initial.starts_at) : ""}
          />
        </label>
        <label>
          Duration (minutes)
          <input
            type="number"
            name="duration"
            min={15}
            max={240}
            required
            defaultValue={initial?.duration_minutes ?? 60}
          />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Maximum participants
          <input
            type="number"
            name="capacity"
            min={2}
            max={50}
            required
            defaultValue={initial?.capacity ?? 6}
          />
        </label>
        <label>
          Format
          <select name="format" defaultValue={initial?.format ?? "In person"}>
            <option>In person</option>
            <option>Online</option>
          </select>
        </label>
      </div>
      <label>
        Location{" "}
        <small>
          Required in person. Online is a demo format without a meeting service.
        </small>
        <input
          name="location"
          maxLength={180}
          defaultValue={initial?.format === "In person" ? initial.location : ""}
        />
      </label>
      {children}
      <div className="action-row">
        <button className="button primary" disabled={busy || !tid}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Close form
        </button>
      </div>
    </form>
  );
}

export function RemoteContent<T>({
  remote,
  children,
}: {
  remote: {
    loading: boolean;
    error: string;
    data: T | null;
    retry: () => void;
  };
  children: (data: T) => ReactNode;
}) {
  return remote.loading ? (
    <Loading label="Loading your learning space" />
  ) : remote.error ? (
    <ErrorState message={remote.error} retry={remote.retry} />
  ) : remote.data ? (
    children(remote.data)
  ) : null;
}

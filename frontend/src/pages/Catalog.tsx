import { t as tr } from "../lib/i18n";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
  ChevronDown,
  HeartHandshake,
  Layers3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { useBookings } from "../lib/bookings";
import { SessionCollection } from "../components/SessionCollection";
import { useDemo } from "../lib/demo";
import { timezoneLabel, useRemote } from "../lib/api";
import { EmptyState, ErrorState, Loading } from "../components/ui";
import type { Session, Subject } from "../lib/types";

export function Catalog() {
  const { version } = useDemo();
  const [searchParams, setSearchParams] = useSearchParams();
  const topicId = searchParams.get("topic");
  const subject = searchParams.get("subject") ?? "";
  const setSubject = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("topic");
    if (value) next.set("subject", value);
    else next.delete("subject");
    setSearchParams(next);
  };
  const [query, setQuery] = useState("");
  const [delivery, setDelivery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState("soonest");
  const subjects = useRemote<Subject[]>("/subjects");
  const params = new URLSearchParams();
  if (subject) params.set("subject_id", subject);
  if (topicId) params.set("topic_id", topicId);
  if (delivery) params.set("delivery", delivery);
  const sessions = useRemote<Session[]>(
    `/sessions?${params}`,
    undefined,
    version,
  );
  const bookings = useBookings();
  const filtered = (sessions.data ?? [])
    .filter(
      (s) =>
        (!availableOnly || s.available_seats > 0) &&
        (!topicId || s.topics?.some((t) => t.id === Number(topicId))) &&
        `${s.title} ${s.description} ${s.subject.name} ${s.tutor.name}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "seats"
        ? b.available_seats - a.available_seats
        : new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const reset = () => {
    setSubject("");
    setQuery("");
    setDelivery("");
    setAvailableOnly(false);
    setSort("soonest");
  };
  return (
    <>
      <PageTitle
        eyebrow={tr("A LITTLE HELP GOES A LONG WAY")}
        title={tr("Find your next breakthrough.")}
        description={tr(
          "Learn from someone who’s been there. All sessions are free, always.",
        )}
      />
      <div className="catalog-intro">
        <div className="catalog-intro-icon">
          <HeartHandshake size={25} />
        </div>
        <p>
          <strong>{tr("Peer support, with a human touch.")}</strong>
          <span>
            {tr(
              "Small groups. Course-focused topics. Space for every question.",
            )}
          </span>
        </p>
        <span className="pill approved-pill">
          <ShieldCheck size={14} />
          {tr("Subject-approved demo tutors")}
        </span>
      </div>
      {topicId && (
        <div className="action-row">
          <span className="pill neutral">
            {tr("Showing your selected topic")}
          </span>
          <button
            className="text-link"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("topic");
              setSearchParams(next);
            }}
          >
            {tr("Show all topics")}
          </button>
          <Link className="text-link" to={`/app/pulse?topic=${topicId}`}>
            {tr("Request more support for this topic")}
          </Link>
        </div>
      )}
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label={tr("Search tutoring sessions")}
            placeholder={tr("Try a subject, topic or tutor…")}
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label={tr("Clear search")}
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="select-field">
          <SlidersHorizontal size={16} />
          <select
            aria-label={tr("Session format")}
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          >
            <option value="">{tr("All formats")}</option>
            <option value="In person">{tr("In person")}</option>
            <option value="Online">{tr("Online")}</option>
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      <div
        className="filter-chips"
        role="group"
        aria-label={tr("Filter by subject")}
      >
        <button
          className={`filter-chip ${!subject ? "selected" : ""}`}
          aria-pressed={!subject}
          onClick={() => setSubject("")}
        >
          <Layers3 size={14} />
          {tr("All subjects")}
        </button>
        {subjects.data?.map((s) => (
          <button
            key={s.id}
            aria-pressed={subject === String(s.id)}
            className={`filter-chip ${subject === String(s.id) ? "selected" : ""}`}
            onClick={() => setSubject(String(s.id))}
          >
            {tr(s.name)}
          </button>
        ))}
      </div>
      {subjects.error && (
        <ErrorState message={subjects.error} retry={subjects.retry} />
      )}
      <div className="catalog-results">
        <span>
          <strong>{sessions.loading ? "…" : filtered.length}</strong>{" "}
          {filtered.length === 1 ? tr("session") : tr("sessions")}
          {tr(" to explore")} <span className="results-dot">·</span>{" "}
          <small>
            {tr("Times in ")}
            {timezoneLabel}
          </small>
        </span>
        <div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            {tr("Open spots only")}
          </label>
          <label className="sort-label">
            {tr("Sort by")}
            <select
              aria-label={tr("Sort sessions")}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="soonest">{tr("Soonest first")}</option>
              <option value="seats">{tr("Most open spots")}</option>
            </select>
          </label>
        </div>
      </div>
      {bookings.error && (
        <ErrorState message={bookings.error} retry={bookings.retry} />
      )}
      {sessions.loading ? (
        <Loading />
      ) : sessions.error ? (
        <ErrorState message={sessions.error} retry={sessions.retry} />
      ) : filtered.length ? (
        <SessionCollection sessions={filtered} bookings={bookings.data ?? []} />
      ) : (
        <EmptyState
          title={tr("Let’s try a different direction.")}
          action={
            <button className="button secondary" onClick={reset}>
              {tr("Clear all filters")}
            </button>
          }
        >
          {tr("No sessions match these filters. Try another topic or format.")}
        </EmptyState>
      )}
      <div className="catalog-footer-note">
        <ShieldCheck size={18} />
        <p>
          {tr(
            "Tutor approvals are part of the synthetic dataset. Real qualification review and AI-assisted checks are planned.",
          )}
        </p>
      </div>
    </>
  );
}

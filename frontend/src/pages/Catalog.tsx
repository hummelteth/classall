import { useSearchParams } from "react-router-dom";
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
  const subject = searchParams.get("subject") ?? "";
  const setSubject = (value: string) => {
    const next = new URLSearchParams(searchParams);
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
        eyebrow="A LITTLE HELP GOES A LONG WAY"
        title="Find your next breakthrough."
        description="Learn from someone who’s been there. All sessions are free, always."
      />
      <div className="catalog-intro">
        <div className="catalog-intro-icon">
          <HeartHandshake size={25} />
        </div>
        <p>
          <strong>Peer support, with a human touch.</strong>
          <span>
            Small groups. Course-focused topics. Space for every question.
          </span>
        </p>
        <span className="pill approved-pill">
          <ShieldCheck size={14} />
          Subject-approved demo tutors
        </span>
      </div>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Search tutoring sessions"
            placeholder="Try a subject, topic or tutor…"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="select-field">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Session format"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          >
            <option value="">All formats</option>
            <option>In person</option>
            <option>Online</option>
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      <div className="filter-chips" role="group" aria-label="Filter by subject">
        <button
          className={`filter-chip ${!subject ? "selected" : ""}`}
          aria-pressed={!subject}
          onClick={() => setSubject("")}
        >
          <Layers3 size={14} />
          All subjects
        </button>
        {subjects.data?.map((s) => (
          <button
            key={s.id}
            aria-pressed={subject === String(s.id)}
            className={`filter-chip ${subject === String(s.id) ? "selected" : ""}`}
            onClick={() => setSubject(String(s.id))}
          >
            {s.name}
          </button>
        ))}
      </div>
      {subjects.error && (
        <ErrorState message={subjects.error} retry={subjects.retry} />
      )}
      <div className="catalog-results">
        <span>
          <strong>{sessions.loading ? "…" : filtered.length}</strong>{" "}
          {filtered.length === 1 ? "session" : "sessions"} to explore{" "}
          <span className="results-dot">·</span>{" "}
          <small>Times in {timezoneLabel}</small>
        </span>
        <div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            Open spots only
          </label>
          <label className="sort-label">
            Sort by
            <select
              aria-label="Sort sessions"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="soonest">Soonest first</option>
              <option value="seats">Most open spots</option>
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
          title="Let’s try a different direction."
          action={
            <button className="button secondary" onClick={reset}>
              Clear all filters
            </button>
          }
        >
          No sessions match these filters. Try another topic or format.
        </EmptyState>
      )}
      <div className="catalog-footer-note">
        <ShieldCheck size={18} />
        <p>
          Tutor approvals are part of the synthetic dataset. Real qualification
          review and AI-assisted checks are planned.
        </p>
      </div>
    </>
  );
}

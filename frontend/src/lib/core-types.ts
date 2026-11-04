import type { Subject } from "./types";
export type Qualification = {
  topic_id: number;
  subject_id: number;
  language: string;
  source: string;
  explanation_task: string;
  rubric: Record<string, string>;
  questions: {
    id: number;
    prompt: string;
    options: string[];
    correct?: number;
    explanation?: string;
  }[];
};
export type Application = {
  id: number;
  applicant_id: number;
  applicant_name: string;
  subject_id: number;
  subject_name: string;
  topic_id: number;
  language: "en" | "es";
  status: "pending" | "changes_requested" | "approved" | "rejected";
  content: Record<string, string>;
  qualification: Qualification;
  answers: number[];
  advisory: {
    mode: string;
    criteria: Record<string, string>;
    advisory_only: boolean;
  } | null;
  reviewer_id: number | null;
  decided_at: string | null;
  comments: string;
  events: { id: number; actor_id: number; event: string; created_at: string }[];
};
export type Attendance = {
  booking_id: number;
  session_id: number;
  title: string;
  confirmed_at: string | null;
  booking_status: string;
  session_status: string;
  provenance: string;
  feedback: {
    clarity: number;
    preparation: number;
    atmosphere: number;
    comment: string;
  } | null;
};
export type PortfolioData = {
  approved_subjects: Subject[];
  points: number;
  confirmed_sessions: number;
  teaching_minutes: number;
  learners_supported: number;
  independently_verified_sessions: number;
  entries: {
    id: number;
    session_id: number;
    title: string;
    points: number;
    provenance: string;
    created_at: string;
  }[];
  topics: { id: number; name: string }[];
  milestones: number[];
  feedback_summary: Record<string, number> | null;
  feedback_minimum: number;
  suggested_strengths: string[];
};

export type Role = "learner" | "tutor" | "professor";
export interface DemoUser {
  id: number;
  name: string;
  role: Role;
  programme: string;
  initials: string;
  color: string;
  year: string;
}
export interface Subject {
  id: number;
  name: string;
  code: string;
  category: string;
  color: string;
  symbol: string;
}
export interface Session {
  id: number;
  title: string;
  description: string;
  goals: string[];
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  format: string;
  location: string;
  level: string;
  status: string;
  tutor: DemoUser;
  subject: Subject;
  booked_seats: number;
  available_seats: number;
  approved: boolean;
  learning_check_available?: boolean;
  topics?: Pick<Topic, "id" | "subject_id" | "name">[];
  kind?: "peer" | "faculty";
  organizer_id?: number | null;
  source?: string;
}
export interface Booking {
  id: number;
  status: string;
  created_at: string;
  session: Session;
}
export interface TutorOverview {
  sessions: Session[];
  completed_sessions: number;
  teaching_minutes: number;
  engagement_points: number;
  approved_subjects: Subject[];
  recognition_note: string;
}
export interface CourseInsight {
  subject: Subject;
  topics?: TopicInsight[];
  sessions: number;
  bookings: number;
  capacity: number;
  available_seats: number;
}
export interface Insights {
  courses: CourseInsight[];
  note: string;
}

export interface CheckScore {
  correct: number;
  total: number;
  percent: number;
  submitted_at: string;
}
export interface CheckState {
  status: "pending" | "locked" | "completed";
  reason: string | null;
  result: CheckScore | null;
}
export interface LearningItem {
  booking_id: number;
  session_id: number;
  title: string;
  booking_status: string;
  topics: { id: number; subject_id: number; name: string }[];
  objectives: { id: number; description: string }[];
  pre: CheckState;
  post: CheckState;
  simulated: boolean;
  change_percentage_points: number | null;
  suggestion: string;
}
export interface LearningHistory {
  items: LearningItem[];
  note: string;
}
export interface CheckPayload extends CheckState {
  booking_id: number;
  stage: "pre" | "post";
  questions: {
    id: number;
    prompt: string;
    objective_id: number;
    options: { id: number; label: string }[];
    explanation?: string;
    selected_option_id?: number;
    correct_option_id?: number;
  }[];
}
export interface AssessmentAggregate {
  n: number;
  suppressed: boolean;
  mean_percent: number | null;
}
export interface TopicInsight {
  topic: { id: number; name: string };
  confirmed_bookings: number;
  distinct_booked_learners: number;
  booked_places: number;
  available_places: number;
  capacity: number;
  pre: AssessmentAggregate;
  post: AssessmentAggregate;
  paired: {
    n: number;
    suppressed: boolean;
    pre_mean_percent: number | null;
    post_mean_percent: number | null;
    mean_change_percentage_points: number | null;
  };
  recommendation: {
    text: string;
    signals: string[];
    human_review_required: boolean;
  };
}

export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  objectives: { id: number; description: string }[];
}
export interface Pulse {
  topic_id: number;
  response: "confident" | "practice" | "support";
  updated_at: string;
  source: string;
}
export interface SupportRequest {
  id: number;
  topic_id: number;
  status: "open" | "matched" | "withdrawn";
  created_at: string;
  updated_at: string;
  source: string;
}
export interface EventData {
  topic_id: number;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  format: "Online" | "In person";
  location: string;
}
export interface StudyGroup extends EventData {
  id: number;
  creator_id: number;
  status: string;
  source: string;
  topic_name: string;
  subject_id: number;
  subject_name: string;
  member_count: number;
  available_places: number;
  joined: boolean;
}
export interface SupportSignal {
  topic: Pick<Topic, "id" | "subject_id" | "name">;
  participants: number;
  suppressed: boolean;
  distribution: Record<string, number> | null;
  open_requests: number | null;
  requests_suppressed: boolean;
  tutoring_places: number;
  study_group_places: number;
  recommendation: string;
  rule: string;
  missing_data: string;
  human_review_required: boolean;
  synthetic: boolean;
}
export interface SupportAction {
  id: number;
  professor_id: number;
  topic_id: number;
  action_type: string;
  rationale: string;
  status: string;
  created_at: string;
  follow_up_date: string | null;
  notes: string;
  evidence: SupportSignal & {
    captured_at: string;
    learning_checks?: TopicInsight;
  };
  session_id: number | null;
  topic_name: string;
  subject_name: string;
}

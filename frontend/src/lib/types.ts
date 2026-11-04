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
  sessions: number;
  bookings: number;
  capacity: number;
  available_seats: number;
}
export interface Insights {
  courses: CourseInsight[];
  note: string;
}

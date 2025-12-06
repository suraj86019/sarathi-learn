// User Types
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  school_id: string;
  school_name: string;
  profile_picture?: string;
}

export interface StudentProfile extends User {
  roll_no: string;
  class: string;
  section: string;
  udise_student_id: string;
  date_of_birth: string;
  parent_phone?: string;
}

export interface TeacherProfile extends User {
  employee_id: string;
  subject: string;
  classes_taught: string[];
}

export interface AdminProfile extends User {
  udise_code: string;
  district: string;
  state: string;
}

export interface SuperAdminProfile extends User {
  level: string;
  region: string;
  state: string;
  permissions: string[];
}

// Authentication
export interface LoginCredentials {
  identifier: string; // UDISE ID, phone, or employee ID
  password?: string;
  pin?: string;
  date_of_birth?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// AI Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens_used?: number;
}

export interface ChatSession {
  id: string;
  student_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// News & Events
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'education' | 'national' | 'motivational';
  image_url?: string;
  published_at: string;
  cached: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'speech' | 'ceremony' | 'holiday';
  date: string;
  time: string;
  live_stream_url?: string;
  is_live: boolean;
}

// Attendance
export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  marked_at: string;
}

// Schedule
export interface ClassSchedule {
  id: string;
  class_name: string;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  room?: string;
}

// Analytics
export interface StudentAnalytics {
  student_id: string;
  total_ai_sessions: number;
  total_questions_asked: number;
  attendance_percentage: number;
  active_days: number;
  subjects_explored: string[];
  last_active: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


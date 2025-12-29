/**
 * Student Dashboard Service
 * API service for student dashboard operations
 */

import api from './api';

// ============ INTERFACES ============

export interface ClassInfo {
  id: string | null;
  name: string;
  class_name: string;
  section: string;
}

export interface ParentInfo {
  name: string;
  phone: string;
  email: string;
}

export interface AIQuota {
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  udise_student_id: string;
  roll_no: string;
  class_info: ClassInfo;
  parent_info: ParentInfo;
  ai_quota: AIQuota;
  academic_year: string;
  enrollment_date: string | null;
}

export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface StudentStats {
  subjects_enrolled: number;
  pending_homework: number;
  overdue_homework: number;
  ai_quota_used: number;
  ai_quota_limit: number;
}

export interface News {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  created_by: string;
}

export interface DashboardData {
  profile: StudentProfile;
  school: SchoolInfo | null;
  stats: StudentStats;
  news: News[];
}

export interface SubjectEnrollment {
  id: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string | null;
    name: string;
  } | null;
  current_grade: string | null;
  attendance_percentage: number;
}

// ============ ATTENDANCE INTERFACES ============

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_days: number;
  percentage: number;
  month: string;
}

export interface AttendanceCalendarDay {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  marked_at: string | null;
  remarks: string | null;
}

export interface AttendanceCalendar {
  year: number;
  month: number;
  month_name: string;
  calendar: Record<string, AttendanceCalendarDay>;
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total_days: number;
    percentage: number;
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  marked_by: string | null;
  marked_at: string | null;
  remarks: string | null;
}

// ============ ACTIVITY INTERFACES ============

export interface ActivitySubmissionInfo {
  id: string | null;
  status: 'NOT_SUBMITTED' | 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'LATE';
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  feedback: string | null;
  response?: string | null;
  attachment_url?: string | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  level: 'CLASS' | 'STUDENT';
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  subject: {
    id: string | null;
    name: string;
  };
  due_date: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_by: string;
  created_at: string;
  google_meet_link: string | null;
  zoom_link: string | null;
  other_link: string | null;
  link_label: string | null;
  submission: ActivitySubmissionInfo;
}

export interface ActivityDetail extends Activity {
  class_name: string | null;
}

export interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SubmitActivityResponse {
  id: string;
  status: string;
  submitted_at: string;
  message: string;
}

// ============ TASK INTERFACES ============

export interface TaskReply {
  id: string;
  content: string;
  reply_type: 'STUDENT' | 'TEACHER';
  replied_by: {
    id: string | null;
    name: string;
  };
  created_at: string;
}

export interface StudentTask {
  id: string;
  title: string;
  description: string;
  task_type: 'TASK' | 'NOTE' | 'REMINDER' | 'HOMEWORK' | 'FOLLOWUP';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  due_date: string | null;
  created_by: {
    id: string | null;
    name: string;
  };
  created_at: string;
  completed_at: string | null;
  replies_count: number;
}

export interface StudentTaskDetail extends StudentTask {
  replies: TaskReply[];
}

export interface TasksResponse {
  tasks: StudentTask[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  counts: {
    open: number;
    in_progress: number;
    completed: number;
  };
}

// ============ SCHEME INTERFACES ============

export interface GovernmentScheme {
  id: string;
  title: string;
  description: string;
  scheme_type: 'EXAM' | 'SCHOLARSHIP' | 'EVENT' | 'PROGRAM' | 'COMPETITION' | 'ADMISSION' | 'OTHER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  eligibility: string | null;
  requirements: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  official_link: string | null;
  apply_link: string | null;
  image_url: string | null;
  target_classes: string[];
  published_at: string | null;
  created_at: string;
}

export interface SchemesResponse {
  schemes: GovernmentScheme[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SchemeType {
  type: string;
  label: string;
  count: number;
}

// ============ SERVICE ============

const studentDashboardService = {
  /**
   * Get student dashboard data
   */
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/students/dashboard/');
    return response.data.data;
  },

  /**
   * Get student profile
   */
  async getProfile(): Promise<StudentProfile> {
    const response = await api.get<{ success: boolean; data: StudentProfile }>('/students/profile/');
    return response.data.data;
  },

  /**
   * Get news list
   */
  async getNews(limit: number = 10): Promise<News[]> {
    const response = await api.get<{ success: boolean; data: { news: News[]; count: number } }>('/students/news/', {
      params: { limit }
    });
    return response.data.data.news;
  },

  /**
   * Get single news detail
   */
  async getNewsDetail(newsId: string): Promise<News> {
    const response = await api.get<{ success: boolean; data: News }>(`/students/news/${newsId}/`);
    return response.data.data;
  },

  /**
   * Get enrolled subjects
   */
  async getSubjects(): Promise<SubjectEnrollment[]> {
    const response = await api.get<{ success: boolean; data: SubjectEnrollment[] }>('/students/subjects/');
    return response.data.data;
  },

  // ============ ATTENDANCE METHODS ============

  /**
   * Get attendance summary for current month
   */
  async getAttendanceSummary(): Promise<AttendanceSummary> {
    const response = await api.get<{ success: boolean; data: AttendanceSummary }>('/students/attendance/summary/');
    return response.data.data;
  },

  /**
   * Get attendance calendar for a specific month
   */
  async getAttendanceCalendar(year: number, month: number): Promise<AttendanceCalendar> {
    const response = await api.get<{ success: boolean; data: AttendanceCalendar }>('/students/attendance/calendar/', {
      params: { year, month }
    });
    return response.data.data;
  },

  /**
   * Get recent attendance history
   */
  async getAttendanceHistory(limit: number = 30): Promise<AttendanceRecord[]> {
    const response = await api.get<{ success: boolean; data: AttendanceRecord[] }>('/students/attendance/history/', {
      params: { limit }
    });
    return response.data.data;
  },

  // ============ ACTIVITY METHODS ============

  /**
   * Get activities list
   */
  async getActivities(params: {
    status?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<ActivitiesResponse> {
    const response = await api.get<{ success: boolean; data: ActivitiesResponse }>('/students/activities/', {
      params
    });
    return response.data.data;
  },

  /**
   * Get single activity detail
   */
  async getActivityDetail(activityId: string): Promise<ActivityDetail> {
    const response = await api.get<{ success: boolean; data: ActivityDetail }>(`/students/activities/${activityId}/`);
    return response.data.data;
  },

  /**
   * Submit activity response
   */
  async submitActivity(activityId: string, data: {
    response: string;
    attachment_url?: string;
  }): Promise<SubmitActivityResponse> {
    const response = await api.post<{ success: boolean; data: SubmitActivityResponse }>(
      `/students/activities/${activityId}/submit/`,
      data
    );
    return response.data.data;
  },

  /**
   * Get count of pending activities
   */
  async getPendingActivitiesCount(): Promise<number> {
    const response = await api.get<{ success: boolean; data: { count: number } }>('/students/activities/pending_count/');
    return response.data.data.count;
  },

  // ============ TASK METHODS ============

  /**
   * Get tasks list
   */
  async getTasks(params: {
    status?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<TasksResponse> {
    const response = await api.get<{ success: boolean; data: TasksResponse }>('/students/tasks/', {
      params
    });
    return response.data.data;
  },

  /**
   * Get single task detail with replies
   */
  async getTaskDetail(taskId: string): Promise<StudentTaskDetail> {
    const response = await api.get<{ success: boolean; data: StudentTaskDetail }>(`/students/tasks/${taskId}/`);
    return response.data.data;
  },

  /**
   * Add a reply to a task
   */
  async addTaskReply(taskId: string, content: string): Promise<TaskReply> {
    const response = await api.post<{ success: boolean; data: TaskReply }>(
      `/students/tasks/${taskId}/reply/`,
      { content }
    );
    return response.data.data;
  },

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string): Promise<StudentTask> {
    const response = await api.post<{ success: boolean; data: StudentTask }>(
      `/students/tasks/${taskId}/update_status/`,
      { status }
    );
    return response.data.data;
  },

  // ============ SCHEME METHODS ============

  /**
   * Get government schemes list
   */
  async getSchemes(params: {
    type?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<SchemesResponse> {
    const response = await api.get<{ success: boolean; data: SchemesResponse }>('/students/schemes/', {
      params
    });
    return response.data.data;
  },

  /**
   * Get single scheme detail
   */
  async getSchemeDetail(schemeId: string): Promise<GovernmentScheme> {
    const response = await api.get<{ success: boolean; data: GovernmentScheme }>(`/students/schemes/${schemeId}/`);
    return response.data.data;
  },

  /**
   * Get scheme types with counts
   */
  async getSchemeTypes(): Promise<SchemeType[]> {
    const response = await api.get<{ success: boolean; data: SchemeType[] }>('/students/schemes/types/');
    return response.data.data;
  },

  // ========== REPORTS / PROGRESS CARDS ==========

  /**
   * Get all reports for the student
   */
  async getReports(): Promise<StudentReportsResponse> {
    const response = await api.get<{ success: boolean; data: StudentReportsResponse }>('/students/reports/');
    return response.data.data;
  },

  /**
   * Get detailed report with subject-wise marks
   */
  async getReportDetail(reportId: string): Promise<StudentReportDetail> {
    const response = await api.get<{ success: boolean; data: StudentReportDetail }>(`/students/reports/${reportId}/`);
    return response.data.data;
  },

  // ========== ANNOUNCEMENTS ==========

  /**
   * Get all announcements for the student
   */
  async getAnnouncements(page: number = 1, pageSize: number = 20): Promise<StudentAnnouncementsResponse> {
    const response = await api.get<{ success: boolean; data: StudentAnnouncementsResponse }>(`/students/announcements/?page=${page}&page_size=${pageSize}`);
    return response.data.data;
  },

  /**
   * Get announcement detail
   */
  async getAnnouncementDetail(announcementId: string): Promise<StudentAnnouncement> {
    const response = await api.get<{ success: boolean; data: StudentAnnouncement }>(`/students/announcements/${announcementId}/`);
    return response.data.data;
  },

  /**
   * Get unread announcement count (last 7 days)
   */
  async getAnnouncementCount(): Promise<number> {
    const response = await api.get<{ success: boolean; data: { count: number } }>('/students/announcements/count/');
    return response.data.data.count;
  },
};

// ========== REPORT INTERFACES ==========

export interface StudentReport {
  id: string;
  name: string;
  report_type: string;
  class_name: string;
  academic_year: string;
  exam_date: string | null;
  published_at: string | null;
  subjects_count: number;
  total_marks: number;
  total_max_marks: number;
  percentage: number;
  grade: string;
  rank: number | null;
  has_marks: boolean;
}

export interface StudentReportsResponse {
  reports: StudentReport[];
  count: number;
}

export interface SubjectMark {
  id: string;
  name: string;
  max_marks: number;
  marks: number | null;
  status: 'passed' | 'failed';
}

export interface StudentReportDetail {
  id: string;
  name: string;
  report_type: string;
  description: string | null;
  class_name: string;
  academic_year: string;
  exam_date: string | null;
  published_at: string | null;
  subjects: SubjectMark[];
  total_marks: number;
  total_max_marks: number;
  percentage: number;
  grade: string;
  rank: number | null;
  remarks: string | null;
}

// ========== ANNOUNCEMENT INTERFACES ==========

export interface StudentAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  published_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface StudentAnnouncementsResponse {
  announcements: StudentAnnouncement[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export default studentDashboardService;


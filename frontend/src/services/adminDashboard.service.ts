/**
 * Admin Dashboard Service
 * API calls for admin dashboard operations - schools, teachers, students, notifications, tasks, reports
 */

import api from './api';

// ============ TYPES ============

export interface School {
  id: string;
  name: string;
  udise_code: string;
  contact_email?: string;
  contact_phone?: string;
  principal_name?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  board?: string;
  status: string;
  plan_type: string;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  ai_quota_limit: number;
  ai_quota_used: number;
  ai_quota_percentage: number;
  created_at: string;
}

export interface Teacher {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    phone?: string;
    status: string;
    is_active: boolean;
  };
  school: string;
  school_name: string;
  employee_id: string;
  subjects_count: number;
  classes_count: number;
  qualification?: string;
  experience_years: number;
  joined_at: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedTeachers {
  teachers: Teacher[];
  pagination: Pagination;
}

export interface PaginatedStudents {
  students: Student[];
  pagination: Pagination;
}

export interface Student {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    phone?: string;
    status: string;
    is_active: boolean;
  };
  school: string;
  school_name: string;
  udise_student_id: string;
  roll_no?: string;
  current_class?: string;
  class_name?: string;
  class_section?: string;
  full_class_name: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  ai_quota_limit: number;
  ai_quota_used: number;
  ai_quota_percentage: number;
  enrollment_date?: string;
  academic_year?: string;
  created_at: string;
}

export interface AttendanceTrendItem {
  date: string;
  day: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface DashboardData {
  view_type: 'single_school' | 'aggregate';
  school_stats: {
    school_id?: string;
    school_name?: string;
    schools_count?: number;
    total_students: number;
    total_teachers: number;
    total_admins: number;
    total_classes?: number;
    total_subjects?: number;
    ai_quota_used: number;
    ai_quota_limit: number;
    ai_quota_percentage: number;
  };
  schools_list?: Array<{
    id: string;
    name: string;
    udise_code: string;
    total_students: number;
    total_teachers: number;
    total_admins?: number;
    ai_quota_percentage: number;
  }>;
  recent_activities: Array<{
    id: string;
    user: string;
    action: string;
    description: string;
    timestamp: string;
  }>;
  pending_approvals: number;
  notifications_count: number;
  tasks_count: number;
  attendance_trend?: AttendanceTrendItem[];
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  published_at?: string;
  targets: Array<{
    type: 'school' | 'user';
    name: string;
    roles?: string[];
    role?: string;
  }>;
  targets_count: number;
  estimated_recipients: number;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  notification_type: 'IN_APP' | 'EMAIL' | 'SMS' | 'BOTH';
  target_schools?: string[];
  school_target_roles?: ('STUDENT' | 'TEACHER' | 'ADMIN')[];
  target_users?: string[];
  scheduled_date?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// User Notifications (bell notifications)
export interface UserNotification {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  target_type: 'user' | 'school';
  target_school: string | null;
  created_at: string;
  published_at: string | null;
  created_by: string;
}

export interface UserNotificationsResponse {
  notifications: UserNotification[];
  count: number;
  user_role: string;
  schools: { id: string; name: string }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  assigned_to: string;
  assigned_to_id?: string;
  school?: string;
  subject?: string;
  assigned_by?: string;
  due_date: string;
  status: string;
  assigned_date: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  task_type: 'HOMEWORK' | 'ASSIGNMENT' | 'PROJECT' | 'ACTIVITY' | 'GENERAL';
  assigned_to_role: 'STUDENT' | 'TEACHER';
  assigned_to_ids: string[];
  subject_id?: string;
  due_date: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  school_id?: string;
}

export interface CreateStudentData {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  udise_student_id: string;
  roll_no?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  school_id?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface CreateTeacherData {
  email: string;
  phone?: string;
  password?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  employee_id: string;
  qualification?: string;
  experience_years?: number;
  school_id?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface UserAction {
  action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND' | 'REMOVE';
  reason?: string;
}

export interface StudentReport {
  school_name: string;
  generated_at: string;
  students: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    udise_id: string;
    roll_no?: string;
    class: string;
    class_name?: string;
    section?: string;
    ai_quota_used: number;
    ai_quota_limit: number;
    ai_quota_remaining: number;
    ai_quota_percentage: number;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    date_of_birth?: string;
    gender?: string;
    status: string;
    is_active: boolean;
    enrollment_date?: string;
    academic_year?: string;
    joined_date?: string;
    total_attendance_days?: number;
    present_days?: number;
    attendance_percentage?: number;
    total_homework?: number;
    completed_homework?: number;
    homework_completion_rate?: number;
    total_ai_sessions?: number;
    total_ai_tokens?: number;
  }>;
  total_students: number;
}

export interface TeacherReport {
  school_name: string;
  generated_at: string;
  teachers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    employee_id: string;
    qualification?: string;
    experience_years: number;
    specialization?: string;
    certifications?: string[];
    can_mark_attendance: boolean;
    can_assign_homework: boolean;
    can_grade_assignments: boolean;
    status: string;
    is_active: boolean;
    joined_date?: string;
    subjects_count: number;
    subjects: Array<{
      id: string;
      name: string;
      code: string;
      is_primary: boolean;
      years_teaching: number;
    }>;
    total_classes: number;
    classes: Array<{
      id: string;
      class_name: string;
      subject_name: string;
      academic_year: string;
    }>;
    attendance_records_marked?: number;
    homework_assigned?: number;
  }>;
  total_teachers: number;
}

export interface SchoolReport {
  school_name: string;
  udise_code: string;
  generated_at: string;
  total_students?: number;
  active_students?: number;
  total_teachers?: number;
  active_teachers?: number;
  total_attendance_records?: number;
  present_records?: number;
  overall_attendance_rate?: number;
  total_ai_queries?: number;
  total_ai_tokens?: number;
}

export interface AIQuotaUsage {
  school_quota: {
    limit: number;
    used: number;
    percentage: number;
  };
  students: Array<{
    id: string;
    name: string;
    quota_limit: number;
    quota_used: number;
    quota_percentage: number;
    remaining_quota: number;
  }>;
  total_students: number;
}

// ============ SERVICE ============

const adminDashboardService = {
  // ============ DASHBOARD ============
  
  async getDashboard(schoolId?: string): Promise<DashboardData> {
    const params = schoolId ? { school_id: schoolId } : {};
    const response = await api.get<{ success: boolean; data: DashboardData }>('/admin/dashboard/', { params });
    return response.data.data;
  },

  // ============ SCHOOLS ============
  
  async getSchools(): Promise<School[]> {
    // Admin endpoint - only returns schools the admin has access to
    const response = await api.get<{ success: boolean; data: { schools: School[]; count: number } }>('/admin/schools/');
    return response.data.data.schools;
  },

  async getSchool(id: string): Promise<School> {
    const response = await api.get<School>(`/superadmin/schools/${id}/`);
    return response.data;
  },

  async getSchoolStatistics(id: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>(`/superadmin/schools/${id}/statistics/`);
    return response.data.data;
  },

  // ============ TEACHERS ============
  
  async getTeachers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    school_id?: string;
  }): Promise<PaginatedTeachers> {
    const response = await api.get<{ success: boolean; data: PaginatedTeachers }>('/admin/teachers/', { 
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 10,
        search: params?.search || '',
        school_id: params?.school_id || '',
      }
    });
    return response.data.data;
  },

  async addTeacher(data: CreateTeacherData): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>('/admin/teachers/add/', data);
    return response.data.data;
  },

  async performTeacherAction(teacherId: string, action: UserAction): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(`/admin/teachers/${teacherId}/action/`, action);
    return response.data.data;
  },

  // ============ STUDENTS ============
  
  async getStudents(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    school_id?: string;
  }): Promise<PaginatedStudents> {
    const response = await api.get<{ success: boolean; data: PaginatedStudents }>('/admin/students/', { 
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 10,
        search: params?.search || '',
        school_id: params?.school_id || '',
      }
    });
    return response.data.data;
  },

  async addStudent(data: CreateStudentData): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>('/admin/students/add/', data);
    return response.data.data;
  },

  async performStudentAction(studentId: string, action: UserAction): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(`/admin/students/${studentId}/action/`, action);
    return response.data.data;
  },

  // ============ NOTIFICATIONS ============
  
  async createNotification(data: CreateNotificationData): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>('/admin/notifications/', data);
    return response.data.data;
  },

  async getNotificationHistory(): Promise<Notification[]> {
    const response = await api.get<{ success: boolean; data: { notifications: Notification[]; count: number } }>('/admin/notifications/history/');
    return response.data.data.notifications;
  },

  async updateNotification(id: string, data: Partial<CreateNotificationData>): Promise<any> {
    const response = await api.put<{ success: boolean; data: any }>(`/admin/notifications/${id}/`, data);
    return response.data.data;
  },

  async deleteNotification(id: string): Promise<any> {
    const response = await api.delete<{ success: boolean }>(`/admin/notifications/${id}/`);
    return response.data;
  },

  async sendNotification(id: string, notificationType: 'IN_APP' | 'EMAIL' | 'SMS' | 'BOTH' = 'IN_APP'): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(`/admin/notifications/${id}/send/`, {
      notification_type: notificationType
    });
    return response.data.data;
  },

  // User Notifications (Bell Notifications - for all users)
  async getMyNotifications(days: number = 7): Promise<UserNotificationsResponse> {
    const response = await api.get<{ success: boolean; data: UserNotificationsResponse }>(`/admin/notifications/my/?days=${days}`);
    return response.data.data;
  },

  async getUnreadNotificationsCount(): Promise<number> {
    const response = await api.get<{ success: boolean; data: { unread_count: number } }>('/admin/notifications/unread-count/');
    return response.data.data.unread_count;
  },

  // ============ TASKS ============
  
  async createTask(data: CreateTaskData): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>('/admin/tasks/', data);
    return response.data.data;
  },

  async getTaskHistory(): Promise<Task[]> {
    const response = await api.get<{ success: boolean; data: { tasks: Task[]; count: number } }>('/admin/tasks/history/');
    return response.data.data.tasks;
  },

  // ============ REPORTS ============
  
  async getStudentReport(params: {
    school_id?: string;
    student_id?: string;
    class_id?: string;
    date_from?: string;
    date_to?: string;
    include_attendance?: boolean;
    include_homework?: boolean;
    include_ai_usage?: boolean;
  }): Promise<StudentReport> {
    const response = await api.post<{ success: boolean; data: StudentReport }>('/admin/reports/students/', params);
    return response.data.data;
  },

  async getTeacherReport(params: {
    school_id?: string;
    teacher_id?: string;
    subject_id?: string;
    date_from?: string;
    date_to?: string;
    include_attendance?: boolean;
    include_classes?: boolean;
    include_homework?: boolean;
  }): Promise<TeacherReport> {
    const response = await api.post<{ success: boolean; data: TeacherReport }>('/admin/reports/teachers/', params);
    return response.data.data;
  },

  async getSchoolReport(params: {
    school_id?: string;
    date_from?: string;
    date_to?: string;
    include_students?: boolean;
    include_teachers?: boolean;
    include_attendance?: boolean;
    include_ai_usage?: boolean;
  }): Promise<SchoolReport> {
    const response = await api.post<{ success: boolean; data: SchoolReport }>('/admin/reports/school/', params);
    return response.data.data;
  },

  // ============ AI QUOTA ============
  
  async getAIQuotaUsage(): Promise<AIQuotaUsage> {
    const response = await api.get<{ success: boolean; data: AIQuotaUsage }>('/admin/ai-quota/usage/');
    return response.data.data;
  },

  async updateAIQuota(userId: string, newQuotaLimit: number, reason?: string): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>('/admin/ai-quota/update/', {
      user_id: userId,
      new_quota_limit: newQuotaLimit,
      reason,
    });
    return response.data.data;
  },

  // ============ SCHOOL TEACHERS ============

  async getSchoolTeachers(schoolId: string): Promise<SchoolTeachersResponse> {
    const response = await api.get<{ success: boolean; data: SchoolTeachersResponse }>(`/admin/schools/${schoolId}/teachers/`);
    return response.data.data;
  },

  async getSchoolTeacherDetail(schoolId: string, teacherId: string): Promise<SchoolTeacherDetail> {
    const response = await api.get<{ success: boolean; data: SchoolTeacherDetail }>(`/admin/schools/${schoolId}/teacher/`, {
      params: { teacher_id: teacherId }
    });
    return response.data.data;
  },

  async getSchoolStudentsList(schoolId: string, search?: string): Promise<SchoolStudentsResponse> {
    const response = await api.get<{ success: boolean; data: SchoolStudentsResponse }>(`/admin/schools/${schoolId}/students/`, {
      params: { search: search || '' }
    });
    return response.data.data;
  },
};

// Additional interfaces for school teachers
export interface SchoolTeacher {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  qualification?: string;
  experience_years: number;
  is_active: boolean;
  subjects: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    years_teaching: number;
  }>;
  subjects_count: number;
  classes: Array<{
    id: string;
    class_name: string;
    subject: string;
  }>;
  classes_count: number;
  attendance_marked_30_days: number;
  total_attendance_marked: number;
  can_mark_attendance: boolean;
  can_assign_homework: boolean;
  created_at: string;
}

export interface SchoolTeachersResponse {
  school_id: string;
  school_name: string;
  teachers: SchoolTeacher[];
  total_count: number;
}

export interface SchoolTeacherDetail {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  qualification?: string;
  experience_years: number;
  specialization?: string;
  certifications?: string[];
  is_active: boolean;
  school: {
    id: string;
    name: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    years_teaching: number;
  }>;
  subjects_count: number;
  classes: Array<{
    id: string;
    class_name: string;
    subject: string;
    academic_year?: string;
  }>;
  classes_count: number;
  permissions: {
    can_mark_attendance: boolean;
    can_assign_homework: boolean;
    can_grade_assignments: boolean;
  };
  attendance_summary: {
    total_records_marked: number;
    last_30_days_marked: number;
  };
  attendance_records: Array<{
    date: string;
    class: string;
    present: number;
    absent: number;
    late: number;
    total: number;
  }>;
  homework_assigned_count: number;
  created_at: string;
}

// School Students interfaces
export interface SchoolStudent {
  id: string;
  name: string;
  roll_no: string;
  class_name: string;
  school_name: string;
}

export interface SchoolStudentsResponse {
  school_id: string;
  school_name: string;
  students: SchoolStudent[];
  total_count: number;
}

// Teacher Task interfaces
export interface TeacherTaskReply {
  id: string;
  content: string;
  reply_type: 'TEACHER' | 'ADMIN';
  replied_by: string;
  created_at: string;
}

export interface TeacherTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  teacher: {
    id: string;
    name: string;
    employee_id: string;
  };
  assigned_by: string;
  school_name: string;
  due_date?: string;
  completed_at?: string;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  replies_count: number;
  last_reply?: {
    content: string;
    reply_type: 'TEACHER' | 'ADMIN';
    replied_by: string;
    created_at: string;
  };
  replies?: TeacherTaskReply[];
}

export interface CreateTeacherTaskData {
  teacher_id: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
}

// Calendar Day interface
export interface CalendarDay {
  date: string;
  day: number;
  day_name: string;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_info?: {
    name: string;
    type: string;
  };
  attendance_marked: boolean;
  attendance_data?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  status_color: 'holiday' | 'weekend' | 'marked' | 'not_marked' | 'future';
}

export interface TeacherCalendarData {
  year: number;
  month: number;
  month_name: string;
  teacher: {
    id: string;
    name: string;
    employee_id: string;
  };
  school_name: string;
  calendar: CalendarDay[];
  summary: {
    total_days: number;
    total_working_days: number;
    attendance_marked_days: number;
    holidays_count: number;
    weekends_count: number;
  };
}

export interface TeacherFullDetail {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  qualification?: string;
  experience_years: number;
  specialization?: string;
  certifications?: string[];
  is_active: boolean;
  status: string;
  school: {
    id: string;
    name: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    years_teaching: number;
  }>;
  subjects_count: number;
  classes: Array<{
    id: string;
    class_id: string;
    class_name: string;
    subject_id: string;
    subject: string;
    academic_year: string;
  }>;
  classes_count: number;
  permissions: {
    can_mark_attendance: boolean;
    can_assign_homework: boolean;
    can_grade_assignments: boolean;
  };
  attendance_class?: {
    id: string;
    name: string;
  } | null;
  attendance_summary: {
    total_marked: number;
    last_30_days: Array<{
      date: string;
      total: number;
      present: number;
      absent: number;
    }>;
    last_30_days_total: number;
  };
  tasks_summary: {
    total: number;
    open: number;
    in_progress: number;
    completed: number;
    closed: number;
  };
  recent_tasks: TeacherTask[];
  created_at: string;
}

// Add teacher task service methods to adminDashboardService
const teacherTaskMethods = {
  // ============ TEACHER TASKS ============
  
  async createTeacherTask(data: CreateTeacherTaskData): Promise<TeacherTask> {
    const response = await api.post<{ success: boolean; data: TeacherTask }>('/admin/teacher-tasks/', data);
    return response.data.data;
  },

  async getTeacherTasks(teacherId: string, status?: string): Promise<TeacherTask[]> {
    const params = status ? { status } : {};
    const response = await api.get<{ success: boolean; data: { tasks: TeacherTask[]; count: number } }>(
      `/admin/teacher-tasks/teacher/${teacherId}/`,
      { params }
    );
    return response.data.data.tasks;
  },

  async getTeacherTaskDetail(taskId: string): Promise<TeacherTask> {
    const response = await api.get<{ success: boolean; data: TeacherTask }>(`/admin/teacher-tasks/${taskId}/`);
    return response.data.data;
  },

  async addTeacherTaskReply(taskId: string, content: string): Promise<TeacherTaskReply> {
    const response = await api.post<{ success: boolean; data: TeacherTaskReply }>(
      `/admin/teacher-tasks/${taskId}/reply/`,
      { content }
    );
    return response.data.data;
  },

  async updateTeacherTaskStatus(taskId: string, status: TeacherTask['status']): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(
      `/admin/teacher-tasks/${taskId}/status/`,
      { status }
    );
    return response.data.data;
  },

  // ============ TEACHER DETAIL WITH CALENDAR ============
  
  async getTeacherFullDetail(teacherId: string): Promise<TeacherFullDetail> {
    const response = await api.get<{ success: boolean; data: TeacherFullDetail }>(
      `/admin/teacher-detail/${teacherId}/`
    );
    return response.data.data;
  },

  async getTeacherAttendanceCalendar(teacherId: string, year: number, month: number): Promise<TeacherCalendarData> {
    const response = await api.get<{ success: boolean; data: TeacherCalendarData }>(
      `/admin/teacher-detail/${teacherId}/calendar/`,
      { params: { year, month } }
    );
    return response.data.data;
  },

  // ============ TEACHER EDIT ============

  async updateTeacherProfile(teacherId: string, data: UpdateTeacherData): Promise<any> {
    const response = await api.put<{ success: boolean; data: any }>(
      `/admin/teacher-detail/${teacherId}/update/`,
      data
    );
    return response.data.data;
  },

  async updateTeacherSubjects(teacherId: string, subjects: SubjectAssignment[]): Promise<any> {
    const response = await api.put<{ success: boolean; data: any }>(
      `/admin/teacher-detail/${teacherId}/subjects/`,
      { subjects }
    );
    return response.data.data;
  },

  async updateTeacherClasses(teacherId: string, classes: ClassAssignment[]): Promise<any> {
    const response = await api.put<{ success: boolean; data: any }>(
      `/admin/teacher-detail/${teacherId}/classes/`,
      { classes }
    );
    return response.data.data;
  },

  async getAvailableSubjects(): Promise<AvailableSubject[]> {
    const response = await api.get<{ success: boolean; data: { subjects: AvailableSubject[]; count: number } }>(
      '/admin/available-subjects/'
    );
    return response.data.data.subjects;
  },

  async getAvailableClasses(schoolId: string): Promise<AvailableClass[]> {
    const response = await api.get<{ success: boolean; data: { classes: AvailableClass[]; count: number } }>(
      `/admin/available-classes/${schoolId}/`
    );
    return response.data.data.classes;
  },
};

// Additional interfaces for teacher editing
export interface UpdateTeacherData {
  qualification?: string;
  experience_years?: number;
  specialization?: string;
  can_mark_attendance?: boolean;
  can_assign_homework?: boolean;
  can_grade_assignments?: boolean;
  school_id?: string;
  attendance_class_id?: string | null;
}

export interface SubjectAssignment {
  subject_id: string;
  is_primary?: boolean;
  years_teaching?: number;
}

export interface ClassAssignment {
  class_id: string;
  subject_id: string;
  academic_year?: string;
}

export interface AvailableSubject {
  id: string;
  name: string;
  code: string;
  category: string;
}

export interface AvailableClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  academic_year: string;
}

// ============ ATTENDANCE INTERFACES ============

export interface AttendanceClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  school_id: string;
  school_name: string;
  student_count: number;
  academic_year: string;
}

export interface StudentAttendance {
  id: string;
  user_id: string;
  name: string;
  roll_number?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
  attendance_id: string | null;
  remarks: string | null;
}

export interface ClassAttendanceData {
  class: {
    id: string;
    name: string;
    grade: number;
    section: string;
    school: string;
  };
  date: string;
  total_students: number;
  marked_count: number;
  students: StudentAttendance[];
}

export interface AttendanceRecord {
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface MarkAttendanceResult {
  success: boolean;
  class_id: string;
  date: string;
  created: number;
  updated: number;
  total_processed: number;
}

// Attendance service methods
const attendanceMethods = {
  async getClassesForAttendance(schoolId?: string): Promise<AttendanceClass[]> {
    const params = schoolId ? { school_id: schoolId } : {};
    const response = await api.get<{ success: boolean; data: { classes: AttendanceClass[]; count: number } }>(
      '/admin/attendance/classes/',
      { params }
    );
    return response.data.data.classes;
  },

  async getClassStudentsForAttendance(classId: string, date: string): Promise<ClassAttendanceData> {
    const response = await api.get<{ success: boolean; data: ClassAttendanceData }>(
      `/admin/attendance/class/${classId}/`,
      { params: { date } }
    );
    return response.data.data;
  },

  async markAttendance(classId: string, date: string, attendance: AttendanceRecord[]): Promise<MarkAttendanceResult> {
    const response = await api.post<{ success: boolean; data: MarkAttendanceResult }>(
      `/admin/attendance/mark/${classId}/`,
      { date, attendance }
    );
    return response.data.data;
  },

  async getAttendanceSummary(classId: string, startDate: string, endDate: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>(
      `/admin/attendance/summary/${classId}/`,
      { params: { start_date: startDate, end_date: endDate } }
    );
    return response.data.data;
  },

  async markTeacherAttendance(teacherId: string, date: string): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(
      `/admin/teacher-detail/${teacherId}/attendance/`,
      { date }
    );
    return response.data.data;
  },
};

// Create a combined service with proper typing
const combinedService = {
  ...adminDashboardService,
  ...teacherTaskMethods,
  ...attendanceMethods,
};

export default combinedService;


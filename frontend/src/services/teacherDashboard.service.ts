/**
 * Teacher Dashboard Service
 * API calls for teacher dashboard operations - news, attendance, students, tasks
 */

import api from './api';

// ============ TYPES ============

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  qualification?: string;
  experience_years: number;
  specialization?: string;
  primary_subject?: string;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  permissions: {
    can_mark_attendance: boolean;
    can_assign_homework: boolean;
    can_grade_assignments: boolean;
  };
  attendance_class?: {
    id: string;
    name: string;
  } | null;
}

export interface School {
  id: string;
  name: string;
  udise_code: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  principal_name?: string;
  contact_email?: string;
  contact_phone?: string;
  total_students: number;
  total_teachers: number;
}

export interface News {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  published_at: string | null;
  created_at: string;
  created_by: string;
}

export interface DashboardStats {
  total_students: number;
  attendance_class_students: number;
  today_attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    marked: boolean;
  };
  pending_tasks: number;
  classes_count: number;
  subjects_count: number;
}

export interface PersonInfo {
  id: string | null;
  name: string;
  role: string;
}

export interface TeacherTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  due_date: string | null;
  assigned_by: PersonInfo;
  created_at: string;
  completed_at?: string | null;
  replies_count: number;
}

export interface TaskReply {
  id: string;
  content: string;
  reply_type: 'TEACHER' | 'ADMIN';
  replied_by: PersonInfo;
  created_at: string;
}

export interface TaskDetail extends TeacherTask {
  school_name: string;
  closed_at?: string | null;
  replies: TaskReply[];
}

export interface ScheduleItem {
  id: string;
  class_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface DashboardData {
  teacher: TeacherProfile;
  school: School;
  news: News[];
  stats: DashboardStats;
  tasks: TeacherTask[];
  today_schedule: ScheduleItem[];
}

export interface StudentAttendance {
  id: string;
  user_id: string;
  name: string;
  roll_no?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
  attendance_id: string | null;
  remarks: string | null;
}

export interface AttendanceClass {
  id: string;
  name: string;
  grade: number;
  section?: string;
}

export interface AttendanceData {
  class: AttendanceClass;
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

export interface AttendanceResult {
  success: boolean;
  class_id: string;
  date: string;
  created: number;
  updated: number;
  total_processed: number;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  roll_no?: string;
  udise_student_id: string;
  class_name?: string;
  parent_name?: string;
  parent_phone?: string;
  is_active: boolean;
}

export interface StudentDetail extends Student {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  class_id?: string;
  school_name: string;
  parent_email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  ai_quota_used: number;
  ai_quota_limit: number;
  enrollment_date?: string;
  academic_year?: string;
  status: string;
  attendance_summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };
}

export interface StudentCalendarDay {
  date: string;
  day: number;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_info?: {
    name: string;
    type: string;
  };
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
}

// Student Tasks
export interface StudentTask {
  id: string;
  title: string;
  description: string;
  task_type: 'TASK' | 'NOTE' | 'REMINDER' | 'HOMEWORK' | 'FOLLOWUP';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  due_date?: string;
  completed_at?: string;
  created_by?: {
    id: string;
    name: string;
  };
  created_at: string;
  is_mine: boolean;
}

export interface StudentTasksResponse {
  tasks: StudentTask[];
  count: number;
}

export interface CreateStudentTaskData {
  title: string;
  description: string;
  task_type?: 'TASK' | 'NOTE' | 'REMINDER' | 'HOMEWORK' | 'FOLLOWUP';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
}

export interface StudentCalendarData {
  student: {
    id: string;
    name: string;
    roll_no?: string;
    class_name?: string;
  };
  year: number;
  month: number;
  month_name: string;
  calendar: StudentCalendarDay[];
  summary: {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    holidays: number;
    weekends: number;
    attendance_percentage: number;
  };
}

// School Teacher (colleague teacher)
export interface SchoolTeacher {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  qualification?: string;
  experience_years: number;
  specialization?: string;
  subjects: Array<{ id: string; name: string; code: string }>;
  subjects_count: number;
  attendance_class?: { id: string; name: string } | null;
  is_active: boolean;
  is_current_user: boolean;
}

export interface SchoolTeachersResponse {
  school_id: string;
  school_name: string;
  teachers: SchoolTeacher[];
  total_count: number;
}

// School Student
export interface SchoolStudent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  roll_no?: string;
  udise_student_id: string;
  class_id?: string;
  class_name: string;
  grade?: number;
  section?: string;
  parent_name?: string;
  parent_phone?: string;
  is_active: boolean;
}

export interface SchoolStudentsResponse {
  school_id: string;
  school_name: string;
  students: SchoolStudent[];
  total_count: number;
}

// School Class
export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  section?: string;
  room_number?: string;
  max_students: number;
  current_students: number;
  available_seats: number;
  is_full: boolean;
  academic_year: string;
  class_teacher?: { id: string; name: string } | null;
  is_my_attendance_class: boolean;
}

export interface SchoolClassesResponse {
  school_id: string;
  school_name: string;
  classes: SchoolClass[];
  total_count: number;
}

// Extended Stats
export interface ExtendedStats {
  // My stats
  my_classes_count: number;
  my_students_count: number;
  my_subjects_count: number;
  attendance_class_students: number;
  today_attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    marked: boolean;
    percentage: number;
  };
  // School stats
  school_total_students: number;
  school_total_teachers: number;
  school_total_classes: number;
  // Tasks stats
  pending_tasks: number;
  completed_tasks: number;
  total_tasks: number;
}

// ============ SERVICE ============

const teacherDashboardService = {
  // ============ DASHBOARD ============
  
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/teachers/dashboard/');
    return response.data.data;
  },

  // ============ NEWS ============
  
  async getNews(limit: number = 10): Promise<News[]> {
    const response = await api.get<{ success: boolean; data: { news: News[]; count: number } }>('/teachers/news/', {
      params: { limit }
    });
    return response.data.data.news;
  },

  async getNewsDetail(newsId: string): Promise<News> {
    const response = await api.get<{ success: boolean; data: News }>(`/teachers/news/${newsId}/`);
    return response.data.data;
  },

  // ============ PROFILE & SCHOOL ============
  
  async getProfile(): Promise<TeacherProfile> {
    const response = await api.get<{ success: boolean; data: TeacherProfile }>('/teachers/profile/');
    return response.data.data;
  },

  async getSchool(): Promise<School> {
    const response = await api.get<{ success: boolean; data: School }>('/teachers/school/');
    return response.data.data;
  },

  async getStats(): Promise<DashboardStats> {
    const response = await api.get<{ success: boolean; data: DashboardStats }>('/teachers/stats/');
    return response.data.data;
  },

  async getSchedule(): Promise<ScheduleItem[]> {
    const response = await api.get<{ success: boolean; data: { schedule: ScheduleItem[]; count: number } }>('/teachers/schedule/');
    return response.data.data.schedule;
  },

  // ============ TASKS ============
  
  async getTasks(status?: string, limit: number = 10): Promise<TeacherTask[]> {
    const params: { status?: string; limit: number } = { limit };
    if (status) params.status = status;
    
    const response = await api.get<{ success: boolean; data: { tasks: TeacherTask[]; count: number } }>('/teachers/tasks/', {
      params
    });
    return response.data.data.tasks;
  },

  async getAllTasks(): Promise<TeacherTask[]> {
    const response = await api.get<{ success: boolean; data: { tasks: TeacherTask[]; count: number } }>('/teachers/tasks/all/');
    return response.data.data.tasks;
  },

  async getTaskDetail(taskId: string): Promise<TaskDetail> {
    const response = await api.get<{ success: boolean; data: TaskDetail }>(`/teachers/tasks/${taskId}/`);
    return response.data.data;
  },

  async replyToTask(taskId: string, content: string): Promise<TaskReply> {
    const response = await api.post<{ success: boolean; data: TaskReply }>(`/teachers/tasks/${taskId}/reply/`, {
      content
    });
    return response.data.data;
  },

  async updateTaskStatus(taskId: string, status: 'IN_PROGRESS' | 'COMPLETED'): Promise<{ id: string; status: string; completed_at: string | null }> {
    const response = await api.post<{ success: boolean; data: { id: string; status: string; completed_at: string | null } }>(
      `/teachers/tasks/${taskId}/status/`,
      { status }
    );
    return response.data.data;
  },

  // ============ ATTENDANCE ============
  
  async getAttendanceStudents(date?: string): Promise<AttendanceData> {
    const params = date ? { date } : {};
    const response = await api.get<{ success: boolean; data: AttendanceData }>('/teachers/attendance/students/', {
      params
    });
    return response.data.data;
  },

  async markAttendance(date: string, attendance: AttendanceRecord[]): Promise<AttendanceResult> {
    const response = await api.post<{ success: boolean; data: AttendanceResult }>('/teachers/attendance/mark/', {
      date,
      attendance
    });
    return response.data.data;
  },

  async getAttendanceSummary(startDate: string, endDate: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/teachers/attendance/summary/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data.data;
  },

  async getStudentAttendanceCalendar(studentId: string, year: number, month: number): Promise<StudentCalendarData> {
    const response = await api.get<{ success: boolean; data: StudentCalendarData }>(
      `/teachers/students/${studentId}/attendance-calendar/`,
      { params: { year, month } }
    );
    return response.data.data;
  },

  // ============ STUDENTS ============
  
  async getStudents(classId?: string): Promise<Student[]> {
    const params = classId ? { class_id: classId } : {};
    const response = await api.get<{ success: boolean; data: { students: Student[]; count: number } }>('/teachers/students/', {
      params
    });
    return response.data.data.students;
  },

  async getStudentDetail(studentId: string): Promise<StudentDetail> {
    const response = await api.get<{ success: boolean; data: StudentDetail }>(`/teachers/students/${studentId}/`);
    return response.data.data;
  },

  async updateStudentPII(studentId: string, data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    roll_no?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
  }): Promise<{ success: boolean; message: string; student_id: string }> {
    const response = await api.post<{ success: boolean; data: { success: boolean; message: string; student_id: string } }>(
      `/teachers/students/${studentId}/update-pii/`,
      data
    );
    return response.data.data;
  },

  // ============ STUDENT TASKS ============
  
  async getStudentTasks(studentId: string): Promise<StudentTasksResponse> {
    const response = await api.get<{ success: boolean; data: StudentTasksResponse }>(
      `/teachers/students/${studentId}/tasks/`
    );
    return response.data.data;
  },

  async createStudentTask(studentId: string, data: CreateStudentTaskData): Promise<{ success: boolean; task: StudentTask }> {
    const response = await api.post<{ success: boolean; data: { success: boolean; task: StudentTask } }>(
      `/teachers/students/${studentId}/create-task/`,
      data
    );
    return response.data.data;
  },

  async updateStudentTaskStatus(taskId: string, status: string): Promise<{ success: boolean; task_id: string; status: string }> {
    const response = await api.post<{ success: boolean; data: { success: boolean; task_id: string; status: string } }>(
      `/teachers/students/task/${taskId}/status/`,
      { status }
    );
    return response.data.data;
  },

  // ============ SCHOOL DATA (Teachers, Students, Classes) ============
  
  async getSchoolTeachers(): Promise<SchoolTeachersResponse> {
    const response = await api.get<{ success: boolean; data: SchoolTeachersResponse }>('/teachers/school-teachers/');
    return response.data.data;
  },

  async getSchoolStudents(classId?: string, search?: string): Promise<SchoolStudentsResponse> {
    const params: { class_id?: string; search?: string } = {};
    if (classId) params.class_id = classId;
    if (search) params.search = search;
    
    const response = await api.get<{ success: boolean; data: SchoolStudentsResponse }>('/teachers/school-students/', {
      params
    });
    return response.data.data;
  },

  async getSchoolClasses(): Promise<SchoolClassesResponse> {
    const response = await api.get<{ success: boolean; data: SchoolClassesResponse }>('/teachers/school-classes/');
    return response.data.data;
  },

  async getExtendedStats(): Promise<ExtendedStats> {
    const response = await api.get<{ success: boolean; data: ExtendedStats }>('/teachers/extended-stats/');
    return response.data.data;
  },
};

export default teacherDashboardService;


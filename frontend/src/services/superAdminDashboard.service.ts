/**
 * Super Admin Dashboard Service
 * Handles all API calls for super admin operations
 */

import api from './api';

// ========== SCHOOL INTERFACES ==========

export interface School {
  id: string;
  name: string;
  udise_code: string;
  contact_email: string | null;
  contact_phone: string | null;
  principal_name: string | null;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  board: string | null;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type: 'BASIC' | 'STANDARD' | 'PREMIUM';
  total_students: number;
  total_teachers: number;
  total_admins: number;
  ai_quota_limit: number;
  ai_quota_used: number;
  established_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolDetail extends School {
  actual_students: number;
  actual_teachers: number;
  actual_admins: number;
  classes: string[];
  classes_count?: number;
}

// School Teachers/Students/Admins/Classes interfaces
export interface SchoolTeacher {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id: string;
  qualification: string | null;
  experience_years: number;
  status: string;
  is_active: boolean;
  created_at: string;
}

export interface SchoolStudent {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  udise_student_id: string;
  roll_no: string;
  class_name: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
}

export interface SchoolAdmin {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id: string;
  designation: string | null;
  is_primary: boolean;
  status: string;
  is_active: boolean;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  academic_year: string;
}

export interface SchoolTeachersResponse {
  teachers: SchoolTeacher[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface SchoolStudentsResponse {
  students: SchoolStudent[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface SchoolAdminsResponse {
  admins: SchoolAdmin[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface SchoolClassesResponse {
  classes: SchoolClass[];
  count: number;
}

export interface SchoolsResponse {
  schools: School[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface CreateSchoolData {
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
  plan_type?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  established_date?: string;
}

export interface UpdateSchoolData {
  name?: string;
  contact_email?: string;
  contact_phone?: string;
  principal_name?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  board?: string;
  plan_type?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  ai_quota_limit?: number;
  established_date?: string;
}

// ========== ADMIN INTERFACES ==========

export interface AdminSchool {
  id: string;
  name: string;
  is_primary: boolean;
}

export interface Admin {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id: string;
  designation: string | null;
  status: string;
  is_active: boolean;
  schools: AdminSchool[];
  created_at: string;
}

export interface AdminsResponse {
  admins: Admin[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface CreateAdminData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  employee_id: string;
  designation?: string;
  school_ids: string[];
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

// ========== TEACHER INTERFACES ==========

export interface Teacher {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id: string;
  qualification: string | null;
  experience_years: number | null;
  primary_subject: string | null;
  specialization: string | null;
  school: {
    id: string;
    name: string;
  } | null;
  status: string;
  is_active: boolean;
  created_at: string;
}

export interface TeacherDetail extends Teacher {
  subjects: {
    id: string;
    name: string;
    code: string;
  }[];
  managed_classes: {
    id: string;
    name: string;
    section: string;
  }[];
  can_mark_attendance: boolean;
  can_assign_homework: boolean;
  can_grade_assignments: boolean;
  certifications: string | null;
}

export interface TeachersResponse {
  teachers: Teacher[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// ========== STUDENT INTERFACES ==========

export interface Student {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  udise_student_id: string;
  roll_no: string;
  class_name: string | null;
  section: string | null;
  school: {
    id: string;
    name: string;
  } | null;
  parent_name: string | null;
  parent_phone: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentDetail extends Student {
  parent_email: string | null;
  academic_year: string | null;
  enrollment_date: string | null;
  ai_quota_limit: number;
  ai_quota_used: number;
}

export interface StudentsResponse {
  students: Student[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// ========== ANNOUNCEMENT INTERFACES ==========

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  is_active: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: {
    id: string;
    name: string;
  } | null;
  created_at: string;
}

export interface AnnouncementTarget {
  id: string;
  type: 'school' | 'class' | 'user';
  school?: { id: string; name: string };
  class?: { id: string; name: string };
  user?: { id: string; name: string };
  role_filter?: string;
}

export interface AnnouncementDetail extends Announcement {
  targets: AnnouncementTarget[];
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'DRAFT' | 'PUBLISHED';
  expires_at?: string;
  targets?: {
    school_id?: string;
    class_id?: string;
    user_id?: string;
    role_filter?: string;
  }[];
}

// ========== ADMIN TASK INTERFACES ==========

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_to: {
    id: string;
    name: string;
    email: string;
  } | null;
  school: {
    id: string;
    name: string;
  } | null;
  created_by: {
    id: string;
    name: string;
  } | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AdminTaskReply {
  id: string;
  message: string;
  replied_by: {
    id: string;
    name: string;
  } | null;
  created_at: string;
}

export interface AdminTaskDetail extends AdminTask {
  replies: AdminTaskReply[];
}

export interface AdminTasksResponse {
  tasks: AdminTask[];
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface CreateAdminTaskData {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to: string;
  school_id?: string;
  due_date?: string;
}

// ========== SERVICE ==========

const superAdminDashboardService = {
  // ========== SCHOOLS ==========
  
  /**
   * Get paginated list of all schools
   */
  async getSchools(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string;
      state?: string;
      district?: string;
      search?: string;
    }
  ): Promise<SchoolsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      if (filters.search) params.append('search', filters.search);
    }
    
    const response = await api.get<{ success: boolean; data: SchoolsResponse }>(
      `/superadmin/manage/schools/?${params.toString()}`
    );
    return response.data.data;
  },
  
  /**
   * Get school details
   */
  async getSchoolDetail(schoolId: string): Promise<SchoolDetail> {
    const response = await api.get<{ success: boolean; data: SchoolDetail }>(
      `/superadmin/manage/schools/${schoolId}/`
    );
    return response.data.data;
  },
  
  /**
   * Create a new school
   */
  async createSchool(data: CreateSchoolData): Promise<School> {
    const response = await api.post<{ success: boolean; data: School; message: string }>(
      '/superadmin/manage/schools/',
      data
    );
    return response.data.data;
  },
  
  /**
   * Update school information
   */
  async updateSchool(schoolId: string, data: UpdateSchoolData): Promise<School> {
    const response = await api.put<{ success: boolean; data: School; message: string }>(
      `/superadmin/manage/schools/${schoolId}/`,
      data
    );
    return response.data.data;
  },
  
  /**
   * Update school status (activate, pause, suspend)
   */
  async updateSchoolStatus(
    schoolId: string,
    status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ): Promise<School> {
    const response = await api.post<{ success: boolean; data: School; message: string }>(
      `/superadmin/manage/schools/${schoolId}/update_status/`,
      { status }
    );
    return response.data.data;
  },
  
  /**
   * Delete/deactivate a school
   */
  async deleteSchool(schoolId: string): Promise<void> {
    await api.delete(`/superadmin/manage/schools/${schoolId}/`);
  },

  /**
   * Get teachers for a school
   */
  async getSchoolTeachers(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<SchoolTeachersResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    if (search) params.append('search', search);
    
    const response = await api.get<{ success: boolean; data: SchoolTeachersResponse }>(
      `/superadmin/manage/schools/${schoolId}/teachers/?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get students for a school
   */
  async getSchoolStudents(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<SchoolStudentsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    if (search) params.append('search', search);
    
    const response = await api.get<{ success: boolean; data: SchoolStudentsResponse }>(
      `/superadmin/manage/schools/${schoolId}/students/?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get admins for a school
   */
  async getSchoolAdmins(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<SchoolAdminsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    if (search) params.append('search', search);
    
    const response = await api.get<{ success: boolean; data: SchoolAdminsResponse }>(
      `/superadmin/manage/schools/${schoolId}/admins/?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get classes for a school
   */
  async getSchoolClasses(schoolId: string): Promise<SchoolClassesResponse> {
    const response = await api.get<{ success: boolean; data: SchoolClassesResponse }>(
      `/superadmin/manage/schools/${schoolId}/classes/`
    );
    return response.data.data;
  },
  
  // ========== ADMINS ==========
  
  /**
   * Get paginated list of all admins
   */
  async getAdmins(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      school_id?: string;
      search?: string;
      status?: string;
    }
  ): Promise<AdminsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    
    if (filters) {
      if (filters.school_id) params.append('school_id', filters.school_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
    }
    
    const response = await api.get<{ success: boolean; data: AdminsResponse }>(
      `/superadmin/manage/admins/?${params.toString()}`
    );
    return response.data.data;
  },
  
  /**
   * Get admin details
   */
  async getAdminDetail(adminId: string): Promise<Admin> {
    const response = await api.get<{ success: boolean; data: Admin }>(
      `/superadmin/manage/admins/${adminId}/`
    );
    return response.data.data;
  },
  
  /**
   * Create a new admin
   */
  async createAdmin(data: CreateAdminData): Promise<Admin> {
    const response = await api.post<{ success: boolean; data: Admin; message: string }>(
      '/superadmin/manage/admins/',
      data
    );
    return response.data.data;
  },
  
  /**
   * Toggle admin active status
   */
  async toggleAdminStatus(adminId: string, isActive: boolean): Promise<void> {
    await api.post(`/superadmin/manage/admins/${adminId}/toggle_status/`, {
      is_active: isActive
    });
  },
  
  /**
   * Update admin's school associations
   */
  async updateAdminSchools(adminId: string, schoolIds: string[]): Promise<void> {
    await api.post(`/superadmin/manage/admins/${adminId}/update_schools/`, {
      school_ids: schoolIds
    });
  },
  
  /**
   * Remove/deactivate an admin
   */
  async removeAdmin(adminId: string): Promise<void> {
    await api.delete(`/superadmin/manage/admins/${adminId}/`);
  },

  // ========== TEACHERS ==========

  /**
   * Get paginated list of all teachers
   */
  async getTeachers(
    page: number = 1,
    pageSize: number = 12,
    filters?: {
      search?: string;
      school_id?: string;
      status?: string;
      subject?: string;
    }
  ): Promise<TeachersResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.school_id) params.append('school_id', filters.school_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.subject) params.append('subject', filters.subject);
    
    const response = await api.get<TeachersResponse>(`/superadmin/manage/teachers/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed information for a specific teacher
   */
  async getTeacherDetail(teacherId: string): Promise<TeacherDetail> {
    const response = await api.get<TeacherDetail>(`/superadmin/manage/teachers/${teacherId}/`);
    return response.data;
  },

  /**
   * Toggle teacher active status
   */
  async toggleTeacherStatus(teacherId: string, isActive: boolean): Promise<void> {
    await api.post(`/superadmin/manage/teachers/${teacherId}/toggle_status/`, {
      is_active: isActive
    });
  },

  // ========== STUDENTS ==========

  /**
   * Get paginated list of all students
   */
  async getStudents(
    page: number = 1,
    pageSize: number = 12,
    filters?: {
      search?: string;
      school_id?: string;
      class_id?: string;
      status?: string;
    }
  ): Promise<StudentsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.school_id) params.append('school_id', filters.school_id);
    if (filters?.class_id) params.append('class_id', filters.class_id);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get<StudentsResponse>(`/superadmin/manage/students/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed information for a specific student
   */
  async getStudentDetail(studentId: string): Promise<StudentDetail> {
    const response = await api.get<StudentDetail>(`/superadmin/manage/students/${studentId}/`);
    return response.data;
  },

  /**
   * Toggle student active status
   */
  async toggleStudentStatus(studentId: string, isActive: boolean): Promise<void> {
    await api.post(`/superadmin/manage/students/${studentId}/toggle_status/`, {
      is_active: isActive
    });
  },

  // ========== ANNOUNCEMENTS ==========

  /**
   * Get paginated list of all announcements
   */
  async getAnnouncements(
    page: number = 1,
    pageSize: number = 12,
    filters?: {
      search?: string;
      status?: string;
      priority?: string;
    }
  ): Promise<AnnouncementsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const response = await api.get<AnnouncementsResponse>(`/superadmin/manage/announcements/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed announcement information
   */
  async getAnnouncementDetail(announcementId: string): Promise<AnnouncementDetail> {
    const response = await api.get<AnnouncementDetail>(`/superadmin/manage/announcements/${announcementId}/`);
    return response.data;
  },

  /**
   * Create a new announcement
   */
  async createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
    const response = await api.post<{ success: boolean; announcement: Announcement }>('/superadmin/manage/announcements/', data);
    return response.data.announcement;
  },

  /**
   * Publish an announcement
   */
  async publishAnnouncement(announcementId: string): Promise<void> {
    await api.post(`/superadmin/manage/announcements/${announcementId}/publish/`);
  },

  /**
   * Archive an announcement
   */
  async archiveAnnouncement(announcementId: string): Promise<void> {
    await api.post(`/superadmin/manage/announcements/${announcementId}/archive/`);
  },

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(announcementId: string): Promise<void> {
    await api.delete(`/superadmin/manage/announcements/${announcementId}/`);
  },

  // ========== ADMIN TASKS ==========

  /**
   * Get paginated list of all admin tasks
   */
  async getAdminTasks(
    page: number = 1,
    pageSize: number = 12,
    filters?: {
      search?: string;
      status?: string;
      priority?: string;
      assigned_to?: string;
      school_id?: string;
    }
  ): Promise<AdminTasksResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.school_id) params.append('school_id', filters.school_id);
    
    const response = await api.get<AdminTasksResponse>(`/superadmin/manage/admin-tasks/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed admin task information with replies
   */
  async getAdminTaskDetail(taskId: string): Promise<AdminTaskDetail> {
    const response = await api.get<AdminTaskDetail>(`/superadmin/manage/admin-tasks/${taskId}/`);
    return response.data;
  },

  /**
   * Create a new admin task
   */
  async createAdminTask(data: CreateAdminTaskData): Promise<AdminTask> {
    const response = await api.post<{ success: boolean; task: AdminTask }>('/superadmin/manage/admin-tasks/', data);
    return response.data.task;
  },

  /**
   * Update admin task status
   */
  async updateAdminTaskStatus(taskId: string, status: string): Promise<void> {
    await api.post(`/superadmin/manage/admin-tasks/${taskId}/update_status/`, { status });
  },

  /**
   * Add a reply to an admin task
   */
  async addAdminTaskReply(taskId: string, message: string): Promise<AdminTaskReply> {
    const response = await api.post<{ success: boolean; reply: AdminTaskReply }>(`/superadmin/manage/admin-tasks/${taskId}/add_reply/`, { message });
    return response.data.reply;
  },

  /**
   * Delete an admin task
   */
  async deleteAdminTask(taskId: string): Promise<void> {
    await api.delete(`/superadmin/manage/admin-tasks/${taskId}/`);
  },
};

export default superAdminDashboardService;


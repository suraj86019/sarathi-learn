/**
 * Admin Service
 * API calls for admin and teacher management (Super Admin operations)
 */

import api from './api';

export interface CreateAdminData {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  school_id: string;
  employee_id: string;
  designation?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface CreateTeacherData {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  school_id: string;
  employee_id: string;
  subject_ids: string[];  // Array of subject IDs
  qualification?: string;
  experience_years?: number;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface AdminProfile {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    phone?: string;
    status: string;
  };
  school: {
    id: string;
    name: string;
    udise_code: string;
  };
  employee_id: string;
  designation?: string;
  created_at: string;
}

export interface TeacherProfile {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    phone?: string;
    status: string;
  };
  school: {
    id: string;
    name: string;
    udise_code: string;
  };
  employee_id: string;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  qualification?: string;
  experience_years: number;
  created_at: string;
}

const adminService = {
  /**
   * Create new admin (Super Admin only)
   */
  async createAdmin(adminData: CreateAdminData): Promise<AdminProfile> {
    const response = await api.post<AdminProfile>('/superadmin/admins/', adminData);
    return response.data;
  },

  /**
   * Create new teacher (Super Admin or Admin)
   */
  async createTeacher(teacherData: CreateTeacherData): Promise<TeacherProfile> {
    const response = await api.post<TeacherProfile>('/superadmin/teachers/', teacherData);
    return response.data;
  },

  /**
   * Get all admins
   */
  async getAdmins(params?: {
    school_id?: string;
    search?: string;
    status?: string;
  }): Promise<AdminProfile[]> {
    const response = await api.get<{ results: AdminProfile[] }>('/admins/', { params });
    return response.data.results;
  },

  /**
   * Get all teachers
   */
  async getTeachers(params?: {
    school_id?: string;
    search?: string;
    status?: string;
  }): Promise<TeacherProfile[]> {
    const response = await api.get<{ results: TeacherProfile[] }>('/teachers/', { params });
    return response.data.results;
  },

  /**
   * Get admin by ID
   */
  async getAdmin(id: string): Promise<AdminProfile> {
    const response = await api.get<AdminProfile>(`/admins/${id}/`);
    return response.data;
  },

  /**
   * Get teacher by ID
   */
  async getTeacher(id: string): Promise<TeacherProfile> {
    const response = await api.get<TeacherProfile>(`/teachers/${id}/`);
    return response.data;
  },

  /**
   * Update admin
   */
  async updateAdmin(id: string, adminData: Partial<CreateAdminData>): Promise<AdminProfile> {
    const response = await api.patch<AdminProfile>(`/admins/${id}/`, adminData);
    return response.data;
  },

  /**
   * Update teacher
   */
  async updateTeacher(id: string, teacherData: Partial<CreateTeacherData>): Promise<TeacherProfile> {
    const response = await api.patch<TeacherProfile>(`/teachers/${id}/`, teacherData);
    return response.data;
  },

  /**
   * Delete admin
   */
  async deleteAdmin(id: string): Promise<void> {
    await api.delete(`/admins/${id}/`);
  },

  /**
   * Delete teacher
   */
  async deleteTeacher(id: string): Promise<void> {
    await api.delete(`/teachers/${id}/`);
  },

  /**
   * Approve admin
   */
  async approveAdmin(id: string): Promise<AdminProfile> {
    const response = await api.post<{ data: AdminProfile }>(`/admins/${id}/approve/`);
    return response.data.data;
  },

  /**
   * Approve teacher
   */
  async approveTeacher(id: string): Promise<TeacherProfile> {
    const response = await api.post<{ data: TeacherProfile }>(`/teachers/${id}/approve/`);
    return response.data.data;
  },
};

export default adminService;


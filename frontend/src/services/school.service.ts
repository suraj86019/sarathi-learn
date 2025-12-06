/**
 * School Service
 * API calls for school management
 */

import api from './api';

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
  established_date?: string;
  board?: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type: 'BASIC' | 'STANDARD' | 'PREMIUM';
  ai_quota_limit: number;
  ai_quota_used: number;
  ai_quota_percentage: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  total_users: number;
  created_at: string;
  updated_at: string;
}

export interface SchoolListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: School[];
}

export interface SchoolStatistics {
  total_admins: number;
  total_teachers: number;
  total_students: number;
  total_users: number;
  total_classes: number;
  ai_quota_used: number;
  ai_quota_limit: number;
  ai_quota_percentage: number;
}

const schoolService = {
  /**
   * Get all schools with optional filters
   */
  async getSchools(params?: {
    search?: string;
    status?: string;
    state?: string;
    district?: string;
    page?: number;
  }): Promise<SchoolListResponse> {
    const response = await api.get<SchoolListResponse>('/superadmin/schools/', { params });
    return response.data;
  },

  /**
   * Get single school by ID
   */
  async getSchool(id: string): Promise<School> {
    const response = await api.get<School>(`/superadmin/schools/${id}/`);
    return response.data;
  },

  /**
   * Create new school
   */
  async createSchool(schoolData: Partial<School>): Promise<School> {
    const response = await api.post<School>('/superadmin/schools/', schoolData);
    return response.data;
  },

  /**
   * Update school
   */
  async updateSchool(id: string, schoolData: Partial<School>): Promise<School> {
    const response = await api.put<School>(`/superadmin/schools/${id}/`, schoolData);
    return response.data;
  },

  /**
   * Delete school
   */
  async deleteSchool(id: string): Promise<void> {
    await api.delete(`/superadmin/schools/${id}/`);
  },

  /**
   * Approve school
   */
  async approveSchool(id: string): Promise<School> {
    const response = await api.post<{ data: School }>(`/superadmin/schools/${id}/approve/`);
    return response.data.data;
  },

  /**
   * Suspend school
   */
  async suspendSchool(id: string): Promise<School> {
    const response = await api.post<{ data: School }>(`/superadmin/schools/${id}/suspend/`);
    return response.data.data;
  },

  /**
   * Get school statistics
   */
  async getSchoolStatistics(id: string): Promise<SchoolStatistics> {
    const response = await api.get<{ data: SchoolStatistics }>(`/superadmin/schools/${id}/statistics/`);
    return response.data.data;
  },

  /**
   * Search schools
   */
  async searchSchools(query: string): Promise<School[]> {
    const response = await api.get<SchoolListResponse>('/superadmin/schools/', {
      params: { search: query }
    });
    return response.data.results;
  },

  /**
   * Get schools by state
   */
  async getSchoolsByState(state: string): Promise<School[]> {
    const response = await api.get<SchoolListResponse>('/superadmin/schools/', {
      params: { state }
    });
    return response.data.results;
  },
};

export default schoolService;


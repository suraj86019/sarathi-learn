/**
 * Subject Service
 * API calls for subject management
 */

import api from './api';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'CORE' | 'ELECTIVE' | 'VOCATIONAL' | 'EXTRA_CURRICULAR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subject[];
}

export interface SubjectsByCategory {
  core: Subject[];
  elective: Subject[];
  vocational: Subject[];
  extra_curricular: Subject[];
}

const subjectService = {
  /**
   * Get all subjects with optional filters
   * Note: This endpoint doesn't require authentication
   */
  async getSubjects(params?: {
    search?: string;
    category?: string;
    page?: number;
  }): Promise<SubjectListResponse> {
    const response = await api.get<SubjectListResponse>('/superadmin/subjects/', { params });
    return response.data;
  },

  /**
   * Get single subject by ID
   */
  async getSubject(id: string): Promise<Subject> {
    const response = await api.get<Subject>(`/superadmin/subjects/${id}/`);
    return response.data;
  },

  /**
   * Get subjects grouped by category
   */
  async getSubjectsByCategory(): Promise<SubjectsByCategory> {
    const response = await api.get<{ data: SubjectsByCategory }>('/subjects/by_category/');
    return response.data.data;
  },

  /**
   * Search subjects
   */
  async searchSubjects(query: string): Promise<Subject[]> {
    const response = await api.get<SubjectListResponse>('/superadmin/subjects/', {
      params: { search: query }
    });
    return response.data.results;
  },

  /**
   * Get subjects by category
   */
  async getSubjectsByCategoryFilter(category: string): Promise<Subject[]> {
    const response = await api.get<SubjectListResponse>('/superadmin/subjects/', {
      params: { category }
    });
    return response.data.results;
  },

  /**
   * Create new subject (Super Admin only)
   */
  async createSubject(subjectData: Partial<Subject>): Promise<Subject> {
    const response = await api.post<Subject>('/superadmin/subjects/', subjectData);
    return response.data;
  },

  /**
   * Update subject (Super Admin only)
   */
  async updateSubject(id: string, subjectData: Partial<Subject>): Promise<Subject> {
    const response = await api.put<Subject>(`/superadmin/subjects/${id}/`, subjectData);
    return response.data;
  },

  /**
   * Delete subject (Super Admin only)
   */
  async deleteSubject(id: string): Promise<void> {
    await api.delete(`/superadmin/subjects/${id}/`);
  },
};

export default subjectService;


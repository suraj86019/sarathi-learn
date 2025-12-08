/**
 * Class Service
 * API calls for class management
 * 
 * New Structure:
 * - Class = Templates (Grade 1-12) with subjects attached
 * - SchoolClass = Mapping between schools and classes
 */

import api from './api';
import { Subject } from './subject.service';

// Class Template (Grade 1-12)
export interface ClassTemplate {
  id: string;
  grade_number: number;
  name: string;
  description?: string;
  is_active: boolean;
  subjects: string[];
  subject_details?: Subject[];
  full_name: string;
  created_at: string;
  updated_at: string;
}

// School-Class Mapping
export interface SchoolClass {
  id: string;
  school: string;
  school_name: string;
  class_obj: string;
  class_name: string;
  grade_number: number;
  section?: string;
  class_teacher?: string;
  class_teacher_name?: string;
  room_number?: string;
  max_students: number;
  current_students: number;
  academic_year: string;
  is_active: boolean;
  subject_details?: Subject[];
  full_name: string;
  is_full: boolean;
  available_seats: number;
  created_at: string;
  updated_at: string;
}

export interface ClassListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClassTemplate[];
}

export interface SchoolClassListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SchoolClass[];
}

// For backward compatibility
export type ClassItem = ClassTemplate;

const classService = {
  // ==================== CLASS TEMPLATES ====================
  
  /**
   * Get all class templates (Grade 1-12)
   */
  async getClasses(params?: {
    grade_number?: number;
    is_active?: boolean;
    search?: string;
    page?: number;
  }): Promise<ClassListResponse> {
    const response = await api.get<ClassListResponse>('/superadmin/classes/', { params });
    return response.data;
  },

  /**
   * Get single class template by ID
   */
  async getClass(id: string): Promise<ClassTemplate> {
    const response = await api.get<ClassTemplate>(`/superadmin/classes/${id}/`);
    return response.data;
  },

  /**
   * Create new class template
   */
  async createClass(data: {
    grade_number: number;
    name: string;
    description?: string;
    subjects?: string[];
  }): Promise<ClassTemplate> {
    const response = await api.post<ClassTemplate>('/superadmin/classes/', data);
    return response.data;
  },

  /**
   * Update class template
   */
  async updateClass(id: string, data: Partial<{
    name: string;
    description: string;
    subjects: string[];
    is_active: boolean;
  }>): Promise<ClassTemplate> {
    const response = await api.patch<ClassTemplate>(`/superadmin/classes/${id}/`, data);
    return response.data;
  },

  /**
   * Delete class template
   */
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/superadmin/classes/${id}/`);
  },

  /**
   * Add subjects to a class template
   */
  async addSubjects(classId: string, subjectIds: string[]): Promise<{ status: string; count: number }> {
    const response = await api.post(`/superadmin/classes/${classId}/add_subjects/`, {
      subject_ids: subjectIds
    });
    return response.data;
  },

  /**
   * Remove subjects from a class template
   */
  async removeSubjects(classId: string, subjectIds: string[]): Promise<{ status: string; count: number }> {
    const response = await api.post(`/superadmin/classes/${classId}/remove_subjects/`, {
      subject_ids: subjectIds
    });
    return response.data;
  },

  // ==================== SCHOOL-CLASS MAPPINGS ====================

  /**
   * Get all school-class mappings
   */
  async getSchoolClasses(params?: {
    school?: string;
    class_obj?: string;
    section?: string;
    academic_year?: string;
    is_active?: boolean;
    page?: number;
  }): Promise<SchoolClassListResponse> {
    const response = await api.get<SchoolClassListResponse>('/superadmin/school-classes/', { params });
    return response.data;
  },

  /**
   * Get school-class mappings for a specific school
   */
  async getSchoolClassesBySchool(schoolId: string): Promise<SchoolClass[]> {
    const response = await api.get<SchoolClassListResponse>('/superadmin/school-classes/', {
      params: { school: schoolId }
    });
    return response.data.results;
  },

  /**
   * Get single school-class mapping
   */
  async getSchoolClass(id: string): Promise<SchoolClass> {
    const response = await api.get<SchoolClass>(`/superadmin/school-classes/${id}/`);
    return response.data;
  },

  /**
   * Add a class to a school (create school-class mapping)
   */
  async addClassToSchool(data: {
    school: string;
    class_obj: string;
    section?: string;
    academic_year?: string;
    room_number?: string;
    max_students?: number;
  }): Promise<SchoolClass> {
    const response = await api.post<SchoolClass>('/superadmin/school-classes/', data);
    return response.data;
  },

  /**
   * Update school-class mapping
   */
  async updateSchoolClass(id: string, data: Partial<{
    section: string;
    class_teacher: string;
    room_number: string;
    max_students: number;
    academic_year: string;
    is_active: boolean;
  }>): Promise<SchoolClass> {
    const response = await api.patch<SchoolClass>(`/superadmin/school-classes/${id}/`, data);
    return response.data;
  },

  /**
   * Remove a class from a school (delete school-class mapping)
   */
  async removeClassFromSchool(id: string): Promise<void> {
    await api.delete(`/superadmin/school-classes/${id}/`);
  },
};

export default classService;

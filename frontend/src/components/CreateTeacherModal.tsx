/**
 * Create Teacher Modal
 * Modal component for creating new teacher users
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService, { CreateTeacherData } from '@/services/admin.service';
import schoolService, { School } from '@/services/school.service';
import subjectService, { Subject } from '@/services/subject.service';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTeacherModal({ isOpen, onClose, onSuccess }: CreateTeacherModalProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [formData, setFormData] = useState<CreateTeacherData>({
    email: '',
    phone: '',
    password: '',
    first_name: '',
    last_name: '',
    school_id: '',
    employee_id: '',
    subject_ids: [],
    qualification: '',
    experience_years: 0,
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadSchools();
      loadSubjects();
    }
  }, [isOpen]);

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await schoolService.getSchools({ status: 'ACTIVE' });
      setSchools(response.results);
      if (response.results.length === 0) {
        toast.error('No active schools found');
      }
    } catch (error: any) {
      console.error('Failed to load schools:', error);
      toast.error('Failed to load schools. Please try again.');
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await subjectService.getSubjects();
      setSubjects(response.results);
      if (response.results.length === 0) {
        toast.error('No subjects found');
      }
    } catch (error: any) {
      console.error('Failed to load subjects:', error);
      toast.error('Failed to load subjects. Please try again.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-fill password when employee_id changes
    if (name === 'employee_id') {
      setFormData({
        ...formData,
        employee_id: value,
        password: value, // Use employee_id as default password
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'experience_years' ? parseInt(value) || 0 : value,
      });
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData({
      ...formData,
      subject_ids: formData.subject_ids.includes(subjectId)
        ? formData.subject_ids.filter(id => id !== subjectId)
        : [...formData.subject_ids, subjectId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.employee_id) {
      toast.error('Employee ID is required');
      return;
    }
    
    if (!formData.school_id) {
      toast.error('Please select a school');
      return;
    }
    
    if (formData.subject_ids.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    setLoading(true);

    try {
      // Use employee_id as password if not explicitly set
      const submitData = {
        ...formData,
        password: formData.password || formData.employee_id,
      };
      
      await adminService.createTeacher(submitData);
      toast.success('Teacher created successfully! Default password is Employee ID.');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        email: '',
        phone: '',
        password: '',
        first_name: '',
        last_name: '',
        school_id: '',
        employee_id: '',
        subject_ids: [],
        qualification: '',
        experience_years: 0,
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create teacher';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create New Teacher</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* School Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign School *
            </label>
            <select
              name="school_id"
              value={formData.school_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={loadingSchools}
            >
              <option value="">
                {loadingSchools ? 'Loading schools...' : schools.length === 0 ? 'No schools available' : 'Select school...'}
              </option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.city}, {school.state}
                </option>
              ))}
            </select>
            {schools.length === 0 && !loadingSchools && (
              <p className="text-xs text-red-500 mt-1">
                No schools found. Please contact Super Admin.
              </p>
            )}
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Employee ID - Acts as default password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID *
            </label>
            <input
              type="text"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter unique employee ID"
              required
              minLength={4}
            />
            <p className="text-xs text-blue-600 mt-1">
              💡 This will be used as the default password. User can change it later.
            </p>
          </div>

          {/* Qualification and Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g., M.Sc Mathematics, B.Ed"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience (Years)
              </label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                min="0"
                max="50"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Subjects Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject * (Select at least one)
            </label>
            {loadingSubjects ? (
              <div className="text-center py-8 text-gray-500">
                Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8 text-red-500">
                No subjects found. Please contact Super Admin.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
                  {subjects.map((subject) => (
                    <label key={subject.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.subject_ids.includes(subject.id)}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{subject.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Selected: {formData.subject_ids.length} subject(s)
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


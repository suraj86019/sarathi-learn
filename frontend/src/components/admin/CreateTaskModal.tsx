import { useState, useEffect } from 'react';
import { X, ClipboardList, Loader2, Users, GraduationCap, School } from 'lucide-react';
import adminDashboardService, { CreateTaskData, Teacher, Student, School as SchoolType } from '../../services/adminDashboard.service';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schools?: SchoolType[];
  schoolId?: string;
  schoolName?: string;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess, schools: propSchools = [], schoolId, schoolName }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolType[]>(propSchools);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schoolId || '');

  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    task_type: 'HOMEWORK',
    assigned_to_role: 'STUDENT',
    assigned_to_ids: [],
    due_date: '',
    priority: 'MEDIUM',
    school_id: schoolId,
  });

  // Update schools when props change
  useEffect(() => {
    if (propSchools && propSchools.length > 0) {
      setSchools(propSchools);
      setLoadingSchools(false);
    }
  }, [propSchools]);

  // Load schools if not provided
  useEffect(() => {
    if (isOpen && (!propSchools || propSchools.length === 0)) {
      loadSchools();
    }
  }, [isOpen, propSchools]);

  // Set initial school
  useEffect(() => {
    if (isOpen && !selectedSchoolId && schools.length > 0) {
      const firstSchool = schoolId || schools[0].id;
      setSelectedSchoolId(firstSchool);
      setFormData(prev => ({ ...prev, school_id: firstSchool }));
    }
  }, [isOpen, schools, schoolId, selectedSchoolId]);

  // Load users when school changes
  useEffect(() => {
    if (isOpen && selectedSchoolId) {
      loadUsers();
    }
  }, [isOpen, selectedSchoolId]);

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      const data = await adminDashboardService.getSchools();
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadUsers = async () => {
    if (!selectedSchoolId) return;
    
    try {
      setLoadingUsers(true);
      const [teachersData, studentsData] = await Promise.all([
        adminDashboardService.getTeachers({ school_id: selectedSchoolId, page_size: 100 }),
        adminDashboardService.getStudents({ school_id: selectedSchoolId, page_size: 100 }),
      ]);
      setTeachers(teachersData.teachers || []);
      setStudents(studentsData.students || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSchoolChange = (newSchoolId: string) => {
    setSelectedSchoolId(newSchoolId);
    setFormData(prev => ({
      ...prev,
      school_id: newSchoolId,
      assigned_to_ids: [], // Reset selections when school changes
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: 'STUDENT' | 'TEACHER') => {
    setFormData(prev => ({
      ...prev,
      assigned_to_role: role,
      assigned_to_ids: [], // Reset selection when role changes
    }));
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => {
      const current = prev.assigned_to_ids || [];
      const updated = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      return { ...prev, assigned_to_ids: updated };
    });
  };

  const selectAll = () => {
    const users = formData.assigned_to_role === 'STUDENT' ? students : teachers;
    const allIds = users.map(u => formData.assigned_to_role === 'STUDENT' 
      ? (u as Student).user.id 
      : (u as Teacher).user.id
    );
    setFormData(prev => ({ ...prev, assigned_to_ids: allIds }));
  };

  const clearAll = () => {
    setFormData(prev => ({ ...prev, assigned_to_ids: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.assigned_to_ids || formData.assigned_to_ids.length === 0) {
      setError('Please select at least one assignee');
      return;
    }

    setLoading(true);

    try {
      await adminDashboardService.createTask(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        task_type: 'HOMEWORK',
        assigned_to_role: 'STUDENT',
        assigned_to_ids: [],
        due_date: '',
        priority: 'MEDIUM',
        school_id: schoolId,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const assigneeList = formData.assigned_to_role === 'STUDENT' ? students : teachers;
  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-base sm:text-xl font-bold">Create Task</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* School Selection */}
            {!schoolId && schools.length > 0 && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                  Select School *
                </label>
                {loadingSchools ? (
                  <div className="flex items-center gap-2 py-2 sm:py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-gray-500 text-xs sm:text-sm">Loading schools...</span>
                  </div>
                ) : (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  >
                    <option value="">Select a school</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* School Info (if preselected) */}
            {schoolName && (
              <div className="bg-amber-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-amber-100">
                <p className="text-amber-700 text-xs sm:text-sm">
                  <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                  Creating task for: <span className="font-semibold">{schoolName}</span>
                </p>
              </div>
            )}

            {/* Task Details */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 sm:mb-4">Task Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    placeholder="Task title"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                    placeholder="Task description..."
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Task Type *</label>
                  <select
                    name="task_type"
                    value={formData.task_type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  >
                    <option value="HOMEWORK">Homework</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="PROJECT">Project</option>
                    <option value="ACTIVITY">Activity</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Due Date *</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Assignees */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 sm:mb-4">Assign To</h3>

              {/* Role Selection */}
              <div className="flex gap-2 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => handleRoleChange('STUDENT')}
                  className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                    formData.assigned_to_role === 'STUDENT'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('TEACHER')}
                  className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                    formData.assigned_to_role === 'TEACHER'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Teachers
                </button>
              </div>

              {/* Selection Actions */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-sm text-gray-600">
                  {formData.assigned_to_ids.length} selected
                  {selectedSchool && <span className="text-gray-400 hidden sm:inline"> from {selectedSchool.name}</span>}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[10px] sm:text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[10px] sm:text-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* User List */}
              {!selectedSchoolId ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 border border-gray-200 rounded-lg">
                  <School className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm">Please select a school first</p>
                </div>
              ) : loadingUsers ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 sm:max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {assigneeList.map(user => {
                    const isStudent = formData.assigned_to_role === 'STUDENT';
                    const userId = isStudent ? (user as Student).user.id : (user as Teacher).user.id;
                    const userName = isStudent ? (user as Student).user.full_name : (user as Teacher).user.full_name;
                    const subtitle = isStudent 
                      ? (user as Student).full_class_name 
                      : (user as Teacher).employee_id;

                    return (
                      <label
                        key={userId}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all ${
                          formData.assigned_to_ids.includes(userId)
                            ? 'bg-amber-50 border-2 border-amber-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.assigned_to_ids.includes(userId)}
                          onChange={() => handleUserToggle(userId)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-xs sm:text-sm">{userName}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{subtitle}</p>
                        </div>
                      </label>
                    );
                  })}

                  {assigneeList.length === 0 && (
                    <div className="col-span-2 text-center py-6 sm:py-8 text-gray-500">
                      <p className="text-xs sm:text-sm">No {formData.assigned_to_role.toLowerCase()}s found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedSchoolId}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Create</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Bell, Loader2, Mail, MessageSquare, School, Users, GraduationCap } from 'lucide-react';
import adminDashboardService, { CreateNotificationData, School as SchoolType } from '../../services/adminDashboard.service';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schools?: SchoolType[];
}

type TargetRole = 'ALL' | 'TEACHER' | 'STUDENT';

export default function CreateNotificationModal({ isOpen, onClose, onSuccess, schools: propSchools }: CreateNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolType[]>(propSchools || []);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState<CreateNotificationData>({
    title: '',
    message: '',
    notification_type: 'IN_APP',
    target_schools: [],
    school_target_roles: [],
    scheduled_date: '',
    priority: 'MEDIUM',
  });

  // Target role selection
  const [targetRole, setTargetRole] = useState<TargetRole>('ALL');

  // Load schools if not provided
  useEffect(() => {
    if (isOpen && (!propSchools || propSchools.length === 0)) {
      loadSchools();
    }
  }, [isOpen, propSchools]);

  const loadSchools = async () => {
    try {
      setLoadingData(true);
      const data = await adminDashboardService.getSchools();
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSchoolToggle = (schoolId: string) => {
    setFormData(prev => {
      const current = prev.target_schools || [];
      const updated = current.includes(schoolId)
        ? current.filter(id => id !== schoolId)
        : [...current, schoolId];
      return { ...prev, target_schools: updated };
    });
  };

  const selectAllSchools = () => {
    setFormData(prev => ({
      ...prev,
      target_schools: schools.map(s => s.id)
    }));
  };

  const clearAllSchools = () => {
    setFormData(prev => ({
      ...prev,
      target_schools: []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Build the payload
    const payload: CreateNotificationData = {
      ...formData,
      school_target_roles: targetRole === 'ALL' ? [] : [targetRole],
    };

    // If no schools selected, use all schools
    if (!payload.target_schools || payload.target_schools.length === 0) {
      payload.target_schools = schools.map(s => s.id);
    }

    setLoading(true);

    try {
      await adminDashboardService.createNotification(payload);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        message: '',
        notification_type: 'IN_APP',
        target_schools: [],
        school_target_roles: [],
        scheduled_date: '',
        priority: 'MEDIUM',
      });
      setTargetRole('ALL');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-base sm:text-xl font-bold">Create Notification</h2>
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
            {/* Notification Details */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 sm:mb-4">Notification Details</h3>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Notification title"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                    placeholder="Enter notification message..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notification Type</label>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notification_type: 'IN_APP' }))}
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                          formData.notification_type === 'IN_APP'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Bell Only</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notification_type: 'EMAIL' }))}
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                          formData.notification_type === 'EMAIL'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notification_type: 'SMS' }))}
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                          formData.notification_type === 'SMS'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>SMS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notification_type: 'BOTH' }))}
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                          formData.notification_type === 'BOTH'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>Email + SMS</span>
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {formData.notification_type === 'IN_APP' && '📢 Shows in bell notification only (no email/SMS sent)'}
                      {formData.notification_type === 'EMAIL' && '📧 Sends email + shows in bell notification'}
                      {formData.notification_type === 'SMS' && '💬 Sends SMS + shows in bell notification'}
                      {formData.notification_type === 'BOTH' && '📧💬 Sends both email & SMS + shows in bell notification'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
                </div>
              </div>
            </div>

            {/* Target Selection */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 sm:mb-4">Send To</h3>

              {/* Target Role Selection */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Target Users *</label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('ALL')}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                      targetRole === 'ALL'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">All Users</span>
                    <span className="sm:hidden">All</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('TEACHER')}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                      targetRole === 'TEACHER'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Teachers</span>
                    <span className="sm:hidden">Tchr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('STUDENT')}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                      targetRole === 'STUDENT'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Students</span>
                    <span className="sm:hidden">Stud</span>
                  </button>
                </div>
              </div>

              {/* School Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Select Schools</label>
                  <div className="flex gap-2 text-[10px] sm:text-sm">
                    <button
                      type="button"
                      onClick={selectAllSchools}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllSchools}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                  Leave empty to send to all {schools.length} schools
                </p>

                {loadingData ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-36 sm:max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {schools.map(school => (
                      <label
                        key={school.id}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all ${
                          formData.target_schools?.includes(school.id)
                            ? 'bg-purple-100 border-2 border-purple-300'
                            : 'bg-white border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.target_schools?.includes(school.id) || false}
                          onChange={() => handleSchoolToggle(school.id)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-xs sm:text-sm">{school.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">{school.total_students} students</p>
                          </div>
                        </div>
                      </label>
                    ))}

                    {schools.length === 0 && (
                      <div className="text-center py-4 sm:py-6 text-gray-500 text-xs sm:text-sm">
                        No schools available
                      </div>
                    )}
                  </div>
                )}

                {/* Selection Summary */}
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-purple-700">
                    <strong>Summary:</strong> Sending to{' '}
                    <span className="font-semibold">
                      {targetRole === 'ALL' ? 'all users' : targetRole === 'TEACHER' ? 'teachers' : 'students'}
                    </span>
                    {' '}in{' '}
                    <span className="font-semibold">
                      {formData.target_schools && formData.target_schools.length > 0
                        ? `${formData.target_schools.length} school(s)`
                        : `all ${schools.length} schools`
                      }
                    </span>
                  </p>
                </div>
              </div>
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
              disabled={loading}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{formData.scheduled_date ? 'Schedule' : 'Send'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

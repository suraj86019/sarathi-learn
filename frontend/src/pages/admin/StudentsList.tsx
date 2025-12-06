import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  BarChart3,
  Brain,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  MoreVertical,
  Ban,
  UserCheck,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import adminDashboardService, { Student, StudentReport, Pagination, School } from '../../services/adminDashboard.service';
import AddStudentModal from '../../components/admin/AddStudentModal';

interface StudentsListProps {
  onBack: () => void;
  schools?: School[];
}

export default function StudentsList({ onBack, schools = [] }: StudentsListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentReport, setStudentReport] = useState<StudentReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });

  // Filter state
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('');
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Initial load
  useEffect(() => {
    loadStudents();
    setIsInitialMount(false);
  }, []);

  // Load on pagination or filter change (skip initial)
  useEffect(() => {
    if (!isInitialMount) {
      loadStudents();
    }
  }, [pagination.page, selectedSchoolFilter]);

  // Debounced search (skip initial)
  useEffect(() => {
    if (isInitialMount) return;
    
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadStudents();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getStudents({
        page: pagination.page,
        page_size: pagination.page_size,
        search: searchTerm,
        school_id: selectedSchoolFilter || undefined,
      });
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingReport(true);
    try {
      const report = await adminDashboardService.getStudentReport({
        student_id: student.id,
        include_attendance: true,
        include_homework: true,
        include_ai_usage: true,
      });
      setStudentReport(report);
    } catch (err) {
      console.error('Failed to load student report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCloseReport = () => {
    setSelectedStudent(null);
    setStudentReport(null);
  };

  const handleAction = async (studentId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND' | 'REMOVE') => {
    setPerformingAction(true);
    try {
      await adminDashboardService.performStudentAction(studentId, { action });
      loadStudents();
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Failed to perform action:', err);
    } finally {
      setPerformingAction(false);
    }
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-600';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600" />
              Students
            </h1>
            <p className="text-xs sm:text-base text-gray-500 mt-0.5 sm:mt-1">
              {pagination.total_count} students
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium shadow-lg text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Student
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
        {schools.length > 1 && (
          <select
            value={selectedSchoolFilter}
            onChange={(e) => {
              setSelectedSchoolFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:min-w-[200px]"
          >
            <option value="">All Schools</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {students.map(student => (
              <div key={student.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {student.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{student.user.full_name}</p>
                        <p className="text-xs text-gray-500">Roll: {student.roll_no || '-'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${getStatusColor(student.user.status)}`}>
                        {student.user.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p className="truncate"><span className="text-gray-400">School:</span> {student.school_name}</p>
                      <p><span className="text-gray-400">Class:</span> {student.full_class_name || '-'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-400">AI:</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getQuotaColor(student.ai_quota_percentage)}`} style={{ width: `${student.ai_quota_percentage}%` }} />
                        </div>
                        <span className="text-[10px]">{student.ai_quota_percentage}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleViewReport(student)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-emerald-600 bg-emerald-50 rounded-lg text-xs font-medium"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Report
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === student.id ? null : student.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenuOpen === student.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                            {student.user.is_active ? (
                              <button
                                onClick={() => handleAction(student.id, 'DEACTIVATE')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <Ban className="w-3 h-3" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(student.id, 'ACTIVATE')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <UserCheck className="w-3 h-3" />
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(student.id, 'REMOVE')}
                              disabled={performingAction}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Student</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">UDISE ID</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">School</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Class</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-semibold text-gray-700">AI Quota</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                          {student.user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm lg:text-base">{student.user.full_name}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{student.roll_no && `Roll: ${student.roll_no}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="font-mono text-xs lg:text-sm text-gray-700">{student.udise_student_id}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="text-xs lg:text-sm text-gray-700 bg-emerald-50 px-2 py-1 rounded-lg truncate max-w-[120px] inline-block">{student.school_name}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="px-2 lg:px-2.5 py-0.5 lg:py-1 bg-blue-50 text-blue-700 rounded-lg text-xs lg:text-sm font-medium">
                        {student.full_class_name || '-'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="w-24 lg:w-32 mx-auto">
                        <div className="flex items-center justify-between text-[10px] lg:text-xs text-gray-500 mb-1">
                          <span>{student.ai_quota_used}/{student.ai_quota_limit}</span>
                          <span>{student.ai_quota_percentage}%</span>
                        </div>
                        <div className="h-1.5 lg:h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getQuotaColor(student.ai_quota_percentage)}`}
                            style={{ width: `${student.ai_quota_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                      <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${getStatusColor(student.user.status)}`}>
                        {student.user.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center justify-center gap-1 lg:gap-2">
                        <button
                          onClick={() => handleViewReport(student)}
                          className="p-1.5 lg:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Report"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === student.id ? null : student.id)}
                            className="p-1.5 lg:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuOpen === student.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 lg:w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                              {student.user.is_active ? (
                                <button
                                  onClick={() => handleAction(student.id, 'DEACTIVATE')}
                                  disabled={performingAction}
                                  className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Ban className="w-4 h-4" />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(student.id, 'ACTIVATE')}
                                  disabled={performingAction}
                                  className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => handleAction(student.id, 'SUSPEND')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-amber-600 hover:bg-amber-50"
                              >
                                <Ban className="w-4 h-4" />
                                Suspend
                              </button>
                              <button
                                onClick={() => handleAction(student.id, 'REMOVE')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="text-center py-16 sm:py-20 text-gray-500">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium">No students found</p>
              <p className="text-xs sm:text-sm">Try adjusting your search or add a new student</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.page_size) + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={!pagination.has_previous}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.has_previous}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-emerald-600 text-white'
                            : 'hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(pagination.total_pages)}
                  disabled={!pagination.has_next}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Report Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 text-white min-w-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold flex-shrink-0">
                    {selectedStudent.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">{selectedStudent.user.full_name}</h2>
                    <p className="text-emerald-100 text-xs sm:text-sm truncate">{selectedStudent.udise_student_id} • {selectedStudent.school_name}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseReport}
                  className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-100px)]">
              {loadingReport ? (
                <div className="flex items-center justify-center py-16 sm:py-20">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600" />
                </div>
              ) : studentReport && studentReport.students[0] ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Report Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {new Date(studentReport.generated_at).toLocaleDateString()}
                    </div>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(studentReport.students[0].status)}`}>
                      {studentReport.students[0].status}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Personal Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">{studentReport.students[0].name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">UDISE ID</p>
                        <p className="font-medium text-gray-900 font-mono text-xs">{studentReport.students[0].udise_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Roll Number</p>
                        <p className="font-medium text-gray-900">{studentReport.students[0].roll_no || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium text-gray-900 truncate">{studentReport.students[0].email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{studentReport.students[0].phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Gender</p>
                        <p className="font-medium text-gray-900">{studentReport.students[0].gender === 'M' ? 'Male' : studentReport.students[0].gender === 'F' ? 'Female' : '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="bg-blue-50 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Academic Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-blue-600">Class</p>
                        <p className="font-medium text-blue-900 text-base sm:text-lg">{studentReport.students[0].class || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Section</p>
                        <p className="font-medium text-blue-900 text-base sm:text-lg">{studentReport.students[0].section || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Academic Year</p>
                        <p className="font-medium text-blue-900">{studentReport.students[0].academic_year || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Enrollment</p>
                        <p className="font-medium text-blue-900">{studentReport.students[0].enrollment_date || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-700">{Math.round(studentReport.students[0].attendance_percentage || 0)}%</p>
                      <p className="text-[10px] sm:text-xs text-emerald-600">Attendance</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">{Math.round(studentReport.students[0].homework_completion_rate || 0)}%</p>
                      <p className="text-[10px] sm:text-xs text-blue-600">Homework</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">{studentReport.students[0].total_ai_sessions || 0}</p>
                      <p className="text-[10px] sm:text-xs text-purple-600">AI Sessions</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-amber-700">{studentReport.students[0].ai_quota_used || 0}</p>
                      <p className="text-[10px] sm:text-xs text-amber-600">AI Queries</p>
                    </div>
                  </div>

                  {/* AI Quota Progress */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      AI Usage Quota
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Used: {studentReport.students[0].ai_quota_used}</span>
                        <span className="text-gray-600">Limit: {studentReport.students[0].ai_quota_limit}</span>
                      </div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getQuotaColor(studentReport.students[0].ai_quota_percentage)}`}
                          style={{ width: `${studentReport.students[0].ai_quota_percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">{Math.round(studentReport.students[0].ai_quota_percentage)}% used</span>
                        <span className="font-medium text-emerald-600">
                          {studentReport.students[0].ai_quota_remaining} remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div className="bg-amber-50 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-amber-900 mb-3 sm:mb-4 text-sm sm:text-base">Parent/Guardian</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-amber-600">Name</p>
                        <p className="font-medium text-amber-900">{studentReport.students[0].parent_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-amber-600">Phone</p>
                        <p className="font-medium text-amber-900">{studentReport.students[0].parent_phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-amber-600">Email</p>
                        <p className="font-medium text-amber-900 truncate">{studentReport.students[0].parent_email || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 sm:py-20 text-gray-500">
                  <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">Failed to load report data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadStudents}
      />
    </div>
  );
}

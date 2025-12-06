import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  BarChart3,
  GraduationCap,
  Loader2,
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  UserPlus,
  MoreVertical,
  Ban,
  UserCheck,
  Trash2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
} from 'lucide-react';
import adminDashboardService, { Teacher, TeacherReport, Pagination, School } from '../../services/adminDashboard.service';
import AddTeacherModal from '../../components/admin/AddTeacherModal';
import TeacherDetailPage from './TeacherDetailPage';

interface TeachersListProps {
  onBack: () => void;
  schools?: School[];
}

export default function TeachersList({ onBack, schools = [] }: TeachersListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherReport, setTeacherReport] = useState<TeacherReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState(false);
  
  // Teacher detail page state
  const [viewingTeacherId, setViewingTeacherId] = useState<string | null>(null);
  
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
    loadTeachers();
    setIsInitialMount(false);
  }, []);

  // Load on pagination or filter change (skip initial)
  useEffect(() => {
    if (!isInitialMount) {
      loadTeachers();
    }
  }, [pagination.page, selectedSchoolFilter]);

  // Debounced search (skip initial)
  useEffect(() => {
    if (isInitialMount) return;
    
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadTeachers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getTeachers({
        page: pagination.page,
        page_size: pagination.page_size,
        search: searchTerm,
        school_id: selectedSchoolFilter || undefined,
      });
      setTeachers(data.teachers);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setLoadingReport(true);
    try {
      const report = await adminDashboardService.getTeacherReport({
        teacher_id: teacher.id,
        include_attendance: true,
        include_classes: true,
        include_homework: true,
      });
      setTeacherReport(report);
    } catch (err) {
      console.error('Failed to load teacher report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCloseReport = () => {
    setSelectedTeacher(null);
    setTeacherReport(null);
  };

  const handleAction = async (teacherId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND' | 'REMOVE') => {
    setPerformingAction(true);
    try {
      await adminDashboardService.performTeacherAction(teacherId, { action });
      loadTeachers();
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

  // Show TeacherDetailPage if a teacher is being viewed
  if (viewingTeacherId) {
    return (
      <TeacherDetailPage
        teacherId={viewingTeacherId}
        onBack={() => setViewingTeacherId(null)}
      />
    );
  }

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
              <Users className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
              Teachers
            </h1>
            <p className="text-xs sm:text-base text-gray-500 mt-0.5 sm:mt-1">
              {pagination.total_count} teachers
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Teacher
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        {schools.length > 1 && (
          <select
            value={selectedSchoolFilter}
            onChange={(e) => {
              setSelectedSchoolFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:min-w-[200px]"
          >
            <option value="">All Schools</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Teachers List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {teachers.map(teacher => (
              <div key={teacher.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div 
                    onClick={() => setViewingTeacherId(teacher.id)}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                  >
                    {teacher.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p 
                          onClick={() => setViewingTeacherId(teacher.id)}
                          className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          {teacher.user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{teacher.employee_id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${getStatusColor(teacher.user.status)}`}>
                        {teacher.user.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p className="truncate"><span className="text-gray-400">School:</span> {teacher.school_name}</p>
                      {teacher.user.email && (
                        <p className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />
                          {teacher.user.email}
                        </p>
                      )}
                      <p><span className="text-gray-400">Exp:</span> {teacher.experience_years} years</p>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setViewingTeacherId(teacher.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-emerald-600 bg-emerald-50 rounded-lg text-xs font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleViewReport(teacher)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-medium"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Report
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === teacher.id ? null : teacher.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenuOpen === teacher.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                            {teacher.user.is_active ? (
                              <button
                                onClick={() => handleAction(teacher.id, 'DEACTIVATE')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <Ban className="w-3 h-3" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(teacher.id, 'ACTIVATE')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <UserCheck className="w-3 h-3" />
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(teacher.id, 'REMOVE')}
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
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Teacher</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Employee ID</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">School</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-700 hidden lg:table-cell">Contact</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-semibold text-gray-700">Exp.</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div 
                          onClick={() => setViewingTeacherId(teacher.id)}
                          className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                        >
                          {teacher.user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p 
                            onClick={() => setViewingTeacherId(teacher.id)}
                            className="font-medium text-gray-900 text-sm lg:text-base cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {teacher.user.full_name}
                          </p>
                          <p className="text-xs lg:text-sm text-gray-500">{teacher.qualification || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="font-mono text-xs lg:text-sm text-gray-700">{teacher.employee_id}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="text-xs lg:text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded-lg truncate max-w-[120px] inline-block">{teacher.school_name}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        {teacher.user.email && (
                          <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                            <Mail className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            <span className="truncate max-w-[150px]">{teacher.user.email}</span>
                          </div>
                        )}
                        {teacher.user.phone && (
                          <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                            <Phone className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            {teacher.user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                      <span className="text-xs lg:text-sm font-medium text-gray-900">{teacher.experience_years}y</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                      <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${getStatusColor(teacher.user.status)}`}>
                        {teacher.user.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center justify-center gap-1 lg:gap-2">
                        <button
                          onClick={() => setViewingTeacherId(teacher.id)}
                          className="p-1.5 lg:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Full Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewReport(teacher)}
                          className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Quick Report"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === teacher.id ? null : teacher.id)}
                            className="p-1.5 lg:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuOpen === teacher.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 lg:w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                              {teacher.user.is_active ? (
                                <button
                                  onClick={() => handleAction(teacher.id, 'DEACTIVATE')}
                                  disabled={performingAction}
                                  className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Ban className="w-4 h-4" />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(teacher.id, 'ACTIVATE')}
                                  disabled={performingAction}
                                  className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => handleAction(teacher.id, 'SUSPEND')}
                                disabled={performingAction}
                                className="w-full flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-amber-600 hover:bg-amber-50"
                              >
                                <Ban className="w-4 h-4" />
                                Suspend
                              </button>
                              <button
                                onClick={() => handleAction(teacher.id, 'REMOVE')}
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

          {teachers.length === 0 && (
            <div className="text-center py-16 sm:py-20 text-gray-500">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium">No teachers found</p>
              <p className="text-xs sm:text-sm">Try adjusting your search or add a new teacher</p>
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
                            ? 'bg-blue-600 text-white'
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

      {/* Teacher Report Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 text-white min-w-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold flex-shrink-0">
                    {selectedTeacher.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">{selectedTeacher.user.full_name}</h2>
                    <p className="text-blue-100 text-xs sm:text-sm truncate">{selectedTeacher.employee_id} • {selectedTeacher.school_name}</p>
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
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                </div>
              ) : teacherReport && teacherReport.teachers[0] ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Report Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {new Date(teacherReport.generated_at).toLocaleDateString()}
                    </div>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(teacherReport.teachers[0].status)}`}>
                      {teacherReport.teachers[0].status}
                    </span>
                  </div>

                  {/* Teacher Info */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Personal Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">{teacherReport.teachers[0].name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Employee ID</p>
                        <p className="font-medium text-gray-900">{teacherReport.teachers[0].employee_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium text-gray-900 truncate">{teacherReport.teachers[0].email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{teacherReport.teachers[0].phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Qualification</p>
                        <p className="font-medium text-gray-900">{teacherReport.teachers[0].qualification || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Experience</p>
                        <p className="font-medium text-gray-900">{teacherReport.teachers[0].experience_years} years</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-700">{teacherReport.teachers[0].subjects_count}</p>
                      <p className="text-[10px] sm:text-xs text-emerald-600">Subjects</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">{teacherReport.teachers[0].total_classes}</p>
                      <p className="text-[10px] sm:text-xs text-blue-600">Classes</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-amber-700">{teacherReport.teachers[0].attendance_records_marked || 0}</p>
                      <p className="text-[10px] sm:text-xs text-amber-600">Attendance</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">{teacherReport.teachers[0].homework_assigned || 0}</p>
                      <p className="text-[10px] sm:text-xs text-purple-600">Homework</p>
                    </div>
                  </div>

                  {/* Subjects Section */}
                  {teacherReport.teachers[0].subjects && teacherReport.teachers[0].subjects.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-emerald-50 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-emerald-800 flex items-center gap-2 text-sm sm:text-base">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                          Subjects ({teacherReport.teachers[0].subjects.length})
                        </h3>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {teacherReport.teachers[0].subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className={`p-2.5 sm:p-3 rounded-lg border ${subject.is_primary ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 text-xs sm:text-sm">{subject.name}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-500">Code: {subject.code}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {subject.is_primary && (
                                    <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs rounded-full">Primary</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Permissions</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${teacherReport.teachers[0].can_mark_attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                        {teacherReport.teachers[0].can_mark_attendance ? '✓' : '✗'} Attendance
                      </span>
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${teacherReport.teachers[0].can_assign_homework ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                        {teacherReport.teachers[0].can_assign_homework ? '✓' : '✗'} Homework
                      </span>
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${teacherReport.teachers[0].can_grade_assignments ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                        {teacherReport.teachers[0].can_grade_assignments ? '✓' : '✗'} Grading
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 sm:py-20 text-gray-500">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">Failed to load report data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadTeachers}
      />
    </div>
  );
}

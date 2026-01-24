import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Users,
  School as SchoolIcon,
  Settings,
  UserPlus,
  Trash2,
  Eye,
  Search,
  Plus,
  Home,
  MapPin,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
  PauseCircle,
  PlayCircle,
  Phone,
  Mail,
  Calendar,
  Menu,
  LogOut,
  Bell,
  Award,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import superAdminDashboardService, {
  School,
  Admin,
  CreateSchoolData,
  CreateAdminData,
} from '../../services/superAdminDashboard.service';

type ActiveView = 'dashboard' | 'schools' | 'admins' | 'teachers' | 'students' | 'announcements' | 'tasks' | 'settings';

// ========== MAIN COMPONENT ==========

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState<ActiveView>('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    activeSchools: 0,
    pendingSchools: 0,
  });

  // Handle navigation state from SchoolDetailPage
  useEffect(() => {
    const state = location.state as { section?: ActiveView } | null;
    if (state?.section) {
      setActiveMenu(state.section);
      // Clear the state to prevent re-triggering on refresh
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      // Load initial stats - fetch counts from all endpoints
      const [schoolsData, adminsData, teachersData, studentsData] = await Promise.all([
        superAdminDashboardService.getSchools(1, 1),
        superAdminDashboardService.getAdmins(1, 1),
        superAdminDashboardService.getTeachers(1, 1),
        superAdminDashboardService.getStudents(1, 1),
      ]);
      
      setStats({
        totalSchools: schoolsData.count || 0,
        totalAdmins: adminsData.count || 0,
        totalTeachers: teachersData.count || 0,
        totalStudents: studentsData.count || 0,
        activeSchools: 0,
        pendingSchools: 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuClick = (menu: ActiveView) => {
    setActiveMenu(menu);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'schools':
        return <SchoolsSection />;
      case 'admins':
        return <AdminsSection />;
      case 'teachers':
        return <TeachersSection />;
      case 'students':
        return <StudentsSection />;
      case 'announcements':
        return <AnnouncementsSection />;
      case 'tasks':
        return <AdminTasksSection />;
      case 'settings':
        return <PlaceholderSection title="Settings" description="Platform settings and configuration" />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 rounded-2xl p-4 md:p-8 text-white">
          <h1 className="text-xl md:text-3xl font-bold mb-2">Super Admin Dashboard</h1>
          <p className="text-amber-100 text-sm md:text-base">Platform-wide management and oversight</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatCard
            icon={<SchoolIcon className="w-5 h-5 md:w-6 md:h-6" />}
            label="Total Schools"
            value={stats.totalSchools}
            color="bg-blue-500"
            onClick={() => setActiveMenu('schools')}
          />
          <StatCard
            icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
            label="Total Admins"
            value={stats.totalAdmins}
            color="bg-purple-500"
            onClick={() => setActiveMenu('admins')}
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5 md:w-6 md:h-6" />}
            label="Total Teachers"
            value={stats.totalTeachers}
            color="bg-green-500"
            onClick={() => setActiveMenu('teachers')}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
            label="Total Students"
            value={stats.totalStudents}
            color="bg-orange-500"
            onClick={() => setActiveMenu('students')}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            icon={<Plus className="w-5 h-5" />}
            title="Add New School"
            description="Register a new school on the platform"
            onClick={() => setActiveMenu('schools')}
            color="bg-blue-600"
          />
          <QuickAction
            icon={<UserPlus className="w-5 h-5" />}
            title="Add New Admin"
            description="Create admin for a school"
            onClick={() => setActiveMenu('admins')}
            color="bg-purple-600"
          />
          <QuickAction
            icon={<Bell className="w-5 h-5" />}
            title="Send Announcement"
            description="Broadcast to all schools"
            onClick={() => setActiveMenu('announcements')}
            color="bg-orange-600"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg">Super Admin</h1>
        <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-lg">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Sarathi Learn</h2>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</span>
          </div>
          <MenuItem
            icon={<Home className="w-5 h-5" />}
            label="Dashboard"
            active={activeMenu === 'dashboard'}
            onClick={() => handleMenuClick('dashboard')}
          />
          <MenuItem
            icon={<SchoolIcon className="w-5 h-5" />}
            label="Schools"
            active={activeMenu === 'schools'}
            onClick={() => handleMenuClick('schools')}
          />
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Admins"
            active={activeMenu === 'admins'}
            onClick={() => handleMenuClick('admins')}
          />
          <MenuItem
            icon={<GraduationCap className="w-5 h-5" />}
            label="Teachers"
            active={activeMenu === 'teachers'}
            onClick={() => handleMenuClick('teachers')}
          />
          <MenuItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Students"
            active={activeMenu === 'students'}
            onClick={() => handleMenuClick('students')}
          />
          <MenuItem
            icon={<Bell className="w-5 h-5" />}
            label="Announcements"
            active={activeMenu === 'announcements'}
            onClick={() => handleMenuClick('announcements')}
          />
          <MenuItem
            icon={<Award className="w-5 h-5" />}
            label="Admin Tasks"
            active={activeMenu === 'tasks'}
            onClick={() => handleMenuClick('tasks')}
          />
          <MenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={activeMenu === 'settings'}
            onClick={() => handleMenuClick('settings')}
            badge="Soon"
          />
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700/50">
                  <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
                  </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {renderContent()}
            </div>
      </main>
    </div>
  );
}


// ========== HELPER COMPONENTS ==========

function MenuItem({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
              <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all
        ${active
          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }
      `}
    >
      {icon}
      <span className="flex-1 text-left font-medium">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
          {badge}
        </span>
      )}
              </button>
  );
}

function StatCard({ icon, label, value, color, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
            </div>
        <div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs md:text-sm text-gray-500">{label}</p>
          </div>
                  </div>
                </div>
  );
}

function QuickAction({ icon, title, description, onClick, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all text-left group"
    >
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
        {icon}
                  </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
                </div>
    </button>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-10 h-10 text-gray-400" />
                  </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500">{description}</p>
        <p className="text-sm text-amber-600 mt-2">Coming Soon</p>
                </div>
                  </div>
  );
}


// ========== TEACHERS SECTION ==========

import type { Teacher, TeacherDetail } from '../../services/superAdminDashboard.service';

function TeachersSection() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadTeachers();
    loadSchools();
  }, [page, schoolFilter, statusFilter]);

  const loadSchools = async () => {
    try {
      const data = await superAdminDashboardService.getSchools(1, 100);
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getTeachers(page, 12, {
        school_id: schoolFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setTeachers(data.teachers || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load teachers:', err);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTeachers();
  };

  const handleViewTeacher = async (teacherId: string) => {
    try {
      const detail = await superAdminDashboardService.getTeacherDetail(teacherId);
      setSelectedTeacher(detail);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load teacher details');
    }
  };

  const handleToggleStatus = async (teacherId: string, currentStatus: boolean) => {
    try {
      await superAdminDashboardService.toggleTeacherStatus(teacherId, !currentStatus);
      toast.success(`Teacher ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadTeachers();
      if (selectedTeacher && selectedTeacher.id === teacherId) {
        const detail = await superAdminDashboardService.getTeacherDetail(teacherId);
        setSelectedTeacher(detail);
      }
    } catch (err) {
      toast.error('Failed to update teacher status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers Management</h2>
          <p className="text-gray-500">View and manage all teachers across schools</p>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, employee ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
                  <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            Search
                  </button>
        </div>
              </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
            </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{teacher.full_name}</h3>
                    <p className="text-xs text-gray-500">ID: {teacher.employee_id}</p>
          </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </span>
        </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                    <span className="truncate">{teacher.email}</span>
            </div>
                  {teacher.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                  {teacher.school && (
                    <div className="flex items-center text-sm text-gray-600">
                      <SchoolIcon className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      <span className="truncate">{teacher.school.name}</span>
                    </div>
                  )}
                  {teacher.primary_subject && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      <span>{teacher.primary_subject}</span>
                    </div>
                  )}
                </div>

                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {teacher.qualification && (
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs">
                      {teacher.qualification}
                    </span>
                  )}
                  {teacher.experience_years && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {teacher.experience_years} yrs exp
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
              <button
                    onClick={() => handleViewTeacher(teacher.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
              </button>
              <button
                    onClick={() => handleToggleStatus(teacher.id, teacher.is_active)}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                      teacher.is_active
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {teacher.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              </button>
            </div>
          </div>
                  </div>
          ))}
                </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <GraduationCap className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Teachers Found</h3>
          <p className="text-gray-500">No teachers match your search criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!pagination.has_previous}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
                  </div>
      )}

      {/* Teacher Detail Modal */}
      {showDetailModal && selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTeacher(null);
          }}
          onToggleStatus={handleToggleStatus}
        />
      )}
                </div>
  );
}

function TeacherDetailModal({ teacher, onClose, onToggleStatus }: {
  teacher: TeacherDetail;
  onClose: () => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
                  </div>
              <div>
                <h2 className="text-xl font-bold text-white">{teacher.full_name}</h2>
                <p className="text-teal-100">Employee ID: {teacher.employee_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    teacher.is_active 
                      ? 'bg-green-400/20 text-green-100' 
                      : 'bg-red-400/20 text-red-100'
                  }`}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {teacher.primary_subject && (
                    <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs">
                      {teacher.primary_subject}
                    </span>
                  )}
                </div>
                  </div>
                </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
                </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-teal-600" />
                    </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium truncate">{teacher.email}</p>
                    </div>
                    </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-teal-600" />
                    </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{teacher.phone || 'Not provided'}</p>
                  </div>
                </div>
                </div>
                      </div>

          {/* School & Qualification */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teacher.school && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <SchoolIcon className="w-5 h-5 text-teal-600" />
                      </div>
                  <div>
                    <p className="text-xs text-gray-500">School</p>
                    <p className="text-sm font-medium">{teacher.school.name}</p>
                    </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Qualification</p>
                  <p className="text-sm font-medium">{teacher.qualification || 'Not specified'}</p>
                </div>
                </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-600" />
              </div>
                <div>
                  <p className="text-xs text-gray-500">Experience</p>
                  <p className="text-sm font-medium">{teacher.experience_years ? `${teacher.experience_years} years` : 'Not specified'}</p>
                </div>
              </div>
              {teacher.specialization && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Specialization</p>
                    <p className="text-sm font-medium">{teacher.specialization}</p>
                  </div>
                </div>
              )}
                </div>
              </div>

          {/* Subjects */}
          {teacher.subjects && teacher.subjects.length > 0 && (
                            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Subjects Teaching</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((subject) => (
                  <span key={subject.id} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
                    {subject.name} ({subject.code})
                  </span>
                ))}
                            </div>
            </div>
          )}

          {/* Managed Classes */}
          {teacher.managed_classes && teacher.managed_classes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Managed Classes</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.managed_classes.map((cls) => (
                  <span key={cls.id} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                    {cls.name} - {cls.section}
                            </span>
                ))}
                            </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Permissions</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm ${teacher.can_mark_attendance ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {teacher.can_mark_attendance ? '✓' : '✗'} Mark Attendance
                            </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm ${teacher.can_assign_homework ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {teacher.can_assign_homework ? '✓' : '✗'} Assign Homework
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm ${teacher.can_grade_assignments ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {teacher.can_grade_assignments ? '✓' : '✗'} Grade Assignments
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onToggleStatus(teacher.id, teacher.is_active)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                teacher.is_active
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {teacher.is_active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              {teacher.is_active ? 'Deactivate Teacher' : 'Activate Teacher'}
                              </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Close
                              </button>
                            </div>
                </div>
              </div>
    </div>
  );
}


// ========== STUDENTS SECTION ==========

import type { Student, StudentDetail } from '../../services/superAdminDashboard.service';

function StudentsSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadStudents();
    loadSchools();
  }, [page, schoolFilter, statusFilter]);

  const loadSchools = async () => {
    try {
      const data = await superAdminDashboardService.getSchools(1, 100);
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getStudents(page, 12, {
        school_id: schoolFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setStudents(data.students || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadStudents();
  };

  const handleViewStudent = async (studentId: string) => {
    try {
      const detail = await superAdminDashboardService.getStudentDetail(studentId);
      setSelectedStudent(detail);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load student details');
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      await superAdminDashboardService.toggleStudentStatus(studentId, !currentStatus);
      toast.success(`Student ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadStudents();
      if (selectedStudent && selectedStudent.id === studentId) {
        const detail = await superAdminDashboardService.getStudentDetail(studentId);
        setSelectedStudent(detail);
      }
    } catch (err) {
      toast.error('Failed to update student status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="text-gray-500">View and manage all students across schools</p>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, roll no, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Schools</option>
                    {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
                  <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
          >
            Search
                  </button>
        </div>
              </div>

      {/* Students Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
            </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{student.full_name}</h3>
                    <p className="text-xs text-gray-500">Roll: {student.roll_no || 'N/A'}</p>
          </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                          </span>
        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
            </div>
                  {student.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                      <span>{student.phone}</span>
                          </div>
                  )}
                  {student.school && (
                          <div className="flex items-center text-sm text-gray-600">
                      <SchoolIcon className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                      <span className="truncate">{student.school.name}</span>
                          </div>
                  )}
                  {student.class_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                      <span>Class {student.class_name}{student.section ? ` - ${student.section}` : ''}</span>
                    </div>
                  )}
                        </div>

                {/* Parent Info */}
                {student.parent_name && (
                  <div className="mb-4 p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-500">Parent: <span className="text-gray-700 font-medium">{student.parent_name}</span></p>
                    {student.parent_phone && (
                      <p className="text-xs text-gray-500">Phone: <span className="text-gray-700">{student.parent_phone}</span></p>
                    )}
                          </div>
                )}

                <div className="flex gap-2">
              <button
                    onClick={() => handleViewStudent(student.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
              </button>
              <button
                    onClick={() => handleToggleStatus(student.id, student.is_active)}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                      student.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {student.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              </button>
            </div>
          </div>
                  </div>
                    ))}
                </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">No students match your search criteria.</p>
                </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!pagination.has_previous}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
                                  <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
                                  </button>
                  </div>
      )}

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
          }}
          onToggleStatus={handleToggleStatus}
        />
      )}
                </div>
                              );
}

function StudentDetailModal({ student, onClose, onToggleStatus }: {
  student: StudentDetail;
  onClose: () => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-600 to-amber-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                  </div>
              <div>
                <h2 className="text-xl font-bold text-white">{student.full_name}</h2>
                <p className="text-orange-100">Roll No: {student.roll_no || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    student.is_active 
                      ? 'bg-green-400/20 text-green-100' 
                      : 'bg-red-400/20 text-red-100'
                  }`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {student.class_name && (
                    <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs">
                      Class {student.class_name}{student.section ? ` - ${student.section}` : ''}
                    </span>
                  )}
                </div>
                  </div>
                </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
                        </div>
                      </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
                      <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium truncate">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{student.phone || 'Not provided'}</p>
                                </div>
                              </div>
            </div>
                </div>

          {/* School & Class */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Academic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {student.school && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <SchoolIcon className="w-5 h-5 text-orange-600" />
                    </div>
                  <div>
                    <p className="text-xs text-gray-500">School</p>
                    <p className="text-sm font-medium">{student.school.name}</p>
                    </div>
                    </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                    </div>
                <div>
                  <p className="text-xs text-gray-500">Class & Section</p>
                  <p className="text-sm font-medium">{student.class_name || 'N/A'}{student.section ? ` - ${student.section}` : ''}</p>
                  </div>
                </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Academic Year</p>
                  <p className="text-sm font-medium">{student.academic_year || 'N/A'}</p>
                </div>
              </div>
              {student.enrollment_date && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Enrollment Date</p>
                    <p className="text-sm font-medium">{new Date(student.enrollment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              )}
                        </div>
                      </div>

          {/* Parent Info */}
          {student.parent_name && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Parent/Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-600" />
                </div>
                  <div>
                    <p className="text-xs text-gray-500">Parent Name</p>
                    <p className="text-sm font-medium">{student.parent_name}</p>
                      </div>
                      </div>
                {student.parent_phone && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Parent Phone</p>
                      <p className="text-sm font-medium">{student.parent_phone}</p>
                </div>
                  </div>
                )}
                {student.parent_email && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-amber-600" />
                </div>
                    <div>
                      <p className="text-xs text-gray-500">Parent Email</p>
                      <p className="text-sm font-medium">{student.parent_email}</p>
              </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Quota */}
                <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">AI Usage</h3>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">AI Quota Used</span>
                <span className="text-sm font-medium">{student.ai_quota_used} / {student.ai_quota_limit}</span>
                </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((student.ai_quota_used / student.ai_quota_limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2">
                      <button
              onClick={() => onToggleStatus(student.id, student.is_active)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                student.is_active
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {student.is_active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              {student.is_active ? 'Deactivate Student' : 'Activate Student'}
                  </button>
                  <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
              Close
                  </button>
                </div>
              </div>
      </div>
    </div>
  );
}


// ========== ANNOUNCEMENTS SECTION ==========

import type { Announcement, AnnouncementDetail, CreateAnnouncementData } from '../../services/superAdminDashboard.service';

function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadAnnouncements();
    loadSchools();
  }, [page, statusFilter]);

  const loadSchools = async () => {
    try {
      const data = await superAdminDashboardService.getSchools(1, 100);
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getAnnouncements(page, 12, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadAnnouncements();
  };

  const handleViewAnnouncement = async (id: string) => {
    try {
      const detail = await superAdminDashboardService.getAnnouncementDetail(id);
      setSelectedAnnouncement(detail);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load announcement details');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await superAdminDashboardService.publishAnnouncement(id);
      toast.success('Announcement published successfully');
      loadAnnouncements();
    } catch (err) {
      toast.error('Failed to publish announcement');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await superAdminDashboardService.archiveAnnouncement(id);
      toast.success('Announcement archived successfully');
      loadAnnouncements();
      setShowDetailModal(false);
    } catch (err) {
      toast.error('Failed to archive announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await superAdminDashboardService.deleteAnnouncement(id);
      toast.success('Announcement deleted successfully');
      loadAnnouncements();
      setShowDetailModal(false);
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-700';
      case 'DRAFT': return 'bg-blue-100 text-blue-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-500">Create and manage platform announcements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
                </div>
              </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{announcement.title}</h3>
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                            </span>
                            </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{announcement.content || 'No content'}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(announcement.status)}`}>
                    {announcement.status}
                            </span>
                  <span className="text-xs text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {announcement.created_by && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>By: <span className="font-medium text-gray-700">{announcement.created_by.name}</span></span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewAnnouncement(announcement.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                                </button>
                  {announcement.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(announcement.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                                </button>
                              )}
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
              </div>
            </div>
                      ))}
                </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements Found</h3>
          <p className="text-gray-500 mb-4">Create your first announcement to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Create Announcement
          </button>
              </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!pagination.has_previous}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
                </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          schools={schools}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAnnouncements();
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAnnouncement(null);
          }}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function CreateAnnouncementModal({ schools, onClose, onSuccess }: {
  schools: School[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targets: [],
  });
  const [targetSchoolId, setTargetSchoolId] = useState('');

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        targets: targetSchoolId ? [{ school_id: targetSchoolId }] : [],
      };
      await superAdminDashboardService.createAnnouncement(data as CreateAnnouncementData);
      toast.success(`Announcement ${publish ? 'published' : 'saved as draft'} successfully`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Announcement</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
                </button>
          </div>
              </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter announcement content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
                          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target School</label>
              <select
                value={targetSchoolId}
                onChange={(e) => setTargetSchoolId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
                          </div>
                        </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish
            </button>
                          </div>
        </form>
                          </div>
    </div>
  );
}

function AnnouncementDetailModal({ announcement, onClose, onPublish, onArchive, onDelete }: {
  announcement: AnnouncementDetail;
  onClose: () => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{announcement.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white`}>
                  {announcement.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white`}>
                  {announcement.priority}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
                          </div>
                        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Content</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{announcement.content || 'No content'}</p>
                          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium">{new Date(announcement.created_at).toLocaleDateString()}</p>
                          </div>
            {announcement.published_at && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Published</p>
                <p className="text-sm font-medium">{new Date(announcement.published_at).toLocaleDateString()}</p>
                          </div>
            )}
                        </div>

          {announcement.targets && announcement.targets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Targets</h3>
              <div className="flex flex-wrap gap-2">
                {announcement.targets.map((target) => (
                  <span key={target.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                    {target.school?.name || target.class?.name || target.user?.name || 'All'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {announcement.status === 'DRAFT' && (
              <button
                onClick={() => onPublish(announcement.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Publish
                          </button>
            )}
            {announcement.status === 'PUBLISHED' && (
              <button
                onClick={() => onArchive(announcement.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Archive
                          </button>
            )}
            <button
              onClick={() => onDelete(announcement.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Close
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
  );
}


// ========== ADMIN TASKS SECTION ==========

import type { AdminTask, AdminTaskDetail, CreateAdminTaskData } from '../../services/superAdminDashboard.service';

function AdminTasksSection() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AdminTaskDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadTasks();
    loadAdmins();
    loadSchools();
  }, [page, statusFilter]);

  const loadAdmins = async () => {
    try {
      const data = await superAdminDashboardService.getAdmins(1, 100);
      setAdmins(data.admins || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const loadSchools = async () => {
    try {
      const data = await superAdminDashboardService.getSchools(1, 100);
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getAdminTasks(page, 12, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setTasks(data.tasks || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTasks();
  };

  const handleViewTask = async (id: string) => {
    try {
      const detail = await superAdminDashboardService.getAdminTaskDetail(id);
      setSelectedTask(detail);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load task details');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await superAdminDashboardService.updateAdminTaskStatus(id, status);
      toast.success('Task status updated successfully');
      loadTasks();
      if (selectedTask && selectedTask.id === id) {
        const detail = await superAdminDashboardService.getAdminTaskDetail(id);
        setSelectedTask(detail);
      }
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await superAdminDashboardService.deleteAdminTask(id);
      toast.success('Task deleted successfully');
      loadTasks();
      setShowDetailModal(false);
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

                              return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Tasks</h2>
          <p className="text-gray-500">Assign and manage tasks for administrators</p>
                                  </div>
                                  <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Create Task</span>
                                  </button>
                                </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
          >
            Search
          </button>
                        </div>
                      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border-l-4 ${getPriorityColor(task.priority)} overflow-hidden hover:shadow-lg transition-all`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{task.title}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description || 'No description'}</p>
                
                <div className="space-y-2 mb-4">
                  {task.assigned_to && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0" />
                      <span className="truncate">{task.assigned_to.name}</span>
                    </div>
                  )}
                  {task.school && (
                    <div className="flex items-center text-sm text-gray-600">
                      <SchoolIcon className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0" />
                      <span className="truncate">{task.school.name}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0" />
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                                <button
                    onClick={() => handleViewTask(task.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                                </button>
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
                              </div>
                            ))}
                        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-500 mb-4">Create your first task to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
          >
            Create Task
          </button>
                      </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
                        <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!pagination.has_previous}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAdminTaskModal
          admins={admins}
          schools={schools}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTasks();
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <AdminTaskDetailModal
          task={selectedTask}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          onReplyAdded={() => {
            superAdminDashboardService.getAdminTaskDetail(selectedTask.id).then(setSelectedTask);
          }}
        />
      )}
    </div>
  );
}

function CreateAdminTaskModal({ admins, schools, onClose, onSuccess }: {
  admins: Admin[];
  schools: School[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAdminTaskData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigned_to: '',
    school_id: '',
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assigned_to) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      await superAdminDashboardService.createAdminTask(formData);
      toast.success('Task created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Admin Task</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Admin) *</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Select Admin</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.user_id}>{admin.full_name} ({admin.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related School (Optional)</label>
            <select
              value={formData.school_id}
              onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">No specific school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
                        </button>
                      </div>
        </form>
      </div>
    </div>
  );
}

function AdminTaskDetailModal({ task, onClose, onUpdateStatus, onDelete, onReplyAdded }: {
  task: AdminTaskDetail;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onReplyAdded: () => void;
}) {
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    
    setSendingReply(true);
    try {
      await superAdminDashboardService.addAdminTaskReply(task.id, replyMessage);
      setReplyMessage('');
      onReplyAdded();
      toast.success('Reply added');
    } catch (err) {
      toast.error('Failed to add reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rose-600 to-pink-600">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{task.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  {task.status.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  {task.priority}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{task.description || 'No description'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {task.assigned_to && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Assigned To</p>
                <p className="text-sm font-medium">{task.assigned_to.name}</p>
                <p className="text-xs text-gray-500">{task.assigned_to.email}</p>
              </div>
            )}
            {task.school && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Related School</p>
                <p className="text-sm font-medium">{task.school.name}</p>
                </div>
            )}
            {task.due_date && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-sm font-medium">{new Date(task.due_date).toLocaleDateString()}</p>
              </div>
          )}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium">{new Date(task.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Replies/Conversation */}
                <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Conversation</h3>
            <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
              {task.replies && task.replies.length > 0 ? (
                <div className="p-4 space-y-3">
                  {task.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{reply.replied_by?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString()}</span>
                </div>
                      <p className="text-sm text-gray-700">{reply.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">No replies yet</div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              />
                      <button
                onClick={handleSendReply}
                disabled={sendingReply || !replyMessage.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          {/* Status Update Section */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Update Status:</span>
            <div className="flex gap-2 flex-wrap">
              {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(task.id, status)}
                  disabled={task.status === status}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    task.status === status
                      ? 'bg-rose-600 text-white cursor-default'
                      : status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : status === 'CANCELLED'
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
                  <button
              onClick={() => onDelete(task.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                  >
              <Trash2 className="w-4 h-4" />
              Delete Task
                  </button>
                  <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
              Close
                  </button>
                </div>
              </div>
      </div>
    </div>
  );
}


// ========== SCHOOLS SECTION ==========

function SchoolsSection() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSchools();
  }, [page, statusFilter]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getSchools(page, 12, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setSchools(data.schools || []);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Failed to load schools:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load schools';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadSchools();
  };

  const handleViewSchool = (schoolId: string) => {
    // Navigate to school detail page
    window.location.href = `/super-admin/schools/${schoolId}`;
  };

  const handleUpdateStatus = async (schoolId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      await superAdminDashboardService.updateSchoolStatus(schoolId, newStatus);
      toast.success(`School status updated to ${newStatus}`);
      loadSchools();
    } catch (err) {
      toast.error('Failed to update school status');
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (!confirm('Are you sure you want to deactivate this school?')) return;
    
    try {
      await superAdminDashboardService.deleteSchool(schoolId);
      toast.success('School deactivated successfully');
      loadSchools();
    } catch (err) {
      toast.error('Failed to deactivate school');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
          <h2 className="text-2xl font-bold text-gray-900">Schools Management</h2>
          <p className="text-gray-500">Manage all registered schools</p>
                      </div>
                  <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
                  >
          <Plus className="w-5 h-5" />
          <span>Add School</span>
                  </button>
                    </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
              placeholder="Search by name, UDISE code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Search
                              </button>
                    </div>
                  </div>

      {/* Schools Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
      ) : schools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {schools.map((school) => (
                      <div
                        key={school.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{school.name}</h3>
                    <p className="text-xs text-gray-500">UDISE: {school.udise_code}</p>
                          </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(school.status)}`}>
                    {school.status}
                        </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{school.city}, {school.district}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                    <span>Plan: {school.plan_type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{school.total_students}</p>
                            <p className="text-xs text-gray-500">Students</p>
                      </div>
                          <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{school.total_teachers}</p>
                            <p className="text-xs text-gray-500">Teachers</p>
                    </div>
                          <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{school.total_admins}</p>
                            <p className="text-xs text-gray-500">Admins</p>
                  </div>
                        </div>

                <div className="flex gap-2">
                                  <button
                    onClick={() => handleViewSchool(school.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
                                  </button>
                  {school.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleUpdateStatus(school.id, 'SUSPENDED')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                    >
                      <PauseCircle className="w-4 h-4" />
                          </button>
                  ) : school.status === 'SUSPENDED' || school.status === 'PENDING' ? (
                                <button
                      onClick={() => handleUpdateStatus(school.id, 'ACTIVE')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                                </button>
                  ) : null}
                        <button
                    onClick={() => handleDeleteSchool(school.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                        </button>
                  </div>
                </div>
              </div>
                    ))}
                </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <SchoolIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Schools Found</h3>
          <p className="text-gray-500 mb-4">No schools match your search criteria.</p>
                      <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
          >
            Add First School
                      </button>
                  </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
                  <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!pagination.has_previous}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
                  </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
                  <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
                  </button>
                    </div>
      )}

      {/* Create School Modal */}
      {showCreateModal && (
        <CreateSchoolModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadSchools();
          }}
        />
      )}
                  </div>
  );
}

function CreateSchoolModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSchoolData>({
    name: '',
    udise_code: '',
    contact_email: '',
    contact_phone: '',
    principal_name: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    board: '',
    plan_type: 'BASIC',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.udise_code || !formData.address || !formData.city || !formData.district || !formData.state || !formData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await superAdminDashboardService.createSchool(formData);
      toast.success('School created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

                      return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add New School</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
                </div>
              </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                      <input
                        type="text"
                        required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter school name"
                      />
                    </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UDISE Code *</label>
                      <input
                        type="text"
                        required
                value={formData.udise_code}
                onChange={(e) => setFormData({ ...formData, udise_code: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="11 digit UDISE code"
                      />
                    </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                      <input
                        type="text"
                value={formData.principal_name}
                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter principal name"
                      />
                    </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="school@example.com"
              />
                  </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="+91 98765 43210"
              />
                    </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
              <input
                type="text"
                value={formData.board}
                onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="CBSE, ICSE, State Board"
              />
                  </div>
                  </div>

                    <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={2}
              placeholder="Full address"
            />
                    </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                type="text"
                          required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                        <input
                          type="text"
                          required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
                    </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
            <select
              value={formData.plan_type}
              onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="BASIC">Basic</option>
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
                        <button
                          type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                        >
              Cancel
                        </button>
                        <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Create School'
              )}
                        </button>
                      </div>
        </form>
                    </div>
    </div>
  );
}


// ========== ADMINS SECTION ==========

function AdminsSection() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAdmins();
    loadSchools();
  }, [page, schoolFilter]);

  const loadSchools = async () => {
    try {
      const data = await superAdminDashboardService.getSchools(1, 100);
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getAdmins(page, 12, {
        school_id: schoolFilter || undefined,
        search: searchQuery || undefined,
      });
      setAdmins(data.admins || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load admins:', err);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadAdmins();
  };

  const handleViewAdmin = async (adminId: string) => {
    try {
      const detail = await superAdminDashboardService.getAdminDetail(adminId);
      setSelectedAdmin(detail);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load admin details');
    }
  };

  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      await superAdminDashboardService.toggleAdminStatus(adminId, !currentStatus);
      toast.success(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadAdmins();
    } catch (err) {
      toast.error('Failed to update admin status');
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    
    try {
      await superAdminDashboardService.removeAdmin(adminId);
      toast.success('Admin removed successfully');
      loadAdmins();
      setShowDetailModal(false);
    } catch (err) {
      toast.error('Failed to remove admin');
    }
  };

  const handleUpdateSchools = async (adminId: string, schoolIds: string[]) => {
    try {
      await superAdminDashboardService.updateAdminSchools(adminId, schoolIds);
      toast.success('Admin schools updated successfully');
      // Refresh admin detail
      const detail = await superAdminDashboardService.getAdminDetail(adminId);
      setSelectedAdmin(detail);
      loadAdmins();
    } catch (err) {
      toast.error('Failed to update admin schools');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admins Management</h2>
          <p className="text-gray-500">Manage all school administrators</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
              type="text"
              placeholder="Search by name, email, employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
                    </div>
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
                  <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                  >
            Search
                  </button>
        </div>
              </div>

      {/* Admins Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
      ) : admins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {admin.first_name?.charAt(0)}{admin.last_name?.charAt(0)}
                          </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{admin.full_name}</h3>
                    <p className="text-xs text-gray-500">ID: {admin.employee_id}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                    <span className="truncate">{admin.email}</span>
                        </div>
                  {admin.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                      <span>{admin.phone}</span>
                    </div>
                  )}
                </div>

                {/* Schools */}
                {admin.schools && admin.schools.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Assigned Schools:</p>
                    <div className="flex flex-wrap gap-1">
                      {admin.schools.slice(0, 2).map((school) => (
                        <span key={school.id} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                          {school.name}
                                </span>
                      ))}
                      {admin.schools.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{admin.schools.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewAdmin(admin.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                      admin.is_active
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {admin.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Admins Found</h3>
          <p className="text-gray-500 mb-4">No admins match your search criteria.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Add First Admin
          </button>
                </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
                        <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!pagination.has_previous}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
            <ChevronLeft className="w-4 h-4" />
                        </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
                        <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
            <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
      )}

      {/* Admin Detail Modal */}
      {showDetailModal && selectedAdmin && (
        <AdminDetailModal
          admin={selectedAdmin}
          allSchools={schools}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAdmin(null);
          }}
          onToggleStatus={handleToggleStatus}
          onRemove={handleRemoveAdmin}
          onUpdateSchools={handleUpdateSchools}
        />
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <CreateAdminModal
          schools={schools}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAdmins();
          }}
        />
      )}
                                </div>
  );
}

function AdminDetailModal({ admin, allSchools, onClose, onToggleStatus, onRemove, onUpdateSchools }: {
  admin: Admin;
  allSchools: School[];
  onClose: () => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateSchools: (adminId: string, schoolIds: string[]) => Promise<void>;
}) {
  const [editingSchools, setEditingSchools] = useState(false);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>(
    admin.schools?.map(s => s.id) || []
  );
  const [savingSchools, setSavingSchools] = useState(false);

  const handleSaveSchools = async () => {
    if (selectedSchoolIds.length === 0) {
      toast.error('Admin must be assigned to at least one school');
      return;
    }
    
    setSavingSchools(true);
    try {
      await onUpdateSchools(admin.id, selectedSchoolIds);
      setEditingSchools(false);
    } catch {
      // Error handled in parent
    } finally {
      setSavingSchools(false);
    }
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchoolIds(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {admin.first_name?.charAt(0)}{admin.last_name?.charAt(0)}
                      </div>
              <div>
                <h2 className="text-xl font-bold text-white">{admin.full_name}</h2>
                <p className="text-purple-200">Employee ID: {admin.employee_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    admin.is_active 
                      ? 'bg-green-400/20 text-green-100' 
                      : 'bg-red-400/20 text-red-100'
                  }`}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {admin.designation && (
                    <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs">
                      {admin.designation}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
                </div>
              </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
                    <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium truncate">{admin.email}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                        <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{admin.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                  <p className="text-xs text-gray-500">Joined Date</p>
                  <p className="text-sm font-medium">{new Date(admin.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-sm font-medium ${admin.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {admin.status || (admin.is_active ? 'Active' : 'Inactive')}
                  </p>
                </div>
              </div>
                        </div>
                      </div>

          {/* Schools Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Assigned Schools ({admin.schools?.length || 0})
              </h3>
              {!editingSchools ? (
                            <button
                  onClick={() => setEditingSchools(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                  <Settings className="w-4 h-4" />
                  Edit Schools
                            </button>
              ) : (
                <div className="flex gap-2">
                            <button
                    onClick={() => {
                      setSelectedSchoolIds(admin.schools?.map(s => s.id) || []);
                      setEditingSchools(false);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchools}
                    disabled={savingSchools}
                    className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {savingSchools && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save
                            </button>
                          </div>
              )}
                        </div>
            
            {editingSchools ? (
              <div className="border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-3">Select schools to assign to this admin:</p>
                <div className="space-y-2">
                  {allSchools.map((school) => (
                              <label
                      key={school.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSchoolIds.includes(school.id)
                          ? 'bg-purple-50 border border-purple-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                        checked={selectedSchoolIds.includes(school.id)}
                        onChange={() => toggleSchoolSelection(school.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{school.name}</p>
                        <p className="text-xs text-gray-500">{school.district}, {school.state}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        school.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        school.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {school.status}
                      </span>
                              </label>
                  ))}
                        </div>
                      </div>
            ) : (
              <div className="space-y-2">
                {admin.schools && admin.schools.length > 0 ? (
                  admin.schools.map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <SchoolIcon className="w-5 h-5 text-purple-600" />
                  </div>
                        <span className="font-medium text-gray-900">{school.name}</span>
                        </div>
                      {school.is_primary && (
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                          Primary
                        </span>
                      )}
                      </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <SchoolIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No schools assigned</p>
                  </div>
                )}
                </div>
            )}
              </div>
            </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onToggleStatus(admin.id, admin.is_active)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                admin.is_active
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {admin.is_active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              {admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
            </button>
            <button
              onClick={() => onRemove(admin.id)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Remove
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
                </div>
                </div>
      </div>
    </div>
  );
}

function CreateAdminModal({ schools, onClose, onSuccess }: {
  schools: School[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAdminData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    employee_id: '',
    designation: '',
    school_ids: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.employee_id || formData.school_ids.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await superAdminDashboardService.createAdmin(formData);
      toast.success('Admin created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchool = (schoolId: string) => {
    setFormData(prev => ({
      ...prev,
      school_ids: prev.school_ids.includes(schoolId)
        ? prev.school_ids.filter(id => id !== schoolId)
        : [...prev.school_ids, schoolId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
                </div>
              </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
                  </div>
                        <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
                </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
        </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., School Administrator"
              />
            </div>
                </div>

          {/* School Selection */}
                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Schools *</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
              {schools.map((school) => (
                <label
                  key={school.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    formData.school_ids.includes(school.id)
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.school_ids.includes(school.id)}
                    onChange={() => toggleSchool(school.id)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{school.name}</p>
                    <p className="text-xs text-gray-500">{school.city}, {school.district}</p>
                  </div>
                </label>
              ))}
              {schools.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No schools available</p>
              )}
                </div>
              </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Create Admin'
              )}
            </button>
        </div>
        </form>
      </div>
    </div>
  );
}

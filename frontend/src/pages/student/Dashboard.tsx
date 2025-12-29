import { useState, useEffect } from 'react';
import {
  Home,
  User,
  BookOpen,
  Bell,
  LogOut,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Calendar,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Award,
  Sparkles,
  Check,
  Clock,
  AlertCircle,
  Send,
  FileText,
  ExternalLink,
  Video,
  MessageSquareText,
  Flag,
  Target,
  Link as LinkIcon,
  Bookmark,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import studentDashboardService, {
  DashboardData,
  StudentProfile,
  AttendanceCalendar,
  AttendanceRecord,
  ActivityDetail,
  ActivitiesResponse,
  StudentTaskDetail,
  TasksResponse,
  GovernmentScheme,
  SchemesResponse,
  SchemeType,
  StudentReport,
  StudentReportDetail,
  StudentAnnouncement,
  StudentAnnouncementsResponse,
} from '../../services/studentDashboard.service';
import NewsSection from '../../components/shared/NewsSection';

type ActiveView = 'dashboard' | 'profile' | 'attendance' | 'activities' | 'tasks' | 'schemes' | 'reports' | 'announcements';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<ActiveView>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await studentDashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (view: ActiveView) => {
    setActiveMenu(view);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'profile':
        return <ProfileSection profile={dashboardData?.profile} />;
      case 'attendance':
        return <AttendanceSection />;
      case 'activities':
        return <ActivitiesSection />;
      case 'tasks':
        return <TasksSection />;
      case 'schemes':
        return <SchemesSection />;
      case 'reports':
        return <ReportsSection />;
      case 'announcements':
        return <AnnouncementsSection />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    const news = dashboardData?.news || [];

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                {dashboardData?.profile?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome, {dashboardData?.profile?.name?.split(' ')[0] || 'Student'}!</h1>
                <p className="text-blue-100">{dashboardData?.profile?.class_info?.name || 'Class not assigned'}</p>
                <p className="text-blue-200 text-sm">{dashboardData?.school?.name || 'School not assigned'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* News Section */}
        <NewsSection news={news as any} loading={loading} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            value={String(dashboardData?.stats?.subjects_enrolled || 0)}
            label="Subjects"
            color="blue"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            value={String(dashboardData?.stats?.pending_homework || 0)}
            label="Pending Tasks"
            color="amber"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5" />}
            value={`${dashboardData?.stats?.ai_quota_used || 0}/${dashboardData?.stats?.ai_quota_limit || 100}`}
            label="AI Queries"
            color="purple"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            value={dashboardData?.profile?.academic_year || '2024-25'}
            label="Academic Year"
            color="emerald"
          />
        </div>

        {/* Profile Card */}
        <button
          onClick={() => handleMenuClick('profile')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                {dashboardData?.profile?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{dashboardData?.profile?.name || 'Student'}</h3>
                <p className="text-sm text-gray-500">Roll No: {dashboardData?.profile?.roll_no || 'N/A'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            label="View Profile"
            icon={<User className="w-5 h-5" />}
            color="blue"
            onClick={() => handleMenuClick('profile')}
          />
          <QuickAction
            label="Attendance"
            icon={<Calendar className="w-5 h-5" />}
            color="green"
            onClick={() => handleMenuClick('attendance')}
          />
          <QuickAction
            label="Activities"
            icon={<BookOpen className="w-5 h-5" />}
            color="purple"
            onClick={() => handleMenuClick('activities')}
          />
          <QuickAction
            label="Progress Cards"
            icon={<FileText className="w-5 h-5" />}
            color="orange"
            onClick={() => handleMenuClick('reports')}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 md:hidden safe-area-inset">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Sarathi Learn</span>
          </Link>
          <button className="p-2 -mr-2 relative">
            <Bell className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-72 
        bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Close button - Mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 md:hidden hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-5 border-b border-slate-700/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Sarathi Learn</span>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </Link>
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
            icon={<User className="w-5 h-5" />}
            label="My Profile"
            active={activeMenu === 'profile'}
            onClick={() => handleMenuClick('profile')}
          />
          <MenuItem
            icon={<Calendar className="w-5 h-5" />}
            label="Attendance"
            active={activeMenu === 'attendance'}
            onClick={() => handleMenuClick('attendance')}
          />
          <MenuItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Activities"
            active={activeMenu === 'activities'}
            onClick={() => handleMenuClick('activities')}
          />
          <MenuItem
            icon={<GraduationCap className="w-5 h-5" />}
            label="Tasks"
            active={activeMenu === 'tasks'}
            onClick={() => handleMenuClick('tasks')}
          />
          <MenuItem
            icon={<Award className="w-5 h-5" />}
            label="Schemes & Events"
            active={activeMenu === 'schemes'}
            onClick={() => handleMenuClick('schemes')}
          />
          <MenuItem
            icon={<Bell className="w-5 h-5" />}
            label="Announcements"
            active={activeMenu === 'announcements'}
            onClick={() => handleMenuClick('announcements')}
          />
          <MenuItem
            icon={<FileText className="w-5 h-5" />}
            label="Progress Cards"
            active={activeMenu === 'reports'}
            onClick={() => handleMenuClick('reports')}
          />
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
              {dashboardData?.profile?.name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{dashboardData?.profile?.name || 'Student'}</p>
              <p className="text-xs text-slate-400 truncate">{dashboardData?.profile?.class_info?.name || 'Student'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {renderContent()}
          </div>
        </main>
    </div>
  );
}

// ============ COMPONENTS ============

function MenuItem({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">
          {badge}
        </span>
      )}
              </button>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: 'blue' | 'amber' | 'purple' | 'emerald';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  const iconColors = {
    blue: 'bg-blue-100',
    amber: 'bg-amber-100',
    purple: 'bg-purple-100',
    emerald: 'bg-emerald-100',
  };

  return (
    <div className={`${colors[color]} rounded-xl border p-4`}>
      <div className={`${iconColors[color]} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-sm opacity-70">{label}</p>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  onClick: () => void;
}) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-emerald-600 hover:bg-emerald-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white rounded-xl p-4 flex items-center gap-3 transition-colors`}
    >
      {icon}
      <span className="font-medium">{label}</span>
              </button>
  );
}

function ProfileSection({ profile }: { profile?: StudentProfile }) {
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {profile.name?.charAt(0) || 'S'}
          </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500">{profile.class_info?.name}</p>
          <p className="text-sm text-gray-400">UDISE: {profile.udise_student_id}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={profile.email} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={profile.phone || 'Not provided'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={profile.address || 'Not provided'} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={profile.date_of_birth || 'Not provided'} />
                </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Academic Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Class" value={profile.class_info?.name || 'Not assigned'} />
            <InfoRow icon={<Award className="w-4 h-4" />} label="Roll No" value={profile.roll_no || 'Not assigned'} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Academic Year" value={profile.academic_year || 'N/A'} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Enrollment Date" value={profile.enrollment_date || 'N/A'} />
          </div>
        </div>

        {/* Parent Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Parent/Guardian Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={profile.parent_info?.name || 'Not provided'} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={profile.parent_info?.phone || 'Not provided'} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={profile.parent_info?.email || 'Not provided'} />
          </div>
        </div>

        {/* AI Quota */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Learning Quota
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Queries Used</span>
                <span className="font-semibold text-gray-900">{profile.ai_quota?.used} / {profile.ai_quota?.limit}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${profile.ai_quota?.percentage || 0}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              You have <span className="font-semibold text-purple-600">{profile.ai_quota?.remaining}</span> AI queries remaining this month.
                  </p>
                </div>
              </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{description}</p>
      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
        Coming Soon
      </span>
    </div>
  );
}

// ============ ATTENDANCE SECTION ============

function AttendanceSection() {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<AttendanceCalendar | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'history'>('calendar');

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const [calendar, historyData] = await Promise.all([
        studentDashboardService.getAttendanceCalendar(year, month),
        studentDashboardService.getAttendanceHistory(30),
      ]);
      
      setCalendarData(calendar);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-emerald-500';
      case 'ABSENT': return 'bg-red-500';
      case 'LATE': return 'bg-amber-500';
      case 'EXCUSED': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ABSENT': return 'bg-red-50 text-red-700 border-red-200';
      case 'LATE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'EXCUSED': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-sm text-gray-500">Track your attendance records</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              viewMode === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {calendarData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-600 font-medium">Present</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{calendarData.summary.present}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Absent</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{calendarData.summary.absent}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-600 font-medium">Late</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{calendarData.summary.late}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Percentage</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{calendarData.summary.percentage}%</p>
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {calendarData?.month_name} {calendarData?.year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }
              
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const attendance = calendarData?.calendar[dateStr];
              
              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                    attendance ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  <span className="font-medium text-gray-700">{day}</span>
                  {attendance && (
                    <div className={`w-2 h-2 rounded-full mt-1 ${getStatusColor(attendance.status)}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Excused</span>
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Attendance</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusBg(record.status)}`}>
                      {record.status === 'PRESENT' && <Check className="w-5 h-5" />}
                      {record.status === 'ABSENT' && <X className="w-5 h-5" />}
                      {record.status === 'LATE' && <Clock className="w-5 h-5" />}
                      {record.status === 'EXCUSED' && <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      {record.marked_by && (
                        <p className="text-xs text-gray-500">Marked by {record.marked_by}</p>
                      )}
                </div>
                </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(record.status)}`}>
                    {record.status}
                  </span>
              </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No attendance records found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ACTIVITIES SECTION ============

function ActivitiesSection() {
  const [loading, setLoading] = useState(true);
  const [activitiesData, setActivitiesData] = useState<ActivitiesResponse | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResponse, setSubmitResponse] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [page]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await studentDashboardService.getActivities({ page, page_size: 10 });
      setActivitiesData(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = async (activityId: string) => {
    try {
      const detail = await studentDashboardService.getActivityDetail(activityId);
      setSelectedActivity(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  };

  const handleSubmitClick = () => {
    if (!submitResponse.trim()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedActivity || !submitResponse.trim()) return;
    
    try {
      setSubmitting(true);
      await studentDashboardService.submitActivity(selectedActivity.id, {
        response: submitResponse.trim(),
      });
      setShowConfirmModal(false);
      setShowSubmitModal(false);
      setSubmitResponse('');
      loadActivities();
      // Reload the activity detail
      const detail = await studentDashboardService.getActivityDetail(selectedActivity.id);
      setSelectedActivity(detail);
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if already submitted (not editable)
  const isAlreadySubmitted = (activity: ActivityDetail | null) => {
    if (!activity?.submission) return false;
    return activity.submission.id !== null && 
           ['SUBMITTED', 'COMPLETED', 'LATE'].includes(activity.submission.status);
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LATE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PENDING': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  if (loading && !activitiesData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Activities</h1>
        <p className="text-sm text-gray-500">View and submit your assigned activities</p>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {activitiesData?.activities && activitiesData.activities.length > 0 ? (
          activitiesData.activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => handleViewActivity(activity.id)}
              className="w-full bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 text-left hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {activity.subject.name}
                    </span>
                    {activity.level === 'STUDENT' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Personal
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{activity.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    {activity.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(activity.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span>By {activity.created_by}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getSubmissionStatusColor(activity.submission.status)}`}>
                    {activity.submission.status === 'NOT_SUBMITTED' ? 'Pending' : activity.submission.status}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activities found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {activitiesData && activitiesData.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {activitiesData.total_pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(activitiesData.total_pages, p + 1))}
            disabled={page === activitiesData.total_pages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Activity Detail Modal */}
      {showDetailModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded">
                    {selectedActivity.subject.name}
                  </span>
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedActivity(null); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-white mt-2">{selectedActivity.title}</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedActivity.description}</p>
              </div>

              {/* Links */}
              {(selectedActivity.google_meet_link || selectedActivity.zoom_link || selectedActivity.other_link) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Meeting Links</h4>
                  <div className="space-y-2">
                    {selectedActivity.google_meet_link && (
                      <a
                        href={selectedActivity.google_meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Google Meet
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    )}
                    {selectedActivity.zoom_link && (
                      <a
                        href={selectedActivity.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Zoom
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    )}
                    {selectedActivity.other_link && (
                      <a
                        href={selectedActivity.other_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedActivity.link_label || 'Other Link'}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Due Date */}
              {selectedActivity.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Due:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedActivity.due_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}

              {/* Submission Status */}
              {selectedActivity.submission && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Your Submission</h4>
                  {selectedActivity.submission.status === 'NOT_SUBMITTED' || !selectedActivity.submission.id ? (
                    <p className="text-sm text-gray-500">You haven't submitted yet</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSubmissionStatusColor(selectedActivity.submission.status)}`}>
                          {selectedActivity.submission.status}
                        </span>
                        {selectedActivity.submission.score !== null && (
                          <span className="text-sm font-medium text-gray-900">
                            Score: {selectedActivity.submission.score}/{selectedActivity.submission.max_score}
                          </span>
                        )}
                      </div>
                      {selectedActivity.submission.response && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Your response:</p>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            {selectedActivity.submission.response}
                          </p>
                        </div>
                      )}
                      {selectedActivity.submission.feedback && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Teacher's feedback:</p>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            {selectedActivity.submission.feedback}
                  </p>
                </div>
                      )}
              </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedActivity(null); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {selectedActivity.status === 'ACTIVE' && !isAlreadySubmitted(selectedActivity) && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </button>
              )}
              {isAlreadySubmitted(selectedActivity) && (
                <div className="flex-1 py-2.5 bg-emerald-100 text-emerald-700 font-medium rounded-xl flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Already Submitted
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Submit Response</h3>
                <button
                  onClick={() => { setShowSubmitModal(false); setSubmitResponse(''); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">{selectedActivity.title}</p>
            </div>
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Once submitted, you will not be able to edit your response.</span>
                </p>
              </div>
              <textarea
                value={submitResponse}
                onChange={(e) => setSubmitResponse(e.target.value)}
                placeholder="Write your response here..."
                className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setShowSubmitModal(false); setSubmitResponse(''); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClick}
                disabled={!submitResponse.trim() || submitting}
                className="flex-1 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
      </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Submission</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to submit? Once submitted, you will <strong>not be able to edit</strong> your response.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ TASKS SECTION ============

function TasksSection() {
  const [loading, setLoading] = useState(true);
  const [tasksData, setTasksData] = useState<TasksResponse | null>(null);
  const [selectedTask, setSelectedTask] = useState<StudentTaskDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTasks();
  }, [page, statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await studentDashboardService.getTasks({
        status: statusFilter || undefined,
        page,
        page_size: 10
      });
      setTasksData(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = async (taskId: string) => {
    try {
      const detail = await studentDashboardService.getTaskDetail(taskId);
      setSelectedTask(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load task:', err);
    }
  };

  const handleReply = async () => {
    if (!selectedTask || !replyContent.trim()) return;
    
    try {
      setSubmitting(true);
      await studentDashboardService.addTaskReply(selectedTask.id, replyContent.trim());
      setReplyContent('');
      // Reload task detail
      const detail = await studentDashboardService.getTaskDetail(selectedTask.id);
      setSelectedTask(detail);
      loadTasks();
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedTask) return;
    
    try {
      await studentDashboardService.updateTaskStatus(selectedTask.id, 'COMPLETED');
      const detail = await studentDashboardService.getTaskDetail(selectedTask.id);
      setSelectedTask(detail);
      loadTasks();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HOMEWORK': return '📝';
      case 'REMINDER': return '⏰';
      case 'NOTE': return '📌';
      case 'FOLLOWUP': return '🔄';
      default: return '✅';
    }
  };

  if (loading && !tasksData) {
  return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500">View and respond to tasks from your teachers</p>
        </div>
      </div>

      {/* Stats */}
      {tasksData && (
        <div className="grid grid-cols-3 gap-3">
    <button
            onClick={() => setStatusFilter(statusFilter === 'OPEN' ? '' : 'OPEN')}
            className={`p-3 rounded-xl border text-center transition-all ${
              statusFilter === 'OPEN' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <p className="text-lg font-bold text-amber-600">{tasksData.counts.open}</p>
            <p className="text-xs text-amber-700">Open</p>
    </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')}
            className={`p-3 rounded-xl border text-center transition-all ${
              statusFilter === 'IN_PROGRESS' ? 'bg-blue-100 border-blue-300' : 'bg-blue-50 border-blue-100'
            }`}
          >
            <p className="text-lg font-bold text-blue-600">{tasksData.counts.in_progress}</p>
            <p className="text-xs text-blue-700">In Progress</p>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? '' : 'COMPLETED')}
            className={`p-3 rounded-xl border text-center transition-all ${
              statusFilter === 'COMPLETED' ? 'bg-emerald-100 border-emerald-300' : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <p className="text-lg font-bold text-emerald-600">{tasksData.counts.completed}</p>
            <p className="text-xs text-emerald-700">Completed</p>
          </button>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {tasksData?.tasks && tasksData.tasks.length > 0 ? (
          tasksData.tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleViewTask(task.id)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl">{getTypeIcon(task.task_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadge(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>By {task.created_by.name}</span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {task.replies_count > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquareText className="w-3 h-3" />
                          {task.replies_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {tasksData && tasksData.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {tasksData.total_pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(tasksData.total_pages, p + 1))}
            disabled={page === tasksData.total_pages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(selectedTask.task_type)}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadge(selectedTask.status)}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedTask(null); setReplyContent(''); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-white mt-2">{selectedTask.title}</h2>
              <p className="text-xs text-white/70 mt-1">
                By {selectedTask.created_by.name} • {new Date(selectedTask.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              {/* Due Date */}
              {selectedTask.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Due:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedTask.due_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}

              {/* Conversation */}
              {selectedTask.replies && selectedTask.replies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4" />
                    Conversation ({selectedTask.replies.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedTask.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-xl ${
                          reply.reply_type === 'STUDENT'
                            ? 'bg-blue-50 ml-4'
                            : 'bg-gray-50 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {reply.replied_by.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input */}
              {selectedTask.status !== 'CLOSED' && selectedTask.status !== 'COMPLETED' && (
                <div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              {selectedTask.status !== 'CLOSED' && selectedTask.status !== 'COMPLETED' ? (
                <>
                  <button
                    onClick={handleMarkComplete}
                    className="flex-1 py-2.5 bg-emerald-100 text-emerald-700 font-medium rounded-xl hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark Complete
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyContent.trim() || submitting}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Reply
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedTask(null); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SCHEMES SECTION ============

function SchemesSection() {
  const [loading, setLoading] = useState(true);
  const [schemesData, setSchemesData] = useState<SchemesResponse | null>(null);
  const [schemeTypes, setSchemeTypes] = useState<SchemeType[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [page, typeFilter]);

  const loadData = async () => {
    try {
      const types = await studentDashboardService.getSchemeTypes();
      setSchemeTypes(types);
    } catch (err) {
      console.error('Failed to load scheme types:', err);
    }
  };

  const loadSchemes = async () => {
    try {
      setLoading(true);
      const data = await studentDashboardService.getSchemes({
        type: typeFilter || undefined,
        page,
        page_size: 10
      });
      setSchemesData(data);
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewScheme = async (schemeId: string) => {
    try {
      const detail = await studentDashboardService.getSchemeDetail(schemeId);
      setSelectedScheme(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load scheme:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXAM': return '📝';
      case 'SCHOLARSHIP': return '🎓';
      case 'EVENT': return '🎉';
      case 'PROGRAM': return '📋';
      case 'COMPETITION': return '🏆';
      case 'ADMISSION': return '🏫';
      default: return '📌';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'EXAM': return 'bg-blue-100 text-blue-700';
      case 'SCHOLARSHIP': return 'bg-emerald-100 text-emerald-700';
      case 'EVENT': return 'bg-purple-100 text-purple-700';
      case 'PROGRAM': return 'bg-amber-100 text-amber-700';
      case 'COMPETITION': return 'bg-orange-100 text-orange-700';
      case 'ADMISSION': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return '';
    }
  };

  if (loading && !schemesData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Government Schemes & Events</h1>
        <p className="text-sm text-gray-500">Exams, scholarships, and opportunities for you</p>
      </div>

      {/* Type Filter */}
      {schemeTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              !typeFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {schemeTypes.map((t) => (
            <button
              key={t.type}
              onClick={() => setTypeFilter(typeFilter === t.type ? '' : t.type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1 ${
                typeFilter === t.type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getTypeIcon(t.type)} {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      {/* Schemes List */}
      <div className="space-y-3">
        {schemesData?.schemes && schemesData.schemes.length > 0 ? (
          schemesData.schemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => handleViewScheme(scheme.id)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getTypeIcon(scheme.scheme_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeBadge(scheme.scheme_type)}`}>
                        {scheme.scheme_type}
                      </span>
                      {getPriorityBadge(scheme.priority) && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityBadge(scheme.priority)}`}>
                          {scheme.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{scheme.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{scheme.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      {scheme.application_deadline && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(scheme.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {scheme.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(scheme.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No schemes found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {schemesData && schemesData.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {schemesData.total_pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(schemesData.total_pages, p + 1))}
            disabled={page === schemesData.total_pages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Scheme Detail Modal */}
      {showDetailModal && selectedScheme && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(selectedScheme.scheme_type)}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded bg-white/20 text-white`}>
                    {selectedScheme.scheme_type}
                  </span>
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedScheme(null); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-white mt-2">{selectedScheme.title}</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedScheme.description}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                {selectedScheme.application_deadline && (
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-medium">Application Deadline</p>
                    <p className="font-bold text-red-700">
                      {new Date(selectedScheme.application_deadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {selectedScheme.start_date && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 font-medium">Start Date</p>
                    <p className="font-bold text-blue-700">
                      {new Date(selectedScheme.start_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Eligibility */}
              {selectedScheme.eligibility && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Eligibility
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedScheme.eligibility}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedScheme.requirements && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Requirements
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedScheme.requirements}</p>
                  </div>
                </div>
              )}

              {/* Links */}
              {(selectedScheme.official_link || selectedScheme.apply_link) && (
                <div className="space-y-2">
                  {selectedScheme.official_link && (
                    <a
                      href={selectedScheme.official_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Official Website
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                  {selectedScheme.apply_link && (
                    <a
                      href={selectedScheme.apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Apply Now
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedScheme(null); }}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ========== REPORTS / PROGRESS CARDS SECTION ==========

function ReportsSection() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StudentReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await studentDashboardService.getReports();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (reportId: string) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await studentDashboardService.getReportDetail(reportId);
      setSelectedReport(detail);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'from-green-500 to-emerald-600';
      case 'B+':
      case 'B':
        return 'from-blue-500 to-indigo-600';
      case 'C':
        return 'from-amber-500 to-orange-600';
      case 'D':
        return 'from-orange-500 to-red-500';
      case 'F':
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'HALF_YEARLY':
        return '📊';
      case 'ANNUAL':
        return '🎓';
      case 'QUARTERLY':
        return '📈';
      case 'ASSESSMENT':
        return '📝';
      default:
        return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Progress Cards</h2>
            <p className="text-indigo-100 text-sm">View your academic performance</p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleOpenReport(report.id)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
            >
              {/* Report Header */}
              <div className={`bg-gradient-to-r ${getGradeColor(report.grade)} p-4 text-white`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl mb-2 block">{getReportTypeIcon(report.report_type)}</span>
                    <h3 className="font-semibold text-lg">{report.name}</h3>
                    <p className="text-white/80 text-sm">{report.class_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{report.grade}</div>
                    <div className="text-sm text-white/80">Grade</div>
                  </div>
                </div>
              </div>

              {/* Report Stats */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{report.percentage.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Percentage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{report.total_marks}/{report.total_max_marks}</div>
                    <div className="text-xs text-gray-500">Total Marks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{report.rank ? `#${report.rank}` : '-'}</div>
                    <div className="text-xs text-gray-500">Rank</div>
                  </div>
                </div>

                {report.exam_date && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.exam_date).toLocaleDateString()}
                    </span>
                    <span className="text-indigo-600 font-medium flex items-center gap-1">
                      View Details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
          <p className="text-gray-500">Your progress cards will appear here once published.</p>
        </div>
      )}

      {/* Report Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : selectedReport ? (
              <>
                {/* Header */}
                <div className={`bg-gradient-to-r ${getGradeColor(selectedReport.grade)} p-6 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-3xl mb-2 block">{getReportTypeIcon(selectedReport.report_type)}</span>
                      <h2 className="text-2xl font-bold">{selectedReport.name}</h2>
                      <p className="text-white/80">{selectedReport.class_name} • {selectedReport.academic_year}</p>
                      {selectedReport.exam_date && (
                        <p className="text-white/70 text-sm mt-1">
                          Exam: {new Date(selectedReport.exam_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { setShowDetailModal(false); setSelectedReport(null); }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6 bg-white/10 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{selectedReport.percentage.toFixed(1)}%</div>
                      <div className="text-xs text-white/80">Percentage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{selectedReport.total_marks}</div>
                      <div className="text-xs text-white/80">Total Marks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{selectedReport.grade}</div>
                      <div className="text-xs text-white/80">Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{selectedReport.rank ? `#${selectedReport.rank}` : '-'}</div>
                      <div className="text-xs text-white/80">Rank</div>
                    </div>
                  </div>
                </div>

                {/* Subject-wise Marks */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    Subject-wise Marks
                  </h3>
                  <div className="space-y-3">
                    {selectedReport.subjects.map((subject) => (
                      <div key={subject.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{subject.name}</span>
                          <span className={`font-bold ${
                            subject.status === 'passed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {subject.marks !== null ? subject.marks : '-'} / {subject.max_marks}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              subject.status === 'passed' 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                : 'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{ width: `${subject.marks !== null ? (subject.marks / subject.max_marks) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="text-gray-500">
                            {subject.marks !== null ? ((subject.marks / subject.max_marks) * 100).toFixed(1) : 0}%
                          </span>
                          <span className={`font-medium ${
                            subject.status === 'passed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {subject.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Remarks */}
                  {selectedReport.remarks && (
                    <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <MessageSquareText className="w-4 h-4" />
                        Teacher's Remarks
                      </h4>
                      <p className="text-amber-700 text-sm">{selectedReport.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => { setShowDetailModal(false); setSelectedReport(null); }}
                    className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">Report not found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ========== ANNOUNCEMENTS SECTION ==========

function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<StudentAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [page]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await studentDashboardService.getAnnouncements(page, 20);
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '🔴';
      case 'HIGH':
        return '🟠';
      case 'MEDIUM':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Announcements</h2>
            <p className="text-purple-100 text-sm">Stay updated with latest news</p>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => {
                setSelectedAnnouncement(announcement);
                setShowDetailModal(true);
              }}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getPriorityIcon(announcement.priority)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{announcement.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(announcement.published_at)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}

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
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
          <p className="text-gray-500">You don't have any announcements yet.</p>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {showDetailModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className={`p-6 border-b border-gray-100 ${
              selectedAnnouncement.priority === 'URGENT' ? 'bg-red-50' :
              selectedAnnouncement.priority === 'HIGH' ? 'bg-orange-50' :
              selectedAnnouncement.priority === 'MEDIUM' ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getPriorityIcon(selectedAnnouncement.priority)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAnnouncement.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(selectedAnnouncement.priority)}`}>
                        {selectedAnnouncement.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(selectedAnnouncement.published_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAnnouncement(null);
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncement.content}
              </p>

              {selectedAnnouncement.expires_at && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Expires: {new Date(selectedAnnouncement.expires_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAnnouncement(null);
                }}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

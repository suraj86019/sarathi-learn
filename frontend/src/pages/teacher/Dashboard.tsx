import { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Calendar,
  Bell,
  LogOut,
  CheckSquare,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  BookOpen,
  GraduationCap,
  ClipboardList,
  User,
  Phone,
  MapPin,
  Award,
  Briefcase,
  Megaphone,
  UserCircle,
  ArrowLeft,
  Plus,
  Edit,
  Send,
  MessageSquare,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import teacherDashboardService, {
  DashboardData,
  ExtendedStats,
  SchoolTeachersResponse,
  SchoolClassesResponse,
} from '../../services/teacherDashboard.service';
import NewsSection from '../../components/shared/NewsSection';

type ActiveView = 'dashboard' | 'attendance' | 'students' | 'tasks' | 'schedule' | 'announcements' | 'teachers' | 'classes' | 'reports';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<ActiveView>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [schoolTeachers, setSchoolTeachers] = useState<SchoolTeachersResponse | null>(null);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClassesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceMarkedToday, setAttendanceMarkedToday] = useState(false);
  
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    email: '',
    address: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Announcement count for bell icon
  const [announcementCount, setAnnouncementCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    loadExtendedStats();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExtendedStats = async () => {
    try {
      const [stats, teachers, classes] = await Promise.all([
        teacherDashboardService.getExtendedStats(),
        teacherDashboardService.getSchoolTeachers(),
        teacherDashboardService.getSchoolClasses(),
      ]);
      setExtendedStats(stats);
      setSchoolTeachers(teachers);
      setSchoolClasses(classes);
    } catch (err) {
      console.error('Failed to load extended stats:', err);
    }
  };

  const loadAnnouncementCount = async () => {
    try {
      const response = await teacherDashboardService.getAnnouncements();
      // Count unread or recent announcements (from last 7 days)
      const recentCount = response.announcements?.filter((ann: any) => {
        const publishedDate = new Date(ann.published_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return publishedDate >= sevenDaysAgo;
      }).length || 0;
      setAnnouncementCount(recentCount);
    } catch (err) {
      console.error('Failed to load announcement count:', err);
    }
  };

  // Load announcement count on mount
  useEffect(() => {
    loadAnnouncementCount();
  }, []);

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

  const handleProfileClick = () => {
    if (dashboardData?.teacher) {
      setProfileForm({
        phone: dashboardData.teacher.phone || '',
        email: dashboardData.teacher.email || '',
        address: dashboardData.teacher.address || '',
      });
      setShowProfileModal(true);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await teacherDashboardService.updateProfile(profileForm);
      // Refresh dashboard data
      await loadDashboardData();
      setEditingProfile(false);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'attendance':
        return (
          <AttendanceSection 
            teacherProfile={dashboardData?.teacher} 
            onAttendanceMarked={() => setAttendanceMarkedToday(true)}
          />
        );
      case 'students':
        return <StudentsSection teacherProfile={dashboardData?.teacher} schoolClasses={schoolClasses} />;
      case 'tasks':
        return <TasksSection />;
      case 'schedule':
        return <ScheduleSection />;
      case 'announcements':
        return <AnnouncementsSection />;
      case 'reports':
        return <ReportsSection />;
      case 'teachers':
        return renderTeachersList();
      case 'classes':
        return renderClassesList();
      default:
        return renderDashboard();
    }
  };

  const renderTeachersList = () => {
    if (!schoolTeachers) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            School Teachers ({schoolTeachers.total_count})
          </h2>
          <span className="text-sm text-gray-500">{schoolTeachers.school_name}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {schoolTeachers.teachers.map((teacher) => (
            <div
              key={teacher.id}
              className={`bg-white rounded-xl border p-4 ${
                teacher.is_current_user 
                  ? 'border-teal-500 ring-2 ring-teal-100' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                  teacher.is_current_user 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {teacher.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{teacher.name}</h3>
                    {teacher.is_current_user && (
                      <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">ID: {teacher.employee_id}</p>
                </div>
              </div>
              
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {teacher.subjects.length > 0 
                      ? teacher.subjects.map(s => s.name).join(', ')
                      : 'No subjects assigned'}
                  </span>
                </div>
                {teacher.qualification && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Award className="w-3.5 h-3.5" />
                    <span>{teacher.qualification}</span>
                  </div>
                )}
                {teacher.attendance_class && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Attendance: {teacher.attendance_class.name}</span>
                  </div>
                )}
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{teacher.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">{teacher.experience_years} years exp.</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {teacher.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderClassesList = () => {
    if (!schoolClasses) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            School Classes ({schoolClasses.total_count})
          </h2>
          <span className="text-sm text-gray-500">{schoolClasses.school_name}</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {schoolClasses.classes.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white rounded-xl border p-4 ${
                cls.is_my_attendance_class 
                  ? 'border-teal-500 ring-2 ring-teal-100' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                {cls.is_my_attendance_class && (
                  <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">My Class</span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Students</span>
                  <span className="font-medium text-gray-900">
                    {cls.current_students}/{cls.max_students}
                  </span>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${cls.is_full ? 'bg-red-500' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min((cls.current_students / cls.max_students) * 100, 100)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{cls.available_seats} seats available</span>
                  {cls.is_full && <span className="text-red-600 font-medium">Full</span>}
                </div>
              </div>
              
              {cls.class_teacher && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <UserCircle className="w-3.5 h-3.5" />
                    <span>Teacher: {cls.class_teacher.name}</span>
                  </div>
                </div>
              )}
              
              {cls.room_number && (
                <div className="mt-2 text-xs text-gray-500">
                  Room: {cls.room_number}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] md:min-h-[60vh]">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-teal-600" />
        </div>
      );
    }

    const news = dashboardData?.news || [];

    return (
      <div className="space-y-4 md:space-y-6">
        {/* News Section - Shared Component */}
        <NewsSection news={news as any} loading={loading} />

        {/* Teacher Profile Card - Right after news - Clickable */}
        {dashboardData?.teacher && (
          <button
            onClick={handleProfileClick}
            className="w-full bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all text-left group"
          >
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                    {dashboardData.teacher.name?.charAt(0) || 'T'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 truncate">{dashboardData.teacher.name}</h3>
                    <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{dashboardData.school?.name || 'School'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                      {dashboardData.teacher.qualification || 'Teacher'}
                    </span>
                    {dashboardData.teacher.subjects?.[0] && (
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg">
                        {dashboardData.teacher.subjects[0].name}
                      </span>
                    )}
                    {dashboardData.teacher.phone && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3 h-3" />
                        {dashboardData.teacher.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* My Students */}
          <button
            onClick={() => handleMenuClick('students')}
            className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-5 text-left group overflow-hidden hover:shadow-xl hover:shadow-blue-500/25 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="p-2 bg-white/20 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">
                {extendedStats?.my_students_count || dashboardData?.stats?.attendance_class_students || 0}
              </p>
              <p className="text-sm text-white/70 mt-1">My Students</p>
            </div>
          </button>

          {/* My Classes */}
          <button
            onClick={() => handleMenuClick('schedule')}
            className="relative bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-left group overflow-hidden hover:shadow-xl hover:shadow-purple-500/25 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="p-2 bg-white/20 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">
                {extendedStats?.my_classes_count || dashboardData?.stats?.classes_count || 0}
              </p>
              <p className="text-sm text-white/70 mt-1">My Classes</p>
            </div>
          </button>

          {/* Today's Attendance - Green if marked, Amber if pending */}
          {(() => {
            const isMarked = extendedStats?.today_attendance?.marked || dashboardData?.stats?.today_attendance?.marked;
            const present = extendedStats?.today_attendance?.present || dashboardData?.stats?.today_attendance?.present || 0;
            const total = extendedStats?.today_attendance?.total || dashboardData?.stats?.today_attendance?.total || 0;
            
            return (
              <button
                onClick={() => handleMenuClick('attendance')}
                className={`relative rounded-2xl p-5 text-left group overflow-hidden hover:shadow-xl transition-all ${
                  isMarked 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 hover:shadow-emerald-500/25' 
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:shadow-amber-500/25'
                }`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="p-2 bg-white/20 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {isMarked ? `${present}/${total}` : 'Pending'}
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    {isMarked ? '✓ Marked Today' : 'Mark Attendance'}
                  </p>
                </div>
              </button>
            );
          })()}

          {/* View Tasks Button */}
          <button
            onClick={() => handleMenuClick('tasks')}
            className="relative bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-left group overflow-hidden hover:shadow-xl hover:shadow-rose-500/25 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="p-2 bg-white/20 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-white flex items-center gap-1">
                Tasks
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </p>
              <p className="text-sm text-white/70 mt-1">
                {extendedStats?.pending_tasks || dashboardData?.stats?.pending_tasks || 0} pending
              </p>
            </div>
          </button>
        </div>

        {/* Quick Actions - Modern Pills */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleMenuClick('students')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Students</span>
          </button>
          <button
            onClick={() => handleMenuClick('schedule')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Schedule</span>
          </button>
          <button
            onClick={() => handleMenuClick('announcements')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full border border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <div className="p-1.5 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
              <Megaphone className="w-4 h-4 text-pink-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Announcements</span>
          </button>
          <button
            onClick={() => handleMenuClick('attendance')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
          >
            <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Attendance</span>
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Off-canvas on mobile/tablet, fixed on desktop */}
      <aside className={`
        fixed h-full w-[280px] md:w-64 bg-[#0f172a] text-white flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        safe-area-inset
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-slate-700/50 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-lg md:text-xl font-bold text-white">
              Sarathi Learn
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-700 rounded-lg active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 md:py-6 overflow-y-auto">
          <MenuItem
            icon={<Home className="w-5 h-5" />}
            label="Dashboard"
            active={activeMenu === 'dashboard'}
            onClick={() => handleMenuClick('dashboard')}
          />
          <MenuItem
            icon={<CheckSquare className="w-5 h-5" />}
            label="Attendance"
            active={activeMenu === 'attendance'}
            onClick={() => handleMenuClick('attendance')}
            badge={dashboardData?.teacher?.attendance_class ? undefined : 0}
            disabled={!dashboardData?.teacher?.attendance_class}
            statusIndicator={
              attendanceMarkedToday || extendedStats?.today_attendance?.marked 
                ? 'done' 
                : dashboardData?.teacher?.attendance_class 
                  ? 'pending' 
                  : 'disabled'
            }
          />
          <MenuItem
            icon={<GraduationCap className="w-5 h-5" />}
            label="Students"
            active={activeMenu === 'students'}
            onClick={() => handleMenuClick('students')}
            badge={extendedStats?.my_students_count}
          />
          <MenuItem
            icon={<ClipboardList className="w-5 h-5" />}
            label="Tasks"
            active={activeMenu === 'tasks'}
            onClick={() => handleMenuClick('tasks')}
            badge={extendedStats?.pending_tasks || dashboardData?.stats?.pending_tasks}
          />
          <MenuItem
            icon={<Calendar className="w-5 h-5" />}
            label="Schedule"
            active={activeMenu === 'schedule'}
            onClick={() => handleMenuClick('schedule')}
          />
          
          <div className="px-4 md:px-6 py-3 md:py-4 mt-3">
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">SCHOOL</p>
          </div>
          
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Teachers"
            active={activeMenu === 'teachers'}
            onClick={() => handleMenuClick('teachers')}
            badge={extendedStats?.school_total_teachers}
          />
          <MenuItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Classes"
            active={activeMenu === 'classes'}
            onClick={() => handleMenuClick('classes')}
            badge={extendedStats?.my_classes_count}
          />
          
          <div className="px-4 md:px-6 py-3 md:py-4 mt-3">
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">COMMUNICATION</p>
          </div>
          
          <MenuItem
            icon={<Megaphone className="w-5 h-5" />}
            label="Announcements"
            active={activeMenu === 'announcements'}
            onClick={() => handleMenuClick('announcements')}
            badge={announcementCount > 0 ? announcementCount : undefined}
          />
          <MenuItem
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            active={activeMenu === 'reports'}
            onClick={() => handleMenuClick('reports')}
          />
        </nav>

        {/* Teacher Info - Bottom section */}
        <div className="p-3 md:p-4 border-t border-slate-700/50">
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center space-x-2 md:space-x-3 mb-3 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
              {dashboardData?.teacher?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-white text-sm truncate">
                {dashboardData?.teacher?.name || 'Teacher'}
            </div>
              <div className="text-xs text-slate-400 truncate">
                {dashboardData?.teacher?.subjects?.[0]?.name || 'Loading...'}
          </div>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Bar - Sticky header */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4 sticky top-0 z-30 safe-area-inset">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg active:scale-95"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </button>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 capitalize">{activeMenu}</h2>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button 
                onClick={() => handleMenuClick('announcements')}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95"
                title="View Announcements"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {announcementCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {announcementCount > 9 ? '9+' : announcementCount}
                  </span>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 md:px-3 py-2 rounded-lg transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium text-sm md:text-base">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content - Safe area padding for mobile */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto pb-safe">
          {renderContent()}
        </main>
          </div>

      {/* Teacher Profile Modal */}
      {showProfileModal && dashboardData?.teacher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 md:px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">My Profile</h3>
                <button
                  onClick={() => { setShowProfileModal(false); setEditingProfile(false); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[65vh]">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {dashboardData.teacher.name?.charAt(0) || 'T'}
                        </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{dashboardData.teacher.name}</h4>
                  <p className="text-sm text-gray-500">ID: {dashboardData.teacher.employee_id}</p>
            </div>
          </div>

              {/* Info Grid */}
            <div className="space-y-4">
                {/* Non-editable Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Qualification</p>
                      <p className="text-sm font-medium text-gray-900">{dashboardData.teacher.qualification || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="text-sm font-medium text-gray-900">{dashboardData.teacher.experience_years || 0} years</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Subjects</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dashboardData.teacher.subjects?.map((s: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                            {s.name}
                          </span>
                        )) || <span className="text-sm text-gray-500">N/A</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Attendance Class</p>
                      <p className="text-sm font-medium text-gray-900">{dashboardData.teacher.attendance_class?.name || 'Not Assigned'}</p>
                    </div>
                  </div>
                </div>

                {/* Editable Contact Info */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-gray-700">Contact Information</h5>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  {editingProfile ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Address</label>
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Enter address"
              />
            </div>
          </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{dashboardData.teacher.phone || 'Not provided'}</span>
      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-900">{dashboardData.teacher.email || 'Not provided'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-900">{dashboardData.teacher.address || 'Not provided'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Permissions</h5>
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.teacher.permissions?.can_mark_attendance && (
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">✓ Attendance</span>
                    )}
                    {dashboardData.teacher.permissions?.can_assign_homework && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">✓ Homework</span>
                    )}
                    {dashboardData.teacher.permissions?.can_grade_assignments && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">✓ Grading</span>
                    )}
                    {dashboardData.teacher.permissions?.can_update_pii && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">✓ Edit Student PII</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-3">
              {editingProfile ? (
                <>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
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

// ============ COMPONENTS ============

function MenuItem({
  icon,
  label,
  active,
  onClick,
  badge,
  disabled,
  statusIndicator,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
  statusIndicator?: 'done' | 'pending' | 'disabled';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-4 md:px-6 py-3 transition-all ${
        disabled
          ? 'text-slate-600 cursor-not-allowed'
          : active
            ? 'bg-slate-800 text-white border-l-4 border-blue-500'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
        <span className="font-medium text-sm">{label}</span>
        {statusIndicator && (
          <span className={`w-2 h-2 rounded-full ${
            statusIndicator === 'done' 
              ? 'bg-green-500' 
              : statusIndicator === 'pending' 
                ? 'bg-amber-500 animate-pulse' 
                : 'bg-slate-600'
          }`} />
        )}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// Placeholder components for other views - All responsive
function AttendanceSection({ 
  teacherProfile,
  onAttendanceMarked
}: { 
  teacherProfile: any;
  onAttendanceMarked?: () => void;
}) {
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Check if teacher has attendance class assigned
  const hasAttendanceClass = teacherProfile?.attendance_class || teacherProfile?.permissions?.can_mark_attendance;
  
  // Check if today's attendance is fully marked
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isTodayMarked = isToday && attendanceData?.marked_count === attendanceData?.total_students && attendanceData?.total_students > 0;

  useEffect(() => {
    if (hasAttendanceClass) {
      loadAttendanceData();
    }
  }, [selectedDate, hasAttendanceClass]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getAttendanceStudents(selectedDate);
      setAttendanceData(data);
      
      // Initialize attendance status from existing data
      const initialStatus: { [key: string]: string } = {};
      data.students?.forEach((student: any) => {
        if (student.status) {
          initialStatus[student.id] = student.status;
        }
      });
      setAttendanceStatus(initialStatus);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setMessage({ type: 'error', text: 'Failed to load attendance data' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (Object.keys(attendanceStatus).length === 0) {
      setMessage({ type: 'error', text: 'Please mark attendance for at least one student' });
      return;
    }

    try {
      setSaving(true);
      const attendanceRecords = Object.entries(attendanceStatus).map(([studentId, status]) => ({
        student_id: studentId,
        status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
      }));

      await teacherDashboardService.markAttendance(selectedDate, attendanceRecords);
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      
      // Reload data to get updated status
      loadAttendanceData();
      
      // Notify parent that attendance was marked
      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setShowCalendarModal(true);
  };

  const canEdit = teacherProfile?.permissions?.can_mark_attendance !== false;

  // No attendance class assigned
  if (!hasAttendanceClass) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckSquare className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Attendance Class Assigned</h3>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
          You don't have any class assigned for attendance. Please contact your school administrator to get a class assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Class Info */}
      <div className={`rounded-xl md:rounded-2xl p-4 md:p-6 text-white ${
        isTodayMarked 
          ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
          : 'bg-gradient-to-r from-emerald-600 to-teal-600'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <CheckSquare className={`w-5 h-5 md:w-6 md:h-6 ${isTodayMarked ? 'text-green-300' : ''}`} />
              Attendance
              {isTodayMarked && (
                <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  ✓ Marked
                </span>
              )}
            </h2>
            <p className={`text-sm mt-1 ${isTodayMarked ? 'text-gray-300' : 'text-emerald-100'}`}>
              {teacherProfile?.attendance_class?.name || 'My Class'} • {attendanceData?.total_students || 0} students
            </p>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{attendanceData?.total_students || 0}</p>
            <p className={`text-[10px] md:text-xs ${isTodayMarked ? 'text-gray-300' : 'text-emerald-100'}`}>Total</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-green-300">
              {Object.values(attendanceStatus).filter(s => s === 'PRESENT').length}
            </p>
            <p className={`text-[10px] md:text-xs ${isTodayMarked ? 'text-gray-300' : 'text-emerald-100'}`}>Present</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-red-300">
              {Object.values(attendanceStatus).filter(s => s === 'ABSENT').length}
            </p>
            <p className={`text-[10px] md:text-xs ${isTodayMarked ? 'text-gray-300' : 'text-emerald-100'}`}>Absent</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-yellow-300">
              {Object.values(attendanceStatus).filter(s => s === 'LATE').length}
            </p>
            <p className={`text-[10px] md:text-xs ${isTodayMarked ? 'text-gray-300' : 'text-emerald-100'}`}>Late</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="float-right font-bold"
          >×</button>
        </div>
      )}

      {/* Save Button */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {Object.keys(attendanceStatus).length} of {attendanceData?.total_students || 0} students marked
            </p>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || Object.keys(attendanceStatus).length === 0}
              className="px-4 md:px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-xs md:text-sm font-medium rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>💾 Save Attendance</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-500">💡 Tap on student name to view their attendance history</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : attendanceData?.students?.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {attendanceData.students.map((student: any, index: number) => (
              <div 
                key={student.id} 
                className={`flex items-center justify-between p-3 md:p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                {/* Student Info - Clickable */}
                <button
                  onClick={() => handleStudentClick(student)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-gray-100 rounded-lg p-1 -m-1 transition-colors"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm md:text-base truncate hover:text-teal-600">{student.name}</p>
                    <p className="text-xs text-gray-500">Roll: {student.roll_no || index + 1} • <span className="text-teal-600">View History →</span></p>
                  </div>
                </button>

                {/* Attendance Buttons */}
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                    disabled={!canEdit}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 ${
                      attendanceStatus[student.id] === 'PRESENT'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="hidden sm:inline">Present</span>
                    <span className="sm:hidden">P</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.id, 'ABSENT')}
                    disabled={!canEdit}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 ${
                      attendanceStatus[student.id] === 'ABSENT'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="hidden sm:inline">Absent</span>
                    <span className="sm:hidden">A</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No students found in this class</p>
          </div>
        )}
      </div>

      {/* Student Attendance Calendar Modal */}
      {showCalendarModal && selectedStudent && (
        <StudentAttendanceCalendarModal
          student={selectedStudent}
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}

// Student Attendance Calendar Modal
function StudentAttendanceCalendarModal({
  student,
  onClose,
}: {
  student: any;
  onClose: () => void;
}) {
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadCalendarData();
  }, [student.id, year, month]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getStudentAttendanceCalendar(student.id, year, month);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getDayClass = (day: any) => {
    if (day.is_future) return 'bg-gray-50 text-gray-300';
    if (day.is_holiday) return 'bg-amber-100 border-amber-300 text-amber-700';
    if (day.is_weekend) return 'bg-gray-100 border-gray-200 text-gray-400';
    
    switch (day.status) {
      case 'PRESENT':
        return 'bg-green-100 border-green-300 text-green-700';
      case 'ABSENT':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'LATE':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'EXCUSED':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'PRESENT': return 'P';
      case 'ABSENT': return 'A';
      case 'LATE': return 'L';
      case 'EXCUSED': return 'E';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{student.name}</h3>
                <p className="text-teal-100 text-sm">Roll: {student.roll_no} • Attendance History</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h4 className="text-lg font-semibold text-gray-900">
              {calendarData?.month_name || ''} {year}
            </h4>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={year === new Date().getFullYear() && month === new Date().getMonth() + 1}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : calendarData ? (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                  <span>Weekend</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for first week offset */}
                {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {calendarData.calendar.map((day: any) => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center ${getDayClass(day)}`}
                    title={day.is_holiday ? day.holiday_info?.name : day.status || 'No record'}
                  >
                    <span className="text-xs font-medium">{day.day}</span>
                    {day.status && !day.is_weekend && !day.is_holiday && (
                      <span className="text-[8px] font-bold">{getStatusLabel(day.status)}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-700">{calendarData.summary.present}</p>
                  <p className="text-[10px] text-green-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-700">{calendarData.summary.absent}</p>
                  <p className="text-[10px] text-red-600">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-yellow-700">{calendarData.summary.late}</p>
                  <p className="text-[10px] text-yellow-600">Late</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-teal-700">{calendarData.summary.attendance_percentage}%</p>
                  <p className="text-[10px] text-teal-600">Attendance</p>
                </div>
              </div>

              {/* Total Stats */}
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total School Days: <strong>{calendarData.summary.total_days}</strong></span>
                  <span>Holidays: <strong>{calendarData.summary.holidays}</strong></span>
                  <span>Weekends: <strong>{calendarData.summary.weekends}</strong></span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No calendar data available</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Student Modal Component
function AddStudentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  className: string;
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    roll_no: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) {
      alert('First name is required');
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add New Student</h3>
            <p className="text-sm text-gray-500">Adding to {className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Student Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={formData.roll_no}
                  onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Roll number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Email (optional)"
                />
              </div>
            </div>
          </div>

          {/* Parent Info */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parent/Guardian Information
            </h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Parent Name</label>
              <input
                type="text"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Parent/Guardian name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Phone</label>
                <input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Parent phone"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Email</label>
                <input
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Parent email"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
                </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Student
                </>
              )}
                </button>
              </div>
        </form>
            </div>
    </div>
  );
}

// Students Section - Shows classes first, then students, then student details
function StudentsSection({ 
  teacherProfile,
  schoolClasses 
}: { 
  teacherProfile: any;
  schoolClasses: any;
}) {
  type ViewMode = 'classes' | 'students' | 'detail';
  
  const [viewMode, setViewMode] = useState<ViewMode>('classes');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  
  // PII Update permission
  const canUpdatePII = teacherProfile?.permissions?.can_update_pii || false;

  const handleAddStudent = async (studentData: any) => {
    try {
      setAddingStudent(true);
      const classId = selectedClass?.class_id || selectedClass?.id;
      await teacherDashboardService.addStudent({
        class_id: classId,
        ...studentData
      });
      setMessage({ type: 'success', text: 'Student added successfully!' });
      setShowAddStudentModal(false);
      // Reload students list
      loadClassStudents(classId);
    } catch (err: any) {
      console.error('Failed to add student:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add student' });
    } finally {
      setAddingStudent(false);
    }
  };

  const handleClassClick = async (classItem: any) => {
    setSelectedClass(classItem);
    setViewMode('students');
    // Use class_id (Class template ID) instead of id (SchoolClass ID)
    loadClassStudents(classItem.class_id || classItem.id);
  };

  const loadClassStudents = async (classId: string, search?: string) => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getSchoolStudents(classId, search);
      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student: any) => {
    setSelectedStudent(student);
    setViewMode('detail');
    loadStudentDetail(student.id);
  };

  const loadStudentDetail = async (studentId: string) => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getStudentDetail(studentId);
      setStudentDetail(data);
    } catch (err) {
      console.error('Failed to load student detail:', err);
      setMessage({ type: 'error', text: 'Failed to load student details' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode('students');
      setStudentDetail(null);
    } else if (viewMode === 'students') {
      setViewMode('classes');
      setSelectedClass(null);
      setStudents([]);
    }
  };

  const handleSearch = () => {
    if (selectedClass) {
      loadClassStudents(selectedClass.class_id || selectedClass.id, searchTerm);
    }
  };

  // Get teacher's assigned classes
  const teacherClasses = schoolClasses?.classes || [];

  // Classes View
  if (viewMode === 'classes') {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
            My Classes
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            Select a class to view students
          </p>
        </div>

        {teacherClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherClasses.map((classItem: any) => (
              <button
                key={classItem.id}
                onClick={() => handleClassClick(classItem)}
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 text-left hover:shadow-lg hover:border-indigo-300 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl">
                    {classItem.grade || classItem.name?.charAt(0) || 'C'}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900 text-base md:text-lg">
                  {classItem.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {classItem.section ? `Section ${classItem.section}` : 'All Sections'}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{classItem.current_students || classItem.student_count || 0} students</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500 text-sm">
              You don't have any classes assigned yet. Please contact your administrator.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Students List View
  if (viewMode === 'students') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Classes
            </button>
            {canUpdatePII && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            )}
          </div>
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
            {selectedClass?.name}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            {students.length} students • Click on a student to view details
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95"
          >
            Search
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Students List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((student: any, index: number) => (
              <button
                key={student.id}
                onClick={() => handleStudentClick(student)}
                className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-indigo-300 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Roll: {student.roll_no || index + 1}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 flex-shrink-0" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    student.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                  {student.parent_phone && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {student.parent_phone}
                    </span>
                  )}
                </div>
                          </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students found in this class</p>
            {canUpdatePII && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Student
                          </button>
            )}
                        </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <AddStudentModal
            isOpen={showAddStudentModal}
            onClose={() => setShowAddStudentModal(false)}
            onSubmit={handleAddStudent}
            isLoading={addingStudent}
            className={selectedClass?.name || ''}
          />
        )}
      </div>
    );
  }

  // Student Detail View
  if (viewMode === 'detail') {
    return (
      <StudentDetailView
        student={studentDetail}
        loading={loading}
        canUpdatePII={canUpdatePII}
        onBack={handleBack}
        onRefresh={() => loadStudentDetail(selectedStudent?.id)}
      />
    );
  }

  return null;
}

// Student Detail View Component
function StudentDetailView({
  student,
  loading,
  canUpdatePII,
  onBack,
  onRefresh,
}: {
  student: any;
  loading: boolean;
  canUpdatePII: boolean;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'tasks' | 'actions'>('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Calendar state
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (activeTab === 'attendance' && student) {
      loadCalendar();
    }
    if (activeTab === 'tasks' && student) {
      loadTasks();
    }
  }, [activeTab, calendarYear, calendarMonth, student]);

  const loadTasks = async () => {
    if (!student) return;
    try {
      setLoadingTasks(true);
      const data = await teacherDashboardService.getStudentTasks(student.id);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await teacherDashboardService.createStudentTask(student.id, taskData);
      setMessage({ type: 'success', text: 'Task created successfully!' });
      setShowCreateTaskModal(false);
      loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      setMessage({ type: 'error', text: 'Failed to create task' });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await teacherDashboardService.updateStudentTaskStatus(taskId, newStatus);
      loadTasks();
      // Also refresh task detail if open
      if (selectedTaskId === taskId && showTaskDetailModal) {
        loadTaskDetail(taskId);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setMessage({ type: 'error', text: 'Failed to update task status' });
    }
  };

  const handleOpenTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetailModal(true);
    await loadTaskDetail(taskId);
  };

  const loadTaskDetail = async (taskId: string) => {
    try {
      setLoadingTaskDetail(true);
      const data = await teacherDashboardService.getStudentTaskDetail(taskId);
      setSelectedTaskDetail(data);
    } catch (err) {
      console.error('Failed to load task detail:', err);
      setMessage({ type: 'error', text: 'Failed to load task details' });
    } finally {
      setLoadingTaskDetail(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTaskId || !replyContent.trim()) return;
    try {
      setSendingReply(true);
      await teacherDashboardService.addStudentTaskReply(selectedTaskId, replyContent.trim());
      setReplyContent('');
      await loadTaskDetail(selectedTaskId);
      loadTasks(); // Refresh tasks list
    } catch (err) {
      console.error('Failed to send reply:', err);
      setMessage({ type: 'error', text: 'Failed to send reply' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetailModal(false);
    setSelectedTaskId(null);
    setSelectedTaskDetail(null);
    setReplyContent('');
  };

  const loadCalendar = async () => {
    if (!student) return;
    try {
      setLoadingCalendar(true);
      const data = await teacherDashboardService.getStudentAttendanceCalendar(student.id, calendarYear, calendarMonth);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const getDayClass = (day: any) => {
    if (day.is_future) return 'bg-gray-50 text-gray-300';
    if (day.is_holiday) return 'bg-amber-100 border-amber-300 text-amber-700';
    if (day.is_weekend) return 'bg-gray-100 border-gray-200 text-gray-400';
    
    switch (day.status) {
      case 'PRESENT': return 'bg-green-100 border-green-300 text-green-700';
      case 'ABSENT': return 'bg-red-100 border-red-300 text-red-700';
      case 'LATE': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'EXCUSED': return 'bg-blue-100 border-blue-300 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await teacherDashboardService.updateStudent(student.id, editData);
      setMessage({ type: 'success', text: 'Student information updated successfully!' });
      setShowEditModal(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update student:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update student information' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Student not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-teal-200 hover:text-white mb-3 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Students
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold">
            {student.name?.charAt(0) || student.first_name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{student.name || `${student.first_name} ${student.last_name}`}</h2>
            <p className="text-teal-100 text-sm mt-1">
              {student.class_name} • Roll: {student.roll_no || 'N/A'}
            </p>
            <p className="text-teal-200 text-xs mt-1">
              UDISE: {student.udise_student_id}
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['info', 'attendance', 'tasks', 'actions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'info' && '📋 Information'}
            {tab === 'attendance' && '📅 Attendance'}
            {tab === 'tasks' && '📝 Tasks'}
            {tab === 'actions' && '⚡ Actions'}
          </button>
        ))}
            </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* PII Edit Button */}
          {canUpdatePII && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <Award className="w-4 h-4" />
                <span>You have PII update permission</span>
          </div>
              <button
                onClick={() => {
                  setEditData({
                    first_name: student.first_name,
                    last_name: student.last_name,
                    phone: student.phone,
                    parent_name: student.parent_name,
                    parent_phone: student.parent_phone,
                    parent_email: student.parent_email,
                    roll_no: student.roll_no,
                    date_of_birth: student.date_of_birth || '',
                  });
                  setShowEditModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                Edit Student
              </button>
            </div>
          )}

          {/* Info Grid */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StudentInfoItem label="Full Name" value={student.name || `${student.first_name} ${student.last_name}`} />
                <StudentInfoItem label="Email" value={student.email} />
                <StudentInfoItem label="Phone" value={student.phone} />
                <StudentInfoItem label="Date of Birth" value={student.date_of_birth} />
                <StudentInfoItem label="Gender" value={student.gender} />
                <StudentInfoItem label="Roll Number" value={student.roll_no} />
              </div>
            </div>

            {/* Academic Info */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StudentInfoItem label="Class" value={student.class_name} />
                <StudentInfoItem label="UDISE ID" value={student.udise_student_id} />
                <StudentInfoItem label="School" value={student.school_name} />
                <StudentInfoItem label="Academic Year" value={student.academic_year} />
                <StudentInfoItem label="Enrollment Date" value={student.enrollment_date} />
                <StudentInfoItem 
                  label="Status" 
                  value={student.is_active ? 'Active' : 'Inactive'}
                  badge={student.is_active ? 'green' : 'red'}
                />
              </div>
            </div>

            {/* Parent Info */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Parent/Guardian Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StudentInfoItem label="Parent Name" value={student.parent_name} />
                <StudentInfoItem label="Parent Phone" value={student.parent_phone} />
                <StudentInfoItem label="Parent Email" value={student.parent_email} />
              </div>
            </div>

            {/* Address */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StudentInfoItem label="Address" value={student.address} className="sm:col-span-2" />
                <StudentInfoItem label="City" value={student.city} />
                <StudentInfoItem label="District" value={student.district} />
                <StudentInfoItem label="State" value={student.state} />
                <StudentInfoItem label="Pincode" value={student.pincode} />
              </div>
            </div>

            {/* Attendance Summary */}
            {student.attendance_summary && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Last 30 Days Attendance
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{student.attendance_summary.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-700">{student.attendance_summary.present}</p>
                    <p className="text-xs text-green-600">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-700">{student.attendance_summary.absent}</p>
                    <p className="text-xs text-red-600">Absent</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-yellow-700">{student.attendance_summary.late}</p>
                    <p className="text-xs text-yellow-600">Late</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h4 className="text-lg font-semibold text-gray-900">
              {calendarData?.month_name || ''} {calendarYear}
            </h4>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {loadingCalendar ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : calendarData ? (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                  <span>Holiday</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {calendarData.calendar?.map((day: any) => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center ${getDayClass(day)}`}
                  >
                    <span className="text-xs font-medium">{day.day}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-700">{calendarData.summary?.present || 0}</p>
                  <p className="text-[10px] text-green-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-700">{calendarData.summary?.absent || 0}</p>
                  <p className="text-[10px] text-red-600">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-yellow-700">{calendarData.summary?.late || 0}</p>
                  <p className="text-[10px] text-yellow-600">Late</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-teal-700">{calendarData.summary?.attendance_percentage || 0}%</p>
                  <p className="text-[10px] text-teal-600">Rate</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No attendance data available</p>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
            <div className="space-y-4">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Tasks & Notes ({tasks.length})
            </h3>
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 flex items-center gap-2"
            >
              <span>+</span> Create Task
            </button>
          </div>

          {/* Tasks List */}
          {loadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenTaskDetail(task.id)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          task.task_type === 'TASK' ? 'bg-blue-100 text-blue-700' :
                          task.task_type === 'NOTE' ? 'bg-gray-100 text-gray-700' :
                          task.task_type === 'REMINDER' ? 'bg-amber-100 text-amber-700' :
                          task.task_type === 'HOMEWORK' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {task.task_type}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {task.created_by && (
                          <span>By: {task.created_by.name}</span>
                        )}
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleUpdateTaskStatus(task.id, e.target.value);
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded-lg border ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          task.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No tasks or notes for this student</p>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                Create First Task
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          {/* Send Notification */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Send Notification
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Send a notification to this student or their parent
            </p>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:scale-95"
            >
              Send Notification
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-500" />
              AI Usage
            </h3>
            <div className="flex items-center gap-4">
      <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">AI Quota Used</span>
                  <span className="font-medium">{student.ai_quota_used || 0} / {student.ai_quota_limit || 100}</span>
      </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min((student.ai_quota_used / student.ai_quota_limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit PII Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">Edit Student Information</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editData.first_name || ''}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editData.last_name || ''}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
          </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={editData.roll_no || ''}
                  onChange={(e) => setEditData({ ...editData, roll_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
      </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                <input
                  type="text"
                  value={editData.parent_name || ''}
                  onChange={(e) => setEditData({ ...editData, parent_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                <input
                  type="text"
                  value={editData.parent_phone || ''}
                  onChange={(e) => setEditData({ ...editData, parent_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  value={editData.parent_email || ''}
                  onChange={(e) => setEditData({ ...editData, parent_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editData.date_of_birth || ''}
                  onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <SendNotificationModal
          studentName={student.name || `${student.first_name} ${student.last_name}`}
          onClose={() => setShowNotificationModal(false)}
          onSend={(data) => {
            console.log('Send notification:', data);
            setMessage({ type: 'success', text: 'Notification sent successfully!' });
            setShowNotificationModal(false);
          }}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <CreateStudentTaskModal
          studentName={student.name || `${student.first_name} ${student.last_name}`}
          onClose={() => setShowCreateTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {/* Task Detail Modal */}
      {showTaskDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
              <button
                onClick={handleCloseTaskDetail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTaskDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : selectedTaskDetail ? (
                <div className="space-y-4">
                  {/* Task Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{selectedTaskDetail.title}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        selectedTaskDetail.task_type === 'TASK' ? 'bg-blue-100 text-blue-700' :
                        selectedTaskDetail.task_type === 'NOTE' ? 'bg-gray-100 text-gray-700' :
                        selectedTaskDetail.task_type === 'REMINDER' ? 'bg-amber-100 text-amber-700' :
                        selectedTaskDetail.task_type === 'HOMEWORK' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedTaskDetail.task_type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        selectedTaskDetail.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        selectedTaskDetail.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        selectedTaskDetail.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {selectedTaskDetail.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        selectedTaskDetail.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        selectedTaskDetail.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        selectedTaskDetail.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedTaskDetail.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTaskDetail.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                      {selectedTaskDetail.created_by && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          By: {selectedTaskDetail.created_by.name}
                        </span>
                      )}
                      {selectedTaskDetail.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(selectedTaskDetail.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Created: {new Date(selectedTaskDetail.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Conversation / Replies */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Conversation ({selectedTaskDetail.replies?.length || 0})
                    </h5>
                    
                    {selectedTaskDetail.replies && selectedTaskDetail.replies.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedTaskDetail.replies.map((reply: any) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg ${
                              reply.reply_type === 'TEACHER' 
                                ? 'bg-indigo-50 border border-indigo-100 ml-4' 
                                : 'bg-gray-50 border border-gray-100 mr-4'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                reply.reply_type === 'TEACHER' 
                                  ? 'bg-indigo-100 text-indigo-700' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {reply.reply_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {reply.replied_by?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No replies yet</p>
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Reply</label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSendReply}
                        disabled={!replyContent.trim() || sendingReply}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">Task not found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Student Info Item Component
function StudentInfoItem({ 
  label,
  value, 
  badge,
  className = '' 
}: {
  label: string;
  value: any; 
  badge?: 'green' | 'red' | 'yellow';
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {badge ? (
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
          badge === 'green' ? 'bg-green-100 text-green-700' :
          badge === 'red' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {value || 'N/A'}
        </span>
      ) : (
        <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
      )}
      </div>
  );
}

// Send Notification Modal
function SendNotificationModal({
  studentName,
  onClose,
  onSend,
}: {
  studentName: string;
  onClose: () => void;
  onSend: (data: { title: string; message: string; type: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">Send Notification</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Send notification to: <strong>{studentName}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="INFO">Information</option>
              <option value="WARNING">Warning</option>
              <option value="REMINDER">Reminder</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3">
    <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
    </button>
          <button
            onClick={() => onSend({ title, message, type })}
            disabled={!title || !message}
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Student Task Modal
function CreateStudentTaskModal({
  studentName,
  onClose,
  onSave,
}: {
  studentName: string;
  onClose: () => void;
  onSave: (data: { title: string; description: string; task_type: string; priority: string; due_date?: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({
      title,
      description,
      task_type: taskType,
      priority,
      due_date: dueDate || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Create Task
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
      </div>
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-500">
            Create task for: <strong className="text-gray-900">{studentName}</strong>
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="TASK">📋 Task</option>
                <option value="NOTE">📝 Note</option>
                <option value="REMINDER">⏰ Reminder</option>
                <option value="HOMEWORK">📚 Homework</option>
                <option value="FOLLOWUP">🔄 Follow-up</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🟠 High</option>
                <option value="URGENT">🔴 Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title || !description || saving}
            className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// Teacher Tasks Section - Tasks assigned by Admin
function TasksSection() {
  const [allTasks, setAllTasks] = useState<any[]>([]); // All tasks for counts
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getAllTasks();
      setAllTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setMessage({ type: 'error', text: 'Failed to load tasks' });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter tasks for display
  const displayTasks = statusFilter 
    ? allTasks.filter((t: any) => t.status === statusFilter)
    : allTasks;

  const loadTaskDetail = async (taskId: string) => {
    try {
      setLoadingDetail(true);
      const data = await teacherDashboardService.getTaskDetail(taskId);
      setTaskDetail(data);
    } catch (err) {
      console.error('Failed to load task detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTaskClick = (task: any) => {
    setShowTaskDetail(true);
    loadTaskDetail(task.id);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await teacherDashboardService.updateTaskStatus(taskId, newStatus);
      setMessage({ type: 'success', text: `Task marked as ${newStatus.replace('_', ' ').toLowerCase()}` });
      loadTasks();
      if (taskDetail && taskDetail.id === taskId) {
        loadTaskDetail(taskId);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setMessage({ type: 'error', text: 'Failed to update task status' });
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !taskDetail) return;
    
    try {
      setSendingReply(true);
      await teacherDashboardService.replyToTask(taskDetail.id, replyContent);
      setReplyContent('');
      setMessage({ type: 'success', text: 'Reply sent successfully' });
      loadTaskDetail(taskDetail.id);
    } catch (err) {
      console.error('Failed to send reply:', err);
      setMessage({ type: 'error', text: 'Failed to send reply' });
    } finally {
      setSendingReply(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return '📋';
      case 'IN_PROGRESS': return '⏳';
      case 'COMPLETED': return '✅';
      case 'CLOSED': return '🔒';
      default: return '📋';
    }
  };

  // Task counts by status (from ALL tasks, not filtered)
  const taskCounts = {
    all: allTasks.length,
    open: allTasks.filter(t => t.status === 'OPEN').length,
    in_progress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: allTasks.filter(t => t.status === 'COMPLETED').length,
    closed: allTasks.filter(t => t.status === 'CLOSED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
          My Tasks
        </h2>
        <p className="text-amber-100 text-sm mt-1">
          Tasks assigned to you by school admin
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{taskCounts.open}</p>
            <p className="text-[10px] md:text-xs text-amber-100">Open</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{taskCounts.in_progress}</p>
            <p className="text-[10px] md:text-xs text-amber-100">In Progress</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{taskCounts.completed}</p>
            <p className="text-[10px] md:text-xs text-amber-100">Completed</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{taskCounts.closed}</p>
            <p className="text-[10px] md:text-xs text-amber-100">Closed</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: '', label: 'All', count: taskCounts.all },
          { value: 'OPEN', label: 'Open', count: taskCounts.open },
          { value: 'IN_PROGRESS', label: 'In Progress', count: taskCounts.in_progress },
          { value: 'COMPLETED', label: 'Completed', count: taskCounts.completed },
          { value: 'CLOSED', label: 'Closed', count: taskCounts.closed },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              statusFilter === filter.value
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              statusFilter === filter.value
                ? 'bg-white/20'
                : 'bg-gray-200'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : displayTasks.length > 0 ? (
        <div className="space-y-3">
          {displayTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-amber-300 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${getStatusBadge(task.status)}`}>
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        📅 {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.replies_count > 0 && (
                      <span className="flex items-center gap-1">
                        💬 {task.replies_count} replies
                      </span>
                    )}
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {statusFilter ? `No ${statusFilter.toLowerCase().replace('_', ' ')} tasks` : 'No tasks assigned to you'}
          </p>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Task Details</h3>
                  {taskDetail && (
                    <p className="text-amber-100 text-xs">
                      Created {new Date(taskDetail.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTaskDetail(false);
                  setTaskDetail(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : taskDetail ? (
                <>
                  {/* Task Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-lg font-bold text-gray-900">{taskDetail.title}</h4>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(taskDetail.priority)}`}>
                          {taskDetail.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(taskDetail.status)}`}>
                          {taskDetail.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600">{taskDetail.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Assigned By</p>
                        <p className="font-medium text-gray-900">{taskDetail.assigned_by?.name || 'Unknown'}</p>
                        {taskDetail.assigned_by?.role && (
                          <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
                            {taskDetail.assigned_by.role}
                          </span>
                        )}
                      </div>
                      {taskDetail.due_date && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Due Date</p>
                          <p className="font-medium text-gray-900">{new Date(taskDetail.due_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    {taskDetail.status !== 'CLOSED' && taskDetail.status !== 'COMPLETED' && (
                      <div className="flex gap-2 pt-2">
                        {taskDetail.status === 'OPEN' && (
                          <button
                            onClick={() => handleStatusUpdate(taskDetail.id, 'IN_PROGRESS')}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95"
                          >
                            ⏳ Start Working
                          </button>
                        )}
                        {(taskDetail.status === 'OPEN' || taskDetail.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => handleStatusUpdate(taskDetail.id, 'COMPLETED')}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95"
                          >
                            ✅ Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Replies Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      💬 Conversation ({taskDetail.replies?.length || 0})
                    </h5>
                    
                    {/* Replies List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                      {taskDetail.replies?.length > 0 ? (
                        taskDetail.replies.map((reply: any) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg ${
                              reply.reply_type === 'TEACHER'
                                ? 'bg-amber-50 border border-amber-100 ml-4'
                                : 'bg-blue-50 border border-blue-100 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium ${
                                reply.reply_type === 'TEACHER' ? 'text-amber-700' : 'text-blue-700'
                              }`}>
                                {reply.replied_by?.name || 'Unknown'}
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100">
                                  {reply.reply_type === 'TEACHER' ? 'You' : (reply.replied_by?.role || 'Admin')}
                                </span>
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 text-sm py-4">No replies yet</p>
                      )}
                    </div>

                    {/* Reply Input */}
                    {taskDetail.status !== 'CLOSED' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Type your reply..."
                          onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyContent.trim() || sendingReply}
                          className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:bg-gray-400 flex items-center gap-2"
                        >
                          {sendingReply ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Send'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Failed to load task details</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Schedule / Activities Section
function ScheduleSection() {
  const [view, setView] = useState<'classes' | 'activities' | 'detail' | 'submissions'>('classes');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [submissionStats, setSubmissionStats] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getActivityClasses();
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassActivities = async (classId: string, pageNum: number = 1) => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getClassActivities(classId, pageNum, 10);
      setActivities(data.activities);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityDetail = async (activityId: string) => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getActivityDetail(activityId);
      setSelectedActivity(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (activityId: string, pageNum: number = 1) => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getActivitySubmissions(activityId, pageNum, 20);
      setSubmissions(data.submissions);
      setPagination(data.pagination);
      setSubmissionStats(data.stats);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem: any) => {
    setSelectedClass(classItem);
    setView('activities');
    loadClassActivities(classItem.id);
  };

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
    setView('detail');
    loadActivityDetail(activity.id);
  };

  const handleViewSubmissions = () => {
    if (selectedActivity) {
      setView('submissions');
      loadSubmissions(selectedActivity.id);
    }
  };

  const handleBack = () => {
    if (view === 'submissions') {
      setView('detail');
    } else if (view === 'detail') {
      setView('activities');
      if (selectedClass) loadClassActivities(selectedClass.id);
    } else if (view === 'activities') {
      setView('classes');
      setSelectedClass(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setMessage({ type: 'success', text: 'Activity created successfully!' });
    if (selectedClass) loadClassActivities(selectedClass.id);
  };

  const handleUpdateStatus = async (status: 'DRAFT' | 'ACTIVE' | 'CLOSED') => {
    if (!selectedActivity) return;
    try {
      await teacherDashboardService.updateActivityStatus(selectedActivity.id, status);
      setMessage({ type: 'success', text: `Activity marked as ${status.toLowerCase()}` });
      loadActivityDetail(selectedActivity.id);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setMessage({ type: 'success', text: 'Activity updated successfully!' });
    if (selectedActivity) {
      loadActivityDetail(selectedActivity.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'CLOSED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'LATE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
              {view === 'classes' && 'Activities & Schedule'}
              {view === 'activities' && selectedClass?.full_name}
              {view === 'detail' && 'Activity Details'}
              {view === 'submissions' && 'Submissions'}
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              {view === 'classes' && 'Create and manage activities for your classes'}
              {view === 'activities' && `${activities.length} activities`}
              {view === 'detail' && selectedActivity?.title}
              {view === 'submissions' && `${submissionStats?.total || 0} students`}
            </p>
          </div>
          {view !== 'classes' && (
            <button
              onClick={handleBack}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Classes View */}
          {view === 'classes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.length > 0 ? classes.map((classItem) => (
                <button
                  key={classItem.id}
                  onClick={() => handleClassClick(classItem)}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{classItem.full_name}</h4>
                      <p className="text-sm text-gray-500">{classItem.student_count} students</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {classItem.subjects?.slice(0, 3).map((subject: any) => (
                      <span key={subject.id} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {subject.name}
                      </span>
                    ))}
                    {classItem.subjects?.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{classItem.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              )) : (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No classes assigned to you</p>
                </div>
              )}
            </div>
          )}

          {/* Activities View */}
          {view === 'activities' && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Activity
                </button>
              </div>

              {/* Activities List */}
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(activity.status)}`}>
                              {activity.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {activity.subject && <span>📚 {activity.subject.name}</span>}
                            {activity.scheduled_date && <span>📅 {new Date(activity.scheduled_date).toLocaleDateString()}</span>}
                            <span>📝 {activity.completed_count}/{activity.submissions_count} completed</span>
                          </div>
                          {/* Meeting Links */}
                          <div className="flex gap-2 mt-2">
                            {activity.google_meet_link && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Google Meet</span>
                            )}
                            {activity.zoom_link && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Zoom</span>
                            )}
                            {activity.other_link && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">{activity.link_label || 'Link'}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                  ))}

                  {/* Pagination */}
                  {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => loadClassActivities(selectedClass.id, page - 1)}
                        disabled={!pagination.has_previous}
                        className="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {pagination.total_pages}
                      </span>
                      <button
                        onClick={() => loadClassActivities(selectedClass.id, page + 1)}
                        disabled={!pagination.has_next}
                        className="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No activities yet for this class</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                  >
                    Create First Activity
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Activity Detail View */}
          {view === 'detail' && selectedActivity && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedActivity.title}</h3>
                    <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(selectedActivity.status)}`}>
                      {selectedActivity.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowEditModal(true)} 
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {selectedActivity.status === 'ACTIVE' && (
                      <button onClick={() => handleUpdateStatus('CLOSED')} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200">
                        Close
                      </button>
                    )}
                    {selectedActivity.status === 'DRAFT' && (
                      <button onClick={() => handleUpdateStatus('ACTIVE')} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200">
                        Activate
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{selectedActivity.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {selectedActivity.subject && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Subject</p>
                      <p className="font-medium">{selectedActivity.subject.name}</p>
                    </div>
                  )}
                  {selectedActivity.scheduled_date && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">{new Date(selectedActivity.scheduled_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedActivity.scheduled_time && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">{selectedActivity.scheduled_time}</p>
                    </div>
                  )}
                  {selectedActivity.due_date && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="font-medium">{new Date(selectedActivity.due_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Meeting Links */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedActivity.google_meet_link && (
                    <a href={selectedActivity.google_meet_link} target="_blank" rel="noopener noreferrer" 
                       className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600">
                      🎥 Google Meet
                    </a>
                  )}
                  {selectedActivity.zoom_link && (
                    <a href={selectedActivity.zoom_link} target="_blank" rel="noopener noreferrer"
                       className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600">
                      🎥 Zoom
                    </a>
                  )}
                  {selectedActivity.other_link && (
                    <a href={selectedActivity.other_link} target="_blank" rel="noopener noreferrer"
                       className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2 hover:bg-purple-600">
                      🔗 {selectedActivity.link_label || 'Open Link'}
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-indigo-600">{selectedActivity.submissions_count}</p>
                    <p className="text-sm text-indigo-700">Total Students</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{selectedActivity.completed_count}</p>
                    <p className="text-sm text-green-700">Completed</p>
                  </div>
                </div>

                <button
                  onClick={handleViewSubmissions}
                  className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  View All Submissions
                </button>
              </div>
            </div>
          )}

          {/* Submissions View */}
          {view === 'submissions' && (
            <div className="space-y-4">
              {/* Stats */}
              {submissionStats && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-yellow-600">{submissionStats.pending}</p>
                    <p className="text-xs text-yellow-700">Pending</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-600">{submissionStats.submitted}</p>
                    <p className="text-xs text-blue-700">Submitted</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{submissionStats.completed}</p>
                    <p className="text-xs text-green-700">Completed</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-600">{submissionStats.late}</p>
                    <p className="text-xs text-red-700">Late</p>
                  </div>
                </div>
              )}

              {/* Submissions List - Card View like Student Activities */}
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubmission(sub); setShowSubmissionModal(true); }}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {sub.student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{sub.student.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Roll: {sub.student.roll_no}</span>
                              {sub.submitted_at && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getSubmissionStatusBadge(sub.status)}`}>
                            {sub.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => loadSubmissions(selectedActivity.id, page - 1)}
                    disabled={!pagination.has_previous}
                    className="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => loadSubmissions(selectedActivity.id, page + 1)}
                    disabled={!pagination.has_next}
                    className="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Activity Modal */}
      {showCreateModal && selectedClass && (
        <CreateActivityModal
          classItem={selectedClass}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Activity Modal */}
      {showEditModal && selectedActivity && (
        <EditActivityModal
          activity={selectedActivity}
          classItem={selectedClass}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Submission Detail Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {selectedSubmission.student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedSubmission.student.name}</h3>
                    <p className="text-xs text-white/70">Roll: {selectedSubmission.student.roll_no}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowSubmissionModal(false); setSelectedSubmission(null); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSubmissionStatusBadge(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
                {selectedSubmission.submitted_at && (
                  <span className="text-sm text-gray-500">
                    {new Date(selectedSubmission.submitted_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {/* Response */}
              {selectedSubmission.response ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Student Response</h4>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedSubmission.response}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-gray-500">No response submitted yet</p>
                </div>
              )}

              {/* Attachment if any */}
              {selectedSubmission.attachment_url && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attachment</h4>
                  <a
                    href={selectedSubmission.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View Attachment
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </div>
              )}

              {/* Score & Feedback */}
              {(selectedSubmission.score !== null || selectedSubmission.feedback) && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Grading</h4>
                  {selectedSubmission.score !== null && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-indigo-600">
                        {selectedSubmission.score}/{selectedSubmission.max_score || 100}
                      </span>
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                  )}
                  {selectedSubmission.feedback && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-sm text-blue-800">{selectedSubmission.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => { setShowSubmissionModal(false); setSelectedSubmission(null); }}
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

// Create Activity Modal Component
function CreateActivityModal({ classItem, onClose, onSuccess }: {
  classItem: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [otherLink, setOtherLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await teacherDashboardService.createActivity({
        level: 'CLASS',
        title,
        description,
        class_id: classItem.id,
        subject_id: subjectId || undefined,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        due_date: dueDate || undefined,
        google_meet_link: googleMeetLink || undefined,
        zoom_link: zoomLink || undefined,
        other_link: otherLink || undefined,
        link_label: linkLabel || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create activity:', err);
      setError('Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Create Activity</h3>
              <p className="text-indigo-100 text-sm">{classItem.full_name}</p>
      </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Activity title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Activity description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select subject</option>
              {classItem.subjects?.map((sub: any) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Meeting Links (Optional)</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Google Meet</label>
                <input
                  type="url"
                  value={googleMeetLink}
                  onChange={(e) => setGoogleMeetLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Zoom</label>
                <input
                  type="url"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://zoom.us/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Other Link</label>
                  <input
                    type="url"
                    value={otherLink}
                    onChange={(e) => setOtherLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Link Label</label>
                  <input
                    type="text"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Assignment"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Activity
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Activity Modal Component
function EditActivityModal({ activity, classItem, onClose, onSuccess }: {
  activity: any;
  classItem: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(activity.title || '');
  const [description, setDescription] = useState(activity.description || '');
  const [subjectId, setSubjectId] = useState(activity.subject?.id || '');
  const [scheduledDate, setScheduledDate] = useState(activity.scheduled_date || '');
  const [scheduledTime, setScheduledTime] = useState(activity.scheduled_time || '');
  const [dueDate, setDueDate] = useState(activity.due_date || '');
  const [googleMeetLink, setGoogleMeetLink] = useState(activity.google_meet_link || '');
  const [zoomLink, setZoomLink] = useState(activity.zoom_link || '');
  const [otherLink, setOtherLink] = useState(activity.other_link || '');
  const [linkLabel, setLinkLabel] = useState(activity.link_label || '');
  const [activityType, setActivityType] = useState(activity.activity_type || 'ASSIGNMENT');
  const [priority, setPriority] = useState(activity.priority || 'MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await teacherDashboardService.updateActivity(activity.id, {
        title,
        description,
        activity_type: activityType,
        priority,
        subject_id: subjectId || undefined,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        due_date: dueDate || undefined,
        google_meet_link: googleMeetLink || undefined,
        zoom_link: zoomLink || undefined,
        other_link: otherLink || undefined,
        link_label: linkLabel || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to update activity:', err);
      setError('Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Edit Activity</h3>
              <p className="text-amber-100 text-sm">{classItem?.full_name || activity.class?.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="Activity title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="Activity description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="HOMEWORK">Homework</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="PROJECT">Project</option>
                <option value="QUIZ">Quiz</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select subject</option>
              {classItem?.subjects?.map((sub: any) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Meeting Links (Optional)</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Google Meet</label>
                <input
                  type="url"
                  value={googleMeetLink}
                  onChange={(e) => setGoogleMeetLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Zoom</label>
                <input
                  type="url"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="https://zoom.us/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Other Link</label>
                  <input
                    type="url"
                    value={otherLink}
                    onChange={(e) => setOtherLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Link Label</label>
                  <input
                    type="text"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., Assignment"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const [view, setView] = useState<'received' | 'sent'>('received');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [view]);

  const loadAnnouncements = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const data = view === 'received'
        ? await teacherDashboardService.getAnnouncements(pageNum, 10)
        : await teacherDashboardService.getMyAnnouncements(pageNum, 10);
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setMessage({ type: 'success', text: 'Announcement created successfully!' });
    setView('sent');
    loadAnnouncements();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'LOW': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              Announcements
            </h2>
            <p className="text-purple-100 text-sm md:text-base">View and create class/student announcements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('received')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            view === 'received'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Received
        </button>
        <button
          onClick={() => setView('sent')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            view === 'sent'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          My Announcements
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <button
              key={ann.id}
              onClick={() => setSelectedAnnouncement(ann)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{ann.title}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(ann.priority)}`}>
                      {ann.priority}
                    </span>
                    {ann.targets?.map((t: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {t.type}: {t.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {ann.published_at ? new Date(ann.published_at).toLocaleDateString() : 'Draft'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
              {view === 'received' && ann.created_by && (
                <p className="text-xs text-gray-400 mt-2">By: {ann.created_by}</p>
              )}
            </button>
          ))}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => loadAnnouncements(page - 1)}
                disabled={!pagination.has_previous}
                className="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => loadAnnouncements(page + 1)}
                disabled={!pagination.has_next}
                className="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            {view === 'received' ? 'No announcements for you yet' : 'You haven\'t created any announcements'}
          </p>
          {view === 'sent' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
            >
              Create First Announcement
            </button>
          )}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedAnnouncement.priority === 'URGENT' ? 'bg-red-200 text-red-800' :
                      selectedAnnouncement.priority === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                      selectedAnnouncement.priority === 'MEDIUM' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {selectedAnnouncement.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{selectedAnnouncement.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedAnnouncement(null)} 
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Meta Info */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedAnnouncement.targets?.map((t: any, idx: number) => (
                  <span key={idx} className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {t.type}: {t.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                {selectedAnnouncement.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedAnnouncement.published_at).toLocaleDateString()}
                  </span>
                )}
                {selectedAnnouncement.created_by && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedAnnouncement.created_by}
                  </span>
                )}
              </div>

              {/* Description/Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Message</h4>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedAnnouncement.content || 'No content provided.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
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

// Create Announcement Modal Component
function CreateAnnouncementModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [level, setLevel] = useState<'CLASS' | 'STUDENT'>('CLASS');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (level === 'STUDENT' && selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [level, selectedClassId]);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const data = await teacherDashboardService.getAnnouncementClasses();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      setLoadingStudents(true);
      const data = await teacherDashboardService.getAnnouncementStudents(classId);
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudentId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (level === 'CLASS' && !selectedClassId) {
      setError('Please select a class');
      return;
    }

    if (level === 'STUDENT' && !selectedStudentId) {
      setError('Please select a student');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await teacherDashboardService.createAnnouncement({
        title,
        content,
        level,
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        class_id: level === 'CLASS' ? selectedClassId : undefined,
        student_id: level === 'STUDENT' ? selectedStudentId : undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create announcement:', err);
      setError(err.response?.data?.error || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Create Announcement</h3>
              <p className="text-purple-100 text-sm">Send to class or individual student</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Level</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLevel('CLASS')}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  level === 'CLASS'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Class Level
              </button>
              <button
                onClick={() => setLevel('STUDENT')}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  level === 'STUDENT'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Student Level
              </button>
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {level === 'CLASS' ? 'Select Class *' : 'Select Class (for student selection) *'}
            </label>
            {loadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Student Selection (if student level) */}
          {level === 'STUDENT' && selectedClassId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                </div>
              ) : students.length > 0 ? (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} {s.roll_no && `(Roll: ${s.roll_no})`}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">No students in this class</p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Announcement title"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Announcement content..."
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Announcement
          </button>
        </div>
      </div>
    </div>
  );
}


// ========== REPORTS / PROGRESS CARDS SECTION ==========

function ReportsSection() {
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'marks'>('list');
  const [reports, setReports] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Create report form
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('EXAM');
  const [examDate, setExamDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<{ id: string; name: string; max_marks: number }[]>([]);
  
  // Marks entry
  const [marksData, setMarksData] = useState<{ [studentId: string]: { marks: { [subjectId: string]: number | null }; remarks: string } }>({});

  useEffect(() => {
    loadReports();
    loadClasses();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardService.getReports();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await teacherDashboardService.getReportClasses();
      setClasses(classesData);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadSubjects = async (classId: string) => {
    try {
      const subjectsData = await teacherDashboardService.getReportSubjects(classId);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      const studentsData = await teacherDashboardService.getReportStudents(classId);
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleClassSelect = async (classId: string) => {
    setSelectedClass(classId);
    await Promise.all([loadSubjects(classId), loadStudents(classId)]);
  };

  const handleToggleSubject = (subject: { id: string; name: string; code: string }) => {
    const exists = selectedSubjects.find(s => s.id === subject.id);
    if (exists) {
      setSelectedSubjects(prev => prev.filter(s => s.id !== subject.id));
    } else {
      setSelectedSubjects(prev => [...prev, { id: subject.id, name: subject.name, max_marks: 100 }]);
    }
  };

  const handleMaxMarksChange = (subjectId: string, maxMarks: number) => {
    setSelectedSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, max_marks: maxMarks } : s));
  };

  const handleCreateReport = async () => {
    if (!reportName.trim() || !selectedClass || selectedSubjects.length === 0) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      setSaving(true);
      await teacherDashboardService.createReport({
        name: reportName.trim(),
        class_id: selectedClass,
        report_type: reportType,
        subjects: selectedSubjects,
        description: description.trim(),
        exam_date: examDate || undefined,
      });
      setMessage({ type: 'success', text: 'Report created successfully!' });
      setView('list');
      loadReports();
      resetForm();
    } catch (err) {
      console.error('Failed to create report:', err);
      setMessage({ type: 'error', text: 'Failed to create report' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setReportName('');
    setReportType('EXAM');
    setExamDate('');
    setDescription('');
    setSelectedClass('');
    setSelectedSubjects([]);
    setSubjects([]);
    setStudents([]);
  };

  const handleOpenReport = async (reportId: string) => {
    try {
      setLoading(true);
      const detail = await teacherDashboardService.getReportDetail(reportId);
      setSelectedReport(detail);
      
      // Initialize marks data from existing data
      const initialMarks: any = {};
      detail.students.forEach((student: any) => {
        initialMarks[student.id] = {
          marks: student.marks || {},
          remarks: student.remarks || '',
        };
      });
      setMarksData(initialMarks);
      
      setView('detail');
    } catch (err) {
      console.error('Failed to load report:', err);
      setMessage({ type: 'error', text: 'Failed to load report details' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartMarksEntry = async () => {
    if (!selectedReport) return;
    
    // Load students for this class
    await loadStudents(selectedReport.class_id);
    
    // Initialize marks if not already
    const initialMarks: any = { ...marksData };
    students.forEach(student => {
      if (!initialMarks[student.id]) {
        initialMarks[student.id] = {
          marks: {},
          remarks: '',
        };
      }
    });
    setMarksData(initialMarks);
    
    setView('marks');
  };

  const handleMarksChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: {
          ...prev[studentId]?.marks,
          [subjectId]: numValue,
        },
      },
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value,
      },
    }));
  };

  const handleSaveMarks = async () => {
    if (!selectedReport) return;

    try {
      setSaving(true);
      
      // Prepare marks data
      const marksToSave = Object.entries(marksData).map(([studentId, data]) => ({
        student_id: studentId,
        marks: Object.fromEntries(
          Object.entries(data.marks).map(([subjectId, marks]) => [
            subjectId,
            { marks: marks, max_marks: selectedReport.subjects.find((s: any) => s.id === subjectId)?.max_marks || 100 }
          ])
        ),
        remarks: data.remarks,
      }));

      await teacherDashboardService.saveMarks(selectedReport.id, marksToSave);
      setMessage({ type: 'success', text: 'Marks saved successfully!' });
      
      // Reload report detail
      await handleOpenReport(selectedReport.id);
    } catch (err) {
      console.error('Failed to save marks:', err);
      setMessage({ type: 'error', text: 'Failed to save marks' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishReport = async () => {
    if (!selectedReport) return;

    try {
      setSaving(true);
      await teacherDashboardService.publishReport(selectedReport.id);
      setMessage({ type: 'success', text: 'Report published! Students can now view their results.' });
      await handleOpenReport(selectedReport.id);
      loadReports();
    } catch (err) {
      console.error('Failed to publish report:', err);
      setMessage({ type: 'error', text: 'Failed to publish report' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await teacherDashboardService.deleteReport(reportId);
      setMessage({ type: 'success', text: 'Report deleted!' });
      setView('list');
      loadReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      setMessage({ type: 'error', text: 'Failed to delete report' });
    }
  };

  // Render Report List
  const renderList = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Progress Cards</h2>
          <p className="text-sm text-gray-500">Create and manage student reports</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleOpenReport(report.id)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{report.name}</h3>
                  <p className="text-sm text-gray-500">{report.class_name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  report.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  report.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {report.status}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {report.subjects?.length || 0} subjects
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {report.student_count || 0} students
                </span>
              </div>
              
              {report.exam_date && (
                <p className="text-xs text-gray-400 mt-2">
                  Exam: {new Date(report.exam_date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No reports created yet</p>
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
          >
            Create First Report
          </button>
        </div>
      )}
    </div>
  );

  // Render Create Report Form
  const renderCreate = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setView('list'); resetForm(); }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Create New Report</h2>
          <p className="text-sm text-gray-500">Set up a report/exam for a class</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Name *</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Half Yearly Exam 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="EXAM">Exam Report</option>
              <option value="QUARTERLY">Quarterly Report</option>
              <option value="HALF_YEARLY">Half Yearly Report</option>
              <option value="ANNUAL">Annual Report</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="PROGRESS">Progress Report</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Optional description..."
          />
        </div>

        {/* Subjects Selection */}
        {selectedClass && subjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subjects *</label>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => {
                const selected = selectedSubjects.find(s => s.id === subject.id);
                return (
                  <div
                    key={subject.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selected 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => handleToggleSubject(subject)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">{subject.name}</span>
                      </label>
                      {selected && (
                        <input
                          type="number"
                          value={selected.max_marks}
                          onChange={(e) => handleMaxMarksChange(subject.id, parseInt(e.target.value) || 100)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500"
                          min={1}
                          placeholder="Max"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Students Preview */}
        {selectedClass && students.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Users className="w-4 h-4" />
              {students.length} students will be included in this report
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => { setView('list'); resetForm(); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReport}
            disabled={saving || !reportName.trim() || !selectedClass || selectedSubjects.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Report
          </button>
        </div>
      </div>
    </div>
  );

  // Render Report Detail
  const renderDetail = () => {
    if (!selectedReport) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('list'); setSelectedReport(null); }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedReport.name}</h2>
              <p className="text-sm text-gray-500">{selectedReport.class_name} • {selectedReport.academic_year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              selectedReport.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
              selectedReport.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {selectedReport.status}
            </span>
            {selectedReport.status === 'DRAFT' && (
              <button
                onClick={handlePublishReport}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                Publish
              </button>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Subjects ({selectedReport.subjects?.length || 0})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedReport.subjects?.map((subject: any) => (
              <span key={subject.id} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {subject.name} ({subject.max_marks} marks)
              </span>
            ))}
          </div>
        </div>

        {/* Student Marks Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Student Marks ({selectedReport.students?.length || 0})</h3>
            <button
              onClick={handleStartMarksEntry}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Marks
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  {selectedReport.subjects?.map((subject: any) => (
                    <th key={subject.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {subject.name}<br/>
                      <span className="text-gray-400">({subject.max_marks})</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedReport.students?.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {student.rank || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.roll_no}</div>
                    </td>
                    {selectedReport.subjects?.map((subject: any) => (
                      <td key={subject.id} className="px-4 py-3 text-center text-sm text-gray-900">
                        {student.marks?.[subject.id]?.marks ?? '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {student.total_marks}/{student.total_max_marks}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {student.percentage?.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        student.grade === 'A+' || student.grade === 'A' ? 'bg-green-100 text-green-700' :
                        student.grade === 'B+' || student.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                        student.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                        student.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.grade || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Button */}
        {selectedReport.status === 'DRAFT' && (
          <div className="flex justify-end">
            <button
              onClick={() => handleDeleteReport(selectedReport.id)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg flex items-center gap-2"
            >
              Delete Report
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Marks Entry
  const renderMarksEntry = () => {
    if (!selectedReport) return null;

    // Use students from report or loaded students
    const studentsList = selectedReport.students?.length > 0 
      ? selectedReport.students 
      : students.map(s => ({ ...s, marks: marksData[s.id]?.marks || {} }));

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('detail')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enter Marks</h2>
              <p className="text-sm text-gray-500">{selectedReport.name} • {selectedReport.class_name}</p>
            </div>
          </div>
          <button
            onClick={handleSaveMarks}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Marks
          </button>
        </div>

        {/* Marks Entry Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Student</th>
                {selectedReport.subjects?.map((subject: any) => (
                  <th key={subject.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                    {subject.name}<br/>
                    <span className="text-gray-400">/{subject.max_marks}</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {studentsList.map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.roll_no}</div>
                  </td>
                  {selectedReport.subjects?.map((subject: any) => (
                    <td key={subject.id} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        value={marksData[student.id]?.marks?.[subject.id] ?? ''}
                        onChange={(e) => handleMarksChange(student.id, subject.id, e.target.value)}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min={0}
                        max={subject.max_marks}
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={marksData[student.id]?.remarks || ''}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Optional"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {view === 'list' && renderList()}
      {view === 'create' && renderCreate()}
      {view === 'detail' && renderDetail()}
      {view === 'marks' && renderMarksEntry()}
    </div>
  );
}

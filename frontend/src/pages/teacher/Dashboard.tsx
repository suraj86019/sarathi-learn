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
  Building2,
  ClipboardList,
  Play,
  Pause,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Briefcase,
  Newspaper,
  Megaphone,
  UserCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import teacherDashboardService, {
  DashboardData,
  News,
  TeacherTask,
  ExtendedStats,
  SchoolTeachersResponse,
  SchoolClassesResponse,
} from '../../services/teacherDashboard.service';

type ActiveView = 'dashboard' | 'attendance' | 'students' | 'tasks' | 'schedule' | 'announcements' | 'teachers' | 'classes';

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
  
  // News carousel state
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadExtendedStats();
  }, []);

  // Auto-slide news every 3 seconds
  useEffect(() => {
    if (!isAutoPlaying || !dashboardData?.news?.length) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => 
        prev === (dashboardData?.news?.length || 1) - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, dashboardData?.news?.length]);

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

  const handleNewsClick = (news: News) => {
    setSelectedNews(news);
    setShowNewsModal(true);
    setIsAutoPlaying(false);
  };

  const handlePrevNews = () => {
    setCurrentNewsIndex((prev) => 
      prev === 0 ? (dashboardData?.news?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextNews = () => {
    setCurrentNewsIndex((prev) => 
      prev === (dashboardData?.news?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
        return <SchedulePlaceholder />;
      case 'announcements':
        return <AnnouncementsPlaceholder />;
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
    const currentNews = news[currentNewsIndex];

    // Separate announcements (HIGH/URGENT priority) from regular news
    const announcements = news.filter(n => n.priority === 'HIGH' || n.priority === 'URGENT');

    return (
      <div className="space-y-4 md:space-y-6">
        {/* News Carousel Section - Auto sliding */}
        <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
                <Newspaper className="w-4 h-4 md:w-5 md:h-5" />
                <span className="truncate">Latest News</span>
              </h2>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="p-1.5 md:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors active:scale-95"
                  title={isAutoPlaying ? 'Pause' : 'Play'}
                >
                  {isAutoPlaying ? (
                    <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  )}
                </button>
                <span className="text-white/80 text-xs md:text-sm">
                  {news.length > 0 ? `${currentNewsIndex + 1}/${news.length}` : '0/0'}
                </span>
              </div>
            </div>

            {news.length > 0 ? (
              <div className="relative">
                {/* News Card */}
                <div 
                  onClick={() => currentNews && handleNewsClick(currentNews)}
                  className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-5 cursor-pointer hover:bg-white/20 transition-all min-h-[100px] md:min-h-[140px] group active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getPriorityBadge(currentNews?.priority || 'LOW')}`}>
                          {currentNews?.priority}
                        </span>
                        <span className="text-white/60 text-[10px] md:text-xs">
                          {formatDate(currentNews?.published_at || currentNews?.created_at || null)}
                        </span>
                      </div>
                      <h3 className="text-sm md:text-lg font-semibold text-white mb-1 md:mb-2 line-clamp-2 group-hover:underline">
                        {currentNews?.title}
                      </h3>
                      <p className="text-white/70 text-xs md:text-sm line-clamp-2">
                        {currentNews?.content}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white/50 group-hover:text-white transition-colors flex-shrink-0" />
                  </div>
                </div>

                {/* Navigation Arrows - Hidden on mobile, visible on tablet+ */}
                <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none px-1 md:px-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevNews(); }}
                    className="p-1.5 md:p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors pointer-events-auto active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextNews(); }}
                    className="p-1.5 md:p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors pointer-events-auto active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-1.5 md:gap-2 mt-3 md:mt-4">
                  {news.slice(0, 10).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentNewsIndex(index)}
                      className={`h-1.5 md:h-2 rounded-full transition-all ${
                        index === currentNewsIndex 
                          ? 'bg-white w-4 md:w-6' 
                          : 'bg-white/40 hover:bg-white/60 w-1.5 md:w-2'
                      }`}
                    />
                  ))}
                </div>

                {/* Swipe hint for mobile */}
                <p className="sm:hidden text-center text-white/50 text-[10px] mt-2">
                  Tap to view • Auto-advances every 3s
                </p>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-6 md:p-8 text-center">
                <Newspaper className="w-10 h-10 md:w-12 md:h-12 text-white/50 mx-auto mb-2 md:mb-3" />
                <p className="text-white/70 text-sm md:text-base">No news available</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid - 2 columns on mobile, 4 on tablet+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
          <StatCard
            icon={<GraduationCap className="w-5 h-5 md:w-7 md:h-7 text-teal-600" />}
            value={String(extendedStats?.school_total_students || dashboardData?.school?.total_students || 0)}
            label="Total Students"
            bgColor="bg-teal-50"
            onClick={() => handleMenuClick('students')}
          />
          <StatCard
            icon={<Users className="w-5 h-5 md:w-7 md:h-7 text-blue-600" />}
            value={String(extendedStats?.school_total_teachers || dashboardData?.school?.total_teachers || 0)}
            label="Total Teachers"
            bgColor="bg-blue-50"
            onClick={() => handleMenuClick('teachers')}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />}
            value={String(extendedStats?.school_total_classes || 0)}
            label="Total Classes"
            bgColor="bg-purple-50"
            onClick={() => handleMenuClick('classes')}
          />
          <StatCard
            icon={<CheckSquare className="w-5 h-5 md:w-7 md:h-7 text-emerald-600" />}
            value={extendedStats?.today_attendance?.marked ? 
              `${extendedStats.today_attendance.present}/${extendedStats.today_attendance.total}` : 
              (dashboardData?.stats?.today_attendance?.marked ? 
                `${dashboardData.stats.today_attendance.present}/${dashboardData.stats.today_attendance.total}` : 
                'Not Marked')}
            label="Today's Attendance"
            bgColor="bg-emerald-50"
            onClick={() => handleMenuClick('attendance')}
          />
        </div>

        {/* My Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 md:w-7 md:h-7 text-cyan-600" />}
            value={String(extendedStats?.my_students_count || dashboardData?.stats?.attendance_class_students || 0)}
            label="My Students"
            bgColor="bg-cyan-50"
            onClick={() => handleMenuClick('students')}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 md:w-7 md:h-7 text-indigo-600" />}
            value={String(extendedStats?.my_classes_count || dashboardData?.stats?.classes_count || 0)}
            label="My Classes"
            bgColor="bg-indigo-50"
            onClick={() => handleMenuClick('schedule')}
          />
          <StatCard
            icon={<ClipboardList className="w-5 h-5 md:w-7 md:h-7 text-amber-600" />}
            value={String(extendedStats?.pending_tasks || dashboardData?.stats?.pending_tasks || 0)}
            label="Pending Tasks"
            bgColor="bg-amber-50"
            onClick={() => handleMenuClick('tasks')}
          />
          <StatCard
            icon={<Award className="w-5 h-5 md:w-7 md:h-7 text-green-600" />}
            value={String(extendedStats?.my_subjects_count || dashboardData?.teacher?.subjects?.length || 0)}
            label="My Subjects"
            bgColor="bg-green-50"
          />
        </div>

        {/* Announcements Section - Important/Urgent items */}
        {announcements.length > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2 mb-3 md:mb-4">
                <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
                Important Announcements
              </h3>
              <div className="space-y-2 md:space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => handleNewsClick(ann)}
                    className="bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4 cursor-pointer hover:bg-white/30 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <span className={`flex-shrink-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full mt-1.5 ${ann.priority === 'URGENT' ? 'bg-red-300 animate-pulse' : 'bg-orange-300'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm md:text-base line-clamp-1">{ann.title}</h4>
                        <p className="text-white/70 text-xs md:text-sm mt-0.5 line-clamp-1">{ann.content}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
              {announcements.length > 3 && (
                <button
                  onClick={() => handleMenuClick('announcements')}
                  className="w-full mt-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors active:scale-[0.99]"
                >
                  View All ({announcements.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Two Column Layout - Stack on mobile, side by side on tablet+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* School Section */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 md:px-6 py-3 md:py-4">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 md:w-5 md:h-5" />
                School Information
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {dashboardData?.school ? (
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <h4 className="text-base md:text-xl font-bold text-gray-900 line-clamp-2">{dashboardData.school.name}</h4>
                    <p className="text-xs md:text-sm text-gray-500">UDISE: {dashboardData.school.udise_code}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <InfoItem 
                      icon={<MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Location"
                      value={`${dashboardData.school.city}, ${dashboardData.school.district}`}
                    />
                    <InfoItem 
                      icon={<User className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Principal"
                      value={dashboardData.school.principal_name || 'N/A'}
                    />
                    <InfoItem 
                      icon={<Users className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Total Students"
                      value={String(dashboardData.school.total_students)}
                    />
                    <InfoItem 
                      icon={<GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Total Teachers"
                      value={String(dashboardData.school.total_teachers)}
                    />
                  </div>

                  {dashboardData.school.contact_phone && (
                    <div className="pt-3 md:pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" /> {dashboardData.school.contact_phone}
                        </span>
                        {dashboardData.school.contact_email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" /> 
                            <span className="truncate">{dashboardData.school.contact_email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <Building2 className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                  <p className="text-sm md:text-base">School information not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Profile Section */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 md:px-6 py-3 md:py-4">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                My Profile
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {dashboardData?.teacher ? (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white text-lg md:text-2xl font-bold flex-shrink-0">
                      {dashboardData.teacher.name?.charAt(0) || 'T'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base md:text-xl font-bold text-gray-900 truncate">{dashboardData.teacher.name}</h4>
                      <p className="text-xs md:text-sm text-gray-500">ID: {dashboardData.teacher.employee_id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <InfoItem 
                      icon={<Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Experience"
                      value={`${dashboardData.teacher.experience_years} years`}
                    />
                    <InfoItem 
                      icon={<Award className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Qualification"
                      value={dashboardData.teacher.qualification || 'N/A'}
                    />
                    <InfoItem 
                      icon={<BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Subjects"
                      value={dashboardData.teacher.subjects?.map(s => s.name).join(', ') || 'N/A'}
                    />
                    <InfoItem 
                      icon={<CheckSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      label="Attendance Class"
                      value={dashboardData.teacher.attendance_class?.name || 'Not Assigned'}
                    />
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {dashboardData.teacher.permissions?.can_mark_attendance && (
                        <span className="px-2 py-0.5 md:py-1 bg-teal-100 text-teal-700 text-[10px] md:text-xs rounded-full">
                          ✓ Attendance
                        </span>
                      )}
                      {dashboardData.teacher.permissions?.can_assign_homework && (
                        <span className="px-2 py-0.5 md:py-1 bg-blue-100 text-blue-700 text-[10px] md:text-xs rounded-full">
                          ✓ Homework
                        </span>
                      )}
                      {dashboardData.teacher.permissions?.can_grade_assignments && (
                        <span className="px-2 py-0.5 md:py-1 bg-purple-100 text-purple-700 text-[10px] md:text-xs rounded-full">
                          ✓ Grading
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <User className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                  <p className="text-sm md:text-base">Profile information not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-sm md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
              Admin Tasks
            </h3>
            <button
              onClick={() => handleMenuClick('tasks')}
              className="text-xs md:text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5 md:gap-1 active:scale-95"
            >
              View All <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {dashboardData?.tasks && dashboardData.tasks.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {dashboardData.tasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8 text-gray-500">
              <CheckSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
              <p className="text-sm md:text-base">No pending tasks</p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        {dashboardData?.today_schedule && dashboardData.today_schedule.length > 0 && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              Today's Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
              {dashboardData.today_schedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-indigo-100"
                >
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <span className="font-semibold text-gray-900 text-sm md:text-base truncate">{item.class_name}</span>
                    <span className="text-xs md:text-sm text-indigo-600 font-medium flex-shrink-0 ml-2">
                      {item.start_time} - {item.end_time}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">{item.subject}</p>
                  {item.room && (
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">Room: {item.room}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
        fixed h-full w-[280px] md:w-64 bg-gradient-to-b from-teal-900 to-emerald-900 text-white flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        safe-area-inset
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-teal-700/50 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-gradient-to-br from-white to-teal-100 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-teal-700" />
            </div>
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
              Sarathi Learn
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-teal-700 rounded-lg active:scale-95"
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
            badge={extendedStats?.school_total_students}
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
          
          <div className="px-4 md:px-6 py-2 md:py-3 mt-2 md:mt-4">
            <p className="text-[10px] md:text-xs font-semibold text-teal-400/70 uppercase tracking-wider">School</p>
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
            badge={extendedStats?.school_total_classes}
          />
          
          <div className="px-4 md:px-6 py-2 md:py-3 mt-2 md:mt-4">
            <p className="text-[10px] md:text-xs font-semibold text-teal-400/70 uppercase tracking-wider">Communication</p>
          </div>
          
          <MenuItem
            icon={<Megaphone className="w-5 h-5" />}
            label="Announcements"
            active={activeMenu === 'announcements'}
            onClick={() => handleMenuClick('announcements')}
          />
        </nav>

        {/* Teacher Info - Bottom section */}
        <div className="p-3 md:p-4 border-t border-teal-700/50">
          <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
              {dashboardData?.teacher?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm md:text-base truncate">
                {dashboardData?.teacher?.name || 'Teacher'}
            </div>
              <div className="text-xs md:text-sm text-teal-200 truncate">
                {dashboardData?.teacher?.subjects?.[0]?.name || 'Loading...'}
          </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-teal-200 hover:text-white hover:bg-teal-700/50 rounded-lg md:rounded-xl transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-medium text-sm md:text-base">Logout</span>
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
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95">
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {(dashboardData?.news?.length || 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
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

      {/* News Detail Modal - Responsive */}
      {showNewsModal && selectedNews && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            <div className={`${getPriorityColor(selectedNews.priority)} px-4 md:px-6 py-3 md:py-4`}>
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-xs md:text-sm font-medium">
                  {selectedNews.priority} Priority
                </span>
                <button
                  onClick={() => { setShowNewsModal(false); setIsAutoPlaying(true); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[50vh]">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">{selectedNews.title}</h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
                <span>{formatDate(selectedNews.published_at || selectedNews.created_at)}</span>
                <span className="hidden sm:inline">•</span>
                <span>By {selectedNews.created_by}</span>
                        </div>
              <div className="prose prose-sm md:prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-base">{selectedNews.content}</p>
            </div>
          </div>
            <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-t border-gray-200 safe-area-inset">
              <button
                onClick={() => { setShowNewsModal(false); setIsAutoPlaying(true); }}
                className="w-full py-2.5 md:py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg md:rounded-xl transition-colors active:scale-[0.99] text-sm md:text-base"
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
      className={`w-full flex items-center justify-between px-4 md:px-6 py-3 transition-all active:scale-[0.98] ${
        disabled
          ? 'text-teal-400/50 cursor-not-allowed'
          : active
            ? 'bg-gradient-to-r from-teal-600/30 to-transparent border-l-4 border-teal-400 text-white'
            : 'text-teal-100 hover:text-white hover:bg-teal-700/30'
      }`}
    >
      <div className="flex items-center space-x-2.5 md:space-x-3">
      {icon}
        <span className="font-medium text-sm md:text-base">{label}</span>
        {statusIndicator && (
          <span className={`w-2 h-2 rounded-full ${
            statusIndicator === 'done' 
              ? 'bg-green-400' 
              : statusIndicator === 'pending' 
                ? 'bg-yellow-400 animate-pulse' 
                : 'bg-gray-500'
          }`} />
        )}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-amber-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full">
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
  bgColor,
  onClick,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  bgColor: string;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 hover:shadow-md transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className={`${bgColor} w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3`}>
        {icon}
      </div>
      <div className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1 truncate">{value}</div>
      <div className="text-xs md:text-sm text-gray-500 font-medium flex items-center justify-between">
        <span className="truncate">{label}</span>
        {onClick && <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5 md:gap-2">
      <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] md:text-xs text-gray-500">{label}</p>
        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
      </div>
  );
}

function TaskCard({ task }: { task: TeacherTask }) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer active:scale-[0.99]">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
          <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getPriorityBadge(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getStatusBadge(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">{task.title}</h4>
        <p className="text-xs md:text-sm text-gray-500 truncate">
          {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
          <span className="hidden sm:inline"> • Assigned by {typeof task.assigned_by === 'object' ? task.assigned_by?.name : task.assigned_by}</span>
        </p>
      </div>
      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0 ml-2" />
    </div>
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
  
  // PII Update permission
  const canUpdatePII = teacherProfile?.permissions?.can_update_pii || false;

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
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-200 hover:text-white mb-3 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Classes
          </button>
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
          </div>
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
    } catch (err) {
      console.error('Failed to update task:', err);
      setMessage({ type: 'error', text: 'Failed to update task status' });
    }
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
      await teacherDashboardService.updateStudentPII(student.id, editData);
      setMessage({ type: 'success', text: 'Student information updated successfully!' });
      setShowEditModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to update student:', err);
      setMessage({ type: 'error', text: 'Failed to update student information' });
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
                    roll_no: student.roll_no,
                  });
                  setShowEditModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                Edit PII
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
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
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
                    <div className="flex-shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
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

function SchedulePlaceholder() {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 text-center">
      <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Schedule</h3>
      <p className="text-sm md:text-base text-gray-500">Schedule view will be implemented in the next step</p>
    </div>
  );
}

function AnnouncementsPlaceholder() {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 text-center">
      <Megaphone className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Announcements</h3>
      <p className="text-sm md:text-base text-gray-500">Full announcements list will be implemented in the next step</p>
    </div>
  );
}

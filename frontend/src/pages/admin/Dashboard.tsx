import { useState, useEffect } from 'react';
import {
  Home,
  School,
  Users,
  GraduationCap,
  Bell,
  LogOut,
  TrendingUp,
  Plus,
  ClipboardList,
  Loader2,
  ChevronRight,
  Clock,
  Menu,
  X,
  BookOpen,
  CreditCard,
  Activity,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import adminDashboardService, { DashboardData, School as SchoolType } from '../../services/adminDashboard.service';
import teacherDashboardService from '../../services/teacherDashboard.service';
import SchoolsList from './SchoolsList';
import TeachersList from './TeachersList';
import StudentsList from './StudentsList';
import NotificationsList from './NotificationsList';
import TasksList from './TasksList';
import ClassesList from './ClassesList';
import SubjectsList from './SubjectsList';
import PaymentsList from './PaymentsList';
import AddStudentModal from '../../components/admin/AddStudentModal';
import AddTeacherModal from '../../components/admin/AddTeacherModal';
import CreateNotificationModal from '../../components/admin/CreateNotificationModal';
import CreateTaskModal from '../../components/admin/CreateTaskModal';
import NotificationsDropdown from '../../components/admin/NotificationsDropdown';
import NewsSection, { NewsItem } from '../../components/shared/NewsSection';

type ActiveView = 'dashboard' | 'schools' | 'teachers' | 'students' | 'classes' | 'subjects' | 'notifications' | 'tasks' | 'payments' | 'activities' | 'reports' | 'settings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<ActiveView>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal states
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  
  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadSchools();
    loadNews();
  }, []);

  // Close sidebar when menu item is clicked on mobile
  const handleMenuClick = (view: ActiveView) => {
    setActiveMenu(view);
    setSidebarOpen(false);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      const data = await adminDashboardService.getSchools();
      setSchools(data);
      if (data.length > 0) {
        setSelectedSchool(data[0]);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadNews = async () => {
    try {
      setNewsLoading(true);
      const data = await teacherDashboardService.getNews(10);
      setNews(data as NewsItem[]);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'schools':
        return <SchoolsList onBack={() => setActiveMenu('dashboard')} schools={schools} />;
      case 'teachers':
        return (
          <TeachersList 
            onBack={() => setActiveMenu('dashboard')} 
            schools={schools}
          />
        );
      case 'students':
        return (
          <StudentsList 
            onBack={() => setActiveMenu('dashboard')} 
            schools={schools}
          />
        );
      case 'notifications':
        return (
          <NotificationsList 
            onBack={() => setActiveMenu('dashboard')} 
            schools={schools}
          />
        );
      case 'tasks':
        return (
          <TasksList 
            onBack={() => setActiveMenu('dashboard')} 
            schools={schools}
            selectedSchoolId={selectedSchool?.id}
            selectedSchoolName={selectedSchool?.name}
          />
        );
      case 'classes':
        return (
          <ClassesList 
            onBack={() => setActiveMenu('dashboard')} 
            schools={schools}
            selectedSchoolId={selectedSchool?.id}
          />
        );
      case 'subjects':
        return (
          <SubjectsList 
            onBack={() => setActiveMenu('dashboard')} 
          />
        );
      case 'payments':
        return (
          <PaymentsList 
            onBack={() => setActiveMenu('dashboard')} 
            schools={schools}
          />
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <>
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
            <span className="truncate">Welcome, Admin</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">Manage your schools, teachers, students, and more</p>
        </div>

        {/* School Selector (if multiple schools) */}
        {schools.length > 1 && (
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Active School</label>
            <select
              value={selectedSchool?.id || ''}
              onChange={(e) => setSelectedSchool(schools.find(s => s.id === e.target.value) || null)}
              className="w-full sm:max-w-md px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* News Section */}
        <div className="mb-6 sm:mb-8">
          <NewsSection news={news} loading={newsLoading} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={<GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />}
            value={String(dashboardData?.school_stats?.total_students || 0)}
            label="Students"
            bgColor="bg-emerald-50"
            onClick={() => handleMenuClick('students')}
          />
          <StatCard
            icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />}
            value={String(dashboardData?.school_stats?.total_teachers || 0)}
            label="Teachers"
            bgColor="bg-blue-50"
            onClick={() => handleMenuClick('teachers')}
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />}
            value={String(dashboardData?.school_stats?.total_classes || 0)}
            label="Classes"
            bgColor="bg-purple-50"
            onClick={() => handleMenuClick('classes')}
          />
          <StatCard
            icon={<School className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />}
            value={String(dashboardData?.school_stats?.schools_count || schools.length || 1)}
            label="Schools"
            bgColor="bg-amber-50"
            onClick={() => handleMenuClick('schools')}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            <QuickActionButton
              icon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Add Teacher"
              color="blue"
              onClick={() => setShowAddTeacher(true)}
            />
            <QuickActionButton
              icon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Add Student"
              color="emerald"
              onClick={() => setShowAddStudent(true)}
            />
            <QuickActionButton
              icon={<Bell className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Notification"
              color="purple"
              onClick={() => setShowCreateNotification(true)}
            />
            <QuickActionButton
              icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Create Task"
              color="amber"
              onClick={() => setShowCreateTask(true)}
            />
            <QuickActionButton
              icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Classes"
              color="blue"
              onClick={() => handleMenuClick('classes')}
            />
            <QuickActionButton
              icon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Subjects"
              color="amber"
              onClick={() => handleMenuClick('subjects')}
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Payment Overview */}
          <div 
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleMenuClick('payments')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Payment Status</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">8</p>
                <p className="text-xs text-slate-500">Months Paid</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">2</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Due</span>
              <span className="text-lg font-bold text-red-600">₹20,000</span>
            </div>
          </div>

          {/* Attendance Trend */}
          <ChartCard title="Attendance (7 Days)" icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}>
            {dashboardData?.attendance_trend && dashboardData.attendance_trend.length > 0 ? (
              <div className="h-48 sm:h-64 relative px-2 sm:px-4">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  <line x1="50" y1="30" x2="350" y2="30" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="80" x2="350" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="130" x2="350" y2="130" stroke="#e5e7eb" strokeWidth="1" />

                  {/* Y-axis labels */}
                  <text x="20" y="35" className="text-[10px] sm:text-xs" fill="#9ca3af">100%</text>
                  <text x="20" y="85" className="text-[10px] sm:text-xs" fill="#9ca3af">75%</text>
                  <text x="20" y="135" className="text-[10px] sm:text-xs" fill="#9ca3af">50%</text>
                  <text x="20" y="175" className="text-[10px] sm:text-xs" fill="#9ca3af">25%</text>

                  {(() => {
                    const trend = dashboardData.attendance_trend || [];
                    const points = trend.map((item, index) => ({
                      x: 50 + (index * 50),
                      y: 180 - (item.percentage * 1.5),
                      percentage: item.percentage,
                      day: item.day
                    }));
                    
                    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
                    const areaPath = linePath + ` L ${points[points.length - 1]?.x || 350},180 L 50,180 Z`;
                    
                    return (
                      <>
                        <path d={areaPath} fill="url(#emeraldGradient)" opacity="0.3" />
                        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                        {points.map((point, index) => (
                          <g key={index}>
                            <circle cx={point.x} cy={point.y} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                            <title>{point.percentage}%</title>
                          </g>
                        ))}
                        {points.map((point, i) => (
                          <text key={i} x={point.x} y="195" className="text-[10px] sm:text-xs" fill="#9ca3af" textAnchor="middle">
                            {point.day}
                          </text>
                        ))}
                      </>
                    );
                  })()}

                  <defs>
                    <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            ) : (
              <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-500">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm">No attendance data available</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Activity Log & Quick Access */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Recent Activity
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
                dashboardData.recent_activities.slice(0, 5).map((activity, index) => (
                  <ActivityItem
                    key={activity.id || index}
                    activity={activity.description}
                    time={activity.timestamp}
                    user={activity.user}
                  />
                ))
              ) : (
                <>
                  <ActivityItem activity="AI session started (Grade 7)" time="10 mins ago" />
                  <ActivityItem activity="Teacher marked attendance" time="30 mins ago" />
                  <ActivityItem activity="Student chat volume up 15%" time="1 hour ago" />
                  <ActivityItem activity="New homework assigned" time="2 hours ago" />
                </>
              )}
            </div>
          </div>

          {/* Quick Access Panel */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Access</h2>
            <div className="space-y-2 sm:space-y-3">
              <QuickAccessItem
                icon={<School className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Schools"
                count={schools.length}
                color="blue"
                onClick={() => handleMenuClick('schools')}
              />
              <QuickAccessItem
                icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Teachers"
                count={dashboardData?.school_stats?.total_teachers || 0}
                color="indigo"
                onClick={() => handleMenuClick('teachers')}
              />
              <QuickAccessItem
                icon={<GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Students"
                count={dashboardData?.school_stats?.total_students || 0}
                color="emerald"
                onClick={() => handleMenuClick('students')}
              />
              <QuickAccessItem
                icon={<Bell className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Notifications"
                count={dashboardData?.notifications_count || 0}
                color="purple"
                onClick={() => handleMenuClick('notifications')}
              />
              <QuickAccessItem
                icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Tasks"
                count={dashboardData?.tasks_count || 0}
                color="amber"
                onClick={() => handleMenuClick('tasks')}
              />
              <QuickAccessItem
                icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Classes"
                count={0}
                color="indigo"
                onClick={() => handleMenuClick('classes')}
              />
              <QuickAccessItem
                icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Subjects"
                count={0}
                color="amber"
                onClick={() => handleMenuClick('subjects')}
              />
            </div>
          </div>
        </div>
      </>
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

      {/* Sidebar */}
      <aside className={`
        fixed lg:fixed h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-lg">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Sarathi Learn
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 sm:py-6 overflow-y-auto">
          <MenuItem
            icon={<Home className="w-5 h-5" />}
            label="Dashboard"
            active={activeMenu === 'dashboard'}
            onClick={() => handleMenuClick('dashboard')}
          />
          <MenuItem
            icon={<School className="w-5 h-5" />}
            label="Schools"
            active={activeMenu === 'schools'}
            onClick={() => handleMenuClick('schools')}
            badge={schools.length}
          />
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Teachers"
            active={activeMenu === 'teachers'}
            onClick={() => handleMenuClick('teachers')}
          />
          <MenuItem
            icon={<GraduationCap className="w-5 h-5" />}
            label="Students"
            active={activeMenu === 'students'}
            onClick={() => handleMenuClick('students')}
          />

          <div className="px-4 sm:px-6 py-2 sm:py-3 mt-2 sm:mt-4">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Academics</p>
          </div>

          <MenuItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Classes"
            active={activeMenu === 'classes'}
            onClick={() => handleMenuClick('classes')}
          />
          <MenuItem
            icon={<ClipboardList className="w-5 h-5" />}
            label="Subjects"
            active={activeMenu === 'subjects'}
            onClick={() => handleMenuClick('subjects')}
          />
          
          <div className="px-4 sm:px-6 py-2 sm:py-3 mt-2 sm:mt-4">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</p>
          </div>
          
          <MenuItem
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
            active={activeMenu === 'notifications'}
            onClick={() => handleMenuClick('notifications')}
          />
          <MenuItem
            icon={<ClipboardList className="w-5 h-5" />}
            label="Tasks"
            active={activeMenu === 'tasks'}
            onClick={() => handleMenuClick('tasks')}
          />
          
          <div className="px-4 sm:px-6 py-2 sm:py-3 mt-2 sm:mt-4">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Finance</p>
          </div>
          
          <MenuItem
            icon={<CreditCard className="w-5 h-5" />}
            label="Payments"
            active={activeMenu === 'payments'}
            onClick={() => handleMenuClick('payments')}
          />
        </nav>

        {/* User Section */}
        <div className="p-3 sm:p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
              
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize truncate">{activeMenu}</h2>
              {selectedSchool && activeMenu !== 'schools' && (
                <span className="hidden sm:inline text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full truncate max-w-[150px]">
                  {selectedSchool.name}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationsDropdown 
                onCreateNotification={() => setShowCreateNotification(true)}
              />
              <button 
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      <AddTeacherModal
        isOpen={showAddTeacher}
        onClose={() => setShowAddTeacher(false)}
        onSuccess={() => {
          loadDashboardData();
          setShowAddTeacher(false);
        }}
        schoolId={selectedSchool?.id}
        schoolName={selectedSchool?.name}
      />

      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        onSuccess={() => {
          loadDashboardData();
          setShowAddStudent(false);
        }}
        schoolId={selectedSchool?.id}
        schoolName={selectedSchool?.name}
      />

      <CreateNotificationModal
        isOpen={showCreateNotification}
        onClose={() => setShowCreateNotification(false)}
        onSuccess={() => {
          loadDashboardData();
          setShowCreateNotification(false);
        }}
        schools={schools}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSuccess={() => {
          loadDashboardData();
          setShowCreateTask(false);
        }}
        schoolId={selectedSchool?.id}
        schoolName={selectedSchool?.name}
      />
    </div>
  );
}

// Menu Item Component
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
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 transition-all text-sm sm:text-base ${
        active
          ? 'bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
      }`}
    >
      <div className="flex items-center space-x-2 sm:space-x-3">
      {icon}
      <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// Stat Card Component
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
      className={`bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className={`${bgColor} w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4`}>
        {icon}
      </div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 font-medium flex items-center justify-between">
        <span className="truncate">{label}</span>
        {onClick && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2">
        {icon}
        <span className="truncate">{title}</span>
      </h2>
      {children}
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  activity,
  time,
  user,
}: {
  activity: string;
  time: string;
  user?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-0 gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
        <div className="min-w-0">
          <span className="text-xs sm:text-sm text-gray-900 line-clamp-1">{activity}</span>
          {user && <p className="text-[10px] sm:text-xs text-gray-500">by {user}</p>}
        </div>
      </div>
      <span className="text-gray-400 text-[10px] sm:text-sm flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        {time}
      </span>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    emerald: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    purple: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    amber: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r ${colorClasses[color]} text-white rounded-lg sm:rounded-xl font-medium shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

// Quick Access Item Component
function QuickAccessItem({
  icon,
  label,
  count,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber';
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="font-medium text-sm sm:text-base text-gray-700 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">{count}</span>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

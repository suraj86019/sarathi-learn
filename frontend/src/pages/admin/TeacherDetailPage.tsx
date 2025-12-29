import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  AlertCircle,
  XCircle,
  Loader2,
  Send,
  X,
  Edit2,
  Edit3,
  Save,
  Trash2,
  UserCheck,
} from 'lucide-react';
import adminDashboardService, {
  TeacherFullDetail,
  TeacherCalendarData,
  TeacherTask,
  CalendarDay,
  CreateTeacherTaskData,
  AvailableSubject,
  AvailableClass,
} from '../../services/adminDashboard.service';

interface TeacherDetailPageProps {
  teacherId: string;
  onBack: () => void;
}

export default function TeacherDetailPage({ teacherId, onBack }: TeacherDetailPageProps) {
  const [teacher, setTeacher] = useState<TeacherFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'tasks' | 'attendance'>('overview');
  
  // Calendar state
  const [calendarData, setCalendarData] = useState<TeacherCalendarData | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TeacherTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('');
  
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSection, setEditSection] = useState<'profile' | 'subjects' | 'classes' | 'permissions' | 'attendance_class'>('profile');
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [editProfile, setEditProfile] = useState({
    qualification: '',
    experience_years: 0,
    specialization: '',
  });
  const [editPermissions, setEditPermissions] = useState({
    can_mark_attendance: false,
    can_assign_homework: false,
    can_grade_assignments: false,
    can_update_pii: false,
  });
  const [editSubjects, setEditSubjects] = useState<Array<{
    subject_id: string;
    is_primary: boolean;
    years_teaching: number;
  }>>([]);
  const [editClasses, setEditClasses] = useState<Array<{
    class_id: string;
    subject_id: string;
    academic_year: string;
  }>>([]);
  
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  
  // Attendance class assignment state
  const [editAttendanceClass, setEditAttendanceClass] = useState<string>('');
  
  // Create task state
  const [newTask, setNewTask] = useState<CreateTeacherTaskData>({
    teacher_id: teacherId,
    title: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    loadTeacherDetail();
  }, [teacherId]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendar();
    } else if (activeTab === 'tasks') {
      loadTasks();
    }
  }, [activeTab, calendarYear, calendarMonth, taskStatusFilter]);

  const loadTeacherDetail = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getTeacherFullDetail(teacherId);
      setTeacher(data);
    } catch (err) {
      console.error('Failed to load teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      setLoadingCalendar(true);
      const data = await adminDashboardService.getTeacherAttendanceCalendar(
        teacherId, calendarYear, calendarMonth
      );
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const data = await adminDashboardService.getTeacherTasks(
        teacherId, taskStatusFilter || undefined
      );
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  
  const handleSaveAttendance = async () => {
    if (!attendanceDate || !teacher) return;
    
    try {
      setSavingAttendance(true);
      setAttendanceSuccess(false);
      
      // Mark teacher attendance for the selected date
      await adminDashboardService.markTeacherAttendance(teacher.id, attendanceDate);
      
      // Reload teacher data to get updated attendance
      await loadTeacherDetail();
      setAttendanceSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setAttendanceSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSavingAttendance(false);
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

  const handleViewTask = async (task: TeacherTask) => {
    try {
      const detail = await adminDashboardService.getTeacherTaskDetail(task.id);
      setSelectedTask(detail);
      setShowTaskModal(true);
    } catch (err) {
      console.error('Failed to load task:', err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTask || !replyContent.trim()) return;
    
    try {
      setSendingReply(true);
      await adminDashboardService.addTeacherTaskReply(selectedTask.id, replyContent);
      // Reload task detail
      const detail = await adminDashboardService.getTeacherTaskDetail(selectedTask.id);
      setSelectedTask(detail);
      setReplyContent('');
      loadTasks();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTaskStatus = async (status: TeacherTask['status']) => {
    if (!selectedTask) return;
    
    try {
      await adminDashboardService.updateTeacherTaskStatus(selectedTask.id, status);
      // Reload task detail
      const detail = await adminDashboardService.getTeacherTaskDetail(selectedTask.id);
      setSelectedTask(detail);
      loadTasks();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      setCreatingTask(true);
      await adminDashboardService.createTeacherTask({
        ...newTask,
        teacher_id: teacherId
      });
      setShowCreateTaskModal(false);
      setNewTask({
        teacher_id: teacherId,
        title: '',
        description: '',
        priority: 'MEDIUM',
      });
      loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Edit functions
  const openEditModal = async (section: 'profile' | 'subjects' | 'classes' | 'permissions' | 'attendance_class') => {
    if (!teacher) return;
    
    setEditSection(section);
    
    // Initialize form data based on current teacher data
    if (section === 'profile') {
      setEditProfile({
        qualification: teacher.qualification || '',
        experience_years: teacher.experience_years || 0,
        specialization: teacher.specialization || '',
      });
    } else if (section === 'permissions') {
      // Load permissions from dedicated API for accuracy
      try {
        const permData = await adminDashboardService.getTeacherPermissions(teacher.id);
        setEditPermissions({
          can_mark_attendance: permData.permissions.can_mark_attendance,
          can_assign_homework: permData.permissions.can_assign_homework,
          can_grade_assignments: permData.permissions.can_grade_assignments,
          can_update_pii: permData.permissions.can_update_pii,
        });
      } catch (err) {
        console.error('Failed to load permissions:', err);
        // Fallback to teacher data
        setEditPermissions({
          can_mark_attendance: teacher.permissions?.can_mark_attendance || false,
          can_assign_homework: teacher.permissions?.can_assign_homework || false,
          can_grade_assignments: teacher.permissions?.can_grade_assignments || false,
          can_update_pii: teacher.permissions?.can_update_pii || false,
        });
      }
    } else if (section === 'subjects') {
      // Load available subjects
      setLoadingOptions(true);
      try {
        const subjects = await adminDashboardService.getAvailableSubjects();
        setAvailableSubjects(subjects);
        // Initialize with current subjects
        setEditSubjects(
          teacher.subjects?.map((s: any) => ({
            subject_id: s.id || '',
            is_primary: s.is_primary || false,
            years_teaching: s.years_teaching || 0,
          })) || []
        );
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoadingOptions(false);
      }
    } else if (section === 'classes') {
      // Load available classes for teacher's school
      setLoadingOptions(true);
      try {
        console.log('Loading classes for school:', teacher.school?.id);
        const [subjects, classes] = await Promise.all([
          adminDashboardService.getAvailableSubjects(),
          adminDashboardService.getAvailableClasses(teacher.school.id)
        ]);
        console.log('Available subjects:', subjects);
        console.log('Available classes:', classes);
        setAvailableSubjects(subjects);
        setAvailableClasses(classes);
        // Initialize with current classes (using class_id and subject_id from response)
        console.log('Teacher current classes:', teacher.classes);
        setEditClasses(
          teacher.classes?.map((c: any) => ({
            class_id: c.class_id || '',
            subject_id: c.subject_id || '',
            academic_year: c.academic_year || '2024-2025',
          })) || []
        );
      } catch (err) {
        console.error('Failed to load options:', err);
      } finally {
        setLoadingOptions(false);
      }
    } else if (section === 'attendance_class') {
      // Load available classes for assigning attendance duty
      setLoadingOptions(true);
      try {
        const classes = await adminDashboardService.getAvailableClasses(teacher.school.id);
        setAvailableClasses(classes);
        // Initialize with current attendance class
        setEditAttendanceClass(teacher.attendance_class?.id || '');
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!teacher) return;
    
    try {
      setSaving(true);
      
      if (editSection === 'profile') {
        await adminDashboardService.updateTeacherProfile(teacher.id, editProfile);
      } else if (editSection === 'permissions') {
        await adminDashboardService.updateTeacherPermissions(teacher.id, editPermissions);
      } else if (editSection === 'subjects') {
        await adminDashboardService.updateTeacherSubjects(teacher.id, editSubjects);
      } else if (editSection === 'classes') {
        await adminDashboardService.updateTeacherClasses(teacher.id, editClasses);
      } else if (editSection === 'attendance_class') {
        await adminDashboardService.updateTeacherProfile(teacher.id, {
          attendance_class_id: editAttendanceClass || null
        });
      }
      
      // Reload teacher data
      await loadTeacherDetail();
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSubject = () => {
    setEditSubjects([...editSubjects, { subject_id: '', is_primary: false, years_teaching: 0 }]);
  };

  const removeSubject = (index: number) => {
    setEditSubjects(editSubjects.filter((_, i) => i !== index));
  };

  const addClass = () => {
    setEditClasses([...editClasses, { class_id: '', subject_id: '', academic_year: '2024-2025' }]);
  };

  const removeClass = (index: number) => {
    setEditClasses(editClasses.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-600';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDayStatusClass = (day: CalendarDay) => {
    switch (day.status_color) {
      case 'holiday': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'weekend': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'marked': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'not_marked': return 'bg-red-100 text-red-600 border-red-300';
      case 'future': return 'bg-white text-gray-400 border-gray-100';
      default: return 'bg-white text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Teacher not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{teacher.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{teacher.employee_id} • {teacher.school.name}</p>
          </div>
        </div>
        <button
          onClick={() => openEditModal('profile')}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Edit Teacher</span>
        </button>
      </div>

      {/* Teacher Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-blue-200" />
                <span className="truncate">{teacher.email}</span>
              </div>
              {teacher.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-blue-200" />
                  <span>{teacher.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-blue-200" />
                <span>{teacher.experience_years} years exp.</span>
              </div>
              {teacher.qualification && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-blue-200" />
                  <span>{teacher.qualification}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.slice(0, 3).map((subject, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    subject.is_primary ? 'bg-white/30' : 'bg-white/20'
                  }`}
                >
                  {subject.name}
                </span>
              ))}
              {teacher.subjects.length > 3 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  +{teacher.subjects.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'attendance', label: 'Attendance', icon: UserCheck },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'tasks', label: 'Tasks', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'tasks' && teacher.tasks_summary.open > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                {teacher.tasks_summary.open}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Stats Cards */}
          <div className="col-span-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{teacher.subjects_count}</p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <GraduationCap className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold text-gray-900">{teacher.classes_count}</p>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-gray-900">{teacher.attendance_summary.total_marked}</p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{teacher.tasks_summary.total}</p>
              <p className="text-xs text-gray-500">Tasks</p>
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Subjects
              </h3>
              <button
                onClick={() => openEditModal('subjects')}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Subjects"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            {teacher.subjects && teacher.subjects.length > 0 ? (
              <div className="space-y-2">
                {teacher.subjects.map((subject, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      subject.is_primary ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={subject.is_primary ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                        {subject.name}
                      </span>
                      {subject.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{subject.years_teaching}y teaching</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No subjects assigned</p>
            )}
          </div>

          {/* Classes */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              Classes
            </h3>
            {teacher.classes.length > 0 ? (
              <div className="space-y-2">
                {teacher.classes.map((cls, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50 rounded-lg">
                    <p className="font-medium text-emerald-700">{cls.class_name}</p>
                    <p className="text-xs text-emerald-600">{cls.subject} • {cls.academic_year}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No classes assigned</p>
            )}
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Permissions
            </h3>
            <div className="space-y-2">
              {[
                { key: 'can_mark_attendance', label: 'Mark Attendance' },
                { key: 'can_assign_homework', label: 'Assign Homework' },
                { key: 'can_grade_assignments', label: 'Grade Assignments' },
                { key: 'can_update_pii', label: 'Edit Student Info (PII)' },
              ].map((perm) => (
                <div
                  key={perm.key}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    teacher.permissions[perm.key as keyof typeof teacher.permissions]
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {teacher.permissions[perm.key as keyof typeof teacher.permissions] ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">{perm.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Recent Tasks
              </h3>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>
            {teacher.recent_tasks && teacher.recent_tasks.length > 0 ? (
              <div className="space-y-2">
                {teacher.recent_tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleViewTask(task)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm truncate">{task.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.created_at).toLocaleDateString()} • {task.replies_count} replies
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {teacher.tasks_summary?.total > 0 ? 'Loading tasks...' : 'No tasks yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          {/* Teacher Attendance Section */}
          <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Mark Teacher Present</h2>
              <p className="text-gray-500 text-sm mb-4 text-center">
                Select a date to mark this teacher as present
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={attendanceDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-gray-700 font-medium"
                  />
                </div>
                
                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || !attendanceDate}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                >
                  {savingAttendance ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Mark Present</>
                  )}
                </button>
              </div>

              {attendanceSuccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Attendance marked!</span>
                </div>
              )}

              <div className="w-full max-w-md mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Last 7 Days</h3>
                <div className="flex justify-center gap-2">
                  {[...Array(7)].map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const isToday = i === 6;
                    const isWeekend = date.getDay() === 0;
                    const dayData = teacher.attendance_summary?.last_30_days?.find(
                      (d: any) => new Date(d.date).toDateString() === date.toDateString()
                    );
                    const hasAttendance = dayData && dayData.total > 0;
                    
                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center p-2 rounded-lg ${
                          isToday ? 'ring-2 ring-blue-500' : ''
                        } ${
                          isWeekend ? 'bg-gray-100' :
                          hasAttendance ? 'bg-emerald-100' : 'bg-red-50'
                        }`}
                      >
                        <span className="text-xs text-gray-500">{dayName}</span>
                        <span className={`text-sm font-bold ${
                          isWeekend ? 'text-gray-400' :
                          hasAttendance ? 'text-emerald-600' : 'text-red-400'
                        }`}>{dayNum}</span>
                        {!isWeekend && <span className="text-xs mt-1">{hasAttendance ? '✓' : '✗'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          {/* Attendance Class Assignment Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Class for Student Attendance</h3>
            {teacher.attendance_class ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{teacher.attendance_class.name}</p>
                      <p className="text-sm text-blue-600">This teacher can mark attendance for this class</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal('attendance_class')}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 text-sm mb-2">No class assigned for attendance</p>
                <button
                  onClick={() => openEditModal('attendance_class')}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Assign a class
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {calendarData?.month_name || ''} {calendarYear}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {loadingCalendar ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : calendarData ? (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
                  <span className="text-gray-600">Attendance Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span className="text-gray-600">Not Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                  <span className="text-gray-600">Holiday</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                  <span className="text-gray-600">Weekend</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for first week offset */}
                {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {calendarData.calendar.map((day) => (
                  <div
                    key={day.date}
                    className={`aspect-square p-1 sm:p-2 rounded-lg border ${getDayStatusClass(day)} relative group cursor-pointer`}
                    title={day.is_holiday ? day.holiday_info?.name : ''}
                  >
                    <span className="text-xs sm:text-sm font-medium">{day.day}</span>
                    {day.attendance_marked && day.attendance_data && (
                      <div className="hidden sm:block absolute bottom-1 left-1 right-1 text-[8px] text-emerald-600">
                        {day.attendance_data.total}
                      </div>
                    )}
                    {day.is_holiday && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-amber-100/90 rounded-lg transition-opacity">
                        <span className="text-[8px] sm:text-xs text-amber-700 px-1 text-center">
                          {day.holiday_info?.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{calendarData.summary.total_working_days}</p>
                  <p className="text-xs text-gray-500">Working Days</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{calendarData.summary.attendance_marked_days}</p>
                  <p className="text-xs text-emerald-600">Days Marked</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-700">{calendarData.summary.holidays_count}</p>
                  <p className="text-xs text-amber-600">Holidays</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-600">{calendarData.summary.weekends_count}</p>
                  <p className="text-xs text-gray-500">Weekends</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">No calendar data</p>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Tasks Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tasks</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>

          {/* Tasks Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{teacher.tasks_summary.open}</p>
              <p className="text-xs text-blue-600">Open</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{teacher.tasks_summary.in_progress}</p>
              <p className="text-xs text-amber-600">In Progress</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{teacher.tasks_summary.completed}</p>
              <p className="text-xs text-emerald-600">Completed</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-600">{teacher.tasks_summary.closed}</p>
              <p className="text-xs text-gray-500">Closed</p>
            </div>
          </div>

          {/* Tasks List */}
          {loadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleViewTask(task)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {task.replies_count} replies
                      </span>
                    </div>
                    {task.due_date && (
                      <span className="text-amber-600">Due: {task.due_date}</span>
                    )}
                  </div>
                  {task.last_reply && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <span className={`font-medium ${task.last_reply.reply_type === 'ADMIN' ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {task.last_reply.replied_by}:
                        </span>{' '}
                        {task.last_reply.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No tasks found</p>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="mt-4 text-blue-600 hover:underline text-sm"
              >
                Create the first task
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-lg font-bold">{selectedTask.title}</h2>
                  <p className="text-blue-100 text-sm">{selectedTask.teacher.name}</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-white/80 hover:text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Task Info */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
                {selectedTask.due_date && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                    Due: {selectedTask.due_date}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{selectedTask.description || 'No description'}</p>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateTaskStatus('COMPLETED')}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition-colors"
                  >
                    Mark Completed
                  </button>
                )}
                {selectedTask.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateTaskStatus('CLOSED')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Close Task
                  </button>
                )}
                {selectedTask.status === 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateTaskStatus('OPEN')}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                  >
                    Reopen Task
                  </button>
                )}
              </div>

              {/* Replies */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Conversation</h4>
                {selectedTask.replies && selectedTask.replies.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedTask.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-lg ${
                          reply.reply_type === 'ADMIN' ? 'bg-blue-50 ml-4' : 'bg-emerald-50 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${
                            reply.reply_type === 'ADMIN' ? 'text-blue-700' : 'text-emerald-700'
                          }`}>
                            {reply.replied_by} ({reply.reply_type})
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No replies yet</p>
                )}
              </div>
            </div>

            {/* Reply Input */}
            {selectedTask.status !== 'CLOSED' && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || sendingReply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Create Task</h2>
                <button
                  onClick={() => setShowCreateTaskModal(false)}
                  className="text-white/80 hover:text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    type="date"
                    value={newTask.due_date || ''}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim() || creatingTask}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creatingTask ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Edit Teacher</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/80 hover:text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Section Tabs */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {(['profile', 'subjects', 'classes', 'permissions', 'attendance_class'] as const).map((section) => (
                  <button
                    key={section}
                    onClick={() => {
                      if (section !== editSection) {
                        openEditModal(section);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      editSection === section
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {section === 'attendance_class' ? 'Attendance Class' : section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingOptions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  {/* Profile Section */}
                  {editSection === 'profile' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qualification
                        </label>
                        <input
                          type="text"
                          value={editProfile.qualification}
                          onChange={(e) => setEditProfile({ ...editProfile, qualification: e.target.value })}
                          placeholder="e.g., M.Sc., B.Ed."
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience (Years)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editProfile.experience_years}
                          onChange={(e) => setEditProfile({ ...editProfile, experience_years: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={editProfile.specialization}
                          onChange={(e) => setEditProfile({ ...editProfile, specialization: e.target.value })}
                          placeholder="e.g., Mathematics, Physics"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Permissions Section */}
                  {editSection === 'permissions' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 mb-2">
                        Configure what actions this teacher can perform in the system. Click to toggle.
                      </p>
                      
                      {/* Mark Attendance */}
                      <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        editPermissions.can_mark_attendance 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={editPermissions.can_mark_attendance}
                          onChange={(e) => setEditPermissions({ ...editPermissions, can_mark_attendance: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${editPermissions.can_mark_attendance ? 'text-blue-900' : 'text-gray-900'}`}>
                            Mark Attendance
                          </p>
                          <p className={`text-sm ${editPermissions.can_mark_attendance ? 'text-blue-600' : 'text-gray-500'}`}>
                            Can mark student attendance for their classes
                          </p>
                        </div>
                        {editPermissions.can_mark_attendance && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">ON</span>
                        )}
                      </label>
                      
                      {/* Assign Homework */}
                      <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        editPermissions.can_assign_homework 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={editPermissions.can_assign_homework}
                          onChange={(e) => setEditPermissions({ ...editPermissions, can_assign_homework: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${editPermissions.can_assign_homework ? 'text-blue-900' : 'text-gray-900'}`}>
                            Assign Homework
                          </p>
                          <p className={`text-sm ${editPermissions.can_assign_homework ? 'text-blue-600' : 'text-gray-500'}`}>
                            Can assign homework and tasks to students
                          </p>
                        </div>
                        {editPermissions.can_assign_homework && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">ON</span>
                        )}
                      </label>
                      
                      {/* Grade Assignments */}
                      <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        editPermissions.can_grade_assignments 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={editPermissions.can_grade_assignments}
                          onChange={(e) => setEditPermissions({ ...editPermissions, can_grade_assignments: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${editPermissions.can_grade_assignments ? 'text-blue-900' : 'text-gray-900'}`}>
                            Grade Assignments
                          </p>
                          <p className={`text-sm ${editPermissions.can_grade_assignments ? 'text-blue-600' : 'text-gray-500'}`}>
                            Can grade and review student assignments
                          </p>
                        </div>
                        {editPermissions.can_grade_assignments && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">ON</span>
                        )}
                      </label>
                      
                      {/* Edit Student PII */}
                      <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        editPermissions.can_update_pii 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={editPermissions.can_update_pii}
                          onChange={(e) => setEditPermissions({ ...editPermissions, can_update_pii: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${editPermissions.can_update_pii ? 'text-blue-900' : 'text-gray-900'}`}>
                            Edit Student Info (PII)
                          </p>
                          <p className={`text-sm ${editPermissions.can_update_pii ? 'text-blue-600' : 'text-gray-500'}`}>
                            Can edit student personal information like name, phone, parent details
                          </p>
                        </div>
                        {editPermissions.can_update_pii && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">ON</span>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Subjects Section */}
                  {editSection === 'subjects' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Assign subjects this teacher can teach.
                        </p>
                        <button
                          onClick={addSubject}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Subject
                        </button>
                      </div>
                      
                      {editSubjects.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          <p>No subjects assigned</p>
                          <button
                            onClick={addSubject}
                            className="mt-2 text-blue-600 hover:underline"
                          >
                            Add a subject
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editSubjects.map((subject, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <select
                                  value={subject.subject_id}
                                  onChange={(e) => {
                                    const newSubjects = [...editSubjects];
                                    newSubjects[index].subject_id = e.target.value;
                                    setEditSubjects(newSubjects);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Subject</option>
                                  {availableSubjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-24">
                                <input
                                  type="number"
                                  min="0"
                                  value={subject.years_teaching}
                                  onChange={(e) => {
                                    const newSubjects = [...editSubjects];
                                    newSubjects[index].years_teaching = parseInt(e.target.value) || 0;
                                    setEditSubjects(newSubjects);
                                  }}
                                  placeholder="Years"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <label className="flex items-center gap-2 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={subject.is_primary}
                                  onChange={(e) => {
                                    const newSubjects = [...editSubjects];
                                    // Uncheck all others if this is being checked
                                    if (e.target.checked) {
                                      newSubjects.forEach((s, i) => {
                                        s.is_primary = i === index;
                                      });
                                    } else {
                                      newSubjects[index].is_primary = false;
                                    }
                                    setEditSubjects(newSubjects);
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-600">Primary</span>
                              </label>
                              <button
                                onClick={() => removeSubject(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Classes Section */}
                  {editSection === 'classes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Assign classes and grades this teacher will teach.
                        </p>
                        <button
                          onClick={addClass}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Class
                        </button>
                      </div>
                      
                      {editClasses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          <p>No classes assigned</p>
                          <button
                            onClick={addClass}
                            className="mt-2 text-blue-600 hover:underline"
                          >
                            Add a class
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editClasses.map((cls, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1 w-full sm:w-auto">
                                <label className="text-xs text-gray-500 mb-1 block sm:hidden">Class</label>
                                <select
                                  value={cls.class_id}
                                  onChange={(e) => {
                                    const newClasses = [...editClasses];
                                    newClasses[index].class_id = e.target.value;
                                    setEditClasses(newClasses);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Class</option>
                                  {availableClasses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 w-full sm:w-auto">
                                <label className="text-xs text-gray-500 mb-1 block sm:hidden">Subject</label>
                                <select
                                  value={cls.subject_id}
                                  onChange={(e) => {
                                    const newClasses = [...editClasses];
                                    newClasses[index].subject_id = e.target.value;
                                    setEditClasses(newClasses);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Subject</option>
                                  {availableSubjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => removeClass(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {editSection === 'attendance_class' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Assign a class for this teacher to mark student attendance. The teacher will only be able to mark attendance for this class.
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attendance Class
                        </label>
                        <select
                          value={editAttendanceClass}
                          onChange={(e) => setEditAttendanceClass(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">No class assigned (Teacher cannot mark student attendance)</option>
                          {availableClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} ({cls.academic_year})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          The teacher will see this class in their dashboard to mark daily student attendance.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


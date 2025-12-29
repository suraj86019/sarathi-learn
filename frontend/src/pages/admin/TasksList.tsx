import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Loader2,
  ArrowLeft,
  Clock,
  Plus,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Target,
  Send,
  MessageSquare,
} from 'lucide-react';
import adminDashboardService, { Task, TaskDetail, School as SchoolType } from '../../services/adminDashboard.service';
import CreateTaskModal from '../../components/admin/CreateTaskModal';

interface TasksListProps {
  onBack: () => void;
  schools?: SchoolType[];
  selectedSchoolId?: string;
  selectedSchoolName?: string;
}

type FilterTab = 'all' | 'open' | 'in_progress' | 'completed' | 'overdue';

export default function TasksList({ onBack, schools = [], selectedSchoolId, selectedSchoolName }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  
  // Task detail with replies
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  // Load task detail when a task is selected
  useEffect(() => {
    if (selectedTask && selectedTask.type === 'TASK') {
      loadTaskDetail(selectedTask.id);
    } else {
      setTaskDetail(null);
    }
  }, [selectedTask]);

  const loadTaskDetail = async (taskId: string) => {
    try {
      setLoadingDetail(true);
      const detail = await adminDashboardService.getTaskDetail(taskId);
      setTaskDetail(detail);
    } catch (err) {
      console.error('Failed to load task detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyContent.trim() || !selectedTask) return;
    
    try {
      setSendingReply(true);
      await adminDashboardService.addTaskReply(selectedTask.id, replyContent);
      setReplyContent('');
      // Reload task detail to get updated replies
      loadTaskDetail(selectedTask.id);
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTask) return;
    
    try {
      setUpdatingStatus(true);
      await adminDashboardService.updateTaskStatus(selectedTask.id, newStatus);
      // Update the task in the list
      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id ? { ...t, status: newStatus } : t
      ));
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      // Reload task detail
      loadTaskDetail(selectedTask.id);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getTaskHistory();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a task is overdue
  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Calculate counts for each filter
  const openCount = tasks.filter(t => t.status.toUpperCase() === 'OPEN' || t.status.toUpperCase() === 'ASSIGNED').length;
  const inProgressCount = tasks.filter(t => t.status.toUpperCase() === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status.toUpperCase() === 'COMPLETED').length;
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status.toUpperCase() !== 'COMPLETED').length;

  // Filter tasks based on active filter and search
  const filteredTasks = tasks.filter(task => {
    // First apply status filter
    let matchesFilter = true;
    switch (activeFilter) {
      case 'open':
        matchesFilter = task.status.toUpperCase() === 'OPEN' || task.status.toUpperCase() === 'ASSIGNED';
        break;
      case 'in_progress':
        matchesFilter = task.status.toUpperCase() === 'IN_PROGRESS';
        break;
      case 'completed':
        matchesFilter = task.status.toUpperCase() === 'COMPLETED';
        break;
      case 'overdue':
        matchesFilter = isOverdue(task.due_date) && task.status.toUpperCase() !== 'COMPLETED';
        break;
      default:
        matchesFilter = true;
    }

    // Then apply search filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'HOMEWORK': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ASSIGNMENT': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PROJECT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACTIVITY': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'GENERAL': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'PENDING': return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'ASSIGNED': return <Target className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'OVERDUE': return <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default: return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
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
              <ClipboardList className="w-5 h-5 sm:w-7 sm:h-7 text-amber-600" />
              Tasks
            </h1>
            <p className="text-xs sm:text-base text-gray-500 mt-0.5 sm:mt-1">
              {tasks.length} tasks created
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all font-medium shadow-lg text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          All
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeFilter === 'all' ? 'bg-white/20' : 'bg-gray-100'
          }`}>
            {tasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('open')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'open'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Open
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeFilter === 'open' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
          }`}>
            {openCount}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('in_progress')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'in_progress'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-amber-50 hover:border-amber-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          In Progress
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeFilter === 'in_progress' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
          }`}>
            {inProgressCount}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completed
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeFilter === 'completed' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {completedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('overdue')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeFilter === 'overdue'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:border-red-200'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Overdue
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeFilter === 'overdue' ? 'bg-white/20' : 'bg-red-100 text-red-700'
          }`}>
            {overdueCount}
          </span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`bg-white rounded-xl p-3 sm:p-4 border transition-all text-left hover:shadow-md ${
            activeFilter === 'all' ? 'border-slate-400 ring-2 ring-slate-200' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{tasks.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Total Tasks</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('open')}
          className={`bg-white rounded-xl p-3 sm:p-4 border transition-all text-left hover:shadow-md ${
            activeFilter === 'open' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{openCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Open</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('in_progress')}
          className={`bg-white rounded-xl p-3 sm:p-4 border transition-all text-left hover:shadow-md ${
            activeFilter === 'in_progress' ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{inProgressCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`bg-white rounded-xl p-3 sm:p-4 border transition-all text-left hover:shadow-md ${
            activeFilter === 'completed' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`bg-white rounded-xl border hover:shadow-lg hover:border-amber-200 transition-all overflow-hidden cursor-pointer active:bg-gray-50 ${
                  isOverdue(task.due_date) && task.status.toUpperCase() !== 'COMPLETED'
                    ? 'border-red-200'
                    : 'border-gray-200'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2">
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium border ${getTypeColor(task.type)}`}>
                          {task.type}
                        </span>
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {task.status}
                        </span>
                        {isOverdue(task.due_date) && task.status.toUpperCase() !== 'COMPLETED' && (
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                            <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Overdue
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{task.description}</p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{task.assigned_to}</span>
                        </div>
                        {task.school && (
                          <div className="hidden sm:flex items-center gap-1 text-blue-600">
                            <Target className="w-4 h-4" />
                            {task.school}
                          </div>
                        )}
                        {task.subject && (
                          <div className="hidden sm:flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {task.subject}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-gray-200">
              <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium text-gray-700">No tasks found</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Start by creating your first task</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 text-white min-w-0">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">Task Details</h2>
                    <p className="text-amber-100 text-xs sm:text-sm">ID: {selectedTask.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTask(null); setTaskDetail(null); setReplyContent(''); }}
                  className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Status & Type with Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${getTypeColor(selectedTask.type)}`}>
                      {selectedTask.type}
                    </span>
                    <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 ${getStatusColor(selectedTask.status)}`}>
                      {getStatusIcon(selectedTask.status)}
                      {selectedTask.status}
                    </span>
                    {isOverdue(selectedTask.due_date) && selectedTask.status.toUpperCase() !== 'COMPLETED' && (
                      <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  {/* Status Update Buttons (only for TASK type) */}
                  {selectedTask.type === 'TASK' && (
                    <div className="flex items-center gap-2">
                      {selectedTask.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus('COMPLETED')}
                          disabled={updatingStatus}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Mark Complete
                        </button>
                      )}
                      {selectedTask.status === 'OPEN' && (
                        <button
                          onClick={() => handleUpdateStatus('IN_PROGRESS')}
                          disabled={updatingStatus}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                          Start Progress
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1">{selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{selectedTask.description}</p>
                  )}
                </div>

                {/* Compact Details Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-gray-700">
                    <Users className="w-3 h-3" />
                    {selectedTask.assigned_to}
                  </span>
                  {selectedTask.school && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg text-blue-700">
                      <Target className="w-3 h-3" />
                      {selectedTask.school}
                    </span>
                  )}
                  {selectedTask.assigned_by && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg text-purple-700">
                      <GraduationCap className="w-3 h-3" />
                      {selectedTask.assigned_by}
                    </span>
                  )}
                  {selectedTask.due_date && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
                      isOverdue(selectedTask.due_date) && selectedTask.status.toUpperCase() !== 'COMPLETED'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedTask.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Conversation Section (only for TASK type) */}
                {selectedTask.type === 'TASK' && (
                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      Conversation
                      {taskDetail?.replies_count ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          {taskDetail.replies_count}
                        </span>
                      ) : null}
                    </h4>

                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      </div>
                    ) : (
                      <>
                        {/* Replies List */}
                        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                          {taskDetail?.replies && taskDetail.replies.length > 0 ? (
                            taskDetail.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={`p-3 sm:p-4 rounded-xl ${
                                  reply.reply_type === 'ADMIN'
                                    ? 'bg-amber-50 border border-amber-200 ml-4'
                                    : 'bg-blue-50 border border-blue-200 mr-4'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                      reply.reply_type === 'ADMIN'
                                        ? 'bg-amber-200 text-amber-700'
                                        : 'bg-blue-200 text-blue-700'
                                    }`}>
                                      {reply.replied_by?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {reply.replied_by?.name || 'Unknown'}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {reply.reply_type === 'ADMIN' ? 'Admin' : 'Teacher'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(reply.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No messages yet</p>
                              <p className="text-xs text-gray-400">Start the conversation below</p>
                            </div>
                          )}
                        </div>

                        {/* Reply Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Type your reply..."
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            onKeyPress={(e) => e.key === 'Enter' && !sendingReply && handleAddReply()}
                          />
                          <button
                            onClick={handleAddReply}
                            disabled={sendingReply || !replyContent.trim()}
                            className="px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {sendingReply ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadTasks();
          setShowCreateModal(false);
        }}
        schools={schools}
        schoolId={selectedSchoolId}
        schoolName={selectedSchoolName}
      />
    </div>
  );
}

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
} from 'lucide-react';
import adminDashboardService, { Task, School as SchoolType } from '../../services/adminDashboard.service';
import CreateTaskModal from '../../components/admin/CreateTaskModal';

interface TasksListProps {
  onBack: () => void;
  schools?: SchoolType[];
  selectedSchoolId?: string;
  selectedSchoolName?: string;
}

export default function TasksList({ onBack, schools = [], selectedSchoolId, selectedSchoolName }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

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

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{tasks.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status.toUpperCase() === 'COMPLETED').length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status.toUpperCase() === 'IN_PROGRESS' || t.status.toUpperCase() === 'ASSIGNED').length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {tasks.filter(t => isOverdue(t.due_date) && t.status.toUpperCase() !== 'COMPLETED').length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
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
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 text-white min-w-0">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">Task Details</h2>
                    <p className="text-amber-100 text-xs sm:text-sm">ID: {selectedTask.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-100px)]">
              <div className="space-y-4 sm:space-y-6">
                {/* Status & Type */}
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

                {/* Title & Description */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTask.description}</p>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Assigned To</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{selectedTask.assigned_to}</span>
                    </p>
                  </div>
                  {selectedTask.school && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">School</p>
                      <p className="font-medium text-blue-600 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{selectedTask.school}</span>
                      </p>
                    </div>
                  )}
                  {selectedTask.subject && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Subject</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{selectedTask.subject}</span>
                      </p>
                    </div>
                  )}
                  {selectedTask.assigned_by && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Assigned By</p>
                      <p className="font-medium text-purple-600 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                        <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{selectedTask.assigned_by}</span>
                      </p>
                    </div>
                  )}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Due Date</p>
                    <p className={`font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base ${
                      isOverdue(selectedTask.due_date) && selectedTask.status.toUpperCase() !== 'COMPLETED'
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      {new Date(selectedTask.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Assigned Date</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      {new Date(selectedTask.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
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

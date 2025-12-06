import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Loader2,
  ArrowLeft,
  Clock,
  Plus,
  School,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Calendar,
  Trash2,
  X,
  Edit3,
} from 'lucide-react';
import adminDashboardService, { Notification, School as SchoolType } from '../../services/adminDashboard.service';
import CreateNotificationModal from '../../components/admin/CreateNotificationModal';

interface NotificationsListProps {
  onBack: () => void;
  schools?: SchoolType[];
}

export default function NotificationsList({ onBack, schools = [] }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (editingNotification) {
      setEditTitle(editingNotification.title);
      setEditMessage(editingNotification.content);
      setEditPriority(editingNotification.priority);
    }
  }, [editingNotification]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getNotificationHistory();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (id: string, notificationType: 'EMAIL' | 'SMS' | 'BOTH' = 'EMAIL') => {
    try {
      setActionLoading(id);
      await adminDashboardService.sendNotification(id, notificationType);
      loadNotifications();
      setSelectedNotification(null);
    } catch (err: any) {
      console.error('Failed to send notification:', err);
      alert(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setActionLoading(id);
      await adminDashboardService.deleteNotification(id);
      setShowDeleteConfirm(null);
      setSelectedNotification(null);
      loadNotifications();
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      alert(err.response?.data?.message || 'Failed to delete notification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification) return;
    
    try {
      setActionLoading(editingNotification.id);
      await adminDashboardService.updateNotification(editingNotification.id, {
        title: editTitle,
        message: editMessage,
        priority: editPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      });
      setEditingNotification(null);
      loadNotifications();
    } catch (err: any) {
      console.error('Failed to update notification:', err);
      alert(err.response?.data?.message || 'Failed to update notification');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-emerald-100 text-emerald-700';
      case 'DRAFT': return 'bg-amber-100 text-amber-700';
      case 'ARCHIVED': return 'bg-slate-100 text-slate-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'DRAFT': return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'ARCHIVED': return <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
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
              <Bell className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600" />
              Notifications
            </h1>
            <p className="text-xs sm:text-base text-gray-500 mt-0.5 sm:mt-1">
              {notifications.length} notifications
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{notifications.length}</p>
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
                {notifications.filter(n => n.status === 'PUBLISHED').length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.status === 'DRAFT').length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.priority === 'URGENT').length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
        />
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => setSelectedNotification(notification)}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all overflow-hidden cursor-pointer active:bg-gray-50"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2">
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 ${getStatusColor(notification.status)}`}>
                          {getStatusIcon(notification.status)}
                          {notification.status}
                        </span>
                      </div>

                      {/* Title & Content */}
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{notification.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{notification.content}</p>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {notification.published_at 
                            ? new Date(notification.published_at).toLocaleDateString()
                            : new Date(notification.created_at).toLocaleDateString()
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          {notification.targets_count} targets
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          ~{notification.estimated_recipients} recipients
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {notification.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => setEditingNotification(notification)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleSendNotification(notification.id, 'EMAIL')}
                            disabled={actionLoading === notification.id}
                            className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Send Now"
                          >
                            {actionLoading === notification.id ? (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(notification.id)}
                            className="hidden sm:block p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Targets Preview - Desktop only */}
                  {notification.targets && notification.targets.length > 0 && (
                    <div className="hidden sm:block mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Targets:</p>
                      <div className="flex flex-wrap gap-2">
                        {notification.targets.slice(0, 5).map((target, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                              target.type === 'school' 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {target.type === 'school' ? <School className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {target.name}
                          </span>
                        ))}
                        {notification.targets.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                            +{notification.targets.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-gray-200">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium text-gray-700">No notifications found</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Start by creating your first notification</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Notification
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Delete Notification</h3>
                <p className="text-xs sm:text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5 sm:mb-6">
              Are you sure you want to delete this notification?
            </p>
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNotification(showDeleteConfirm)}
                disabled={actionLoading === showDeleteConfirm}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 text-sm"
              >
                {actionLoading === showDeleteConfirm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 text-white min-w-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">Notification Details</h2>
                    <p className="text-purple-100 text-xs sm:text-sm">ID: {selectedNotification.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)]">
              <div className="space-y-4 sm:space-y-6">
                {/* Status & Priority */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border ${getPriorityColor(selectedNotification.priority)}`}>
                    {selectedNotification.priority}
                  </span>
                  <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 ${getStatusColor(selectedNotification.status)}`}>
                    {getStatusIcon(selectedNotification.status)}
                    {selectedNotification.status}
                  </span>
                </div>

                {/* Title & Content */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{selectedNotification.title}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedNotification.content}</p>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Created</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      {new Date(selectedNotification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedNotification.published_at && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Published</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                        {new Date(selectedNotification.published_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-purple-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">{selectedNotification.targets_count}</p>
                    <p className="text-xs sm:text-sm text-purple-600">Targets</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{selectedNotification.estimated_recipients}</p>
                    <p className="text-xs sm:text-sm text-emerald-600">Recipients</p>
                  </div>
                </div>

                {/* Targets */}
                {selectedNotification.targets && selectedNotification.targets.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Target Recipients</h3>
                    </div>
                    <div className="p-3 sm:p-4 space-y-2">
                      {selectedNotification.targets.map((target, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 sm:p-3 rounded-lg flex items-center gap-2 sm:gap-3 ${
                            target.type === 'school' ? 'bg-blue-50' : 'bg-emerald-50'
                          }`}
                        >
                          {target.type === 'school' ? (
                            <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className={`font-medium text-xs sm:text-sm ${target.type === 'school' ? 'text-blue-900' : 'text-emerald-900'}`}>
                              {target.name}
                            </p>
                            {target.roles && target.roles.length > 0 && (
                              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Roles: {target.roles.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Actions for Draft */}
            {selectedNotification.status === 'DRAFT' && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setShowDeleteConfirm(selectedNotification.id)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs sm:text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setEditingNotification(selectedNotification);
                      setSelectedNotification(null);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-xs sm:text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleSendNotification(selectedNotification.id, 'EMAIL')}
                    disabled={actionLoading === selectedNotification.id}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors font-medium shadow-lg disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {actionLoading === selectedNotification.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Notification Modal */}
      {editingNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 text-white">
                  <Edit3 className="w-5 h-5 sm:w-6 sm:h-6" />
                  <h2 className="text-base sm:text-xl font-bold">Edit Notification</h2>
                </div>
                <button
                  onClick={() => setEditingNotification(null)}
                  className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Message</label>
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notification message"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setEditingNotification(null)}
                className="px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNotification}
                disabled={actionLoading === editingNotification.id}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg disabled:opacity-50 text-sm"
              >
                {actionLoading === editingNotification.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      <CreateNotificationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadNotifications();
          setShowCreateModal(false);
        }}
        schools={schools}
      />
    </div>
  );
}

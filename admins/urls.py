"""
Admin URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profile', views.AdminProfileViewSet, basename='admin-profile')

# Additional URL patterns for complex operations
urlpatterns = [
    path('', include(router.urls)),

    # User Notifications (for all authenticated users - bell notifications)
    path('notifications/my/', views.UserNotificationViewSet.as_view({
        'get': 'my_notifications'
    }), name='my-notifications'),
    path('notifications/unread-count/', views.UserNotificationViewSet.as_view({
        'get': 'unread_count'
    }), name='unread-notifications-count'),

    # Notification management (admin only)
    path('notifications/', views.NotificationViewSet.as_view({
        'post': 'create_notification'
    }), name='create-notification'),
    path('notifications/history/', views.NotificationViewSet.as_view({
        'get': 'notification_history'
    }), name='notification-history'),
    path('notifications/<uuid:pk>/', views.NotificationViewSet.as_view({
        'put': 'update_notification',
        'patch': 'update_notification',
        'delete': 'delete_notification'
    }), name='notification-detail'),
    path('notifications/<uuid:pk>/send/', views.NotificationViewSet.as_view({
        'post': 'send_notification'
    }), name='send-notification'),

    # Task management
    path('tasks/', views.TaskViewSet.as_view({
        'post': 'create_task'
    }), name='create-task'),
    path('tasks/history/', views.TaskViewSet.as_view({
        'get': 'task_history'
    }), name='task-history'),

    # Student management
    path('students/add/', views.StudentManagementViewSet.as_view({
        'post': 'add_student'
    }), name='add-student'),
    path('students/', views.StudentManagementViewSet.as_view({
        'get': 'list_students'
    }), name='list-students'),
    path('students/<uuid:pk>/action/', views.StudentManagementViewSet.as_view({
        'post': 'perform_action'
    }), name='student-action'),

    # Teacher management
    path('teachers/add/', views.TeacherManagementViewSet.as_view({
        'post': 'add_teacher'
    }), name='add-teacher'),
    path('teachers/', views.TeacherManagementViewSet.as_view({
        'get': 'list_teachers'
    }), name='list-teachers'),
    path('teachers/<uuid:pk>/action/', views.TeacherManagementViewSet.as_view({
        'post': 'perform_action'
    }), name='teacher-action'),

    # Reports
    path('reports/students/', views.ReportViewSet.as_view({
        'post': 'student_report'
    }), name='student-report'),
    path('reports/teachers/', views.ReportViewSet.as_view({
        'post': 'teacher_report'
    }), name='teacher-report'),
    path('reports/school/', views.ReportViewSet.as_view({
        'post': 'school_report'
    }), name='school-report'),

    # Dashboard
    path('dashboard/', views.AdminDashboardViewSet.as_view({
        'get': 'dashboard'
    }), name='admin-dashboard'),
    
    # Schools (admin's assigned schools)
    path('schools/', views.AdminDashboardViewSet.as_view({
        'get': 'schools'
    }), name='admin-schools'),
    
    # School Teachers - Get all teachers for a specific school
    path('schools/<uuid:pk>/teachers/', views.AdminDashboardViewSet.as_view({
        'get': 'school_teachers'
    }), name='school-teachers'),
    
    # School Students - Get all students for a specific school (simple list)
    path('schools/<uuid:pk>/students/', views.AdminDashboardViewSet.as_view({
        'get': 'school_students'
    }), name='school-students'),
    
    # Teacher Detail for a School
    path('schools/<uuid:pk>/teacher/', views.AdminDashboardViewSet.as_view({
        'get': 'teacher_detail'
    }), name='school-teacher-detail'),

    # AI Quota Management
    path('ai-quota/update/', views.AIQuotaManagementViewSet.as_view({
        'post': 'update_quota'
    }), name='update-ai-quota'),
    path('ai-quota/usage/', views.AIQuotaManagementViewSet.as_view({
        'get': 'quota_usage'
    }), name='ai-quota-usage'),

    # Announcement Target Management
    path('announcement-targets/', views.AnnouncementTargetViewSet.as_view({
        'get': 'list_targets'
    }), name='list-announcement-targets'),
    path('announcement-targets/<uuid:pk>/', views.AnnouncementTargetViewSet.as_view({
        'get': 'target_details'
    }), name='announcement-target-details'),
    path('announcement-targets/<uuid:pk>/retry/', views.AnnouncementTargetViewSet.as_view({
        'post': 'retry_send'
    }), name='retry-announcement-target'),

    # Teacher Task Management
    path('teacher-tasks/', views.TeacherTaskViewSet.as_view({
        'post': 'create_task'
    }), name='create-teacher-task'),
    path('teacher-tasks/teacher/<uuid:teacher_id>/', views.TeacherTaskViewSet.as_view({
        'get': 'get_teacher_tasks'
    }), name='teacher-tasks'),
    path('teacher-tasks/<uuid:pk>/', views.TeacherTaskViewSet.as_view({
        'get': 'task_detail'
    }), name='teacher-task-detail'),
    path('teacher-tasks/<uuid:pk>/reply/', views.TeacherTaskViewSet.as_view({
        'post': 'add_reply'
    }), name='teacher-task-reply'),
    path('teacher-tasks/<uuid:pk>/status/', views.TeacherTaskViewSet.as_view({
        'post': 'update_status'
    }), name='teacher-task-status'),
    
    # Teacher Detail with Calendar and Tasks
    path('teacher-detail/<uuid:teacher_id>/', views.TeacherTaskViewSet.as_view({
        'get': 'get_teacher_detail'
    }), name='teacher-full-detail'),
    path('teacher-detail/<uuid:teacher_id>/calendar/', views.TeacherTaskViewSet.as_view({
        'get': 'get_attendance_calendar'
    }), name='teacher-attendance-calendar'),
    path('teacher-detail/<uuid:teacher_id>/attendance/', views.TeacherTaskViewSet.as_view({
        'post': 'mark_teacher_attendance'
    }), name='mark-teacher-attendance'),
    
    # Teacher Edit Endpoints
    path('teacher-detail/<uuid:teacher_id>/update/', views.TeacherTaskViewSet.as_view({
        'put': 'update_teacher',
        'patch': 'update_teacher'
    }), name='update-teacher'),
    path('teacher-detail/<uuid:teacher_id>/subjects/', views.TeacherTaskViewSet.as_view({
        'put': 'update_teacher_subjects'
    }), name='update-teacher-subjects'),
    path('teacher-detail/<uuid:teacher_id>/classes/', views.TeacherTaskViewSet.as_view({
        'put': 'update_teacher_classes'
    }), name='update-teacher-classes'),
    
    # Available options for teacher assignment
    path('available-subjects/', views.TeacherTaskViewSet.as_view({
        'get': 'available_subjects'
    }), name='available-subjects'),
    path('available-classes/<uuid:school_id>/', views.TeacherTaskViewSet.as_view({
        'get': 'available_classes'
    }), name='available-classes'),
    
    # Attendance Management
    path('attendance/classes/', views.AttendanceViewSet.as_view({
        'get': 'classes_for_attendance'
    }), name='attendance-classes'),
    path('attendance/class/<uuid:class_id>/', views.AttendanceViewSet.as_view({
        'get': 'get_class_students'
    }), name='attendance-class-students'),
    path('attendance/mark/<uuid:class_id>/', views.AttendanceViewSet.as_view({
        'post': 'mark_attendance'
    }), name='mark-attendance'),
    path('attendance/summary/<uuid:class_id>/', views.AttendanceViewSet.as_view({
        'get': 'attendance_summary'
    }), name='attendance-summary'),
]

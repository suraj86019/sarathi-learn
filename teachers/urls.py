"""
Teacher URLs
URL routing for teacher-related endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'teachers'

router = DefaultRouter()

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
    
    # Dashboard
    path('dashboard/', views.TeacherDashboardViewSet.as_view({
        'get': 'dashboard'
    }), name='teacher-dashboard'),
    
    # News/Announcements
    path('news/', views.TeacherDashboardViewSet.as_view({
        'get': 'news'
    }), name='teacher-news'),
    path('news/<uuid:pk>/', views.TeacherDashboardViewSet.as_view({
        'get': 'news_detail'
    }), name='teacher-news-detail'),
    
    # Profile & School
    path('profile/', views.TeacherDashboardViewSet.as_view({
        'get': 'profile'
    }), name='teacher-profile'),
    path('profile/update/', views.TeacherDashboardViewSet.as_view({
        'put': 'update_profile',
        'patch': 'update_profile'
    }), name='teacher-profile-update'),
    path('school/', views.TeacherDashboardViewSet.as_view({
        'get': 'school'
    }), name='teacher-school'),
    path('stats/', views.TeacherDashboardViewSet.as_view({
        'get': 'stats'
    }), name='teacher-stats'),
    path('extended-stats/', views.TeacherDashboardViewSet.as_view({
        'get': 'extended_stats'
    }), name='teacher-extended-stats'),
    path('schedule/', views.TeacherDashboardViewSet.as_view({
        'get': 'schedule'
    }), name='teacher-schedule'),
    
    # School Data (Teachers, Students, Classes)
    path('school-teachers/', views.TeacherDashboardViewSet.as_view({
        'get': 'teachers'
    }), name='school-teachers'),
    path('school-students/', views.TeacherDashboardViewSet.as_view({
        'get': 'school_students'
    }), name='school-students'),
    path('school-classes/', views.TeacherDashboardViewSet.as_view({
        'get': 'classes'
    }), name='school-classes'),
    
    # Tasks
    path('tasks/', views.TeacherTaskViewSet.as_view({
        'get': 'tasks'
    }), name='teacher-tasks'),
    path('tasks/all/', views.TeacherTaskViewSet.as_view({
        'get': 'all_tasks'
    }), name='teacher-all-tasks'),
    path('tasks/<uuid:pk>/', views.TeacherTaskViewSet.as_view({
        'get': 'task_detail'
    }), name='teacher-task-detail'),
    path('tasks/<uuid:pk>/reply/', views.TeacherTaskViewSet.as_view({
        'post': 'reply'
    }), name='teacher-task-reply'),
    path('tasks/<uuid:pk>/status/', views.TeacherTaskViewSet.as_view({
        'post': 'update_status'
    }), name='teacher-task-status'),
    
    # Attendance
    path('attendance/students/', views.TeacherAttendanceViewSet.as_view({
        'get': 'students'
    }), name='attendance-students'),
    path('attendance/mark/', views.TeacherAttendanceViewSet.as_view({
        'post': 'mark'
    }), name='mark-attendance'),
    path('attendance/summary/', views.TeacherAttendanceViewSet.as_view({
        'get': 'summary'
    }), name='attendance-summary'),
    
    # Students
    path('students/', views.TeacherStudentViewSet.as_view({
        'get': 'students'
    }), name='teacher-students'),
    path('students/<uuid:pk>/', views.TeacherStudentViewSet.as_view({
        'get': 'student_detail'
    }), name='teacher-student-detail'),
    path('students/<uuid:pk>/attendance-calendar/', views.TeacherStudentViewSet.as_view({
        'get': 'attendance_calendar'
    }), name='student-attendance-calendar'),
    path('students/<uuid:pk>/update-pii/', views.TeacherStudentViewSet.as_view({
        'post': 'update_pii'
    }), name='student-update-pii'),
    path('students/add/', views.TeacherStudentViewSet.as_view({
        'post': 'add_student'
    }), name='add-student'),
    path('students/<uuid:pk>/update/', views.TeacherStudentViewSet.as_view({
        'put': 'update_student',
        'patch': 'update_student'
    }), name='update-student'),
    path('students/<uuid:pk>/tasks/', views.TeacherStudentViewSet.as_view({
        'get': 'student_tasks'
    }), name='student-tasks'),
    path('students/<uuid:pk>/create-task/', views.TeacherStudentViewSet.as_view({
        'post': 'create_task'
    }), name='student-create-task'),
    path('students/task/<uuid:task_id>/status/', views.TeacherStudentViewSet.as_view({
        'post': 'update_task_status'
    }), name='student-task-status'),
    path('students/task/<uuid:task_id>/detail/', views.TeacherStudentViewSet.as_view({
        'get': 'task_detail'
    }), name='student-task-detail'),
    path('students/task/<uuid:task_id>/reply/', views.TeacherStudentViewSet.as_view({
        'post': 'add_task_reply'
    }), name='student-task-reply'),
    
    # Activities / Schedule
    path('activities/classes/', views.TeacherActivityViewSet.as_view({
        'get': 'classes'
    }), name='activity-classes'),
    path('activities/classes/<uuid:class_id>/students/', views.TeacherActivityViewSet.as_view({
        'get': 'class_students'
    }), name='activity-class-students'),
    path('activities/classes/<uuid:class_id>/activities/', views.TeacherActivityViewSet.as_view({
        'get': 'class_activities'
    }), name='activity-class-activities'),
    path('activities/subjects/', views.TeacherActivityViewSet.as_view({
        'get': 'subjects'
    }), name='activity-subjects'),
    path('activities/', views.TeacherActivityViewSet.as_view({
        'get': 'list_all',
        'post': 'create'
    }), name='activities'),
    path('activities/<uuid:pk>/', views.TeacherActivityViewSet.as_view({
        'get': 'retrieve'
    }), name='activity-detail'),
    path('activities/<uuid:pk>/submissions/', views.TeacherActivityViewSet.as_view({
        'get': 'submissions'
    }), name='activity-submissions'),
    path('activities/<uuid:pk>/status/', views.TeacherActivityViewSet.as_view({
        'patch': 'update_status'
    }), name='activity-status'),
    path('activities/<uuid:pk>/update/', views.TeacherActivityViewSet.as_view({
        'put': 'update_activity',
        'patch': 'update_activity'
    }), name='activity-update'),
    path('activities/submissions/<uuid:submission_id>/grade/', views.TeacherActivityViewSet.as_view({
        'patch': 'grade_submission'
    }), name='activity-grade-submission'),
    
    # Announcements
    path('announcements/', views.TeacherAnnouncementViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='announcements'),
    path('announcements/my/', views.TeacherAnnouncementViewSet.as_view({
        'get': 'my_announcements'
    }), name='my-announcements'),
    path('announcements/classes/', views.TeacherAnnouncementViewSet.as_view({
        'get': 'classes'
    }), name='announcement-classes'),
    path('announcements/classes/<uuid:class_id>/students/', views.TeacherAnnouncementViewSet.as_view({
        'get': 'class_students'
    }), name='announcement-class-students'),
    
    # Reports / Progress Cards
    path('reports/', views.TeacherReportViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='reports'),
    path('reports/<uuid:pk>/', views.TeacherReportViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='report-detail'),
    path('reports/<uuid:pk>/marks/', views.TeacherReportViewSet.as_view({
        'post': 'save_marks'
    }), name='report-marks'),
    path('reports/<uuid:pk>/publish/', views.TeacherReportViewSet.as_view({
        'post': 'publish'
    }), name='report-publish'),
    path('reports/classes/', views.TeacherReportViewSet.as_view({
        'get': 'classes'
    }), name='report-classes'),
    path('reports/classes/<uuid:class_id>/subjects/', views.TeacherReportViewSet.as_view({
        'get': 'class_subjects'
    }), name='report-class-subjects'),
    path('reports/classes/<uuid:class_id>/students/', views.TeacherReportViewSet.as_view({
        'get': 'class_students'
    }), name='report-class-students'),
]


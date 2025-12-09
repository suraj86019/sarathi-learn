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
    path('students/<uuid:pk>/tasks/', views.TeacherStudentViewSet.as_view({
        'get': 'student_tasks'
    }), name='student-tasks'),
    path('students/<uuid:pk>/create-task/', views.TeacherStudentViewSet.as_view({
        'post': 'create_task'
    }), name='student-create-task'),
    path('students/task/<uuid:task_id>/status/', views.TeacherStudentViewSet.as_view({
        'post': 'update_task_status'
    }), name='student-task-status'),
]


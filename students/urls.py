"""
Student URLs
URL routing for student API endpoints
"""

from django.urls import path
from . import views

app_name = 'students'

urlpatterns = [
    # Dashboard
    path('dashboard/', views.StudentDashboardViewSet.as_view({
        'get': 'dashboard'
    }), name='dashboard'),
    
    # Profile
    path('profile/', views.StudentDashboardViewSet.as_view({
        'get': 'profile'
    }), name='profile'),
    
    # News
    path('news/', views.StudentNewsViewSet.as_view({
        'get': 'list'
    }), name='news-list'),
    
    path('news/<uuid:pk>/', views.StudentNewsViewSet.as_view({
        'get': 'retrieve'
    }), name='news-detail'),
    
    # Subjects
    path('subjects/', views.StudentSubjectsViewSet.as_view({
        'get': 'list'
    }), name='subjects-list'),
    
    # Attendance
    path('attendance/summary/', views.StudentAttendanceViewSet.as_view({
        'get': 'summary'
    }), name='attendance-summary'),
    
    path('attendance/calendar/', views.StudentAttendanceViewSet.as_view({
        'get': 'calendar'
    }), name='attendance-calendar'),
    
    path('attendance/history/', views.StudentAttendanceViewSet.as_view({
        'get': 'history'
    }), name='attendance-history'),
    
    # Activities
    path('activities/', views.StudentActivityViewSet.as_view({
        'get': 'list'
    }), name='activities-list'),
    
    path('activities/pending_count/', views.StudentActivityViewSet.as_view({
        'get': 'pending_count'
    }), name='activities-pending-count'),
    
    path('activities/<uuid:pk>/', views.StudentActivityViewSet.as_view({
        'get': 'retrieve'
    }), name='activities-detail'),
    
    path('activities/<uuid:pk>/submit/', views.StudentActivityViewSet.as_view({
        'post': 'submit'
    }), name='activities-submit'),
    
    # Tasks
    path('tasks/', views.StudentTaskViewSet.as_view({
        'get': 'list'
    }), name='tasks-list'),
    
    path('tasks/<uuid:pk>/', views.StudentTaskViewSet.as_view({
        'get': 'retrieve'
    }), name='tasks-detail'),
    
    path('tasks/<uuid:pk>/reply/', views.StudentTaskViewSet.as_view({
        'post': 'reply'
    }), name='tasks-reply'),
    
    path('tasks/<uuid:pk>/update_status/', views.StudentTaskViewSet.as_view({
        'post': 'update_status'
    }), name='tasks-update-status'),
    
    # Government Schemes
    path('schemes/', views.StudentSchemeViewSet.as_view({
        'get': 'list'
    }), name='schemes-list'),
    
    path('schemes/types/', views.StudentSchemeViewSet.as_view({
        'get': 'types'
    }), name='schemes-types'),
    
    path('schemes/<uuid:pk>/', views.StudentSchemeViewSet.as_view({
        'get': 'retrieve'
    }), name='schemes-detail'),
    
    # Reports / Progress Cards
    path('reports/', views.StudentReportViewSet.as_view({
        'get': 'list'
    }), name='reports-list'),
    
    path('reports/<uuid:pk>/', views.StudentReportViewSet.as_view({
        'get': 'retrieve'
    }), name='reports-detail'),
    
    # Announcements
    path('announcements/', views.StudentAnnouncementViewSet.as_view({
        'get': 'list'
    }), name='announcements-list'),
    
    path('announcements/count/', views.StudentAnnouncementViewSet.as_view({
        'get': 'count'
    }), name='announcements-count'),
    
    path('announcements/<uuid:pk>/', views.StudentAnnouncementViewSet.as_view({
        'get': 'retrieve'
    }), name='announcements-detail'),
]


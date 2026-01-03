"""
Super Admin URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'schools', views.SchoolViewSet, basename='school')
router.register(r'subjects', views.SubjectViewSet, basename='subject')
router.register(r'classes', views.ClassViewSet, basename='class')  # Class templates (Grade 1-12)
router.register(r'school-classes', views.SchoolClassViewSet, basename='schoolclass')  # School-Class mappings
router.register(r'school-users', views.SchoolUserViewSet, basename='schooluser')
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')
router.register(r'settings', views.SystemSettingsViewSet, basename='systemsettings')

urlpatterns = [
    path('', include(router.urls)),
    path('admins/', views.CreateAdminView.as_view(), name='create-admin'),
    path('teachers/', views.CreateTeacherView.as_view(), name='create-teacher'),
    
    # Super Admin Management - Schools
    path('manage/schools/', views.SuperAdminSchoolViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='manage-schools-list'),
    
    path('manage/schools/<uuid:pk>/', views.SuperAdminSchoolViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='manage-schools-detail'),
    
    path('manage/schools/<uuid:pk>/update_status/', views.SuperAdminSchoolViewSet.as_view({
        'post': 'update_status'
    }), name='manage-schools-update-status'),
    
    path('manage/schools/<uuid:pk>/teachers/', views.SuperAdminSchoolViewSet.as_view({
        'get': 'teachers'
    }), name='manage-schools-teachers'),
    
    path('manage/schools/<uuid:pk>/students/', views.SuperAdminSchoolViewSet.as_view({
        'get': 'students'
    }), name='manage-schools-students'),
    
    path('manage/schools/<uuid:pk>/admins/', views.SuperAdminSchoolViewSet.as_view({
        'get': 'admins'
    }), name='manage-schools-admins'),
    
    path('manage/schools/<uuid:pk>/classes/', views.SuperAdminSchoolViewSet.as_view({
        'get': 'classes'
    }), name='manage-schools-classes'),
    
    # Super Admin Management - Admins
    path('manage/admins/', views.SuperAdminAdminViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='manage-admins-list'),
    
    path('manage/admins/<uuid:pk>/', views.SuperAdminAdminViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='manage-admins-detail'),
    
    path('manage/admins/<uuid:pk>/toggle_status/', views.SuperAdminAdminViewSet.as_view({
        'post': 'toggle_status'
    }), name='manage-admins-toggle-status'),
    
    path('manage/admins/<uuid:pk>/update_schools/', views.SuperAdminAdminViewSet.as_view({
        'post': 'update_schools'
    }), name='manage-admins-update-schools'),
    
    # Super Admin Management - Teachers
    path('manage/teachers/', views.SuperAdminTeacherViewSet.as_view({
        'get': 'list',
    }), name='manage-teachers-list'),
    
    path('manage/teachers/<uuid:pk>/', views.SuperAdminTeacherViewSet.as_view({
        'get': 'retrieve',
    }), name='manage-teachers-detail'),
    
    path('manage/teachers/<uuid:pk>/toggle_status/', views.SuperAdminTeacherViewSet.as_view({
        'post': 'toggle_status'
    }), name='manage-teachers-toggle-status'),
    
    # Super Admin Management - Students
    path('manage/students/', views.SuperAdminStudentViewSet.as_view({
        'get': 'list',
    }), name='manage-students-list'),
    
    path('manage/students/<uuid:pk>/', views.SuperAdminStudentViewSet.as_view({
        'get': 'retrieve',
    }), name='manage-students-detail'),
    
    path('manage/students/<uuid:pk>/toggle_status/', views.SuperAdminStudentViewSet.as_view({
        'post': 'toggle_status'
    }), name='manage-students-toggle-status'),
    
    # Super Admin Management - Announcements
    path('manage/announcements/', views.SuperAdminAnnouncementViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='manage-announcements-list'),
    
    path('manage/announcements/<uuid:pk>/', views.SuperAdminAnnouncementViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='manage-announcements-detail'),
    
    path('manage/announcements/<uuid:pk>/publish/', views.SuperAdminAnnouncementViewSet.as_view({
        'post': 'publish'
    }), name='manage-announcements-publish'),
    
    path('manage/announcements/<uuid:pk>/archive/', views.SuperAdminAnnouncementViewSet.as_view({
        'post': 'archive'
    }), name='manage-announcements-archive'),
    
    # Super Admin Management - Admin Tasks
    path('manage/admin-tasks/', views.SuperAdminTaskViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='manage-admin-tasks-list'),
    
    path('manage/admin-tasks/<uuid:pk>/', views.SuperAdminTaskViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='manage-admin-tasks-detail'),
    
    path('manage/admin-tasks/<uuid:pk>/update_status/', views.SuperAdminTaskViewSet.as_view({
        'post': 'update_status'
    }), name='manage-admin-tasks-update-status'),
    
    path('manage/admin-tasks/<uuid:pk>/add_reply/', views.SuperAdminTaskViewSet.as_view({
        'post': 'add_reply'
    }), name='manage-admin-tasks-add-reply'),
]


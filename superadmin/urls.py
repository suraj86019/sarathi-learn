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
]


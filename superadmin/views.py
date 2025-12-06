"""
Super Admin Views
API views for super admin operations
"""

from rest_framework import generics, viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from .models import School, Subject, Class, SchoolUser, Announcement, SystemSettings
from .serializers import (
    SchoolSerializer, SubjectSerializer, ClassSerializer,
    SchoolUserSerializer, AnnouncementSerializer, SystemSettingsSerializer
)
from .services import (
    UserManagementService,
    SchoolService,
    SubjectService,
    ClassService,
    AnnouncementService,
    SystemSettingsService
)
from .utils import (
    ResponseUtils,
    UserResponseUtils,
    SchoolResponseUtils,
    SubjectResponseUtils,
    ClassResponseUtils,
    AnnouncementResponseUtils
)
from users.permissions import IsSuperAdmin, IsAdmin


class SchoolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for School CRUD operations
    """
    queryset = School.objects.all().order_by('-created_at')
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'state', 'district', 'plan_type']
    search_fields = ['name', 'udise_code', 'city', 'district', 'state', 'principal_name']
    ordering_fields = ['name', 'created_at', 'total_students', 'total_teachers']
    
    def get_queryset(self):
        """
        Filter schools based on user role
        Super Admin: All schools
        Admin: Only their school
        """
        return SchoolService.get_filtered_schools_queryset(self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a school"""
        school = self.get_object()
        approved_school = SchoolService.approve_school(school, request.user)
        return Response(SchoolResponseUtils.format_school_approval_response(approved_school))
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a school"""
        school = self.get_object()
        suspended_school = SchoolService.suspend_school(school)
        return Response(SchoolResponseUtils.format_school_suspension_response(suspended_school))
    
    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Get all users of a school"""
        school = self.get_object()
        users = SchoolService.get_school_users(school)
        return Response(SchoolResponseUtils.format_school_users_response(users))
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get school statistics"""
        school = self.get_object()
        statistics = SchoolService.get_school_statistics(school)
        return Response(SchoolResponseUtils.format_school_statistics_response(statistics))


class SubjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subject CRUD operations
    """
    queryset = Subject.objects.all().order_by('name')
    serializer_class = SubjectSerializer
    permission_classes = [AllowAny]  # Public access to view subjects
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'category']
    
    def get_permissions(self):
        """
        Allow public read access, but require authentication for write operations
        """
        return SubjectService.get_subject_permissions(self.action)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get subjects grouped by category"""
        subjects_by_category = SubjectService.get_subjects_by_category()
        return Response(SubjectResponseUtils.format_subjects_by_category_response(subjects_by_category))


class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Class CRUD operations
    """
    queryset = Class.objects.all().order_by('school', 'grade', 'section')
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['school', 'grade', 'section', 'academic_year', 'is_active']
    search_fields = ['name', 'grade', 'section']
    ordering_fields = ['grade', 'section', 'current_students']
    
    def get_queryset(self):
        """Filter classes based on user's school"""
        return ClassService.get_filtered_classes_queryset(self.request.user)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students in a class"""
        class_obj = self.get_object()
        students = ClassService.get_class_students(class_obj)
        return Response(ClassResponseUtils.format_class_students_response(students))


class SchoolUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SchoolUser CRUD operations
    """
    queryset = SchoolUser.objects.all().order_by('-created_at')
    serializer_class = SchoolUserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['school', 'role_in_school', 'is_active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Announcement CRUD operations
    """
    queryset = Announcement.objects.all().order_by('-published_at', '-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'priority', 'is_active']
    search_fields = ['title', 'content']
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        AnnouncementService.create_announcement(serializer, self.request.user)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish an announcement"""
        announcement = self.get_object()
        published_announcement = AnnouncementService.publish_announcement(announcement)
        return Response(AnnouncementResponseUtils.format_announcement_publish_response(published_announcement))


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SystemSettings CRUD operations
    """
    queryset = SystemSettings.objects.all().order_by('setting_key')
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['setting_key', 'description']
    
    def perform_update(self, serializer):
        """Set updated_by to current user"""
        SystemSettingsService.update_system_setting(serializer, self.request.user)


class CreateAdminView(generics.CreateAPIView):
    """
    Create Admin User (Super Admin only)
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def post(self, request):
        """Create a new admin user"""
        try:
            data = request.data

            # Validate input data
            UserManagementService.validate_admin_creation_data(data)

            # Create admin user
            user, admin_profile, school = UserManagementService.create_admin_user(data)

            # Format response
            response_data = UserResponseUtils.format_admin_creation_response(user, admin_profile, school)

            return ResponseUtils.create_success_response(
                'Admin created successfully',
                response_data,
                status.HTTP_201_CREATED
            )

        except ValidationError as e:
            return ResponseUtils.create_error_response(str(e))
        except Exception as e:
            return ResponseUtils.create_error_response(f'Error creating admin: {str(e)}', status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateTeacherView(generics.CreateAPIView):
    """
    Create Teacher User (Super Admin or Admin)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Create a new teacher user"""
        try:
            data = request.data
            
            UserManagementService.validate_teacher_creation_data(data)

            user, teacher_profile, school, subjects = UserManagementService.create_teacher_user(data)

            response_data = UserResponseUtils.format_teacher_creation_response(user, teacher_profile, school, subjects)

            return ResponseUtils.create_success_response(
                'Teacher created successfully',
                response_data,
                status.HTTP_201_CREATED
            )

        except ValidationError as e:
            return ResponseUtils.create_error_response(str(e))
        except Exception as e:
            return ResponseUtils.create_error_response(f'Error creating teacher: {str(e)}', status.HTTP_500_INTERNAL_SERVER_ERROR)

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

from .models import School, Subject, Class, SchoolClass, SchoolUser, Announcement, SystemSettings
from .serializers import (
    SchoolSerializer, SubjectSerializer, ClassSerializer, SchoolClassSerializer,
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
    permission_classes = [AllowAny]  # Overridden below
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'category']
    
    def get_permissions(self):
        """
        Allow public read access, but require authentication + admin/super-admin for write operations
        """
        return SubjectService.get_subject_permissions(self.action)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get subjects grouped by category"""
        subjects_by_category = SubjectService.get_subjects_by_category()
        return Response(SubjectResponseUtils.format_subjects_by_category_response(subjects_by_category))


class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Class (Template) CRUD operations
    Classes are templates like Grade 1-12 with subjects
    """
    queryset = Class.objects.all().order_by('grade_number')
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['grade_number', 'is_active']
    search_fields = ['name', 'grade_number', 'description']
    ordering_fields = ['grade_number', 'name']
    
    @action(detail=True, methods=['get'])
    def subjects(self, request, pk=None):
        """Get all subjects for this class"""
        class_obj = self.get_object()
        subjects = class_obj.subjects.all()
        return Response(SubjectSerializer(subjects, many=True).data)
    
    @action(detail=True, methods=['post'])
    def add_subjects(self, request, pk=None):
        """Add subjects to this class"""
        class_obj = self.get_object()
        subject_ids = request.data.get('subject_ids', [])
        subjects = Subject.objects.filter(id__in=subject_ids)
        class_obj.subjects.add(
            *subjects,
            through_defaults={'is_mandatory': True, 'is_active': True, 'credits': 0, 'weekly_hours': 0}
        )
        return Response({'status': 'subjects added', 'count': len(subject_ids)})
    
    @action(detail=True, methods=['post'])
    def remove_subjects(self, request, pk=None):
        """Remove subjects from this class"""
        class_obj = self.get_object()
        subject_ids = request.data.get('subject_ids', [])
        subjects = Subject.objects.filter(id__in=subject_ids)
        class_obj.subjects.remove(*subjects)
        return Response({'status': 'subjects removed', 'count': len(subject_ids)})


class SchoolClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SchoolClass (School-Class Mapping) CRUD operations
    Maps which classes each school offers
    Example: School A -> Class 1, Class 2, Class 5
    """
    queryset = SchoolClass.objects.all().select_related('school', 'class_obj').order_by('school', 'class_obj__grade_number')
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['school', 'class_obj', 'section', 'academic_year', 'is_active']
    search_fields = ['school__name', 'class_obj__name', 'section']
    ordering_fields = ['class_obj__grade_number', 'section', 'academic_year']
    
    def get_queryset(self):
        """Filter school classes based on user's school"""
        user = self.request.user
        if hasattr(user, 'user_role') and user.user_role.role_type == 'SUPER_ADMIN':
            return SchoolClass.objects.all().select_related('school', 'class_obj')
        # For admins, filter by their schools
        school_ids = ClassService.get_user_school_ids(user)
        if school_ids:
            return SchoolClass.objects.filter(school_id__in=school_ids).select_related('school', 'class_obj')
        return SchoolClass.objects.none()
    
    def perform_create(self, serializer):
        """Admins can only create school classes for their schools"""
        school_id = serializer.validated_data.get('school').id
        ClassService.validate_user_can_manage_school(self.request.user, school_id)
        serializer.save()

    def perform_update(self, serializer):
        """Admins can only update school classes for their schools"""
        school = serializer.validated_data.get('school') or serializer.instance.school
        ClassService.validate_user_can_manage_school(self.request.user, school.id)
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def by_school(self, request):
        """Get all classes for a specific school"""
        school_id = request.query_params.get('school_id')
        if not school_id:
            return Response({'error': 'school_id is required'}, status=400)
        school_classes = self.get_queryset().filter(school_id=school_id)
        serializer = self.get_serializer(school_classes, many=True)
        return Response(serializer.data)


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


# ========== SUPER ADMIN MANAGEMENT VIEWSETS ==========

class SuperAdminSchoolViewSet(viewsets.ViewSet):
    """
    ViewSet for Super Admin school management operations
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def list(self, request):
        """
        Get paginated list of all schools
        GET /superadmin/manage/schools/
        Query params: page, page_size, status, state, district, search
        """
        from .services import SuperAdminSchoolService
        
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            filters = {
                'status': request.query_params.get('status'),
                'state': request.query_params.get('state'),
                'district': request.query_params.get('district'),
                'search': request.query_params.get('search'),
            }
            
            data = SuperAdminSchoolService.get_all_schools(page, page_size, filters)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get school details
        GET /superadmin/manage/schools/<id>/
        """
        from .services import SuperAdminSchoolService
        
        try:
            data = SuperAdminSchoolService.get_school_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'School not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request):
        """
        Create a new school
        POST /superadmin/manage/schools/
        """
        from .services import SuperAdminSchoolService
        
        try:
            data = request.data
            school = SuperAdminSchoolService.create_school(data)
            return Response({
                'success': True,
                'message': 'School created successfully',
                'data': SuperAdminSchoolService._format_school(school)
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, pk=None):
        """
        Update school information
        PUT /superadmin/manage/schools/<id>/
        """
        from .services import SuperAdminSchoolService
        
        try:
            data = request.data
            school = SuperAdminSchoolService.update_school(pk, data)
            return Response({
                'success': True,
                'message': 'School updated successfully',
                'data': SuperAdminSchoolService._format_school(school)
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update school status (activate, pause, suspend)
        POST /superadmin/manage/schools/<id>/update_status/
        Body: { "status": "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" }
        """
        from .services import SuperAdminSchoolService
        
        try:
            new_status = request.data.get('status')
            if not new_status:
                return Response({
                    'success': False,
                    'error': 'Status is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            school = SuperAdminSchoolService.update_school_status(pk, new_status, request.user)
            return Response({
                'success': True,
                'message': f'School status updated to {new_status}',
                'data': SuperAdminSchoolService._format_school(school)
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def teachers(self, request, pk=None):
        """
        Get paginated teachers for a school
        GET /superadmin/manage/schools/<id>/teachers/
        Query params: page, page_size, search
        """
        from .services import SuperAdminSchoolService
        
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            search = request.query_params.get('search')
            
            data = SuperAdminSchoolService.get_school_teachers(pk, page, page_size, search)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """
        Get paginated students for a school
        GET /superadmin/manage/schools/<id>/students/
        Query params: page, page_size, search
        """
        from .services import SuperAdminSchoolService
        
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            search = request.query_params.get('search')
            
            data = SuperAdminSchoolService.get_school_students(pk, page, page_size, search)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def admins(self, request, pk=None):
        """
        Get paginated admins for a school
        GET /superadmin/manage/schools/<id>/admins/
        Query params: page, page_size, search
        """
        from .services import SuperAdminSchoolService
        
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            search = request.query_params.get('search')
            
            data = SuperAdminSchoolService.get_school_admins(pk, page, page_size, search)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def classes(self, request, pk=None):
        """
        Get all classes for a school
        GET /superadmin/manage/schools/<id>/classes/
        """
        from .services import SuperAdminSchoolService
        
        try:
            data = SuperAdminSchoolService.get_school_classes(pk)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        """
        Delete/deactivate a school
        DELETE /superadmin/manage/schools/<id>/
        """
        from .services import SuperAdminSchoolService
        
        try:
            SuperAdminSchoolService.delete_school(pk)
            return Response({
                'success': True,
                'message': 'School deactivated successfully'
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SuperAdminAdminViewSet(viewsets.ViewSet):
    """
    ViewSet for Super Admin admin management operations
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def list(self, request):
        """
        Get paginated list of all admins
        GET /superadmin/manage/admins/
        Query params: page, page_size, school_id, search, status
        """
        from .services import SuperAdminService
        
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            filters = {
                'school_id': request.query_params.get('school_id'),
                'search': request.query_params.get('search'),
                'status': request.query_params.get('status'),
            }
            
            data = SuperAdminService.get_all_admins(page, page_size, filters)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get admin details
        GET /superadmin/manage/admins/<id>/
        """
        from .services import SuperAdminService
        
        try:
            data = SuperAdminService.get_admin_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'Admin not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request):
        """
        Create a new admin
        POST /superadmin/manage/admins/
        """
        try:
            data = request.data
            
            # Validate input data
            UserManagementService.validate_admin_creation_data(data)
            
            # Create admin user
            user, admin_profile, schools = UserManagementService.create_admin_user(data)
            
            from .services import SuperAdminService
            admin_data = SuperAdminService._format_admin(admin_profile)
            
            return Response({
                'success': True,
                'message': 'Admin created successfully',
                'data': admin_data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle admin active status
        POST /superadmin/manage/admins/<id>/toggle_status/
        Body: { "is_active": true | false }
        """
        from .services import SuperAdminService
        
        try:
            is_active = request.data.get('is_active')
            if is_active is None:
                return Response({
                    'success': False,
                    'error': 'is_active is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            SuperAdminService.update_admin_status(pk, is_active)
            return Response({
                'success': True,
                'message': f'Admin {"activated" if is_active else "deactivated"} successfully'
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_schools(self, request, pk=None):
        """
        Update admin's school associations
        POST /superadmin/manage/admins/<id>/update_schools/
        Body: { "school_ids": ["uuid1", "uuid2"] }
        """
        from .services import SuperAdminService
        
        try:
            school_ids = request.data.get('school_ids', [])
            if not school_ids:
                return Response({
                    'success': False,
                    'error': 'At least one school_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            SuperAdminService.update_admin_schools(pk, school_ids)
            return Response({
                'success': True,
                'message': 'Admin schools updated successfully'
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        """
        Remove/deactivate an admin
        DELETE /superadmin/manage/admins/<id>/
        """
        from .services import SuperAdminService
        
        try:
            SuperAdminService.remove_admin(pk)
            return Response({
                'success': True,
                'message': 'Admin removed successfully'
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SuperAdminTeacherViewSet(viewsets.ViewSet):
    """ViewSet for Super Admin teacher management"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def list(self, request):
        """
        Get paginated list of all teachers
        GET /superadmin/manage/teachers/?page=1&page_size=12&search=...&school_id=...&status=...
        """
        from .services import SuperAdminTeacherService
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        
        filters = {
            'search': request.query_params.get('search'),
            'school_id': request.query_params.get('school_id'),
            'status': request.query_params.get('status'),
            'subject': request.query_params.get('subject'),
        }
        
        data = SuperAdminTeacherService.get_all_teachers(page, page_size, filters)
        return Response(data)
    
    def retrieve(self, request, pk=None):
        """
        Get detailed teacher information
        GET /superadmin/manage/teachers/<id>/
        """
        from .services import SuperAdminTeacherService
        
        try:
            data = SuperAdminTeacherService.get_teacher_detail(pk)
            return Response(data)
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle teacher active status
        POST /superadmin/manage/teachers/<id>/toggle_status/
        Body: { "is_active": true/false }
        """
        from .services import SuperAdminTeacherService
        
        try:
            is_active = request.data.get('is_active', True)
            SuperAdminTeacherService.toggle_teacher_status(pk, is_active)
            return Response({
                'success': True,
                'message': f'Teacher {"activated" if is_active else "deactivated"} successfully'
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SuperAdminStudentViewSet(viewsets.ViewSet):
    """ViewSet for Super Admin student management"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def list(self, request):
        """
        Get paginated list of all students
        GET /superadmin/manage/students/?page=1&page_size=12&search=...&school_id=...&status=...
        """
        from .services import SuperAdminStudentService
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        
        filters = {
            'search': request.query_params.get('search'),
            'school_id': request.query_params.get('school_id'),
            'class_id': request.query_params.get('class_id'),
            'status': request.query_params.get('status'),
        }
        
        data = SuperAdminStudentService.get_all_students(page, page_size, filters)
        return Response(data)
    
    def retrieve(self, request, pk=None):
        """
        Get detailed student information
        GET /superadmin/manage/students/<id>/
        """
        from .services import SuperAdminStudentService
        
        try:
            data = SuperAdminStudentService.get_student_detail(pk)
            return Response(data)
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle student active status
        POST /superadmin/manage/students/<id>/toggle_status/
        Body: { "is_active": true/false }
        """
        from .services import SuperAdminStudentService
        
        try:
            is_active = request.data.get('is_active', True)
            SuperAdminStudentService.toggle_student_status(pk, is_active)
            return Response({
                'success': True,
                'message': f'Student {"activated" if is_active else "deactivated"} successfully'
            })
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SuperAdminAnnouncementViewSet(viewsets.ViewSet):
    """ViewSet for Super Admin announcement management"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def list(self, request):
        """Get paginated list of announcements for the requesting user"""
        from .services import SuperAdminAnnouncementService
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        
        filters = {
            'search': request.query_params.get('search'),
            'status': request.query_params.get('status'),
            'priority': request.query_params.get('priority'),
        }
        
        # Pass the requesting user to filter announcements
        data = SuperAdminAnnouncementService.get_all_announcements(page, page_size, filters, user=request.user)
        return Response(data)
    
    def retrieve(self, request, pk=None):
        """Get detailed announcement information"""
        from .services import SuperAdminAnnouncementService
        
        try:
            data = SuperAdminAnnouncementService.get_announcement_detail(pk)
            return Response(data)
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    
    def create(self, request):
        """Create a new announcement"""
        from .services import SuperAdminAnnouncementService
        
        try:
            data = SuperAdminAnnouncementService.create_announcement(request.data, request.user)
            return Response({'success': True, 'announcement': data}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish an announcement"""
        from .services import SuperAdminAnnouncementService
        
        try:
            data = SuperAdminAnnouncementService.publish_announcement(pk)
            return Response({'success': True, 'announcement': data})
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive an announcement"""
        from .services import SuperAdminAnnouncementService
        
        try:
            data = SuperAdminAnnouncementService.archive_announcement(pk)
            return Response({'success': True, 'announcement': data})
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete an announcement"""
        from .services import SuperAdminAnnouncementService
        
        try:
            SuperAdminAnnouncementService.delete_announcement(pk)
            return Response({'success': True, 'message': 'Announcement deleted successfully'})
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SuperAdminTaskViewSet(viewsets.ViewSet):
    """ViewSet for Super Admin task management (tasks for admins only)"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def list(self, request):
        """Get paginated list of all admin tasks"""
        from .services import SuperAdminTaskService
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        
        filters = {
            'search': request.query_params.get('search'),
            'status': request.query_params.get('status'),
            'priority': request.query_params.get('priority'),
            'assigned_to': request.query_params.get('assigned_to'),
            'school_id': request.query_params.get('school_id'),
        }
        
        data = SuperAdminTaskService.get_all_tasks(page, page_size, filters)
        return Response(data)
    
    def retrieve(self, request, pk=None):
        """Get detailed task information with replies"""
        from .services import SuperAdminTaskService
        
        try:
            data = SuperAdminTaskService.get_task_detail(pk)
            return Response(data)
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    
    def create(self, request):
        """Create a new admin task"""
        from .services import SuperAdminTaskService
        
        try:
            data = SuperAdminTaskService.create_task(request.data, request.user)
            return Response({'success': True, 'task': data}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update task status"""
        from .services import SuperAdminTaskService
        
        try:
            status_value = request.data.get('status')
            if not status_value:
                return Response({'success': False, 'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
            data = SuperAdminTaskService.update_task_status(pk, status_value)
            return Response({'success': True, 'task': data})
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_reply(self, request, pk=None):
        """Add a reply to a task"""
        from .services import SuperAdminTaskService
        
        try:
            message = request.data.get('message')
            if not message:
                return Response({'success': False, 'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
            data = SuperAdminTaskService.add_task_reply(pk, message, request.user)
            return Response({'success': True, 'reply': data})
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete a task"""
        from .services import SuperAdminTaskService
        
        try:
            SuperAdminTaskService.delete_task(pk)
            return Response({'success': True, 'message': 'Task deleted successfully'})
        except ValidationError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

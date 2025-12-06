"""
Admin Views
API views for admin operations - notifications, user management, reports, tasks
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from .models import AdminProfile
from .serializers import (
    AdminProfileSerializer, NotificationSerializer, TaskSerializer,
    AdminDashboardSerializer, SchoolUserManagementSerializer,
    UserActionSerializer, AIQuotaUpdateSerializer, AnalyticsDataSerializer,
    StudentReportSerializer, TeacherReportSerializer, SchoolReportSerializer
)
from .services import (
    NotificationService, TaskService, UserManagementService,
    ReportService, AdminDashboardService
)
from .utils import (
    ResponseUtils, NotificationResponseUtils, TaskResponseUtils,
    UserManagementResponseUtils, ReportResponseUtils, DashboardResponseUtils
)
from users.permissions import IsAdmin
from users.models import User, ActivityLog
from superadmin.models import Class
from students.models import StudentProfile
from teachers.models import TeacherProfile


class AdminProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin Profile operations
    """
    queryset = AdminProfile.objects.all()
    serializer_class = AdminProfileSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """Filter to current user's admin profile"""
        return AdminProfile.objects.filter(user=self.request.user)


class NotificationViewSet(viewsets.ViewSet):
    """
    ViewSet for Notification management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def create_notification(self, request):
        """Create and send/schedule notifications"""
        try:
            serializer = NotificationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)

            # Validate that admin can only target schools they have access to (unless super admin)
            if not hasattr(request.user, 'user_role') or request.user.user_role.role_type != 'SUPER_ADMIN':
                target_schools = serializer.validated_data.get('target_schools', [])
                admin_school_ids = [str(s.id) for s in admin_profile.schools.all()]

                for school_id in target_schools:
                    if str(school_id) not in admin_school_ids:
                        return ResponseUtils.create_error_response(
                            f"You don't have access to school {school_id}. "
                            f"You can only send notifications to your assigned schools."
                        )

            result = NotificationService.create_notification(
                serializer.validated_data, admin_profile
            )

            return Response(NotificationResponseUtils.format_notification_creation_response(result))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def notification_history(self, request):
        """Get notification history"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Get announcements created by this admin
            from superadmin.models import Announcement
            announcements = Announcement.objects.filter(
                created_by=request.user
            ).prefetch_related('targets').order_by('-created_at')[:50]

            data = []
            for announcement in announcements:
                targets_info = []
                total_targets = 0

                for target in announcement.targets.all():
                    if target.school:
                        targets_info.append({
                            'type': 'school',
                            'name': target.school.name,
                            'roles': target.target_roles or ['ALL']
                        })
                        # Count users in school
                        user_count = target.get_target_users().count()
                        total_targets += user_count
                    elif target.user:
                        targets_info.append({
                            'type': 'user',
                            'name': target.user.get_full_name(),
                            'role': target.user.user_role.role_type
                        })
                        total_targets += 1

                data.append({
                    'id': str(announcement.id),
                    'title': announcement.title,
                    'content': announcement.content[:100] + '...' if len(announcement.content) > 100 else announcement.content,
                    'priority': announcement.priority,
                    'status': announcement.status,
                    'created_at': announcement.created_at,
                    'published_at': announcement.published_at,
                    'targets': targets_info,
                    'targets_count': len(targets_info),
                    'estimated_recipients': total_targets
                })

            return ResponseUtils.create_success_response(
                'Notification history retrieved successfully',
                {'notifications': data, 'count': len(data)}
            )

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['put', 'patch'])
    def update_notification(self, request, pk=None):
        """Update an existing notification"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            result = NotificationService.update_notification(
                pk, request.data, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Notification updated successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['post'])
    def send_notification(self, request, pk=None):
        """Send a draft notification immediately"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            notification_type = request.data.get('notification_type', 'EMAIL')
            
            result = NotificationService.send_notification(
                pk, notification_type, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                f"Notification sent to {result['total_sent']} users",
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['delete'])
    def delete_notification(self, request, pk=None):
        """Delete a notification"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            NotificationService.delete_notification(pk, admin_profile)
            
            return ResponseUtils.create_success_response(
                'Notification deleted successfully'
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class TaskViewSet(viewsets.ViewSet):
    """
    ViewSet for Task management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def create_task(self, request):
        """Create and assign tasks"""
        try:
            serializer = TaskSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)
            result = TaskService.create_task(serializer.validated_data, admin_profile)

            return Response(TaskResponseUtils.format_task_creation_response(result))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def task_history(self, request):
        """Get task creation history"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            # Get schools managed by admin
            admin_schools = admin_profile.schools.all()

            # Get recent homework assignments from admin's schools
            from students.models import Homework
            recent_tasks = Homework.objects.filter(
                student__school__in=admin_schools
            ).select_related(
                'student__user', 'student__school', 'subject', 'assigned_by__user'
            ).order_by('-assigned_date')[:50]

            data = []
            for task in recent_tasks:
                data.append({
                    'id': str(task.id),
                    'title': task.title,
                    'description': task.description[:100] + '...' if len(task.description) > 100 else task.description,
                    'type': 'HOMEWORK',
                    'assigned_to': task.student.user.get_full_name(),
                    'assigned_to_id': str(task.student.id),
                    'school': task.student.school.name if task.student.school else 'N/A',
                    'subject': task.subject.name if task.subject else 'N/A',
                    'assigned_by': task.assigned_by.user.get_full_name() if task.assigned_by else 'System',
                    'due_date': task.due_date,
                    'status': task.status,
                    'assigned_date': task.assigned_date
                })

            return ResponseUtils.create_success_response(
                'Task history retrieved successfully',
                {'tasks': data, 'count': len(data)}
            )

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class StudentManagementViewSet(viewsets.ViewSet):
    """
    ViewSet for Student Management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def add_student(self, request):
        """Add a new student to the school"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Basic validation
            required_fields = ['email', 'first_name', 'last_name', 'udise_student_id']
            for field in required_fields:
                if field not in request.data:
                    return ResponseUtils.create_error_response(f'{field} is required')

            # school_id is required if admin has multiple schools
            school_id = request.data.get('school_id')
            if admin_profile.schools.count() > 1 and not school_id:
                return ResponseUtils.create_error_response(
                    "school_id is required as you manage multiple schools"
                )

            user = UserManagementService.add_user_to_school(
                request.data, 'STUDENT', admin_profile, school_id
            )

            student_profile = user.student_profile
            response_data = UserManagementResponseUtils.format_user_creation_response(
                user, student_profile, 'STUDENT'
            )

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def list_students(self, request):
        """Get all students from all schools admin manages with pagination"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Get all students from all admin's schools
            students = StudentProfile.objects.filter(
                school__in=admin_profile.schools.all()
            ).select_related('user', 'current_class', 'school').order_by('school__name', 'user__first_name')

            # Search filter
            search = request.query_params.get('search', '')
            if search:
                students = students.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(udise_student_id__icontains=search) |
                    Q(roll_no__icontains=search)
                )

            # School filter (optional - for filtering within admin's schools)
            school_id = request.query_params.get('school_id')
            if school_id:
                students = students.filter(school_id=school_id)

            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            total_count = students.count()
            total_pages = (total_count + page_size - 1) // page_size

            start = (page - 1) * page_size
            end = start + page_size
            students_page = students[start:end]

            from students.serializers import StudentProfileSerializer
            serializer = StudentProfileSerializer(students_page, many=True)

            return ResponseUtils.create_success_response(
                f'Found {total_count} students',
                {
                    'students': serializer.data,
                    'pagination': {
                        'page': page,
                        'page_size': page_size,
                        'total_count': total_count,
                        'total_pages': total_pages,
                        'has_next': page < total_pages,
                        'has_previous': page > 1
                    }
                }
            )

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['post'])
    def perform_action(self, request, pk=None):
        """Perform action on a student (activate, deactivate, etc.)"""
        try:
            serializer = UserActionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)
            result = UserManagementService.perform_user_action(
                pk, serializer.validated_data['action'],
                serializer.validated_data.get('reason', ''), admin_profile
            )

            return Response(UserManagementResponseUtils.format_user_action_response(result))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class TeacherManagementViewSet(viewsets.ViewSet):
    """
    ViewSet for Teacher Management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def add_teacher(self, request):
        """Add a new teacher to the school"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Basic validation
            required_fields = ['email', 'first_name', 'last_name', 'employee_id']
            for field in required_fields:
                if field not in request.data:
                    return ResponseUtils.create_error_response(f'{field} is required')

            # school_id is required if admin has multiple schools
            school_id = request.data.get('school_id')
            if admin_profile.schools.count() > 1 and not school_id:
                return ResponseUtils.create_error_response(
                    "school_id is required as you manage multiple schools"
                )

            user = UserManagementService.add_user_to_school(
                request.data, 'TEACHER', admin_profile, school_id
            )

            teacher_profile = user.teacher_profile
            response_data = UserManagementResponseUtils.format_user_creation_response(
                user, teacher_profile, 'TEACHER'
            )

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def list_teachers(self, request):
        """Get all teachers from all schools admin manages with pagination"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Get all teachers from all admin's schools
            teachers = TeacherProfile.objects.filter(
                school__in=admin_profile.schools.all()
            ).select_related('user', 'school').order_by('school__name', 'user__first_name')

            # Search filter
            search = request.query_params.get('search', '')
            if search:
                teachers = teachers.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(employee_id__icontains=search)
                )

            # School filter (optional - for filtering within admin's schools)
            school_id = request.query_params.get('school_id')
            if school_id:
                teachers = teachers.filter(school_id=school_id)

            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            total_count = teachers.count()
            total_pages = (total_count + page_size - 1) // page_size

            start = (page - 1) * page_size
            end = start + page_size
            teachers_page = teachers[start:end]

            from teachers.serializers import TeacherProfileSerializer
            serializer = TeacherProfileSerializer(teachers_page, many=True)

            return ResponseUtils.create_success_response(
                f'Found {total_count} teachers',
                {
                    'teachers': serializer.data,
                    'pagination': {
                        'page': page,
                        'page_size': page_size,
                        'total_count': total_count,
                        'total_pages': total_pages,
                        'has_next': page < total_pages,
                        'has_previous': page > 1
                    }
                }
            )

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['post'])
    def perform_action(self, request, pk=None):
        """Perform action on a teacher (activate, deactivate, etc.)"""
        try:
            serializer = UserActionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)
            result = UserManagementService.perform_user_action(
                pk, serializer.validated_data['action'],
                serializer.validated_data.get('reason', ''), admin_profile
            )

            return Response(UserManagementResponseUtils.format_user_action_response(result))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class ReportViewSet(viewsets.ViewSet):
    """
    ViewSet for Report Generation
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def student_report(self, request):
        """Generate student report"""
        try:
            serializer = StudentReportSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)

            # school_id from request data
            school_id = serializer.validated_data.get('school_id')

            report_data = ReportService.generate_student_report(
                serializer.validated_data, admin_profile, school_id
            )

            return Response(ReportResponseUtils.format_student_report_response(report_data))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['post'])
    def teacher_report(self, request):
        """Generate teacher report"""
        try:
            serializer = TeacherReportSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)

            # school_id from request data
            school_id = serializer.validated_data.get('school_id')

            report_data = ReportService.generate_teacher_report(
                serializer.validated_data, admin_profile, school_id
            )

            return Response(ReportResponseUtils.format_teacher_report_response(report_data))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['post'])
    def school_report(self, request):
        """Generate school report"""
        try:
            serializer = SchoolReportSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)

            # school_id from request data
            school_id = serializer.validated_data.get('school_id')

            report_data = ReportService.generate_school_report(
                serializer.validated_data, admin_profile, school_id
            )

            return Response(ReportResponseUtils.format_school_report_response(report_data))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class AdminDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for Admin Dashboard
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get admin dashboard data"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Optional school_id from query params
            school_id = request.query_params.get('school_id')

            dashboard_data = AdminDashboardService.get_dashboard_data(admin_profile, school_id)

            return Response(DashboardResponseUtils.format_dashboard_response(dashboard_data))

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def schools(self, request):
        """Get schools that admin has access to with actual live data"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Get schools the admin manages
            from superadmin.models import School
            from admins.services import AdminDashboardService

            schools = admin_profile.schools.all()

            # Build response with actual counts from database (not cached model fields)
            schools_data = []
            for school in schools:
                # Get actual counts from database
                total_students, total_teachers, total_admins = AdminDashboardService._get_school_counts(school)
                
                schools_data.append({
                    'id': str(school.id),
                    'name': school.name,
                    'udise_code': school.udise_code,
                    'contact_email': school.contact_email,
                    'contact_phone': school.contact_phone,
                    'principal_name': school.principal_name,
                    'address': school.address,
                    'city': school.city,
                    'district': school.district,
                    'state': school.state,
                    'pincode': school.pincode,
                    'board': school.board,
                    'status': school.status,
                    'plan_type': school.plan_type,
                    'total_students': total_students,  # Actual count from DB
                    'total_teachers': total_teachers,  # Actual count from DB
                    'total_admins': total_admins,  # Actual count from DB
                    'ai_quota_limit': school.ai_quota_limit,
                    'ai_quota_used': school.ai_quota_used,
                    'ai_quota_percentage': school.ai_quota_percentage,
                    'created_at': school.created_at.isoformat() if school.created_at else None,
                })

            return Response({
                'success': True,
                'data': {
                    'schools': schools_data,
                    'count': len(schools_data)
                }
            })

        except AdminProfile.DoesNotExist:
            return ResponseUtils.create_error_response('Admin profile not found')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['get'])
    def school_teachers(self, request, pk=None):
        """Get all teachers for a specific school with detailed info"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            result = ReportService.get_school_teachers_detailed(pk, admin_profile)
            
            return Response({
                'success': True,
                'data': result
            })
            
        except AdminProfile.DoesNotExist:
            return ResponseUtils.create_error_response('Admin profile not found')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['get'])
    def school_students(self, request, pk=None):
        """Get all students for a specific school (simple list)"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            search = request.query_params.get('search', '')
            
            result = ReportService.get_school_students_list(pk, admin_profile, search)
            
            return Response({
                'success': True,
                'data': result
            })
            
        except AdminProfile.DoesNotExist:
            return ResponseUtils.create_error_response('Admin profile not found')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['get'])
    def teacher_detail(self, request, pk=None):
        """Get detailed teacher info for a school"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            teacher_id = request.query_params.get('teacher_id')
            
            if not teacher_id:
                return ResponseUtils.create_error_response('teacher_id is required')
            
            result = ReportService.get_teacher_detail_for_school(teacher_id, pk, admin_profile)
            
            return Response({
                'success': True,
                'data': result
            })
            
        except AdminProfile.DoesNotExist:
            return ResponseUtils.create_error_response('Admin profile not found')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class AIQuotaManagementViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Quota Management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def update_quota(self, request):
        """Update AI quota for a user"""
        try:
            serializer = AIQuotaUpdateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            admin_profile = AdminProfile.objects.get(user=request.user)

            # Update student quota
            student = StudentProfile.objects.get(
                id=serializer.validated_data['user_id'],
                school=admin_profile.school
            )

            old_quota = student.ai_quota_limit
            student.ai_quota_limit = serializer.validated_data['new_quota_limit']
            student.save()

            # Log activity
            ActivityLog.objects.create(
                user=admin_profile.user,
                action='UPDATE',
                description=f"Updated AI quota for {student.user.get_full_name()} from {old_quota} to {student.ai_quota_limit}. Reason: {serializer.validated_data.get('reason', 'N/A')}",
                target_type='StudentProfile',
                target_id=str(student.id)
            )

            return ResponseUtils.create_success_response(
                'AI quota updated successfully',
                {
                    'student_id': str(student.id),
                    'student_name': student.user.get_full_name(),
                    'old_quota': old_quota,
                    'new_quota': student.ai_quota_limit
                }
            )

        except StudentProfile.DoesNotExist:
            return ResponseUtils.create_error_response('Student not found in your school')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def quota_usage(self, request):
        """Get AI quota usage for the school"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            school = admin_profile.school

            # Get students with quota info
            students = StudentProfile.objects.filter(
                school=school
            ).select_related('user').order_by('-ai_quota_used')

            quota_data = []
            for student in students:
                quota_data.append({
                    'id': str(student.id),
                    'name': student.user.get_full_name(),
                    'quota_limit': student.ai_quota_limit,
                    'quota_used': student.ai_quota_used,
                    'quota_percentage': student.ai_quota_percentage,
                    'remaining_quota': max(0, student.ai_quota_limit - student.ai_quota_used)
                })

            return ResponseUtils.create_success_response(
                'AI quota usage retrieved successfully',
                {
                    'school_quota': {
                        'limit': school.ai_quota_limit,
                        'used': school.ai_quota_used,
                        'percentage': school.ai_quota_percentage
                    },
                    'students': quota_data,
                    'total_students': len(quota_data)
                }
            )

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class AnnouncementTargetViewSet(viewsets.ViewSet):
    """
    ViewSet for Announcement Target Management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['get'])
    def list_targets(self, request):
        """List announcement targets created by this admin"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            # Get targets for announcements created by this admin
            from superadmin.models import AnnouncementTarget
            targets = AnnouncementTarget.objects.filter(
                announcement__created_by=request.user
            ).select_related(
                'announcement', 'school', 'user'
            ).order_by('-created_at')[:100]

            from superadmin.serializers import AnnouncementTargetSerializer
            serializer = AnnouncementTargetSerializer(targets, many=True)

            return ResponseUtils.create_success_response(
                'Announcement targets retrieved successfully',
                {'targets': serializer.data, 'count': len(targets)}
            )

        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['get'])
    def target_details(self, request, pk=None):
        """Get detailed information about a specific target"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            from superadmin.models import AnnouncementTarget
            target = AnnouncementTarget.objects.get(
                id=pk,
                announcement__created_by=request.user
            )

            # Get the actual users this target will/would send to
            target_users = target.get_target_users()

            users_data = []
            for user in target_users[:50]:  # Limit to 50 for performance
                users_data.append({
                    'id': str(user.id),
                    'name': user.get_full_name(),
                    'email': user.email,
                    'phone': user.phone,
                    'role': user.user_role.role_type if hasattr(user, 'user_role') else None
                })

            return ResponseUtils.create_success_response(
                'Target details retrieved successfully',
                {
                    'target_id': str(target.id),
                    'announcement_title': target.announcement.title,
                    'target_type': target.target_type,  # Computed property
                    'school_name': target.school.name if target.school else None,
                    'user_name': target.user.get_full_name() if target.user else None,
                    'target_roles': target.target_roles,
                    'is_sent': target.is_sent,
                    'sent_at': target.sent_at,
                    'error_message': target.error_message,
                    'total_users': len(target_users),
                    'sample_users': users_data[:10]  # Show first 10 users
                }
            )

        except AnnouncementTarget.DoesNotExist:
            return ResponseUtils.create_error_response('Target not found')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['post'])
    def retry_send(self, request, pk=None):
        """Retry sending to a failed target"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)

            from superadmin.models import AnnouncementTarget
            target = AnnouncementTarget.objects.get(
                id=pk,
                announcement__created_by=request.user
            )

            if target.is_sent:
                return ResponseUtils.create_error_response('This target has already been sent')

            # Get notification type from request or default to EMAIL
            notification_type = request.data.get('notification_type', 'EMAIL')

            # Send to this specific target
            users = target.get_target_users()
            sent_count = NotificationService._send_to_users(
                users, target.announcement, notification_type
            )

            if sent_count > 0:
                target.is_sent = True
                target.sent_at = timezone.now()
                target.error_message = None
                target.save()

            return ResponseUtils.create_success_response(
                f'Successfully sent to {sent_count} users',
                {
                    'target_id': str(target.id),
                    'users_sent': sent_count,
                    'total_users': len(users)
                }
            )

        except AnnouncementTarget.DoesNotExist:
            return ResponseUtils.create_error_response('Target not found')
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class TeacherTaskViewSet(viewsets.ViewSet):
    """
    ViewSet for Teacher Task Management
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['post'])
    def create_task(self, request):
        """Create a task for a teacher"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            # Validate required fields
            required_fields = ['teacher_id', 'title']
            for field in required_fields:
                if field not in request.data:
                    return ResponseUtils.create_error_response(f'{field} is required')
            
            from .services import TeacherTaskService
            result = TeacherTaskService.create_teacher_task(request.data, admin_profile)
            
            return ResponseUtils.create_success_response(
                'Task created successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'], url_path='teacher/(?P<teacher_id>[^/.]+)')
    def get_teacher_tasks(self, request, teacher_id=None):
        """Get all tasks for a specific teacher"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            status_filter = request.query_params.get('status')
            
            from .services import TeacherTaskService
            tasks = TeacherTaskService.get_teacher_tasks(
                teacher_id, admin_profile, status_filter
            )
            
            return ResponseUtils.create_success_response(
                f'Found {len(tasks)} tasks',
                {'tasks': tasks, 'count': len(tasks)}
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['get'])
    def task_detail(self, request, pk=None):
        """Get detailed task info with all replies"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            from .services import TeacherTaskService
            task = TeacherTaskService.get_task_detail(pk, admin_profile)
            
            return ResponseUtils.create_success_response(
                'Task retrieved successfully',
                task
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['post'])
    def add_reply(self, request, pk=None):
        """Add a reply to a task (admin reply)"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            content = request.data.get('content')
            
            if not content:
                return ResponseUtils.create_error_response('Content is required')
            
            from .services import TeacherTaskService
            result = TeacherTaskService.add_task_reply(
                pk, content, request.user, 'ADMIN'
            )
            
            return ResponseUtils.create_success_response(
                'Reply added successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update task status"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            new_status = request.data.get('status')
            
            valid_statuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']
            if new_status not in valid_statuses:
                return ResponseUtils.create_error_response(
                    f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                )
            
            from .services import TeacherTaskService
            result = TeacherTaskService.update_task_status(
                pk, new_status, request.user, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                f'Task status updated to {new_status}',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'], url_path='teacher/(?P<teacher_id>[^/.]+)/calendar')
    def get_attendance_calendar(self, request, teacher_id=None):
        """Get teacher's attendance calendar for a specific month"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            # Get year and month from query params, default to current
            year = int(request.query_params.get('year', timezone.now().year))
            month = int(request.query_params.get('month', timezone.now().month))
            
            # Validate month
            if month < 1 or month > 12:
                return ResponseUtils.create_error_response('Invalid month')
            
            from .services import TeacherTaskService
            calendar_data = TeacherTaskService.get_teacher_attendance_calendar(
                teacher_id, admin_profile, year, month
            )
            
            return ResponseUtils.create_success_response(
                'Calendar retrieved successfully',
                calendar_data
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'], url_path='teacher/(?P<teacher_id>[^/.]+)/detail')
    def get_teacher_detail(self, request, teacher_id=None):
        """Get comprehensive teacher detail including tasks and attendance summary"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            # Get teacher profile
            teacher = TeacherProfile.objects.select_related(
                'user', 'school'
            ).prefetch_related(
                'teacher_subjects__subject',
                'class_assignments__school_class',
                'class_assignments__subject'
            ).get(id=teacher_id)
            
            # Verify access
            if not admin_profile.has_school_access(teacher.school):
                return ResponseUtils.create_error_response('Access denied', status_code=403)
            
            # Get subjects
            subjects = [
                {
                    'id': str(ts.subject.id),
                    'name': ts.subject.name,
                    'is_primary': ts.is_primary,
                    'years_teaching': ts.years_teaching
                }
                for ts in teacher.teacher_subjects.all()
            ]
            
            # Get classes
            classes = [
                {
                    'id': str(ca.id),  # Assignment ID
                    'class_id': str(ca.school_class.id) if ca.school_class else '',
                    'class_name': ca.school_class.full_name if ca.school_class else 'N/A',
                    'subject_id': str(ca.subject.id) if ca.subject else '',
                    'subject': ca.subject.name if ca.subject else 'N/A',
                    'academic_year': ca.academic_year
                }
                for ca in teacher.class_assignments.filter(is_active=True)
            ]
            
            # Get attendance summary (last 30 days)
            from teachers.models import Attendance
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            
            attendance_30_days = Attendance.objects.filter(
                marked_by=teacher,
                date__gte=thirty_days_ago
            ).values('date').annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status='PRESENT')),
                absent=Count('id', filter=Q(status='ABSENT'))
            ).order_by('-date')
            
            # Total attendance ever marked
            total_attendance = Attendance.objects.filter(marked_by=teacher).count()
            
            # Get tasks summary
            from teachers.models import TeacherTask
            tasks_summary = TeacherTask.objects.filter(teacher=teacher).aggregate(
                total=Count('id'),
                open=Count('id', filter=Q(status='OPEN')),
                in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
                completed=Count('id', filter=Q(status='COMPLETED')),
                closed=Count('id', filter=Q(status='CLOSED'))
            )
            
            # Get recent tasks
            from .services import TeacherTaskService
            recent_tasks = TeacherTask.objects.filter(
                teacher=teacher
            ).select_related('assigned_by', 'closed_by').prefetch_related(
                'replies__replied_by'
            ).order_by('-created_at')[:5]
            
            recent_tasks_data = [
                TeacherTaskService._format_task(task) for task in recent_tasks
            ]
            
            teacher_data = {
                'id': str(teacher.id),
                'user_id': str(teacher.user.id),
                'name': teacher.user.get_full_name(),
                'email': teacher.user.email,
                'phone': teacher.user.phone,
                'employee_id': teacher.employee_id,
                'qualification': teacher.qualification,
                'experience_years': teacher.experience_years,
                'specialization': teacher.specialization,
                'certifications': teacher.certifications,
                'is_active': teacher.user.is_active,
                'status': teacher.user.status,
                'school': {
                    'id': str(teacher.school.id),
                    'name': teacher.school.name
                },
                'subjects': subjects,
                'subjects_count': len(subjects),
                'classes': classes,
                'classes_count': len(classes),
                'permissions': {
                    'can_mark_attendance': teacher.can_mark_attendance,
                    'can_assign_homework': teacher.can_assign_homework,
                    'can_grade_assignments': teacher.can_grade_assignments
                },
                'attendance_class': {
                    'id': str(teacher.attendance_class.id) if teacher.attendance_class else None,
                    'name': teacher.attendance_class.full_name if teacher.attendance_class else None,
                } if teacher.attendance_class else None,
                'attendance_summary': {
                    'total_marked': total_attendance,
                    'last_30_days': list(attendance_30_days),
                    'last_30_days_total': sum(a['total'] for a in attendance_30_days)
                },
                'tasks_summary': tasks_summary,
                'recent_tasks': recent_tasks_data,
                'created_at': teacher.created_at.isoformat()
            }
            
            return ResponseUtils.create_success_response(
                'Teacher detail retrieved successfully',
                teacher_data
            )
            
        except TeacherProfile.DoesNotExist:
            return ResponseUtils.create_error_response('Teacher not found', status_code=404)
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['put', 'patch'], url_path='teacher/(?P<teacher_id>[^/.]+)/update')
    def update_teacher(self, request, teacher_id=None):
        """Update teacher profile including permissions"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            from .services import TeacherTaskService
            result = TeacherTaskService.update_teacher_profile(
                teacher_id, request.data, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Teacher updated successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['put'], url_path='teacher/(?P<teacher_id>[^/.]+)/subjects')
    def update_teacher_subjects(self, request, teacher_id=None):
        """Update teacher's subjects"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            subjects_data = request.data.get('subjects', [])
            
            if not subjects_data:
                return ResponseUtils.create_error_response('subjects is required')
            
            from .services import TeacherTaskService
            result = TeacherTaskService.update_teacher_subjects(
                teacher_id, subjects_data, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Subjects updated successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['put'], url_path='teacher/(?P<teacher_id>[^/.]+)/classes')
    def update_teacher_classes(self, request, teacher_id=None):
        """Update teacher's class assignments"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            classes_data = request.data.get('classes', [])
            
            if not classes_data:
                return ResponseUtils.create_error_response('classes is required')
            
            from .services import TeacherTaskService
            result = TeacherTaskService.update_teacher_classes(
                teacher_id, classes_data, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Classes updated successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def available_subjects(self, request):
        """Get all available subjects for assignment"""
        try:
            from .services import TeacherTaskService
            subjects = TeacherTaskService.get_available_subjects()
            
            return ResponseUtils.create_success_response(
                'Subjects retrieved successfully',
                {'subjects': subjects, 'count': len(subjects)}
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'], url_path='available-classes/(?P<school_id>[^/.]+)')
    def available_classes(self, request, school_id=None):
        """Get available classes for a school"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            
            from .services import TeacherTaskService
            classes = TeacherTaskService.get_available_classes(school_id, admin_profile)
            
            return ResponseUtils.create_success_response(
                'Classes retrieved successfully',
                {'classes': classes, 'count': len(classes)}
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['post'], url_path='teacher/(?P<teacher_id>[^/.]+)/attendance')
    def mark_teacher_attendance(self, request, teacher_id=None):
        """Mark teacher attendance for a specific date"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            date = request.data.get('date')
            
            if not date:
                return ResponseUtils.create_error_response('date is required')
            
            from .services import TeacherTaskService
            result = TeacherTaskService.mark_teacher_attendance(
                teacher_id, date, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Teacher attendance marked successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))


class AttendanceViewSet(viewsets.ViewSet):
    """ViewSet for managing student attendance"""
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['get'], url_path='class/(?P<class_id>[^/.]+)')
    def get_class_students(self, request, class_id=None):
        """Get students for a class with attendance status for a date"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            date = request.query_params.get('date')
            
            if not date:
                from datetime import date as dt
                date = dt.today().strftime('%Y-%m-%d')
            
            from .services import AttendanceService
            result = AttendanceService.get_class_students_for_attendance(
                class_id, date, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Class students retrieved successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['post'], url_path='mark/(?P<class_id>[^/.]+)')
    def mark_attendance(self, request, class_id=None):
        """Mark or update attendance for a class"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            date = request.data.get('date')
            attendance_data = request.data.get('attendance', [])
            
            if not date:
                return ResponseUtils.create_error_response('date is required')
            
            if not attendance_data:
                return ResponseUtils.create_error_response('attendance data is required')
            
            from .services import AttendanceService
            result = AttendanceService.mark_attendance(
                class_id, date, attendance_data, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                f"Attendance marked successfully. Created: {result['created']}, Updated: {result['updated']}",
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'], url_path='summary/(?P<class_id>[^/.]+)')
    def attendance_summary(self, request, class_id=None):
        """Get attendance summary for a class"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            if not start_date or not end_date:
                from datetime import date, timedelta
                end_date = date.today()
                start_date = end_date - timedelta(days=30)
                start_date = start_date.strftime('%Y-%m-%d')
                end_date = end_date.strftime('%Y-%m-%d')
            
            from .services import AttendanceService
            result = AttendanceService.get_attendance_summary(
                class_id, start_date, end_date, admin_profile
            )
            
            return ResponseUtils.create_success_response(
                'Attendance summary retrieved successfully',
                result
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))

    @action(detail=False, methods=['get'])
    def classes_for_attendance(self, request):
        """Get all classes available for marking attendance"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            school_id = request.query_params.get('school_id')
            
            # Get classes from admin's schools
            schools = admin_profile.schools.all()
            if school_id:
                schools = schools.filter(id=school_id)
            
            classes_data = []
            for school in schools:
                classes = Class.objects.filter(school=school, is_active=True).order_by('grade', 'section')
                for cls in classes:
                    # Count students in class
                    from students.models import StudentProfile
                    student_count = StudentProfile.objects.filter(
                        current_class=cls, user__is_active=True
                    ).count()
                    
                    classes_data.append({
                        'id': str(cls.id),
                        'name': cls.full_name,
                        'grade': cls.grade,
                        'section': cls.section,
                        'school_id': str(school.id),
                        'school_name': school.name,
                        'student_count': student_count,
                        'academic_year': cls.academic_year
                    })
            
            return ResponseUtils.create_success_response(
                'Classes retrieved successfully',
                {'classes': classes_data, 'count': len(classes_data)}
            )
            
        except Exception as e:
            return ResponseUtils.create_error_response(str(e))
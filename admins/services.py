"""
Admin Services
Business logic for admin operations - notifications, user management, reports, tasks
"""

from django.core.exceptions import ValidationError
from django.db import transaction, models
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
import logging

from .models import AdminProfile, AdminSchool
from users.models import User, UserRole, ActivityLog
from students.models import StudentProfile, Homework
from teachers.models import TeacherProfile, Attendance
from superadmin.models import School, Subject, Class, Announcement, AnnouncementTarget
from ai_machine.models import AIChatSession, AIUsageMetrics

logger = logging.getLogger(__name__)


class NotificationService:
    """Service class for notification management"""

    @staticmethod
    def create_notification(data, admin_profile):
        """
        Create announcement and targets for notifications

        Args:
            data (dict): Notification data
            admin_profile: AdminProfile instance

        Returns:
            dict: Notification result
        """
        try:
            with transaction.atomic():
                # Create the announcement
                announcement = Announcement.objects.create(
                    title=data['title'],
                    content=data['message'],
                    priority=data.get('priority', 'MEDIUM'),
                    status='DRAFT',
                    created_by=admin_profile.user
                )

                # Create targets based on target_type
                targets_created = NotificationService._create_targets(
                    announcement, data, admin_profile
                )

                if not targets_created:
                    raise ValidationError("No valid targets created for the notification")

                # Handle scheduling
                scheduled_date = data.get('scheduled_date')
                # Treat empty string as None
                if scheduled_date == '' or scheduled_date is None:
                    scheduled_date = None
                total_target_users = 0

                if scheduled_date:
                    # Schedule for later - mark announcement as scheduled
                    announcement.published_at = scheduled_date
                    announcement.save()
                else:
                    # Send immediately
                    notification_type = data.get('notification_type', 'IN_APP')
                    
                    if notification_type == 'IN_APP':
                        # In-app only - just publish for bell notification, no email/SMS
                        total_target_users = NotificationService._count_target_users(announcement)
                    else:
                        # Send via email/SMS
                        total_target_users = NotificationService._send_to_all_targets(
                            announcement, notification_type
                        )
                    announcement.publish()

                return {
                    'announcement_id': str(announcement.id),
                    'targets_created': len(targets_created),
                    'total_target_users': total_target_users,
                    'scheduled': scheduled_date is not None,
                    'scheduled_date': scheduled_date
                }

        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            raise ValidationError(f"Failed to create notification: {str(e)}")

    @staticmethod
    def update_notification(notification_id, data, admin_profile):
        """
        Update an existing notification/announcement
        
        Args:
            notification_id (str): UUID of the notification
            data (dict): Updated notification data
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Update result
        """
        try:
            announcement = Announcement.objects.get(id=notification_id)
            
            # Verify admin owns this notification
            if announcement.created_by != admin_profile.user:
                raise ValidationError("You don't have permission to edit this notification")
            
            # Can only edit if not published
            if announcement.status == 'PUBLISHED':
                raise ValidationError("Cannot edit a published notification")
            
            with transaction.atomic():
                # Update announcement fields
                if 'title' in data:
                    announcement.title = data['title']
                if 'message' in data:
                    announcement.content = data['message']
                if 'priority' in data:
                    announcement.priority = data['priority']
                
                # Handle scheduling
                scheduled_date = data.get('scheduled_date')
                if scheduled_date == '' or scheduled_date is None:
                    scheduled_date = None
                
                if scheduled_date:
                    announcement.published_at = scheduled_date
                else:
                    announcement.published_at = None
                
                announcement.save()
                
                # Update targets if provided
                if 'target_schools' in data or 'target_users' in data:
                    # Delete existing targets
                    announcement.targets.all().delete()
                    
                    # Create new targets
                    NotificationService._create_targets(announcement, data, admin_profile)
                
                return {
                    'announcement_id': str(announcement.id),
                    'status': announcement.status,
                    'scheduled': scheduled_date is not None
                }
                
        except Announcement.DoesNotExist:
            raise ValidationError("Notification not found")
        except Exception as e:
            logger.error(f"Error updating notification: {str(e)}")
            raise ValidationError(f"Failed to update notification: {str(e)}")

    @staticmethod
    def send_notification(notification_id, notification_type, admin_profile):
        """
        Send a draft notification immediately
        
        Args:
            notification_id (str): UUID of the notification
            notification_type (str): EMAIL, SMS, or BOTH
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Send result
        """
        try:
            announcement = Announcement.objects.get(id=notification_id)
            
            # Verify admin owns this notification
            if announcement.created_by != admin_profile.user:
                raise ValidationError("You don't have permission to send this notification")
            
            if announcement.status == 'PUBLISHED':
                raise ValidationError("Notification already published")
            
            # Send to all targets
            total_sent = NotificationService._send_to_all_targets(
                announcement, notification_type
            )
            
            # Publish the announcement
            announcement.publish()
            
            return {
                'announcement_id': str(announcement.id),
                'total_sent': total_sent,
                'status': 'PUBLISHED'
            }
            
        except Announcement.DoesNotExist:
            raise ValidationError("Notification not found")
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            raise ValidationError(f"Failed to send notification: {str(e)}")

    @staticmethod
    def delete_notification(notification_id, admin_profile):
        """
        Delete a notification
        
        Args:
            notification_id (str): UUID of the notification
            admin_profile: AdminProfile instance
        """
        try:
            announcement = Announcement.objects.get(id=notification_id)
            
            # Verify admin owns this notification
            if announcement.created_by != admin_profile.user:
                raise ValidationError("You don't have permission to delete this notification")
            
            announcement.delete()
            return {'deleted': True}
            
        except Announcement.DoesNotExist:
            raise ValidationError("Notification not found")
        except Exception as e:
            logger.error(f"Error deleting notification: {str(e)}")
            raise ValidationError(f"Failed to delete notification: {str(e)}")

    @staticmethod
    def _create_targets(announcement, data, admin_profile):
        """Create AnnouncementTarget instances based on targeting logic"""
        targets_created = []
        target_type = data.get('target_type')

        # Schools targeting
        school_ids = data.get('target_schools', [])
        target_roles = data.get('school_target_roles', [])

        for school_id in school_ids:
            try:
                school = School.objects.get(id=school_id)
                target = AnnouncementTarget.objects.create(
                    announcement=announcement,
                    school=school,
                    target_roles=target_roles if target_roles else []
                )
                targets_created.append(target)
            except School.DoesNotExist:
                logger.warning(f"School {school_id} not found, skipping")

        # Specific users targeting
        user_ids = data.get('target_users', [])
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id, is_active=True)
                target = AnnouncementTarget.objects.create(
                    announcement=announcement,
                    user=user
                )
                targets_created.append(target)
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found or inactive, skipping")

        # Legacy support for backward compatibility
        if not targets_created and 'target_audience' in data:
            # Handle old format
            targets_created = NotificationService._create_legacy_targets(
                announcement, data, admin_profile
            )

        return targets_created

    @staticmethod
    def _create_legacy_targets(announcement, data, admin_profile):
        """Handle legacy targeting format for backward compatibility"""
        targets_created = []
        target_audience = data.get('target_audience')

        # Get school from data or use admin's primary school
        school_id = data.get('school_id')
        if school_id:
            school = School.objects.filter(id=school_id).first()
            if not school or not admin_profile.has_school_access(school):
                raise ValidationError("Invalid school or no access")
        else:
            school = admin_profile.get_primary_school()
            if not school:
                raise ValidationError("No school available for admin")

        if target_audience == 'ALL_STUDENTS':
            target = AnnouncementTarget.objects.create(
                announcement=announcement,
                school=school,
                target_roles=['STUDENT']
            )
            targets_created.append(target)

        elif target_audience == 'ALL_TEACHERS':
            target = AnnouncementTarget.objects.create(
                announcement=announcement,
                school=school,
                target_roles=['TEACHER']
            )
            targets_created.append(target)

        elif target_audience == 'SPECIFIC_CLASS':
            # For specific class, we need to create user-level targets
            class_id = data.get('target_class_id')
            if class_id:
                students = User.objects.filter(
                    student_profile__current_class_id=class_id,
                    user_role__role_type='STUDENT',
                    is_active=True
                )
                for student in students:
                    target = AnnouncementTarget.objects.create(
                        announcement=announcement,
                        user=student
                    )
                    targets_created.append(target)

        elif target_audience == 'SPECIFIC_USERS':
            user_ids = data.get('target_user_ids', [])
            for user_id in user_ids:
                try:
                    user = User.objects.get(id=user_id, is_active=True)
                    target = AnnouncementTarget.objects.create(
                        announcement=announcement,
                        user=user
                    )
                    targets_created.append(target)
                except User.DoesNotExist:
                    pass

        elif target_audience == 'ALL_SCHOOL':
            target = AnnouncementTarget.objects.create(
                announcement=announcement,
                school=school,
                target_roles=[]  # Empty means all roles
            )
            targets_created.append(target)

        return targets_created

    @staticmethod
    def _count_target_users(announcement):
        """Count total target users without sending (for IN_APP notifications)"""
        total_count = 0

        for target in announcement.targets.all():
            try:
                users = target.get_target_users()
                total_count += len(users)
                # Mark as delivered (in-app) without actually sending external notifications
                target.is_sent = True
                target.sent_at = timezone.now()
                target.save()
            except Exception as e:
                logger.error(f"Error counting users for target {target.id}: {str(e)}")

        return total_count

    @staticmethod
    def _send_to_all_targets(announcement, notification_type):
        """Send notification to all targets"""
        total_sent = 0

        for target in announcement.targets.all():
            try:
                users = target.get_target_users()
                sent_count = NotificationService._send_to_users(
                    users, announcement, notification_type
                )
                target.is_sent = True
                target.sent_at = timezone.now()
                target.save()
                total_sent += sent_count

            except Exception as e:
                target.error_message = str(e)
                target.save()
                logger.error(f"Error sending to target {target.id}: {str(e)}")

        return total_sent

    @staticmethod
    def _send_to_users(users, announcement, notification_type):
        """Send notification to a list of users"""
        sent_count = 0

        for user in users:
            try:
                if notification_type in ['EMAIL', 'BOTH']:
                    NotificationService._send_email_notification(user, announcement)
                if notification_type in ['SMS', 'BOTH']:
                    NotificationService._send_sms_notification(user, announcement)
                sent_count += 1
            except Exception as e:
                logger.error(f"Error sending to user {user.id}: {str(e)}")

        return sent_count

    @staticmethod
    def _send_email_notification(user, announcement):
        """Send email notification"""
        try:
            send_mail(
                subject=announcement.title,
                message=announcement.content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
        except Exception as e:
            logger.error(f"Error sending email to {user.email}: {str(e)}")

    @staticmethod
    def _send_sms_notification(user, announcement):
        """Send SMS notification (placeholder for SMS service integration)"""
        # TODO: Integrate with SMS service like Twilio, AWS SNS, etc.
        logger.info(f"SMS to {user.phone}: {announcement.title}")

    @staticmethod
    def get_user_notifications(user, days=7):
        """
        Get notifications for a user from the last N days based on their role.
        
        - Admin: User-level + School-level notifications for schools they manage
        - Teacher: User-level + School-level notifications for their school
        - Student: User-level + School-level notifications for their school
        
        Args:
            user: User instance
            days: Number of days to look back (default 7)
            
        Returns:
            list: List of notification dictionaries
        """
        from datetime import timedelta
        from django.db.models import Q
        from superadmin.models import Announcement, AnnouncementTarget
        from teachers.models import TeacherProfile
        from students.models import StudentProfile
        
        # Calculate date threshold
        date_threshold = timezone.now() - timedelta(days=days)
        
        # Get user's role
        user_role = getattr(user, 'user_role', None)
        role_type = user_role.role_type if user_role else None
        
        # Build query for announcements
        # Start with user-level notifications (targeted directly at this user)
        user_targets = AnnouncementTarget.objects.filter(user=user)
        
        # Get school-level notifications based on role
        school_targets = AnnouncementTarget.objects.none()
        user_schools = []
        
        def filter_by_role(queryset, role):
            """Filter targets by role - SQLite compatible"""
            # Get all targets for the school(s) first
            all_targets = list(queryset)
            filtered_ids = []
            
            for target in all_targets:
                # Include if target_roles is empty (all roles) or contains the user's role
                if not target.target_roles or role in target.target_roles:
                    filtered_ids.append(target.id)
            
            return AnnouncementTarget.objects.filter(id__in=filtered_ids)
        
        if role_type == 'ADMIN':
            # Admin: Get all schools they manage
            try:
                admin_profile = AdminProfile.objects.get(user=user)
                user_schools = list(admin_profile.schools.all())
                
                if user_schools:
                    # Get school-level notifications filtered by role
                    base_targets = AnnouncementTarget.objects.filter(school__in=user_schools)
                    school_targets = filter_by_role(base_targets, 'ADMIN')
            except AdminProfile.DoesNotExist:
                pass
                
        elif role_type == 'TEACHER':
            # Teacher: Get their school
            try:
                teacher_profile = TeacherProfile.objects.select_related('school').get(user=user)
                if teacher_profile.school:
                    user_schools = [teacher_profile.school]
                    
                    # Get school-level notifications filtered by role
                    base_targets = AnnouncementTarget.objects.filter(school=teacher_profile.school)
                    school_targets = filter_by_role(base_targets, 'TEACHER')
            except TeacherProfile.DoesNotExist:
                pass
                
        elif role_type == 'STUDENT':
            # Student: Get their school
            try:
                student_profile = StudentProfile.objects.select_related('school').get(user=user)
                if student_profile.school:
                    user_schools = [student_profile.school]
                    
                    # Get school-level notifications filtered by role
                    base_targets = AnnouncementTarget.objects.filter(school=student_profile.school)
                    school_targets = filter_by_role(base_targets, 'STUDENT')
            except StudentProfile.DoesNotExist:
                pass
        
        # Combine user-level and school-level targets
        all_target_ids = set(user_targets.values_list('announcement_id', flat=True)) | \
                         set(school_targets.values_list('announcement_id', flat=True))
        
        # Get published announcements from last N days
        announcements = Announcement.objects.filter(
            id__in=all_target_ids,
            status='PUBLISHED',
            created_at__gte=date_threshold
        ).order_by('-created_at')
        
        # Format response
        notifications = []
        for announcement in announcements:
            # Determine target type for this notification
            target_type = 'user'
            target_school = None
            
            # Check if this is a school-level notification
            school_target = announcement.targets.filter(school__isnull=False).first()
            if school_target and school_target.school in user_schools:
                target_type = 'school'
                target_school = school_target.school.name
            
            notifications.append({
                'id': str(announcement.id),
                'title': announcement.title,
                'content': announcement.content,
                'priority': announcement.priority,
                'target_type': target_type,
                'target_school': target_school,
                'created_at': announcement.created_at.isoformat(),
                'published_at': announcement.published_at.isoformat() if announcement.published_at else None,
                'created_by': announcement.created_by.get_full_name() if announcement.created_by else 'System'
            })
        
        return {
            'notifications': notifications,
            'count': len(notifications),
            'user_role': role_type,
            'schools': [{'id': str(s.id), 'name': s.name} for s in user_schools]
        }


class TaskService:
    """Service class for task management"""

    @staticmethod
    def create_task(data, admin_profile, school_id=None):
        """
        Create and assign tasks to students or teachers

        Args:
            data (dict): Task data
            admin_profile: AdminProfile instance
            school_id: Optional school ID (required for admins with multiple schools)

        Returns:
            dict: Task creation result
        """
        try:
            assigned_to_role = data['assigned_to_role']
            assigned_to_ids = data['assigned_to_ids']

            # Get school from parameter or data
            school = TaskService._get_school_for_task(admin_profile, school_id or data.get('school_id'))

            # Validate users exist and belong to school
            users = TaskService._validate_task_assignees(
                assigned_to_ids, assigned_to_role, school
            )

            if not users:
                raise ValidationError("No valid users found for task assignment")

            tasks_created = []

            if assigned_to_role == 'STUDENT':
                tasks_created = TaskService._create_student_tasks(data, users, admin_profile)
            elif assigned_to_role == 'TEACHER':
                tasks_created = TaskService._create_teacher_tasks(data, users, admin_profile)

            return {
                'tasks_created': len(tasks_created),
                'assigned_to_count': len(users),
                'task_type': data['task_type']
            }

        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            raise ValidationError(f"Failed to create task: {str(e)}")

    @staticmethod
    def _get_school_for_task(admin_profile, school_id=None):
        """Get school for task, validating admin has access"""
        if school_id:
            school = School.objects.filter(id=school_id).first()
            if not school or not admin_profile.has_school_access(school):
                raise ValidationError("Invalid school or no access")
            return school
        else:
            school = admin_profile.get_primary_school()
            if not school:
                raise ValidationError("No school available for admin. Please specify school_id.")
            return school

    @staticmethod
    def _validate_task_assignees(user_ids, role_type, school):
        """Validate that users exist and belong to the school"""
        if role_type == 'STUDENT':
            return User.objects.filter(
                id__in=user_ids,
                user_role__role_type='STUDENT',
                student_profile__school=school,
                is_active=True
            ).select_related('student_profile')
        elif role_type == 'TEACHER':
            return User.objects.filter(
                id__in=user_ids,
                user_role__role_type='TEACHER',
                teacher_profile__school=school,
                is_active=True
            ).select_related('teacher_profile')
        return []

    @staticmethod
    def _create_student_tasks(data, students, admin_profile):
        """Create homework/assignments for students"""
        tasks = []
        subject_id = data.get('subject_id')

        for student in students:
            homework = Homework.objects.create(
                student=student.student_profile,
                assigned_by=admin_profile,  # This might need adjustment based on model
                subject_id=subject_id,
                title=data['title'],
                description=data['description'],
                due_date=data['due_date'],
                status='ASSIGNED'
            )
            tasks.append(homework)

            # Log activity
            ActivityLog.objects.create(
                user=admin_profile.user,
                action='CREATE',
                description=f"Assigned {data['task_type']} to {student.get_full_name()}",
                target_type='Homework',
                target_id=str(homework.id)
            )

        return tasks

    @staticmethod
    def _create_teacher_tasks(data, teachers, admin_profile):
        """Create tasks for teachers (could be various types)"""
        # This is a placeholder - teacher task model might need to be created
        # For now, we'll log the task creation
        tasks = []
        for teacher in teachers:
            # Log activity for teacher task
            ActivityLog.objects.create(
                user=admin_profile.user,
                action='CREATE',
                description=f"Assigned {data['task_type']} to teacher {teacher.get_full_name()}",
                target_type='TeacherTask',
                target_id=str(teacher.id)
            )
            tasks.append(teacher)
        return tasks


class UserManagementService:
    """Service class for user management operations"""

    @staticmethod
    def get_school_for_admin(admin_profile, school_id=None):
        """
        Get and validate school for admin operations

        Args:
            admin_profile: AdminProfile instance
            school_id: Optional specific school ID

        Returns:
            School: Validated school instance
        """
        if school_id:
            school = School.objects.filter(id=school_id).first()
            if not school or not admin_profile.has_school_access(school):
                raise ValidationError("Invalid school or no access to this school")
            return school
        else:
            school = admin_profile.get_primary_school()
            if not school:
                raise ValidationError("No school available. Please specify school_id.")
            return school

    @staticmethod
    def add_user_to_school(user_data, role_type, admin_profile, school_id=None):
        """
        Add a user to the school with specified role

        Args:
            user_data (dict): User creation data
            role_type (str): Role type (STUDENT, TEACHER)
            admin_profile: AdminProfile instance
            school_id: Optional school ID (required if admin has multiple schools)

        Returns:
            User: Created user instance
        """
        try:
            # Get school
            school = UserManagementService.get_school_for_admin(
                admin_profile, school_id or user_data.get('school_id')
            )

            with transaction.atomic():
                # Create user
                user = User.objects.create(
                    email=user_data['email'],
                    phone=user_data.get('phone'),
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    date_of_birth=user_data.get('date_of_birth'),
                    gender=user_data.get('gender'),
                    address=user_data.get('address'),
                    city=user_data.get('city'),
                    district=user_data.get('district'),
                    state=user_data.get('state'),
                    pincode=user_data.get('pincode'),
                    status='ACTIVE',
                    is_active=True
                )

                # Set password for teachers
                if role_type == 'TEACHER':
                    user.set_password(user_data.get('password', 'TempPass123!'))
                    user.is_staff = True
                user.save()

                # Create user role
                UserRole.objects.create(user=user, role_type=role_type)

                # Create profile and school association
                if role_type == 'STUDENT':
                    UserManagementService._create_student_profile(user, user_data, school)
                elif role_type == 'TEACHER':
                    UserManagementService._create_teacher_profile(user, user_data, school)

                # Log activity
                ActivityLog.objects.create(
                    user=admin_profile.user,
                    action='CREATE',
                    description=f"Added {role_type.lower()} {user.get_full_name()} to {school.name}",
                    target_type='User',
                    target_id=str(user.id)
                )

                return user

        except Exception as e:
            logger.error(f"Error adding user to school: {str(e)}")
            raise ValidationError(f"Failed to add user: {str(e)}")

    @staticmethod
    def _create_student_profile(user, user_data, school):
        """Create student profile and associations"""
        from superadmin.models import SchoolUser

        # Create student profile
        student_profile = StudentProfile.objects.create(
            user=user,
            school=school,
            udise_student_id=user_data['udise_student_id'],
            roll_no=user_data.get('roll_no'),
            parent_name=user_data.get('parent_name'),
            parent_phone=user_data.get('parent_phone'),
            parent_email=user_data.get('parent_email'),
            enrollment_date=timezone.now().date()
        )

        # Create school-user relationship
        SchoolUser.objects.create(
            school=school,
            user=user,
            role_in_school='STUDENT',
            is_active=True
        )

    @staticmethod
    def _create_teacher_profile(user, user_data, school):
        """Create teacher profile and associations"""
        from superadmin.models import SchoolUser

        # Create teacher profile
        teacher_profile = TeacherProfile.objects.create(
            user=user,
            school=school,
            employee_id=user_data['employee_id'],
            qualification=user_data.get('qualification'),
            experience_years=user_data.get('experience_years', 0)
        )

        # Create school-user relationship
        SchoolUser.objects.create(
            school=school,
            user=user,
            role_in_school='TEACHER',
            is_active=True
        )

    @staticmethod
    def perform_user_action(user_id, action, reason, admin_profile, school_id=None):
        """
        Perform action on a user (activate, deactivate, suspend, remove)

        Args:
            user_id: User ID
            action (str): Action to perform
            reason (str): Reason for action
            admin_profile: AdminProfile instance
            school_id: Optional school ID for validation

        Returns:
            dict: Action result
        """
        try:
            user = User.objects.get(id=user_id)

            # Verify user belongs to one of admin's schools
            if not UserManagementService._user_belongs_to_admin_schools(user, admin_profile):
                raise ValidationError("User does not belong to any of your schools")

            # Get specific school for removal action
            school = None
            if action == 'REMOVE':
                school = UserManagementService.get_school_for_admin(admin_profile, school_id)

            if action == 'ACTIVATE':
                user.activate(approved_by=admin_profile.user)
                status = 'activated'
            elif action == 'DEACTIVATE':
                user.status = 'INACTIVE'
                user.is_active = False
                user.save()
                status = 'deactivated'
            elif action == 'SUSPEND':
                user.suspend()
                status = 'suspended'
            elif action == 'REMOVE':
                UserManagementService._remove_user_from_school(user, school)
                status = 'removed from school'

            # Log activity
            ActivityLog.objects.create(
                user=admin_profile.user,
                action=action,
                description=f"{action} user {user.get_full_name()}. Reason: {reason}",
                target_type='User',
                target_id=str(user.id)
            )

            return {
                'user_id': str(user.id),
                'action': action,
                'status': status,
                'reason': reason
            }

        except User.DoesNotExist:
            raise ValidationError("User not found")
        except Exception as e:
            logger.error(f"Error performing user action: {str(e)}")
            raise ValidationError(f"Failed to perform action: {str(e)}")

    @staticmethod
    def _user_belongs_to_school(user, school):
        """Check if user belongs to the school"""
        return (
            hasattr(user, 'student_profile') and user.student_profile.school == school or
            hasattr(user, 'teacher_profile') and user.teacher_profile.school == school
        )

    @staticmethod
    def _user_belongs_to_admin_schools(user, admin_profile):
        """Check if user belongs to any of admin's schools"""
        admin_schools = admin_profile.schools.all()

        if hasattr(user, 'student_profile') and user.student_profile.school in admin_schools:
            return True
        if hasattr(user, 'teacher_profile') and user.teacher_profile.school in admin_schools:
            return True
        return False

    @staticmethod
    def _remove_user_from_school(user, school):
        """Remove user from school (soft delete relationship)"""
        from superadmin.models import SchoolUser

        school_user = SchoolUser.objects.filter(
            school=school,
            user=user
        ).first()

        if school_user:
            school_user.is_active = False
            school_user.left_date = timezone.now().date()
            school_user.save()


class ReportService:
    """Service class for generating reports"""

    @staticmethod
    def get_school_for_report(admin_profile, school_id=None):
        """Get and validate school for report generation"""
        if school_id:
            school = School.objects.filter(id=school_id).first()
            if not school or not admin_profile.has_school_access(school):
                raise ValidationError("Invalid school or no access")
            return school
        else:
            school = admin_profile.get_primary_school()
            if not school:
                raise ValidationError("No school available. Please specify school_id.")
            return school

    @staticmethod
    def generate_student_report(data, admin_profile, school_id=None):
        """
        Generate student report

        Args:
            data (dict): Report parameters
            admin_profile: AdminProfile instance
            school_id: Optional school ID

        Returns:
            dict: Student report data
        """
        try:
            school = ReportService.get_school_for_report(
                admin_profile, school_id or data.get('school_id')
            )
            student_id = data.get('student_id')
            class_id = data.get('class_id')
            date_from = data.get('date_from')
            date_to = data.get('date_to')

            # Base queryset
            students_query = StudentProfile.objects.filter(school=school)

            if student_id:
                students_query = students_query.filter(id=student_id)
            if class_id:
                students_query = students_query.filter(current_class_id=class_id)

            students = students_query.select_related('user', 'current_class')

            report_data = []

            for student in students:
                student_data = {
                    'id': str(student.id),
                    'name': student.user.get_full_name(),
                    'email': student.user.email,
                    'phone': student.user.phone,
                    'udise_id': student.udise_student_id,
                    'roll_no': student.roll_no,
                    'class': student.current_class.full_name if student.current_class else 'Not Assigned',
                    'class_name': student.current_class.name if student.current_class else None,
                    'section': student.current_class.section if student.current_class else None,
                    'ai_quota_used': student.ai_quota_used,
                    'ai_quota_limit': student.ai_quota_limit,
                    'ai_quota_remaining': student.ai_quota_limit - student.ai_quota_used,
                    'ai_quota_percentage': (student.ai_quota_used / student.ai_quota_limit * 100) if student.ai_quota_limit > 0 else 0,
                    'parent_name': student.parent_name,
                    'parent_phone': student.parent_phone,
                    'parent_email': student.parent_email,
                    'date_of_birth': student.user.date_of_birth.strftime('%Y-%m-%d') if student.user.date_of_birth else None,
                    'gender': student.user.gender,
                    'status': student.user.status,
                    'is_active': student.user.is_active,
                    'enrollment_date': student.enrollment_date.strftime('%Y-%m-%d') if student.enrollment_date else None,
                    'academic_year': student.academic_year,
                    'joined_date': student.created_at.strftime('%Y-%m-%d') if student.created_at else None
                }

                # Add attendance data if requested
                if data.get('include_attendance', True):
                    attendance_data = ReportService._get_student_attendance(
                        student, date_from, date_to
                    )
                    student_data.update(attendance_data)

                # Add homework data if requested
                if data.get('include_homework', True):
                    homework_data = ReportService._get_student_homework(
                        student, date_from, date_to
                    )
                    student_data.update(homework_data)

                # Add AI usage data if requested
                if data.get('include_ai_usage', True):
                    ai_data = ReportService._get_student_ai_usage(
                        student, date_from, date_to
                    )
                    student_data.update(ai_data)

                report_data.append(student_data)

            return {
                'school_name': school.name,
                'generated_at': timezone.now(),
                'students': report_data,
                'total_students': len(report_data)
            }

        except Exception as e:
            logger.error(f"Error generating student report: {str(e)}")
            raise ValidationError(f"Failed to generate report: {str(e)}")

    @staticmethod
    def generate_teacher_report(data, admin_profile, school_id=None):
        """
        Generate teacher report

        Args:
            data (dict): Report parameters
            admin_profile: AdminProfile instance
            school_id: Optional school ID

        Returns:
            dict: Teacher report data
        """
        try:
            school = ReportService.get_school_for_report(
                admin_profile, school_id or data.get('school_id')
            )
            teacher_id = data.get('teacher_id')
            subject_id = data.get('subject_id')
            date_from = data.get('date_from')
            date_to = data.get('date_to')

            # Base queryset
            teachers_query = TeacherProfile.objects.filter(school=school)

            if teacher_id:
                teachers_query = teachers_query.filter(id=teacher_id)

            teachers = teachers_query.select_related('user')

            report_data = []

            for teacher in teachers:
                teacher_data = {
                    'id': str(teacher.id),
                    'name': teacher.user.get_full_name(),
                    'email': teacher.user.email,
                    'phone': teacher.user.phone,
                    'employee_id': teacher.employee_id,
                    'qualification': teacher.qualification,
                    'experience_years': teacher.experience_years,
                    'specialization': teacher.specialization,
                    'certifications': teacher.certifications or [],
                    'can_mark_attendance': teacher.can_mark_attendance,
                    'can_assign_homework': teacher.can_assign_homework,
                    'can_grade_assignments': teacher.can_grade_assignments,
                    'status': teacher.user.status,
                    'is_active': teacher.user.is_active,
                    'joined_date': teacher.created_at.strftime('%Y-%m-%d') if teacher.created_at else None
                }

                # Add subjects data (always include)
                subjects_data = ReportService._get_teacher_subjects_data(teacher)
                teacher_data.update(subjects_data)

                # Add attendance data if requested
                if data.get('include_attendance', True):
                    attendance_data = ReportService._get_teacher_attendance_data(
                        teacher, date_from, date_to
                    )
                    teacher_data.update(attendance_data)

                # Add classes data if requested
                if data.get('include_classes', True):
                    classes_data = ReportService._get_teacher_classes_data(teacher)
                    teacher_data.update(classes_data)

                # Add homework data if requested
                if data.get('include_homework', True):
                    homework_data = ReportService._get_teacher_homework_data(
                        teacher, date_from, date_to
                    )
                    teacher_data.update(homework_data)

                report_data.append(teacher_data)

            return {
                'school_name': school.name,
                'generated_at': timezone.now(),
                'teachers': report_data,
                'total_teachers': len(report_data)
            }

        except Exception as e:
            logger.error(f"Error generating teacher report: {str(e)}")
            raise ValidationError(f"Failed to generate report: {str(e)}")

    @staticmethod
    def generate_school_report(data, admin_profile, school_id=None):
        """
        Generate school report

        Args:
            data (dict): Report parameters
            admin_profile: AdminProfile instance
            school_id: Optional school ID

        Returns:
            dict: School report data
        """
        try:
            school = ReportService.get_school_for_report(
                admin_profile, school_id or data.get('school_id')
            )
            date_from = data.get('date_from')
            date_to = data.get('date_to')

            report_data = {
                'school_name': school.name,
                'udise_code': school.udise_code,
                'generated_at': timezone.now(),
            }

            # Add student data if requested
            if data.get('include_students', True):
                students_data = ReportService._get_school_students_data(school)
                report_data.update(students_data)

            # Add teacher data if requested
            if data.get('include_teachers', True):
                teachers_data = ReportService._get_school_teachers_data(school)
                report_data.update(teachers_data)

            # Add attendance data if requested
            if data.get('include_attendance', True):
                attendance_data = ReportService._get_school_attendance_data(
                    school, date_from, date_to
                )
                report_data.update(attendance_data)

            # Add AI usage data if requested
            if data.get('include_ai_usage', True):
                ai_data = ReportService._get_school_ai_usage_data(
                    school, date_from, date_to
                )
                report_data.update(ai_data)

            return report_data

        except Exception as e:
            logger.error(f"Error generating school report: {str(e)}")
            raise ValidationError(f"Failed to generate report: {str(e)}")

    # Helper methods for report data
    @staticmethod
    def _get_student_attendance(student, date_from, date_to):
        """Get student attendance data"""
        attendance_query = Attendance.objects.filter(student=student)

        if date_from:
            attendance_query = attendance_query.filter(date__gte=date_from)
        if date_to:
            attendance_query = attendance_query.filter(date__lte=date_to)

        total_days = attendance_query.count()
        present_days = attendance_query.filter(status='PRESENT').count()

        return {
            'total_attendance_days': total_days,
            'present_days': present_days,
            'attendance_percentage': (present_days / total_days * 100) if total_days > 0 else 0
        }

    @staticmethod
    def _get_student_homework(student, date_from, date_to):
        """Get student homework data"""
        homework_query = Homework.objects.filter(student=student)

        if date_from:
            homework_query = homework_query.filter(assigned_date__gte=date_from)
        if date_to:
            homework_query = homework_query.filter(assigned_date__lte=date_to)

        total_homework = homework_query.count()
        completed_homework = homework_query.filter(status='GRADED').count()

        return {
            'total_homework': total_homework,
            'completed_homework': completed_homework,
            'homework_completion_rate': (completed_homework / total_homework * 100) if total_homework > 0 else 0
        }

    @staticmethod
    def _get_student_ai_usage(student, date_from, date_to):
        """Get student AI usage data"""
        ai_query = AIChatSession.objects.filter(student=student)

        if date_from:
            ai_query = ai_query.filter(started_at__date__gte=date_from)
        if date_to:
            ai_query = ai_query.filter(started_at__date__lte=date_to)

        return {
            'total_ai_sessions': ai_query.count(),
            'total_ai_tokens': ai_query.aggregate(total=models.Sum('total_tokens_used'))['total'] or 0
        }

    @staticmethod
    def _get_teacher_attendance_data(teacher, date_from, date_to):
        """Get teacher attendance marking data"""
        attendance_query = Attendance.objects.filter(marked_by=teacher)

        if date_from:
            attendance_query = attendance_query.filter(date__gte=date_from)
        if date_to:
            attendance_query = attendance_query.filter(date__lte=date_to)

        return {
            'attendance_records_marked': attendance_query.count()
        }

    @staticmethod
    def _get_teacher_classes_data(teacher):
        """Get teacher classes data with details"""
        class_assignments = teacher.class_assignments.filter(is_active=True).select_related(
            'school_class', 'subject'
        )
        
        classes_list = []
        for assignment in class_assignments:
            classes_list.append({
                'id': str(assignment.id),
                'class_name': assignment.school_class.full_name if assignment.school_class else '-',
                'subject_name': assignment.subject.name if assignment.subject else '-',
                'academic_year': assignment.academic_year
            })
        
        return {
            'total_classes': len(classes_list),
            'classes': classes_list
        }
    
    @staticmethod
    def _get_teacher_subjects_data(teacher):
        """Get teacher subjects data with details"""
        teacher_subjects = teacher.teacher_subjects.select_related('subject')
        
        subjects_list = []
        for ts in teacher_subjects:
            subjects_list.append({
                'id': str(ts.subject.id),
                'name': ts.subject.name,
                'code': ts.subject.code,
                'is_primary': ts.is_primary,
                'years_teaching': ts.years_teaching
            })
        
        return {
            'subjects_count': len(subjects_list),
            'subjects': subjects_list
        }

    @staticmethod
    def _get_teacher_homework_data(teacher, date_from, date_to):
        """Get teacher homework assignment data"""
        homework_query = Homework.objects.filter(assigned_by=teacher)

        if date_from:
            homework_query = homework_query.filter(assigned_date__gte=date_from)
        if date_to:
            homework_query = homework_query.filter(assigned_date__lte=date_to)

        return {
            'homework_assigned': homework_query.count()
        }

    @staticmethod
    def _get_school_students_data(school):
        """Get school students data"""
        students = StudentProfile.objects.filter(school=school)
        return {
            'total_students': students.count(),
            'active_students': students.filter(user__is_active=True).count()
        }

    @staticmethod
    def _get_school_teachers_data(school):
        """Get school teachers data"""
        teachers = TeacherProfile.objects.filter(school=school)
        return {
            'total_teachers': teachers.count(),
            'active_teachers': teachers.filter(user__is_active=True).count()
        }

    @staticmethod
    def get_school_teachers_detailed(school_id, admin_profile):
        """
        Get detailed list of teachers for a school with subjects and attendance data
        
        Args:
            school_id: School UUID
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Teachers list with detailed info
        """
        try:
            school = School.objects.get(id=school_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(school):
                raise ValidationError("You don't have access to this school")
            
            teachers = TeacherProfile.objects.filter(
                school=school,
                user__is_active=True
            ).select_related('user').prefetch_related(
                'teacher_subjects__subject',
                'class_assignments__school_class',
                'class_assignments__subject'
            )
            
            teachers_data = []
            for teacher in teachers:
                # Get subjects
                subjects = []
                for ts in teacher.teacher_subjects.all():
                    subjects.append({
                        'id': str(ts.subject.id),
                        'name': ts.subject.name,
                        'is_primary': ts.is_primary,
                        'years_teaching': ts.years_teaching
                    })
                
                # Get classes assigned
                classes = []
                for ca in teacher.class_assignments.filter(is_active=True):
                    classes.append({
                        'id': str(ca.school_class.id),
                        'class_name': f"{ca.school_class.name} - {ca.school_class.section}",
                        'subject': ca.subject.name if ca.subject else 'N/A'
                    })
                
                # Get attendance records marked by this teacher (last 30 days)
                attendance_marked = Attendance.objects.filter(
                    marked_by=teacher,
                    date__gte=timezone.now().date() - timedelta(days=30)
                ).count()
                
                # Total attendance records in school by this teacher
                total_attendance_marked = Attendance.objects.filter(
                    marked_by=teacher
                ).count()
                
                teachers_data.append({
                    'id': str(teacher.id),
                    'user_id': str(teacher.user.id),
                    'name': teacher.user.get_full_name(),
                    'email': teacher.user.email,
                    'phone': teacher.user.phone,
                    'employee_id': teacher.employee_id,
                    'qualification': teacher.qualification,
                    'experience_years': teacher.experience_years,
                    'is_active': teacher.user.is_active,
                    'subjects': subjects,
                    'subjects_count': len(subjects),
                    'classes': classes,
                    'classes_count': len(classes),
                    'attendance_marked_30_days': attendance_marked,
                    'total_attendance_marked': total_attendance_marked,
                    'can_mark_attendance': teacher.can_mark_attendance,
                    'can_assign_homework': teacher.can_assign_homework,
                    'created_at': teacher.created_at
                })
            
            return {
                'school_id': str(school.id),
                'school_name': school.name,
                'teachers': teachers_data,
                'total_count': len(teachers_data)
            }
            
        except School.DoesNotExist:
            raise ValidationError("School not found")
        except Exception as e:
            logger.error(f"Error getting school teachers: {str(e)}")
            raise ValidationError(f"Failed to get teachers: {str(e)}")

    @staticmethod
    def get_school_students_list(school_id, admin_profile, search=''):
        """
        Get list of students for a school (simple list with class, roll number)
        
        Args:
            school_id: School UUID
            admin_profile: AdminProfile instance
            search: Optional search term for student name
            
        Returns:
            dict: Students list
        """
        try:
            school = School.objects.get(id=school_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(school):
                raise ValidationError("You don't have access to this school")
            
            students = StudentProfile.objects.filter(
                school=school,
                user__is_active=True
            ).select_related('user', 'current_class')
            
            # Apply search filter
            if search:
                students = students.filter(
                    models.Q(user__first_name__icontains=search) |
                    models.Q(user__last_name__icontains=search) |
                    models.Q(roll_no__icontains=search)
                )
            
            students = students.order_by('current_class__name', 'roll_no')
            
            students_data = []
            for student in students:
                class_name = ''
                if student.current_class:
                    class_name = f"{student.current_class.name}"
                    if student.current_class.section:
                        class_name += f" - {student.current_class.section}"
                
                students_data.append({
                    'id': str(student.id),
                    'name': student.user.get_full_name(),
                    'roll_no': student.roll_no or 'N/A',
                    'class_name': class_name or 'Not Assigned',
                    'school_name': school.name
                })
            
            return {
                'school_id': str(school.id),
                'school_name': school.name,
                'students': students_data,
                'total_count': len(students_data)
            }
            
        except School.DoesNotExist:
            raise ValidationError("School not found")
        except Exception as e:
            logger.error(f"Error getting school students: {str(e)}")
            raise ValidationError(f"Failed to get students: {str(e)}")

    @staticmethod
    def get_teacher_detail_for_school(teacher_id, school_id, admin_profile):
        """
        Get detailed teacher info including subjects and attendance for a school
        
        Args:
            teacher_id: Teacher UUID
            school_id: School UUID
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Detailed teacher info
        """
        try:
            school = School.objects.get(id=school_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(school):
                raise ValidationError("You don't have access to this school")
            
            teacher = TeacherProfile.objects.select_related('user', 'school').prefetch_related(
                'teacher_subjects__subject',
                'class_assignments__school_class',
                'class_assignments__subject'
            ).get(id=teacher_id, school=school)
            
            # Get subjects
            subjects = []
            for ts in teacher.teacher_subjects.all():
                subjects.append({
                    'id': str(ts.subject.id),
                    'name': ts.subject.name,
                    'is_primary': ts.is_primary,
                    'years_teaching': ts.years_teaching
                })
            
            # Get classes assigned
            classes = []
            for ca in teacher.class_assignments.filter(is_active=True):
                classes.append({
                    'id': str(ca.school_class.id),
                    'class_name': f"{ca.school_class.name} - {ca.school_class.section}",
                    'subject': ca.subject.name if ca.subject else 'N/A',
                    'academic_year': ca.academic_year
                })
            
            # Get attendance records (last 30 days, grouped by date)
            from django.db.models.functions import TruncDate
            attendance_records = Attendance.objects.filter(
                marked_by=teacher,
                date__gte=timezone.now().date() - timedelta(days=30)
            ).values('date', 'school_class__name', 'school_class__section').annotate(
                present=models.Count('id', filter=models.Q(status='PRESENT')),
                absent=models.Count('id', filter=models.Q(status='ABSENT')),
                late=models.Count('id', filter=models.Q(status='LATE')),
                total=models.Count('id')
            ).order_by('-date')[:30]
            
            attendance_data = []
            for record in attendance_records:
                attendance_data.append({
                    'date': record['date'].strftime('%Y-%m-%d') if record['date'] else None,
                    'class': f"{record['school_class__name']} - {record['school_class__section']}",
                    'present': record['present'],
                    'absent': record['absent'],
                    'late': record['late'],
                    'total': record['total']
                })
            
            # Get attendance summary
            total_marked = Attendance.objects.filter(marked_by=teacher).count()
            last_30_days_marked = Attendance.objects.filter(
                marked_by=teacher,
                date__gte=timezone.now().date() - timedelta(days=30)
            ).count()
            
            # Get homework assigned
            homework_count = Homework.objects.filter(assigned_by=teacher).count()
            
            return {
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
                'school': {
                    'id': str(school.id),
                    'name': school.name
                },
                'subjects': subjects,
                'subjects_count': len(subjects),
                'classes': classes,
                'classes_count': len(classes),
                'permissions': {
                    'can_mark_attendance': teacher.can_mark_attendance,
                    'can_assign_homework': teacher.can_assign_homework,
                    'can_grade_assignments': teacher.can_grade_assignments,
                    'can_update_pii': teacher.can_update_pii
                },
                'attendance_summary': {
                    'total_records_marked': total_marked,
                    'last_30_days_marked': last_30_days_marked
                },
                'attendance_records': attendance_data,
                'homework_assigned_count': homework_count,
                'created_at': teacher.created_at
            }
            
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found in this school")
        except School.DoesNotExist:
            raise ValidationError("School not found")
        except Exception as e:
            logger.error(f"Error getting teacher detail: {str(e)}")
            raise ValidationError(f"Failed to get teacher detail: {str(e)}")

    @staticmethod
    def _get_school_attendance_data(school, date_from, date_to):
        """Get school attendance data"""
        # Filter by student's school since Attendance.school_class points to Class template
        attendance_query = Attendance.objects.filter(
            student__school=school
        )

        if date_from:
            attendance_query = attendance_query.filter(date__gte=date_from)
        if date_to:
            attendance_query = attendance_query.filter(date__lte=date_to)

        total_records = attendance_query.count()
        present_records = attendance_query.filter(status='PRESENT').count()

        return {
            'total_attendance_records': total_records,
            'present_records': present_records,
            'overall_attendance_rate': (present_records / total_records * 100) if total_records > 0 else 0
        }

    @staticmethod
    def _get_school_ai_usage_data(school, date_from, date_to):
        """Get school AI usage data"""
        ai_query = AIUsageMetrics.objects.filter(school=school)

        if date_from:
            ai_query = ai_query.filter(date__gte=date_from)
        if date_to:
            ai_query = ai_query.filter(date__lte=date_to)

        return {
            'total_ai_queries': ai_query.aggregate(total=models.Sum('total_queries'))['total'] or 0,
            'total_ai_tokens': ai_query.aggregate(total=models.Sum('total_tokens'))['total'] or 0
        }


class AdminDashboardService:
    """Service class for admin dashboard data"""

    @staticmethod
    def get_dashboard_data(admin_profile, school_id=None):
        """
        Get comprehensive dashboard data for admin

        Args:
            admin_profile: AdminProfile instance
            school_id: Optional school ID (if not provided, shows aggregate for all schools)

        Returns:
            dict: Dashboard data
        """
        try:
            # Get admin's schools from AdminSchool relationship
            admin_schools = admin_profile.schools.all()
            
            # Also check SchoolUser relationship (fallback)
            if not admin_schools.exists():
                from superadmin.models import SchoolUser
                school_user_schools = SchoolUser.objects.filter(
                    user=admin_profile.user,
                    role_in_school='ADMIN',
                    is_active=True
                ).values_list('school_id', flat=True)
                admin_schools = School.objects.filter(id__in=school_user_schools)

            if school_id:
                school = School.objects.filter(id=school_id).first()
                if not school:
                    raise ValidationError("Invalid school")
                # Check access via both AdminSchool and SchoolUser
                has_access = admin_profile.has_school_access(school)
                if not has_access:
                    from superadmin.models import SchoolUser
                    has_access = SchoolUser.objects.filter(
                        user=admin_profile.user,
                        school=school,
                        role_in_school='ADMIN',
                        is_active=True
                    ).exists()
                if not has_access:
                    raise ValidationError("No access to this school")
                return AdminDashboardService._get_single_school_dashboard(admin_profile, school)
            else:
                return AdminDashboardService._get_aggregate_dashboard(admin_profile, admin_schools)

        except Exception as e:
            logger.error(f"Error getting dashboard data: {str(e)}")
            raise ValidationError(f"Failed to get dashboard data: {str(e)}")

    @staticmethod
    def _get_actual_counts(schools):
        """Get actual student, teacher, and admin counts from database"""
        from students.models import StudentProfile
        from teachers.models import TeacherProfile, Attendance
        from admins.models import AdminProfile
        
        school_ids = [s.id for s in schools]
        
        # Count actual students from StudentProfile
        total_students = StudentProfile.objects.filter(
            school__in=school_ids,
            user__is_active=True
        ).count()
        
        # Count actual teachers from TeacherProfile
        total_teachers = TeacherProfile.objects.filter(
            school__in=school_ids,
            user__is_active=True
        ).count()
        
        # Count admins - admins can have multiple schools, so use distinct
        total_admins = AdminProfile.objects.filter(
            schools__in=school_ids,
            user__is_active=True
        ).distinct().count()
        
        return total_students, total_teachers, total_admins

    @staticmethod
    def _get_school_counts(school):
        """Get actual counts for a single school"""
        from students.models import StudentProfile
        from teachers.models import TeacherProfile
        from admins.models import AdminProfile
        
        total_students = StudentProfile.objects.filter(
            school=school,
            user__is_active=True
        ).count()
        
        total_teachers = TeacherProfile.objects.filter(
            school=school,
            user__is_active=True
        ).count()
        
        total_admins = AdminProfile.objects.filter(
            schools=school,
            user__is_active=True
        ).distinct().count()
        
        return total_students, total_teachers, total_admins

    @staticmethod
    def _get_attendance_trend(schools, days=7):
        """Get attendance trend for the last N days"""
        from teachers.models import Attendance
        from django.db.models.functions import TruncDate
        
        school_ids = [s.id for s in schools]
        today = timezone.now().date()
        start_date = today - timedelta(days=days-1)
        
        # Get attendance data grouped by date (filter by student's school)
        attendance_data = Attendance.objects.filter(
            student__school__in=school_ids,
            date__gte=start_date,
            date__lte=today
        ).values('date').annotate(
            present=models.Count('id', filter=models.Q(status='PRESENT')),
            absent=models.Count('id', filter=models.Q(status='ABSENT')),
            late=models.Count('id', filter=models.Q(status='LATE')),
            total=models.Count('id')
        ).order_by('date')
        
        # Create a dictionary for easy lookup
        attendance_by_date = {item['date']: item for item in attendance_data}
        
        # Fill in missing dates with zeros
        trend = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            if date in attendance_by_date:
                data = attendance_by_date[date]
                total = data['total']
                present = data['present'] + data['late']  # Consider late as present
                percentage = round((present / total * 100), 1) if total > 0 else 0
                trend.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'day': date.strftime('%a'),
                    'present': data['present'],
                    'absent': data['absent'],
                    'late': data['late'],
                    'total': total,
                    'percentage': percentage
                })
            else:
                trend.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'day': date.strftime('%a'),
                    'present': 0,
                    'absent': 0,
                    'late': 0,
                    'total': 0,
                    'percentage': 0
                })
        
        return trend

    @staticmethod
    def _get_single_school_dashboard(admin_profile, school):
        """Get dashboard data for a single school"""
        from superadmin.models import SchoolClass, Subject
        
        # Get actual counts from database
        total_students, total_teachers, total_admins = AdminDashboardService._get_school_counts(school)
        
        # Get classes and subjects counts
        total_classes = SchoolClass.objects.filter(school=school, is_active=True).count()
        total_subjects = Subject.objects.filter(is_active=True).count()
        
        # School statistics
        school_stats = {
            'school_id': str(school.id),
            'school_name': school.name,
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_admins': total_admins,
            'total_classes': total_classes,
            'total_subjects': total_subjects,
            'ai_quota_used': school.ai_quota_used,
            'ai_quota_limit': school.ai_quota_limit,
            'ai_quota_percentage': school.ai_quota_percentage
        }

        # Recent activities (last 7 days)
        recent_activities = ActivityLog.objects.filter(
            user__user_schools__school=school,
            timestamp__gte=timezone.now() - timedelta(days=7)
        ).select_related('user').order_by('-timestamp')[:10]

        # Pending approvals (inactive users)
        pending_approvals = User.objects.filter(
            user_schools__school=school,
            is_active=False,
            status__in=['PENDING', 'INACTIVE']
        ).count()

        # AI quota usage
        ai_quota_usage = {
            'used': school.ai_quota_used,
            'limit': school.ai_quota_limit,
            'percentage': school.ai_quota_percentage
        }

        # Notifications count (last 30 days)
        notifications_count = Announcement.objects.filter(
            targets__school=school,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).distinct().count()

        # Tasks count (homework assigned in last 30 days)
        tasks_count = Homework.objects.filter(
            student__school=school,
            assigned_date__gte=timezone.now().date() - timedelta(days=30)
        ).count()

        # Attendance trend
        attendance_trend = AdminDashboardService._get_attendance_trend([school])

        return {
            'view_type': 'single_school',
            'school_stats': school_stats,
            'recent_activities': [
                {
                    'id': str(activity.id),
                    'user': activity.user.get_full_name(),
                    'action': activity.action,
                    'description': activity.description,
                    'timestamp': activity.timestamp
                } for activity in recent_activities
            ],
            'pending_approvals': pending_approvals,
            'ai_quota_usage': ai_quota_usage,
            'notifications_count': notifications_count,
            'tasks_count': tasks_count,
            'attendance_trend': attendance_trend
        }

    @staticmethod
    def _get_aggregate_dashboard(admin_profile, admin_schools):
        """Get aggregated dashboard data for all admin's schools"""
        from superadmin.models import SchoolClass, Subject
        
        # Get actual counts from database
        total_students, total_teachers, total_admins = AdminDashboardService._get_actual_counts(admin_schools)
        
        total_ai_quota_used = sum(s.ai_quota_used for s in admin_schools)
        total_ai_quota_limit = sum(s.ai_quota_limit for s in admin_schools)
        
        # Get classes and subjects counts
        school_ids = [s.id for s in admin_schools]
        total_classes = SchoolClass.objects.filter(school_id__in=school_ids, is_active=True).count()
        total_subjects = Subject.objects.filter(is_active=True).count()

        school_stats = {
            'schools_count': admin_schools.count(),
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_admins': total_admins,
            'total_classes': total_classes,
            'total_subjects': total_subjects,
            'ai_quota_used': total_ai_quota_used,
            'ai_quota_limit': total_ai_quota_limit,
            'ai_quota_percentage': round((total_ai_quota_used / total_ai_quota_limit * 100), 2) if total_ai_quota_limit > 0 else 0
        }

        # Schools list with actual stats
        schools_list = []
        for s in admin_schools:
            s_students, s_teachers, s_admins = AdminDashboardService._get_school_counts(s)
            schools_list.append({
                'id': str(s.id),
                'name': s.name,
                'udise_code': s.udise_code,
                'total_students': s_students,
                'total_teachers': s_teachers,
                'total_admins': s_admins,
                'ai_quota_percentage': s.ai_quota_percentage
            })

        # Recent activities across all schools (last 7 days)
        recent_activities = ActivityLog.objects.filter(
            user__user_schools__school__in=admin_schools,
            timestamp__gte=timezone.now() - timedelta(days=7)
        ).select_related('user').order_by('-timestamp')[:10]

        # Pending approvals across all schools
        pending_approvals = User.objects.filter(
            user_schools__school__in=admin_schools,
            is_active=False,
            status__in=['PENDING', 'INACTIVE']
        ).distinct().count()

        # Notifications count across all schools (last 30 days)
        notifications_count = Announcement.objects.filter(
            targets__school__in=admin_schools,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).distinct().count()

        # Tasks count across all schools (last 30 days)
        tasks_count = Homework.objects.filter(
            student__school__in=admin_schools,
            assigned_date__gte=timezone.now().date() - timedelta(days=30)
        ).count()

        # Attendance trend
        attendance_trend = AdminDashboardService._get_attendance_trend(admin_schools)

        return {
            'view_type': 'aggregate',
            'school_stats': school_stats,
            'schools_list': schools_list,
            'recent_activities': [
                {
                    'id': str(activity.id),
                    'user': activity.user.get_full_name(),
                    'action': activity.action,
                    'description': activity.description,
                    'timestamp': activity.timestamp
                } for activity in recent_activities
            ],
            'pending_approvals': pending_approvals,
            'notifications_count': notifications_count,
            'tasks_count': tasks_count,
            'attendance_trend': attendance_trend
        }


class TeacherTaskService:
    """Service class for teacher task management"""

    @staticmethod
    def create_teacher_task(data, admin_profile):
        """
        Create a task for a teacher
        
        Args:
            data (dict): Task data containing teacher_id, title, description, etc.
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Created task info
        """
        from teachers.models import TeacherTask
        
        try:
            teacher_id = data.get('teacher_id')
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify admin has access to this teacher's school
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            task = TeacherTask.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                priority=data.get('priority', 'MEDIUM'),
                teacher=teacher,
                assigned_by=admin_profile.user,
                school=teacher.school,
                due_date=data.get('due_date'),
                status='OPEN'
            )
            
            # Log activity
            ActivityLog.objects.create(
                user=admin_profile.user,
                action='CREATE',
                description=f"Assigned task '{task.title}' to teacher {teacher.user.get_full_name()}",
                target_type='TeacherTask',
                target_id=str(task.id)
            )
            
            return {
                'task_id': str(task.id),
                'title': task.title,
                'teacher_name': teacher.user.get_full_name(),
                'status': task.status
            }
            
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except Exception as e:
            logger.error(f"Error creating teacher task: {str(e)}")
            raise ValidationError(f"Failed to create task: {str(e)}")

    @staticmethod
    def get_teacher_tasks(teacher_id, admin_profile, status_filter=None):
        """
        Get all tasks for a specific teacher
        
        Args:
            teacher_id: Teacher ID
            admin_profile: AdminProfile instance
            status_filter: Optional status filter
            
        Returns:
            list: List of tasks
        """
        from teachers.models import TeacherTask
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            tasks_query = TeacherTask.objects.filter(
                teacher=teacher
            ).select_related('assigned_by', 'closed_by').prefetch_related('replies__replied_by')
            
            if status_filter:
                tasks_query = tasks_query.filter(status=status_filter)
            
            tasks_data = []
            for task in tasks_query:
                tasks_data.append(TeacherTaskService._format_task(task))
            
            return tasks_data
            
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except Exception as e:
            logger.error(f"Error getting teacher tasks: {str(e)}")
            raise ValidationError(f"Failed to get tasks: {str(e)}")

    @staticmethod
    def add_task_reply(task_id, content, user, reply_type):
        """
        Add a reply to a task
        
        Args:
            task_id: Task ID
            content: Reply content
            user: User adding the reply
            reply_type: TEACHER or ADMIN
            
        Returns:
            dict: Reply info
        """
        from teachers.models import TeacherTask, TeacherTaskReply
        
        try:
            task = TeacherTask.objects.get(id=task_id)
            
            # Update task status to IN_PROGRESS if it was OPEN
            if task.status == 'OPEN':
                task.status = 'IN_PROGRESS'
                task.save()
            
            reply = TeacherTaskReply.objects.create(
                task=task,
                content=content,
                reply_type=reply_type,
                replied_by=user
            )
            
            return {
                'reply_id': str(reply.id),
                'task_id': str(task.id),
                'content': reply.content,
                'reply_type': reply.reply_type,
                'replied_by': user.get_full_name(),
                'created_at': reply.created_at
            }
            
        except TeacherTask.DoesNotExist:
            raise ValidationError("Task not found")
        except Exception as e:
            logger.error(f"Error adding task reply: {str(e)}")
            raise ValidationError(f"Failed to add reply: {str(e)}")

    @staticmethod
    def update_task_status(task_id, new_status, user, admin_profile=None):
        """
        Update task status (close/open/complete)
        
        Args:
            task_id: Task ID
            new_status: New status
            user: User updating the status
            admin_profile: AdminProfile if admin is updating
            
        Returns:
            dict: Updated task info
        """
        from teachers.models import TeacherTask
        
        try:
            task = TeacherTask.objects.get(id=task_id)
            
            # Verify access
            if admin_profile:
                if not admin_profile.has_school_access(task.school):
                    raise ValidationError("You don't have access to this task")
            
            old_status = task.status
            task.status = new_status
            
            if new_status == 'COMPLETED':
                task.completed_at = timezone.now()
            elif new_status == 'CLOSED':
                task.closed_at = timezone.now()
                task.closed_by = user
            
            task.save()
            
            # Log activity
            ActivityLog.objects.create(
                user=user,
                action='UPDATE',
                description=f"Updated task '{task.title}' status from {old_status} to {new_status}",
                target_type='TeacherTask',
                target_id=str(task.id)
            )
            
            return {
                'task_id': str(task.id),
                'title': task.title,
                'old_status': old_status,
                'new_status': new_status
            }
            
        except TeacherTask.DoesNotExist:
            raise ValidationError("Task not found")
        except Exception as e:
            logger.error(f"Error updating task status: {str(e)}")
            raise ValidationError(f"Failed to update task: {str(e)}")

    @staticmethod
    def get_task_detail(task_id, admin_profile):
        """
        Get detailed task info including all replies
        
        Args:
            task_id: Task ID
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Task details with replies
        """
        from teachers.models import TeacherTask
        
        try:
            task = TeacherTask.objects.select_related(
                'teacher__user', 'assigned_by', 'closed_by', 'school'
            ).prefetch_related('replies__replied_by').get(id=task_id)
            
            # Verify access
            if not admin_profile.has_school_access(task.school):
                raise ValidationError("You don't have access to this task")
            
            return TeacherTaskService._format_task(task, include_replies=True)
            
        except TeacherTask.DoesNotExist:
            raise ValidationError("Task not found")
        except Exception as e:
            logger.error(f"Error getting task detail: {str(e)}")
            raise ValidationError(f"Failed to get task: {str(e)}")

    @staticmethod
    def _format_task(task, include_replies=False):
        """Format task for API response"""
        data = {
            'id': str(task.id),
            'title': task.title,
            'description': task.description,
            'priority': task.priority,
            'status': task.status,
            'teacher': {
                'id': str(task.teacher.id),
                'name': task.teacher.user.get_full_name(),
                'employee_id': task.teacher.employee_id
            },
            'assigned_by': task.assigned_by.get_full_name() if task.assigned_by else 'System',
            'school_name': task.school.name,
            'due_date': task.due_date.strftime('%Y-%m-%d') if task.due_date else None,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'closed_at': task.closed_at.isoformat() if task.closed_at else None,
            'closed_by': task.closed_by.get_full_name() if task.closed_by else None,
            'created_at': task.created_at.isoformat(),
            'replies_count': task.replies_count,
        }
        
        if include_replies:
            def get_reply_user_info(user):
                if not user:
                    return {'id': None, 'name': 'Unknown', 'role': 'Unknown'}
                role = 'Unknown'
                try:
                    if hasattr(user, 'user_role') and user.user_role:
                        role = user.user_role.role_type
                except:
                    pass
                return {
                    'id': str(user.id),
                    'name': user.get_full_name(),
                    'role': role
                }
            
            data['replies'] = [
                {
                    'id': str(reply.id),
                    'content': reply.content,
                    'reply_type': reply.reply_type,
                    'replied_by': get_reply_user_info(reply.replied_by),
                    'created_at': reply.created_at.isoformat()
                }
                for reply in task.replies.all().order_by('created_at')
            ]
        else:
            # Include last reply summary
            last_reply = task.last_reply
            if last_reply:
                data['last_reply'] = {
                    'content': last_reply.content[:100] + '...' if len(last_reply.content) > 100 else last_reply.content,
                    'reply_type': last_reply.reply_type,
                    'replied_by': last_reply.replied_by.get_full_name() if last_reply.replied_by else 'Unknown',
                    'created_at': last_reply.created_at.isoformat()
                }
        
        return data

    @staticmethod
    def get_teacher_attendance_calendar(teacher_id, admin_profile, year, month):
        """
        Get teacher's attendance marking calendar data
        
        Args:
            teacher_id: Teacher ID
            admin_profile: AdminProfile instance
            year: Year
            month: Month (1-12)
            
        Returns:
            dict: Calendar data with attendance marked dates
        """
        from teachers.models import SchoolHoliday
        import calendar
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify access
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            # Get first and last day of month
            _, num_days = calendar.monthrange(year, month)
            start_date = datetime(year, month, 1).date()
            end_date = datetime(year, month, num_days).date()
            
            # Get teacher's own attendance from ActivityLog
            teacher_attendance = ActivityLog.objects.filter(
                target_type='TeacherAttendance',
                target_id=str(teacher.id),
                action='CREATE',
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date
            )
            
            # Extract dates from descriptions (format: "... on YYYY-MM-DD")
            attendance_dates = set()
            for log in teacher_attendance:
                # Parse date from description: "Marked attendance for teacher X on 2024-12-05"
                if ' on ' in log.description:
                    date_str = log.description.split(' on ')[-1].strip()
                    try:
                        from datetime import datetime as dt
                        attendance_dates.add(dt.strptime(date_str, '%Y-%m-%d').date())
                    except:
                        pass
            
            # Get holidays for this school
            holidays = SchoolHoliday.objects.filter(
                school=teacher.school,
                date__gte=start_date,
                date__lte=end_date
            )
            
            # Build calendar data
            holidays_by_date = {h.date: {'name': h.name, 'type': h.holiday_type} for h in holidays}
            
            calendar_data = []
            for day in range(1, num_days + 1):
                current_date = datetime(year, month, day).date()
                day_of_week = current_date.weekday()
                
                # Only Sunday (6) is weekend, Saturday is a working day
                is_weekend = day_of_week == 6  # Sunday only
                is_attendance_marked = current_date in attendance_dates
                
                day_data = {
                    'date': current_date.strftime('%Y-%m-%d'),
                    'day': day,
                    'day_name': current_date.strftime('%a'),
                    'is_weekend': is_weekend,
                    'is_holiday': current_date in holidays_by_date,
                    'holiday_info': holidays_by_date.get(current_date),
                    'attendance_marked': is_attendance_marked,
                    'attendance_data': {'present': 1, 'total': 1} if is_attendance_marked else None,
                }
                
                # Determine status color
                if day_data['is_holiday']:
                    day_data['status_color'] = 'holiday'  # Orange/Yellow
                elif day_data['is_weekend']:
                    day_data['status_color'] = 'weekend'  # Gray
                elif day_data['attendance_marked']:
                    day_data['status_color'] = 'marked'  # Green
                elif current_date < timezone.now().date():
                    day_data['status_color'] = 'not_marked'  # Red (past day, no attendance)
                else:
                    day_data['status_color'] = 'future'  # Light gray
                
                calendar_data.append(day_data)
            
            # Monthly summary
            total_working_days = sum(1 for d in calendar_data if not d['is_weekend'] and not d['is_holiday'])
            attendance_marked_days = sum(1 for d in calendar_data if d['attendance_marked'])
            
            return {
                'year': year,
                'month': month,
                'month_name': calendar.month_name[month],
                'teacher': {
                    'id': str(teacher.id),
                    'name': teacher.user.get_full_name(),
                    'employee_id': teacher.employee_id
                },
                'school_name': teacher.school.name,
                'calendar': calendar_data,
                'summary': {
                    'total_days': num_days,
                    'total_working_days': total_working_days,
                    'attendance_marked_days': attendance_marked_days,
                    'holidays_count': len(holidays_by_date),
                    'weekends_count': sum(1 for d in calendar_data if d['is_weekend'])
                }
            }
            
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except Exception as e:
            logger.error(f"Error getting teacher calendar: {str(e)}")
            raise ValidationError(f"Failed to get calendar: {str(e)}")

    @staticmethod
    def update_teacher_profile(teacher_id, data, admin_profile):
        """
        Update teacher profile including basic info and permissions
        
        Args:
            teacher_id: Teacher ID
            data: Update data
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Updated teacher info
        """
        from teachers.models import TeacherSubject, TeacherClassAssignment
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            with transaction.atomic():
                # Update basic info
                if 'qualification' in data:
                    teacher.qualification = data['qualification']
                if 'experience_years' in data:
                    teacher.experience_years = data['experience_years']
                if 'specialization' in data:
                    teacher.specialization = data['specialization']
                
                # Update permissions
                if 'can_mark_attendance' in data:
                    teacher.can_mark_attendance = data['can_mark_attendance']
                if 'can_assign_homework' in data:
                    teacher.can_assign_homework = data['can_assign_homework']
                if 'can_grade_assignments' in data:
                    teacher.can_grade_assignments = data['can_grade_assignments']
                if 'can_update_pii' in data:
                    teacher.can_update_pii = data['can_update_pii']
                
                # Update school if provided and admin has access to new school
                if 'school_id' in data:
                    new_school = School.objects.get(id=data['school_id'])
                    if not admin_profile.has_school_access(new_school):
                        raise ValidationError("You don't have access to the new school")
                    teacher.school = new_school
                
                # Update attendance class (the class this teacher takes attendance for)
                if 'attendance_class_id' in data:
                    if data['attendance_class_id']:
                        from superadmin.models import SchoolClass, Class
                        # attendance_class_id could be SchoolClass ID or Class template ID
                        try:
                            school_class = SchoolClass.objects.select_related('school', 'class_obj').get(id=data['attendance_class_id'])
                            # Verify the class belongs to teacher's school
                            if school_class.school != teacher.school:
                                raise ValidationError("Attendance class must belong to teacher's school")
                            # Use the Class template, not SchoolClass
                            teacher.attendance_class = school_class.class_obj
                        except SchoolClass.DoesNotExist:
                            # Try as Class template ID directly
                            class_template = Class.objects.get(id=data['attendance_class_id'])
                            teacher.attendance_class = class_template
                    else:
                        teacher.attendance_class = None
                
                teacher.save()
                
                # Log activity
                ActivityLog.objects.create(
                    user=admin_profile.user,
                    action='UPDATE',
                    description=f"Updated teacher profile for {teacher.user.get_full_name()}",
                    target_type='TeacherProfile',
                    target_id=str(teacher.id)
                )
                
                return {
                    'id': str(teacher.id),
                    'name': teacher.user.get_full_name(),
                    'updated': True,
                    'permissions': {
                        'can_mark_attendance': teacher.can_mark_attendance,
                        'can_assign_homework': teacher.can_assign_homework,
                        'can_grade_assignments': teacher.can_grade_assignments,
                        'can_update_pii': teacher.can_update_pii,
                    }
                }
                
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except School.DoesNotExist:
            raise ValidationError("School not found")
        except Exception as e:
            logger.error(f"Error updating teacher: {str(e)}")
            raise ValidationError(f"Failed to update teacher: {str(e)}")

    @staticmethod
    def update_teacher_subjects(teacher_id, subjects_data, admin_profile):
        """
        Update teacher's subjects
        
        Args:
            teacher_id: Teacher ID
            subjects_data: List of subject assignments {subject_id, is_primary, years_teaching}
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Updated subjects info
        """
        from teachers.models import TeacherSubject
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            with transaction.atomic():
                # Remove existing subjects
                TeacherSubject.objects.filter(teacher=teacher).delete()
                
                # Add new subjects
                added_subjects = []
                for subject_info in subjects_data:
                    subject = Subject.objects.get(id=subject_info['subject_id'])
                    ts = TeacherSubject.objects.create(
                        teacher=teacher,
                        subject=subject,
                        is_primary=subject_info.get('is_primary', False),
                        years_teaching=subject_info.get('years_teaching', 0)
                    )
                    added_subjects.append({
                        'id': str(ts.id),
                        'subject_name': subject.name,
                        'is_primary': ts.is_primary
                    })
                
                # Log activity
                ActivityLog.objects.create(
                    user=admin_profile.user,
                    action='UPDATE',
                    description=f"Updated subjects for teacher {teacher.user.get_full_name()}",
                    target_type='TeacherProfile',
                    target_id=str(teacher.id)
                )
                
                return {
                    'teacher_id': str(teacher.id),
                    'subjects_count': len(added_subjects),
                    'subjects': added_subjects
                }
                
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except Subject.DoesNotExist:
            raise ValidationError("Subject not found")
        except Exception as e:
            logger.error(f"Error updating teacher subjects: {str(e)}")
            raise ValidationError(f"Failed to update subjects: {str(e)}")

    @staticmethod
    def update_teacher_classes(teacher_id, classes_data, admin_profile):
        """
        Update teacher's class assignments
        
        Args:
            teacher_id: Teacher ID
            classes_data: List of class assignments {class_id, subject_id, academic_year}
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Updated classes info
        """
        from teachers.models import TeacherClassAssignment
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            with transaction.atomic():
                from superadmin.models import SchoolClass, Class
                
                # Deactivate existing class assignments
                TeacherClassAssignment.objects.filter(teacher=teacher).update(is_active=False)
                
                # Add/update class assignments
                added_classes = []
                for class_info in classes_data:
                    # class_id could be either SchoolClass ID or Class template ID
                    # Try SchoolClass first, then fallback to Class template
                    class_obj = None
                    class_display_name = 'N/A'
                    
                    try:
                        school_class = SchoolClass.objects.select_related('school', 'class_obj').get(id=class_info['class_id'])
                        # Check if class belongs to teacher's school
                        if school_class.school != teacher.school:
                            raise ValidationError(f"Class {school_class.full_name} does not belong to teacher's school")
                        class_obj = school_class.class_obj  # Get the Class template
                        class_display_name = school_class.full_name
                    except SchoolClass.DoesNotExist:
                        # Try as Class template ID
                        class_obj = Class.objects.get(id=class_info['class_id'])
                        class_display_name = f"Class {class_obj.grade_number}"
                    
                    subject = Subject.objects.get(id=class_info['subject_id'])
                    academic_year = class_info.get('academic_year', '2024-2025')
                    
                    # Get or create assignment using Class template (not SchoolClass)
                    assignment, created = TeacherClassAssignment.objects.update_or_create(
                        teacher=teacher,
                        school_class=class_obj,  # This is the Class template
                        subject=subject,
                        academic_year=academic_year,
                        defaults={'is_active': True}
                    )
                    
                    added_classes.append({
                        'id': str(assignment.id),
                        'class_name': class_display_name,
                        'subject_name': subject.name
                    })
                
                # Log activity
                ActivityLog.objects.create(
                    user=admin_profile.user,
                    action='UPDATE',
                    description=f"Updated class assignments for teacher {teacher.user.get_full_name()}",
                    target_type='TeacherProfile',
                    target_id=str(teacher.id)
                )
                
                return {
                    'teacher_id': str(teacher.id),
                    'classes_count': len(added_classes),
                    'classes': added_classes
                }
                
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except Subject.DoesNotExist:
            raise ValidationError("Subject not found")
        except Exception as e:
            logger.error(f"Error updating teacher classes: {str(e)}")
            raise ValidationError(f"Failed to update classes: {str(e)}")

    @staticmethod
    def get_available_subjects():
        """Get all available subjects for assignment"""
        subjects = Subject.objects.filter(is_active=True).order_by('name')
        return [
            {
                'id': str(s.id),
                'name': s.name,
                'code': s.code,
                'category': s.category
            }
            for s in subjects
        ]

    @staticmethod
    def get_available_classes(school_id, admin_profile):
        """Get all available classes for a school"""
        try:
            from superadmin.models import SchoolClass, Class
            school = School.objects.get(id=school_id)
            
            if not admin_profile.has_school_access(school):
                raise ValidationError("You don't have access to this school")
            
            # Use SchoolClass mapping to get classes for this school
            school_classes = SchoolClass.objects.filter(
                school=school, is_active=True
            ).select_related('class_obj').order_by('class_obj__grade_number', 'section')
            
            # Return Class template IDs (to match TeacherClassAssignment.school_class FK)
            # but include SchoolClass info for display
            return [
                {
                    'id': str(sc.class_obj.id),  # Class template ID (for FK matching)
                    'school_class_id': str(sc.id),  # SchoolClass ID (for reference)
                    'name': sc.full_name,
                    'grade': sc.class_obj.grade_number,
                    'section': sc.section or '',
                    'academic_year': sc.academic_year
                }
                for sc in school_classes
            ]
        except School.DoesNotExist:
            raise ValidationError("School not found")

    @staticmethod
    def mark_teacher_attendance(teacher_id, date, admin_profile):
        """
        Mark teacher attendance for a specific date
        
        Args:
            teacher_id: Teacher ID
            date: Date string (YYYY-MM-DD)
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Result of marking attendance
        """
        from teachers.models import TeacherProfile, Attendance
        from datetime import datetime
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(teacher.school):
                raise ValidationError("You don't have access to this teacher's school")
            
            # Parse date
            if isinstance(date, str):
                attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
            else:
                attendance_date = date
            
            # Validate date is not in the future
            from datetime import date as dt_date
            if attendance_date > dt_date.today():
                raise ValidationError("Cannot mark attendance for future dates")
            
            with transaction.atomic():
                # Create or update teacher attendance record
                # We use the Attendance model but with no student (teacher attendance)
                # Or we can use a separate model. For simplicity, let's track in ActivityLog
                
                # Log the attendance
                ActivityLog.objects.create(
                    user=admin_profile.user,
                    action='CREATE',
                    description=f"Marked attendance for teacher {teacher.user.get_full_name()} on {attendance_date}",
                    target_type='TeacherAttendance',
                    target_id=str(teacher.id)
                )
                
                return {
                    'teacher_id': str(teacher.id),
                    'teacher_name': teacher.user.get_full_name(),
                    'date': str(attendance_date),
                    'marked': True
                }
                
        except TeacherProfile.DoesNotExist:
            raise ValidationError("Teacher not found")
        except Exception as e:
            logger.error(f"Error marking teacher attendance: {str(e)}")
            raise ValidationError(f"Failed to mark attendance: {str(e)}")


class AttendanceService:
    """Service for managing student attendance"""

    @staticmethod
    def get_class_students_for_attendance(class_id, date, admin_profile):
        """
        Get list of students for a class with their attendance status for a specific date
        
        Args:
            class_id: Class ID
            date: Date for attendance (YYYY-MM-DD)
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Class info with students and their attendance status
        """
        from students.models import StudentProfile
        from teachers.models import Attendance
        from superadmin.models import SchoolClass
        from datetime import datetime
        
        try:
            school_class = SchoolClass.objects.select_related('school', 'class_obj').get(id=class_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(school_class.school):
                raise ValidationError("You don't have access to this class")
            
            # Parse date
            if isinstance(date, str):
                attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
            else:
                attendance_date = date
            
            # Get all students in this class
            students = StudentProfile.objects.filter(
                current_class=school_class,
                user__is_active=True
            ).select_related('user').order_by('roll_no', 'user__first_name')
            
            # Get existing attendance records for this date
            existing_attendance = {
                str(a.student_id): a 
                for a in Attendance.objects.filter(
                    school_class=school_class,
                    date=attendance_date
                )
            }
            
            students_data = []
            for student in students:
                attendance = existing_attendance.get(str(student.id))
                students_data.append({
                    'id': str(student.id),
                    'user_id': str(student.user.id),
                    'name': student.user.get_full_name(),
                    'roll_number': student.roll_no,
                    'status': attendance.status if attendance else None,
                    'attendance_id': str(attendance.id) if attendance else None,
                    'remarks': attendance.remarks if attendance else None,
                })
            
            return {
                'class': {
                    'id': str(school_class.id),
                    'name': school_class.full_name,
                    'grade': school_class.grade,
                    'section': school_class.section,
                    'school': school_class.school.name,
                },
                'date': str(attendance_date),
                'total_students': len(students_data),
                'marked_count': len(existing_attendance),
                'students': students_data
            }
            
        except Class.DoesNotExist:
            raise ValidationError("Class not found")
        except Exception as e:
            logger.error(f"Error getting class students for attendance: {str(e)}")
            raise ValidationError(f"Failed to get students: {str(e)}")

    @staticmethod
    def mark_attendance(class_id, date, attendance_data, admin_profile, marked_by_teacher=None):
        """
        Mark or update attendance for multiple students
        
        Args:
            class_id: Class ID
            date: Date for attendance (YYYY-MM-DD)
            attendance_data: List of {student_id, status, remarks}
            admin_profile: AdminProfile instance
            marked_by_teacher: Optional TeacherProfile who marked the attendance
            
        Returns:
            dict: Summary of attendance marking
        """
        from students.models import StudentProfile
        from teachers.models import Attendance, TeacherProfile
        from superadmin.models import SchoolClass
        from datetime import datetime
        
        try:
            school_class = SchoolClass.objects.select_related('school', 'class_obj').get(id=class_id)
            
            # Verify admin has access
            if not admin_profile.has_school_access(school_class.school):
                raise ValidationError("You don't have access to this class")
            
            # Parse date
            if isinstance(date, str):
                attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
            else:
                attendance_date = date
            
            # Validate attendance data
            if not attendance_data:
                raise ValidationError("No attendance data provided")
            
            # Get teacher profile for marking (if admin is also a teacher, or specified)
            teacher_profile = marked_by_teacher
            if not teacher_profile:
                try:
                    teacher_profile = TeacherProfile.objects.get(user=admin_profile.user)
                except TeacherProfile.DoesNotExist:
                    teacher_profile = None
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for record in attendance_data:
                    student_id = record.get('student_id')
                    status = record.get('status')
                    remarks = record.get('remarks', '')
                    
                    if not student_id or not status:
                        continue
                    
                    # Validate status
                    if status not in ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']:
                        continue
                    
                    try:
                        student = StudentProfile.objects.get(id=student_id)
                        
                        # Verify student is in this class
                        if student.current_class_id != school_class.id:
                            continue
                        
                        # Create or update attendance
                        attendance, created = Attendance.objects.update_or_create(
                            student=student,
                            date=attendance_date,
                            defaults={
                                'school_class': school_class,
                                'status': status,
                                'marked_by': teacher_profile,
                                'remarks': remarks,
                            }
                        )
                        
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                            
                    except StudentProfile.DoesNotExist:
                        continue
                
                # Log activity
                ActivityLog.objects.create(
                    user=admin_profile.user,
                    action='CREATE' if created_count > 0 else 'UPDATE',
                    description=f"Marked attendance for {school_class.full_name} on {attendance_date}",
                    target_type='Attendance',
                    target_id=str(school_class.id)
                )
            
            return {
                'success': True,
                'class_id': str(school_class.id),
                'date': str(attendance_date),
                'created': created_count,
                'updated': updated_count,
                'total_processed': created_count + updated_count
            }
            
        except Class.DoesNotExist:
            raise ValidationError("Class not found")
        except Exception as e:
            logger.error(f"Error marking attendance: {str(e)}")
            raise ValidationError(f"Failed to mark attendance: {str(e)}")

    @staticmethod
    def get_attendance_summary(class_id, start_date, end_date, admin_profile):
        """
        Get attendance summary for a class over a date range
        
        Args:
            class_id: Class ID
            start_date: Start date
            end_date: End date
            admin_profile: AdminProfile instance
            
        Returns:
            dict: Attendance summary
        """
        from teachers.models import Attendance
        from superadmin.models import SchoolClass
        from datetime import datetime
        from django.db.models import Count, Q
        
        try:
            school_class = SchoolClass.objects.select_related('school', 'class_obj').get(id=class_id)
            
            if not admin_profile.has_school_access(school_class.school):
                raise ValidationError("You don't have access to this class")
            
            # Parse dates
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            # Get attendance records
            attendance = Attendance.objects.filter(
                school_class=school_class,
                date__gte=start_date,
                date__lte=end_date
            )
            
            # Daily breakdown
            daily_stats = attendance.values('date').annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status='PRESENT')),
                absent=Count('id', filter=Q(status='ABSENT')),
                late=Count('id', filter=Q(status='LATE')),
                excused=Count('id', filter=Q(status='EXCUSED'))
            ).order_by('date')
            
            # Overall stats
            overall_stats = attendance.aggregate(
                total=Count('id'),
                present=Count('id', filter=Q(status='PRESENT')),
                absent=Count('id', filter=Q(status='ABSENT')),
                late=Count('id', filter=Q(status='LATE')),
                excused=Count('id', filter=Q(status='EXCUSED'))
            )
            
            return {
                'class': {
                    'id': str(school_class.id),
                    'name': school_class.full_name,
                },
                'period': {
                    'start_date': str(start_date),
                    'end_date': str(end_date),
                },
                'overall': overall_stats,
                'daily': list(daily_stats)
            }
            
        except Class.DoesNotExist:
            raise ValidationError("Class not found")
        except Exception as e:
            logger.error(f"Error getting attendance summary: {str(e)}")
            raise ValidationError(f"Failed to get summary: {str(e)}")

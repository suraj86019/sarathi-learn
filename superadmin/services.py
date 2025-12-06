"""
Super Admin Services
Business logic for super admin operations
"""

from django.core.exceptions import ValidationError
from django.db import transaction

from .models import School, Subject, Class, SchoolUser, Announcement, SystemSettings
from users.models import User, UserRole
from admins.models import AdminProfile
from teachers.models import TeacherProfile, TeacherSubject


class UserManagementService:
    """Service class for user management operations"""

    @staticmethod
    def validate_admin_creation_data(data):
        """
        Validate data for admin creation

        Args:
            data (dict): Request data

        Raises:
            ValidationError: If validation fails
        """
        required_fields = ['email', 'password', 'first_name', 'last_name', 'school_id', 'employee_id']

        for field in required_fields:
            if field not in data:
                raise ValidationError(f'{field} is required')

        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise ValidationError('User with this email already exists')

        # Check if employee_id already exists
        if AdminProfile.objects.filter(employee_id=data['employee_id']).exists():
            raise ValidationError('Employee ID already exists')

    @staticmethod
    def validate_teacher_creation_data(data):
        """
        Validate data for teacher creation

        Args:
            data (dict): Request data

        Raises:
            ValidationError: If validation fails
        """
        required_fields = ['email', 'password', 'first_name', 'last_name', 'school_id', 'employee_id', 'subject_ids']

        for field in required_fields:
            if field not in data:
                raise ValidationError(f'{field} is required')

        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise ValidationError('User with this email already exists')

        # Check if employee_id already exists
        if TeacherProfile.objects.filter(employee_id=data['employee_id']).exists():
            raise ValidationError('Employee ID already exists')

        # Validate subjects
        subject_ids = data.get('subject_ids', [])
        if not subject_ids:
            raise ValidationError('At least one subject is required')

        subjects = Subject.objects.filter(id__in=subject_ids)
        if subjects.count() != len(subject_ids):
            raise ValidationError('One or more subjects not found')

        return subjects

    @staticmethod
    @transaction.atomic
    def create_admin_user(data):
        """
        Create a new admin user with profile and school relationship

        Args:
            data (dict): User creation data
                - school_id: Single school ID (legacy support)
                - school_ids: List of school IDs (for multiple schools)

        Returns:
            tuple: (user, admin_profile, schools)
        """
        from admins.models import AdminSchool

        # Get school(s)
        school_ids = data.get('school_ids', [])
        if not school_ids and data.get('school_id'):
            school_ids = [data['school_id']]

        if not school_ids:
            raise ValidationError('At least one school_id or school_ids is required')

        schools = School.objects.filter(id__in=school_ids)
        if schools.count() != len(school_ids):
            raise ValidationError('One or more schools not found')

        # Create user
        user = User.objects.create(
            email=data['email'],
            phone=data.get('phone'),
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender'),
            address=data.get('address'),
            city=data.get('city'),
            district=data.get('district'),
            state=data.get('state'),
            pincode=data.get('pincode'),
            status='ACTIVE',
            is_active=True,
            is_staff=True
        )
        user.set_password(data['password'])
        user.save()

        # Create user role
        UserRole.objects.create(user=user, role_type='ADMIN')

        # Create admin profile
        admin_profile = AdminProfile.objects.create(
            user=user,
            employee_id=data['employee_id'],
            designation=data.get('designation')
        )

        # Create AdminSchool relationships for each school
        is_first = True
        for school in schools:
            AdminSchool.objects.create(
                admin=admin_profile,
                school=school,
                is_primary=is_first  # First school is primary
            )
            is_first = False

            # Create SchoolUser relationship
            SchoolUser.objects.create(
                school=school,
                user=user,
                role_in_school='ADMIN',
                is_active=True
            )

        return user, admin_profile, list(schools)

    @staticmethod
    @transaction.atomic
    def create_teacher_user(data):
        """
        Create a new teacher user with profile, subjects and school relationship

        Args:
            data (dict): User creation data

        Returns:
            tuple: (user, teacher_profile, school, subjects)
        """
        # Get school
        try:
            school = School.objects.get(id=data['school_id'])
        except School.DoesNotExist:
            raise ValidationError('School not found')

        # Get validated subjects
        subjects = UserManagementService.validate_teacher_creation_data(data)

        # Create user
        user = User.objects.create(
            email=data['email'],
            phone=data.get('phone'),
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender'),
            address=data.get('address'),
            city=data.get('city'),
            district=data.get('district'),
            state=data.get('state'),
            pincode=data.get('pincode'),
            status='ACTIVE',
            is_active=True,
            is_staff=True
        )
        user.set_password(data['password'])
        user.save()

        # Create user role
        UserRole.objects.create(user=user, role_type='TEACHER')

        # Create teacher profile
        teacher_profile = TeacherProfile.objects.create(
            user=user,
            school=school,
            employee_id=data['employee_id'],
            qualification=data.get('qualification'),
            experience_years=data.get('experience_years', 0)
        )

        # Create subject associations
        for subject in subjects:
            TeacherSubject.objects.create(
                teacher=teacher_profile,
                subject=subject
            )

        # Create SchoolUser relationship
        SchoolUser.objects.create(
            school=school,
            user=user,
            role_in_school='TEACHER',
            is_active=True
        )

        return user, teacher_profile, school, subjects


class SchoolService:
    """Service class for school-related operations"""

    @staticmethod
    def get_filtered_schools_queryset(user):
        """
        Get filtered schools queryset based on user role

        Args:
            user: User instance

        Returns:
            QuerySet: Filtered schools queryset
        """
        if hasattr(user, 'user_role') and user.user_role.role_type == 'SUPER_ADMIN':
            return School.objects.all().order_by('-created_at')
        elif hasattr(user, 'admin_profile'):
            return School.objects.filter(id=user.admin_profile.school_id)
        elif hasattr(user, 'teacher_profile'):
            return School.objects.filter(id=user.teacher_profile.school_id)

        return School.objects.none()

    @staticmethod
    def approve_school(school, approved_by_user):
        """
        Approve a school

        Args:
            school: School instance
            approved_by_user: User who is approving

        Returns:
            School: Updated school instance
        """
        school.status = 'ACTIVE'
        school.approved_by = approved_by_user
        school.save()
        return school

    @staticmethod
    def suspend_school(school):
        """
        Suspend a school

        Args:
            school: School instance

        Returns:
            School: Updated school instance
        """
        school.status = 'SUSPENDED'
        school.save()
        return school

    @staticmethod
    def get_school_users(school):
        """
        Get all users of a school

        Args:
            school: School instance

        Returns:
            QuerySet: Users queryset
        """
        return school.get_all_users()

    @staticmethod
    def get_school_statistics(school):
        """
        Get school statistics

        Args:
            school: School instance

        Returns:
            dict: Statistics data
        """
        return {
            'total_admins': school.total_admins,
            'total_teachers': school.total_teachers,
            'total_students': school.total_students,
            'total_users': school.total_users,
            'total_classes': school.classes.count(),
            'ai_quota_used': school.ai_quota_used,
            'ai_quota_limit': school.ai_quota_limit,
            'ai_quota_percentage': school.ai_quota_percentage,
        }


class SubjectService:
    """Service class for subject-related operations"""

    @staticmethod
    def get_subject_permissions(action):
        """
        Get permissions for subject operations

        Args:
            action: Action being performed

        Returns:
            list: List of permission classes
        """
        from rest_framework.permissions import AllowAny
        from users.permissions import IsSuperAdmin
        from rest_framework.permissions import IsAuthenticated

        if action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsSuperAdmin()]

    @staticmethod
    def get_subjects_by_category():
        """
        Get subjects grouped by category

        Returns:
            dict: Subjects grouped by category
        """
        categories = ['CORE', 'ELECTIVE', 'VOCATIONAL', 'EXTRA_CURRICULAR']
        result = {}

        for category in categories:
            subjects = Subject.objects.filter(category=category, is_active=True)
            result[category.lower()] = subjects

        return result


class ClassService:
    """Service class for class-related operations"""

    @staticmethod
    def get_filtered_classes_queryset(user):
        """
        Get filtered classes queryset based on user role

        Args:
            user: User instance

        Returns:
            QuerySet: Filtered classes queryset
        """
        if hasattr(user, 'user_role') and user.user_role.role_type == 'SUPER_ADMIN':
            return Class.objects.all()
        elif hasattr(user, 'admin_profile'):
            return Class.objects.filter(school=user.admin_profile.school)
        elif hasattr(user, 'teacher_profile'):
            return Class.objects.filter(school=user.teacher_profile.school)

        return Class.objects.none()

    @staticmethod
    def get_class_students(class_obj):
        """
        Get all students in a class

        Args:
            class_obj: Class instance

        Returns:
            QuerySet: Students queryset
        """
        return class_obj.students.all()


class AnnouncementService:
    """Service class for announcement-related operations"""

    @staticmethod
    def create_announcement(serializer, created_by_user):
        """
        Create announcement with created_by set

        Args:
            serializer: Announcement serializer
            created_by_user: User creating the announcement

        Returns:
            Announcement: Created announcement instance
        """
        return serializer.save(created_by=created_by_user)

    @staticmethod
    def publish_announcement(announcement):
        """
        Publish an announcement

        Args:
            announcement: Announcement instance

        Returns:
            Announcement: Published announcement instance
        """
        announcement.publish()
        return announcement


class SystemSettingsService:
    """Service class for system settings operations"""

    @staticmethod
    def update_system_setting(serializer, updated_by_user):
        """
        Update system setting with updated_by set

        Args:
            serializer: SystemSettings serializer
            updated_by_user: User updating the setting

        Returns:
            SystemSettings: Updated system settings instance
        """
        return serializer.save(updated_by=updated_by_user)

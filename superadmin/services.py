"""
Super Admin Services
Business logic for super admin operations
"""

from django.core.exceptions import ValidationError
from django.db import models, transaction

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
            'total_classes': school.school_classes.count(),  # Using SchoolClass mapping
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
        from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission

        class IsAdminOrSuperAdmin(BasePermission):
            def has_permission(self, request, view):
                role = getattr(request.user, 'user_role', None)
                return bool(role and role.role_type in ['SUPER_ADMIN', 'ADMIN'])

        if action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOrSuperAdmin()]

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
        Classes are templates available to everyone (Grade 1-12)

        Args:
            user: User instance

        Returns:
            QuerySet: Classes queryset (all active classes)
        """
        # Class templates are available to all authenticated users
        return Class.objects.filter(is_active=True).order_by('grade_number')

    @staticmethod
    def get_user_school_ids(user):
        """
        Return list of school IDs the user is associated with via SchoolUser.
        Admins/teachers should be limited to their schools.
        """
        return list(
            SchoolUser.objects.filter(user=user, is_active=True).values_list('school_id', flat=True)
        )

    @staticmethod
    def validate_user_can_manage_school(user, school_id):
        """
        Ensure the user is allowed to manage classes for the given school.
        Super admins are always allowed; others must belong to the school.
        """
        if hasattr(user, 'user_role') and user.user_role.role_type == 'SUPER_ADMIN':
            return True
        allowed_ids = ClassService.get_user_school_ids(user)
        # Convert UUIDs to strings for comparison
        allowed_str = [str(uid) for uid in allowed_ids]
        if str(school_id) not in allowed_str:
            raise ValidationError('You do not have permission to manage classes for this school')
        return True


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


class SuperAdminSchoolService:
    """Enhanced service class for super admin school management"""
    
    @staticmethod
    def get_all_schools(page: int = 1, page_size: int = 20, filters: dict = None) -> dict:
        """
        Get paginated list of all schools with filters
        """
        queryset = School.objects.all().order_by('-created_at')
        
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('state'):
                queryset = queryset.filter(state__icontains=filters['state'])
            if filters.get('district'):
                queryset = queryset.filter(district__icontains=filters['district'])
            if filters.get('search'):
                search = filters['search']
                queryset = queryset.filter(
                    models.Q(name__icontains=search) |
                    models.Q(udise_code__icontains=search) |
                    models.Q(city__icontains=search) |
                    models.Q(principal_name__icontains=search)
                )
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        schools = queryset[start:end]
        
        return {
            'schools': [SuperAdminSchoolService._format_school(s) for s in schools],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def _format_school(school: School, include_counts: bool = True) -> dict:
        """Format school for API response with actual counts"""
        data = {
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
            'ai_quota_limit': school.ai_quota_limit,
            'ai_quota_used': school.ai_quota_used,
            'established_date': school.established_date.isoformat() if school.established_date else None,
            'created_at': school.created_at.isoformat(),
            'updated_at': school.updated_at.isoformat(),
        }
        
        if include_counts:
            # Get actual counts from database
            from students.models import StudentProfile
            from teachers.models import TeacherProfile
            from admins.models import AdminSchool
            
            data['total_students'] = StudentProfile.objects.filter(school=school).count()
            data['total_teachers'] = TeacherProfile.objects.filter(school=school).count()
            data['total_admins'] = AdminSchool.objects.filter(school=school, is_active=True).count()
        else:
            data['total_students'] = school.total_students
            data['total_teachers'] = school.total_teachers
            data['total_admins'] = school.total_admins
        
        return data
    
    @staticmethod
    def get_school_detail(school_id: str) -> dict:
        """Get detailed school information"""
        try:
            school = School.objects.get(id=school_id)
            data = SuperAdminSchoolService._format_school(school)
            
            # Add additional statistics
            from students.models import StudentProfile
            from teachers.models import TeacherProfile
            from admins.models import AdminProfile, AdminSchool
            
            # Real counts from database
            data['actual_students'] = StudentProfile.objects.filter(school=school).count()
            data['actual_teachers'] = TeacherProfile.objects.filter(school=school).count()
            data['actual_admins'] = AdminSchool.objects.filter(school=school, is_active=True).count()
            
            # Classes
            from .models import SchoolClass
            data['classes'] = list(SchoolClass.objects.filter(school=school, is_active=True).values_list('class_obj__name', flat=True).distinct())
            data['classes_count'] = SchoolClass.objects.filter(school=school, is_active=True).count()
            
            return data
        except School.DoesNotExist:
            return None
    
    @staticmethod
    def get_school_teachers(school_id: str, page: int = 1, page_size: int = 20, search: str = None) -> dict:
        """Get paginated teachers for a school"""
        from teachers.models import TeacherProfile
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return {'teachers': [], 'count': 0, 'pagination': {}}
        
        queryset = TeacherProfile.objects.filter(school=school).select_related('user')
        
        if search:
            queryset = queryset.filter(
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(employee_id__icontains=search)
            )
        
        queryset = queryset.order_by('-user__created_at')
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        teachers = queryset[start:end]
        
        return {
            'teachers': [
                {
                    'id': str(t.id),
                    'user_id': str(t.user.id),
                    'email': t.user.email,
                    'phone': t.user.phone,
                    'first_name': t.user.first_name,
                    'last_name': t.user.last_name,
                    'full_name': t.user.get_full_name(),
                    'employee_id': t.employee_id,
                    'qualification': t.qualification,
                    'experience_years': t.experience_years,
                    'status': t.user.status,
                    'is_active': t.user.is_active,
                    'created_at': t.user.created_at.isoformat(),
                }
                for t in teachers
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def get_school_students(school_id: str, page: int = 1, page_size: int = 20, search: str = None) -> dict:
        """Get paginated students for a school"""
        from students.models import StudentProfile
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return {'students': [], 'count': 0, 'pagination': {}}
        
        queryset = StudentProfile.objects.filter(school=school).select_related('user', 'current_class')
        
        if search:
            queryset = queryset.filter(
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(udise_id__icontains=search) |
                models.Q(roll_number__icontains=search)
            )
        
        queryset = queryset.order_by('-user__created_at')
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        students = queryset[start:end]
        
        return {
            'students': [
                {
                    'id': str(s.id),
                    'user_id': str(s.user.id),
                    'email': s.user.email,
                    'phone': s.user.phone,
                    'first_name': s.user.first_name,
                    'last_name': s.user.last_name,
                    'full_name': s.user.get_full_name(),
                    'udise_student_id': s.udise_student_id,
                    'roll_no': s.roll_no,
                    'class_name': s.current_class.name if s.current_class else None,
                    'status': s.user.status,
                    'is_active': s.user.is_active,
                    'created_at': s.user.created_at.isoformat(),
                }
                for s in students
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def get_school_admins(school_id: str, page: int = 1, page_size: int = 20, search: str = None) -> dict:
        """Get paginated admins for a school"""
        from admins.models import AdminSchool
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return {'admins': [], 'count': 0, 'pagination': {}}
        
        queryset = AdminSchool.objects.filter(
            school=school, 
            is_active=True
        ).select_related('admin__user')
        
        if search:
            queryset = queryset.filter(
                models.Q(admin__user__first_name__icontains=search) |
                models.Q(admin__user__last_name__icontains=search) |
                models.Q(admin__user__email__icontains=search) |
                models.Q(admin__employee_id__icontains=search)
            )
        
        queryset = queryset.order_by('-admin__user__created_at')
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        admin_schools = queryset[start:end]
        
        return {
            'admins': [
                {
                    'id': str(a.admin.id),
                    'user_id': str(a.admin.user.id),
                    'email': a.admin.user.email,
                    'phone': a.admin.user.phone,
                    'first_name': a.admin.user.first_name,
                    'last_name': a.admin.user.last_name,
                    'full_name': a.admin.user.get_full_name(),
                    'employee_id': a.admin.employee_id,
                    'designation': a.admin.designation,
                    'is_primary': a.is_primary,
                    'status': a.admin.user.status,
                    'is_active': a.admin.user.is_active,
                    'created_at': a.admin.user.created_at.isoformat(),
                }
                for a in admin_schools
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def get_school_classes(school_id: str) -> dict:
        """Get all classes for a school"""
        from .models import SchoolClass
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return {'classes': [], 'count': 0}
        
        classes = SchoolClass.objects.filter(
            school=school, 
            is_active=True
        ).select_related('class_obj').order_by('class_obj__grade_number')
        
        return {
            'classes': [
                {
                    'id': str(c.id),
                    'name': c.class_obj.name if c.class_obj else 'Unknown',
                    'grade': c.class_obj.grade_number if c.class_obj else 0,
                    'section': c.section,
                    'academic_year': c.academic_year,
                }
                for c in classes
            ],
            'count': classes.count()
        }
    
    @staticmethod
    @transaction.atomic
    def create_school(data: dict) -> School:
        """Create a new school"""
        school = School.objects.create(
            name=data['name'],
            udise_code=data['udise_code'],
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            principal_name=data.get('principal_name'),
            address=data['address'],
            city=data['city'],
            district=data['district'],
            state=data['state'],
            pincode=data['pincode'],
            board=data.get('board'),
            plan_type=data.get('plan_type', 'BASIC'),
            established_date=data.get('established_date'),
            status='PENDING'
        )
        return school
    
    @staticmethod
    @transaction.atomic
    def update_school(school_id: str, data: dict) -> School:
        """Update school information"""
        try:
            school = School.objects.get(id=school_id)
            
            # Update fields
            for field in ['name', 'contact_email', 'contact_phone', 'principal_name',
                         'address', 'city', 'district', 'state', 'pincode', 'board',
                         'plan_type', 'established_date', 'ai_quota_limit']:
                if field in data:
                    setattr(school, field, data[field])
            
            school.save()
            return school
        except School.DoesNotExist:
            raise ValidationError('School not found')
    
    @staticmethod
    def update_school_status(school_id: str, new_status: str, user=None) -> School:
        """Update school status (PENDING, ACTIVE, INACTIVE, SUSPENDED)"""
        from django.utils import timezone
        
        try:
            school = School.objects.get(id=school_id)
            
            if new_status not in ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED']:
                raise ValidationError('Invalid status')
            
            school.status = new_status
            
            if new_status == 'ACTIVE' and user:
                school.approved_by = user
                school.approved_at = timezone.now()
            
            school.save()
            return school
        except School.DoesNotExist:
            raise ValidationError('School not found')
    
    @staticmethod
    @transaction.atomic
    def delete_school(school_id: str) -> bool:
        """
        Delete a school (soft delete by setting status to INACTIVE)
        This is a soft delete to preserve data integrity
        """
        try:
            school = School.objects.get(id=school_id)
            school.status = 'INACTIVE'
            school.save()
            return True
        except School.DoesNotExist:
            raise ValidationError('School not found')


class SuperAdminService:
    """Service class for super admin operations on admins"""
    
    @staticmethod
    def get_all_admins(page: int = 1, page_size: int = 20, filters: dict = None) -> dict:
        """Get paginated list of all admins"""
        from admins.models import AdminProfile, AdminSchool
        from users.models import User
        
        # Get admin profiles with related data
        queryset = AdminProfile.objects.select_related('user').prefetch_related(
            'admin_schools__school'
        ).order_by('-user__created_at')
        
        if filters:
            if filters.get('school_id'):
                queryset = queryset.filter(admin_schools__school_id=filters['school_id'])
            if filters.get('search'):
                search = filters['search']
                queryset = queryset.filter(
                    models.Q(user__email__icontains=search) |
                    models.Q(user__first_name__icontains=search) |
                    models.Q(user__last_name__icontains=search) |
                    models.Q(employee_id__icontains=search)
                )
            if filters.get('status'):
                queryset = queryset.filter(user__status=filters['status'])
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        admins = queryset[start:end]
        
        return {
            'admins': [SuperAdminService._format_admin(a) for a in admins],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def _format_admin(admin_profile) -> dict:
        """Format admin for API response"""
        from admins.models import AdminSchool
        
        user = admin_profile.user
        schools = AdminSchool.objects.filter(admin=admin_profile).select_related('school')
        
        return {
            'id': str(admin_profile.id),
            'user_id': str(user.id),
            'email': user.email,
            'phone': user.phone,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name(),
            'employee_id': admin_profile.employee_id,
            'designation': admin_profile.designation,
            'status': user.status,
            'is_active': user.is_active,
            'schools': [
                {
                    'id': str(s.school.id),
                    'name': s.school.name,
                    'is_primary': s.is_primary
                }
                for s in schools
            ],
            'created_at': user.created_at.isoformat(),
        }
    
    @staticmethod
    def get_admin_detail(admin_id: str) -> dict:
        """Get detailed admin information"""
        from admins.models import AdminProfile
        
        try:
            admin = AdminProfile.objects.select_related('user').get(id=admin_id)
            return SuperAdminService._format_admin(admin)
        except AdminProfile.DoesNotExist:
            return None
    
    @staticmethod
    @transaction.atomic
    def update_admin_status(admin_id: str, is_active: bool) -> bool:
        """Activate or deactivate an admin"""
        from admins.models import AdminProfile
        
        try:
            admin = AdminProfile.objects.select_related('user').get(id=admin_id)
            user = admin.user
            user.is_active = is_active
            user.status = 'ACTIVE' if is_active else 'INACTIVE'
            user.save()
            return True
        except AdminProfile.DoesNotExist:
            raise ValidationError('Admin not found')
    
    @staticmethod
    @transaction.atomic
    def remove_admin(admin_id: str) -> bool:
        """Remove an admin (soft delete)"""
        from admins.models import AdminProfile, AdminSchool
        from .models import SchoolUser
        
        try:
            admin = AdminProfile.objects.select_related('user').get(id=admin_id)
            user = admin.user
            
            # Deactivate user
            user.is_active = False
            user.status = 'INACTIVE'
            user.save()
            
            # Deactivate school associations
            AdminSchool.objects.filter(admin=admin).update(is_active=False)
            SchoolUser.objects.filter(user=user).update(is_active=False)
            
            return True
        except AdminProfile.DoesNotExist:
            raise ValidationError('Admin not found')
    
    @staticmethod
    @transaction.atomic
    def update_admin_schools(admin_id: str, school_ids: list) -> bool:
        """Update admin's school associations"""
        from admins.models import AdminProfile, AdminSchool
        from .models import SchoolUser
        
        try:
            admin = AdminProfile.objects.select_related('user').get(id=admin_id)
            user = admin.user
            
            # Get schools
            schools = School.objects.filter(id__in=school_ids)
            if schools.count() != len(school_ids):
                raise ValidationError('One or more schools not found')
            
            # Remove old AdminSchool associations
            AdminSchool.objects.filter(admin=admin).delete()
            
            # Create new associations
            is_first = True
            for school in schools:
                AdminSchool.objects.create(
                    admin=admin,
                    school=school,
                    is_primary=is_first
                )
                # Use update_or_create to handle existing SchoolUser entries
                SchoolUser.objects.update_or_create(
                    school=school,
                    user=user,
                    defaults={
                        'role_in_school': 'ADMIN',
                        'is_active': True
                    }
                )
                is_first = False
            
            # Remove SchoolUser entries for schools no longer assigned
            old_school_ids = set(SchoolUser.objects.filter(
                user=user, 
                role_in_school='ADMIN'
            ).values_list('school_id', flat=True))
            new_school_ids = set(s.id for s in schools)
            schools_to_remove = old_school_ids - new_school_ids
            if schools_to_remove:
                SchoolUser.objects.filter(
                    user=user, 
                    role_in_school='ADMIN',
                    school_id__in=schools_to_remove
                ).delete()
            
            return True
        except AdminProfile.DoesNotExist:
            raise ValidationError('Admin not found')


class SuperAdminTeacherService:
    """Service class for super admin operations on teachers"""
    
    @staticmethod
    def get_all_teachers(page: int = 1, page_size: int = 20, filters: dict = None) -> dict:
        """Get paginated list of all teachers across all schools"""
        from teachers.models import TeacherProfile
        
        queryset = TeacherProfile.objects.select_related(
            'user', 'school'
        ).order_by('-user__created_at')
        
        if filters:
            if filters.get('school_id'):
                queryset = queryset.filter(school_id=filters['school_id'])
            if filters.get('search'):
                search = filters['search']
                queryset = queryset.filter(
                    models.Q(user__email__icontains=search) |
                    models.Q(user__first_name__icontains=search) |
                    models.Q(user__last_name__icontains=search) |
                    models.Q(employee_id__icontains=search) |
                    models.Q(user__phone__icontains=search)
                )
            if filters.get('status'):
                if filters['status'] == 'active':
                    queryset = queryset.filter(user__is_active=True)
                elif filters['status'] == 'inactive':
                    queryset = queryset.filter(user__is_active=False)
            if filters.get('subject'):
                queryset = queryset.filter(primary_subject__icontains=filters['subject'])
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        teachers = queryset[start:end]
        
        return {
            'teachers': [
                SuperAdminTeacherService._format_teacher(t) for t in teachers
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def _format_teacher(teacher) -> dict:
        """Format teacher data for API response"""
        return {
            'id': str(teacher.id),
            'user_id': str(teacher.user.id),
            'email': teacher.user.email,
            'phone': teacher.user.phone,
            'first_name': teacher.user.first_name,
            'last_name': teacher.user.last_name,
            'full_name': teacher.user.get_full_name(),
            'employee_id': teacher.employee_id,
            'qualification': teacher.qualification,
            'experience_years': teacher.experience_years,
            'primary_subject': teacher.primary_subject,
            'specialization': teacher.specialization,
            'school': {
                'id': str(teacher.school.id),
                'name': teacher.school.name,
            } if teacher.school else None,
            'status': teacher.user.status,
            'is_active': teacher.user.is_active,
            'created_at': teacher.user.created_at.isoformat(),
        }
    
    @staticmethod
    def get_teacher_detail(teacher_id: str) -> dict:
        """Get detailed information for a specific teacher"""
        from teachers.models import TeacherProfile, TeacherSubject
        
        try:
            teacher = TeacherProfile.objects.select_related(
                'user', 'school'
            ).prefetch_related(
                'teacher_subjects__subject',
                'managed_classes'
            ).get(id=teacher_id)
            
            # Get subjects taught
            subjects = [
                {
                    'id': str(ts.subject.id),
                    'name': ts.subject.name,
                    'code': ts.subject.code,
                }
                for ts in teacher.teacher_subjects.all()
            ]
            
            # Get managed classes
            classes = [
                {
                    'id': str(c.id),
                    'name': c.name,
                    'section': c.section,
                }
                for c in teacher.managed_classes.all()
            ]
            
            return {
                **SuperAdminTeacherService._format_teacher(teacher),
                'subjects': subjects,
                'managed_classes': classes,
                'can_mark_attendance': teacher.can_mark_attendance,
                'can_assign_homework': teacher.can_assign_homework,
                'can_grade_assignments': teacher.can_grade_assignments,
                'certifications': teacher.certifications,
            }
        except TeacherProfile.DoesNotExist:
            raise ValidationError('Teacher not found')
    
    @staticmethod
    def toggle_teacher_status(teacher_id: str, is_active: bool) -> bool:
        """Activate or deactivate a teacher"""
        from teachers.models import TeacherProfile
        
        try:
            teacher = TeacherProfile.objects.select_related('user').get(id=teacher_id)
            teacher.user.is_active = is_active
            teacher.user.status = 'ACTIVE' if is_active else 'INACTIVE'
            teacher.user.save()
            return True
        except TeacherProfile.DoesNotExist:
            raise ValidationError('Teacher not found')


class SuperAdminStudentService:
    """Service class for super admin operations on students"""
    
    @staticmethod
    def get_all_students(page: int = 1, page_size: int = 20, filters: dict = None) -> dict:
        """Get paginated list of all students across all schools"""
        from students.models import StudentProfile
        
        queryset = StudentProfile.objects.select_related(
            'user', 'school', 'current_class'
        ).order_by('-user__created_at')
        
        if filters:
            if filters.get('school_id'):
                queryset = queryset.filter(school_id=filters['school_id'])
            if filters.get('class_id'):
                queryset = queryset.filter(current_class_id=filters['class_id'])
            if filters.get('search'):
                search = filters['search']
                queryset = queryset.filter(
                    models.Q(user__email__icontains=search) |
                    models.Q(user__first_name__icontains=search) |
                    models.Q(user__last_name__icontains=search) |
                    models.Q(udise_student_id__icontains=search) |
                    models.Q(roll_no__icontains=search) |
                    models.Q(user__phone__icontains=search)
                )
            if filters.get('status'):
                if filters['status'] == 'active':
                    queryset = queryset.filter(user__is_active=True)
                elif filters['status'] == 'inactive':
                    queryset = queryset.filter(user__is_active=False)
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        students = queryset[start:end]
        
        return {
            'students': [
                SuperAdminStudentService._format_student(s) for s in students
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def _format_student(student) -> dict:
        """Format student data for API response"""
        return {
            'id': str(student.id),
            'user_id': str(student.user.id),
            'email': student.user.email,
            'phone': student.user.phone,
            'first_name': student.user.first_name,
            'last_name': student.user.last_name,
            'full_name': student.user.get_full_name(),
            'udise_student_id': student.udise_student_id,
            'roll_no': student.roll_no,
            'class_name': student.current_class.name if student.current_class else student.class_name,
            'section': student.section,
            'school': {
                'id': str(student.school.id),
                'name': student.school.name,
            } if student.school else None,
            'parent_name': student.parent_name,
            'parent_phone': student.parent_phone,
            'status': student.user.status,
            'is_active': student.user.is_active,
            'created_at': student.user.created_at.isoformat(),
        }
    
    @staticmethod
    def get_student_detail(student_id: str) -> dict:
        """Get detailed information for a specific student"""
        from students.models import StudentProfile
        
        try:
            student = StudentProfile.objects.select_related(
                'user', 'school', 'current_class'
            ).get(id=student_id)
            
            return {
                **SuperAdminStudentService._format_student(student),
                'parent_email': student.parent_email,
                'academic_year': student.academic_year,
                'enrollment_date': student.enrollment_date.isoformat() if student.enrollment_date else None,
                'ai_quota_limit': student.ai_quota_limit,
                'ai_quota_used': student.ai_quota_used,
            }
        except StudentProfile.DoesNotExist:
            raise ValidationError('Student not found')
    
    @staticmethod
    def toggle_student_status(student_id: str, is_active: bool) -> bool:
        """Activate or deactivate a student"""
        from students.models import StudentProfile
        
        try:
            student = StudentProfile.objects.select_related('user').get(id=student_id)
            student.user.is_active = is_active
            student.user.status = 'ACTIVE' if is_active else 'INACTIVE'
            student.user.save()
            return True
        except StudentProfile.DoesNotExist:
            raise ValidationError('Student not found')


class SuperAdminAnnouncementService:
    """Service class for super admin announcement operations"""
    
    @staticmethod
    def get_all_announcements(page: int = 1, page_size: int = 20, filters: dict = None, user=None) -> dict:
        """Get paginated list of announcements for the requesting user"""
        from .models import Announcement, AnnouncementTarget
        
        queryset = Announcement.objects.select_related('created_by').order_by('-created_at')
        
        # Filter to show only announcements created by user OR targeted to user
        if user:
            # Get announcement IDs that target this user directly
            targeted_announcement_ids = AnnouncementTarget.objects.filter(
                user=user
            ).values_list('announcement_id', flat=True)
            
            # Filter: created by user OR targeted to user
            queryset = queryset.filter(
                models.Q(created_by=user) |
                models.Q(id__in=targeted_announcement_ids)
            ).distinct()
        
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('priority'):
                queryset = queryset.filter(priority=filters['priority'])
            if filters.get('search'):
                search = filters['search']
                queryset = queryset.filter(
                    models.Q(title__icontains=search) |
                    models.Q(content__icontains=search)
                )
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        announcements = queryset[start:end]
        
        return {
            'announcements': [
                SuperAdminAnnouncementService._format_announcement(a) for a in announcements
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def _format_announcement(announcement) -> dict:
        """Format announcement data for API response"""
        return {
            'id': str(announcement.id),
            'title': announcement.title,
            'content': announcement.content,
            'priority': announcement.priority,
            'status': announcement.status,
            'is_active': announcement.is_active,
            'published_at': announcement.published_at.isoformat() if announcement.published_at else None,
            'expires_at': announcement.expires_at.isoformat() if announcement.expires_at else None,
            'created_by': {
                'id': str(announcement.created_by.id),
                'name': announcement.created_by.get_full_name(),
                'full_name': announcement.created_by.get_full_name(),
            } if announcement.created_by else None,
            'created_at': announcement.created_at.isoformat(),
        }
    
    @staticmethod
    def get_announcement_detail(announcement_id: str) -> dict:
        """Get detailed announcement information"""
        from .models import Announcement, AnnouncementTarget
        
        try:
            announcement = Announcement.objects.select_related('created_by').prefetch_related(
                'targets__school', 'targets__school_class', 'targets__user'
            ).get(id=announcement_id)
            
            # Format targets
            targets = []
            for target in announcement.targets.all():
                target_info = {'id': str(target.id)}
                if target.school:
                    target_info['type'] = 'school'
                    target_info['school'] = {'id': str(target.school.id), 'name': target.school.name}
                elif target.school_class:
                    target_info['type'] = 'class'
                    target_info['class'] = {'id': str(target.school_class.id), 'name': target.school_class.class_obj.name if target.school_class.class_obj else 'N/A'}
                elif target.user:
                    target_info['type'] = 'user'
                    target_info['user'] = {'id': str(target.user.id), 'name': target.user.get_full_name()}
                if target.target_roles:
                    target_info['target_roles'] = target.target_roles
                targets.append(target_info)
            
            return {
                **SuperAdminAnnouncementService._format_announcement(announcement),
                'targets': targets,
            }
        except Announcement.DoesNotExist:
            raise ValidationError('Announcement not found')
    
    @staticmethod
    @transaction.atomic
    def create_announcement(data: dict, created_by) -> dict:
        """Create a new announcement"""
        from .models import Announcement, AnnouncementTarget
        
        announcement = Announcement.objects.create(
            title=data['title'],
            content=data.get('content', ''),
            priority=data.get('priority', 'MEDIUM'),
            status=data.get('status', 'DRAFT'),
            expires_at=data.get('expires_at'),
            created_by=created_by,
        )
        
        # Create targets
        targets = data.get('targets', [])
        for target in targets:
            AnnouncementTarget.objects.create(
                announcement=announcement,
                school_id=target.get('school_id'),
                school_class_id=target.get('class_id'),
                user_id=target.get('user_id'),
                target_roles=target.get('target_roles'),
            )
        
        return SuperAdminAnnouncementService._format_announcement(announcement)
    
    @staticmethod
    def publish_announcement(announcement_id: str) -> dict:
        """Publish an announcement"""
        from .models import Announcement
        
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            announcement.publish()
            return SuperAdminAnnouncementService._format_announcement(announcement)
        except Announcement.DoesNotExist:
            raise ValidationError('Announcement not found')
    
    @staticmethod
    def archive_announcement(announcement_id: str) -> dict:
        """Archive an announcement"""
        from .models import Announcement
        
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            announcement.archive()
            return SuperAdminAnnouncementService._format_announcement(announcement)
        except Announcement.DoesNotExist:
            raise ValidationError('Announcement not found')
    
    @staticmethod
    def delete_announcement(announcement_id: str) -> bool:
        """Delete an announcement"""
        from .models import Announcement
        
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            announcement.delete()
            return True
        except Announcement.DoesNotExist:
            raise ValidationError('Announcement not found')


class SuperAdminTaskService:
    """Service class for super admin task operations (tasks for admins only)"""
    
    @staticmethod
    def get_all_tasks(page: int = 1, page_size: int = 20, filters: dict = None) -> dict:
        """Get paginated list of all admin tasks"""
        from .models import AdminTask
        
        queryset = AdminTask.objects.select_related(
            'assigned_to', 'school', 'created_by'
        ).order_by('-created_at')
        
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('priority'):
                queryset = queryset.filter(priority=filters['priority'])
            if filters.get('assigned_to'):
                queryset = queryset.filter(assigned_to_id=filters['assigned_to'])
            if filters.get('school_id'):
                queryset = queryset.filter(school_id=filters['school_id'])
            if filters.get('search'):
                search = filters['search']
                queryset = queryset.filter(
                    models.Q(title__icontains=search) |
                    models.Q(description__icontains=search)
                )
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        tasks = queryset[start:end]
        
        return {
            'tasks': [
                SuperAdminTaskService._format_task(t) for t in tasks
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    @staticmethod
    def _format_task(task) -> dict:
        """Format task data for API response"""
        return {
            'id': str(task.id),
            'title': task.title,
            'description': task.description,
            'priority': task.priority,
            'status': task.status,
            'assigned_to': {
                'id': str(task.assigned_to.id),
                'name': task.assigned_to.get_full_name(),
                'email': task.assigned_to.email,
            } if task.assigned_to else None,
            'school': {
                'id': str(task.school.id),
                'name': task.school.name,
            } if task.school else None,
            'created_by': {
                'id': str(task.created_by.id),
                'name': task.created_by.get_full_name(),
            } if task.created_by else None,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'created_at': task.created_at.isoformat(),
        }
    
    @staticmethod
    def get_task_detail(task_id: str) -> dict:
        """Get detailed task information with replies"""
        from .models import AdminTask
        
        try:
            task = AdminTask.objects.select_related(
                'assigned_to', 'school', 'created_by'
            ).prefetch_related('replies__replied_by').get(id=task_id)
            
            replies = [
                {
                    'id': str(r.id),
                    'message': r.message,
                    'replied_by': {
                        'id': str(r.replied_by.id),
                        'name': r.replied_by.get_full_name(),
                    } if r.replied_by else None,
                    'created_at': r.created_at.isoformat(),
                }
                for r in task.replies.all()
            ]
            
            return {
                **SuperAdminTaskService._format_task(task),
                'replies': replies,
            }
        except AdminTask.DoesNotExist:
            raise ValidationError('Task not found')
    
    @staticmethod
    def create_task(data: dict, created_by) -> dict:
        """Create a new admin task"""
        from .models import AdminTask
        from users.models import User
        from django.utils import timezone
        from datetime import datetime
        
        # Validate assigned_to is an admin
        try:
            assigned_user = User.objects.get(id=data['assigned_to'])
            if not hasattr(assigned_user, 'user_role') or assigned_user.user_role.role_type != 'ADMIN':
                raise ValidationError('Tasks can only be assigned to Admins')
        except User.DoesNotExist:
            raise ValidationError('Assigned user not found')
        
        # Parse due_date if provided as string
        due_date = data.get('due_date')
        if due_date and isinstance(due_date, str):
            try:
                # Handle datetime-local format (YYYY-MM-DDTHH:MM)
                if 'T' in due_date:
                    due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    if due_date.tzinfo is None:
                        due_date = timezone.make_aware(due_date)
                else:
                    due_date = None
            except (ValueError, TypeError):
                due_date = None
        
        task = AdminTask.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'MEDIUM'),
            assigned_to=assigned_user,
            school_id=data.get('school_id') or None,
            due_date=due_date,
            created_by=created_by,
        )
        
        return SuperAdminTaskService._format_task(task)
    
    @staticmethod
    def update_task_status(task_id: str, status: str) -> dict:
        """Update task status"""
        from .models import AdminTask
        from django.utils import timezone
        
        try:
            task = AdminTask.objects.get(id=task_id)
            task.status = status
            if status == 'COMPLETED':
                task.completed_at = timezone.now()
            task.save()
            return SuperAdminTaskService._format_task(task)
        except AdminTask.DoesNotExist:
            raise ValidationError('Task not found')
    
    @staticmethod
    def add_task_reply(task_id: str, message: str, replied_by) -> dict:
        """Add a reply to a task"""
        from .models import AdminTask, AdminTaskReply
        
        try:
            task = AdminTask.objects.get(id=task_id)
            reply = AdminTaskReply.objects.create(
                task=task,
                message=message,
                replied_by=replied_by,
            )
            return {
                'id': str(reply.id),
                'message': reply.message,
                'replied_by': {
                    'id': str(reply.replied_by.id),
                    'name': reply.replied_by.get_full_name(),
                } if reply.replied_by else None,
                'created_at': reply.created_at.isoformat(),
            }
        except AdminTask.DoesNotExist:
            raise ValidationError('Task not found')
    
    @staticmethod
    def delete_task(task_id: str) -> bool:
        """Delete a task"""
        from .models import AdminTask
        
        try:
            task = AdminTask.objects.get(id=task_id)
            task.delete()
            return True
        except AdminTask.DoesNotExist:
            raise ValidationError('Task not found')

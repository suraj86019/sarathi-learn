"""
Super Admin Models
Platform-wide management models
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class School(models.Model):
    """
    School Model
    Represents a government school in the system
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    PLAN_CHOICES = [
        ('BASIC', 'Basic'),
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # School Information
    name = models.CharField(max_length=255, help_text="Official name of the school")
    udise_code = models.CharField(
        max_length=11,
        unique=True,
        db_index=True,
        help_text="Unique District Information System for Education code (11 digits)"
    )
    
    # Contact Information
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=15, blank=True, null=True)
    principal_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Address
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, db_index=True)
    pincode = models.CharField(max_length=10)
    
    # School Details
    established_date = models.DateField(blank=True, null=True)
    board = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="e.g., CBSE, ICSE, State Board"
    )
    
    # Status & Plan
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='BASIC')
    
    # AI Configuration
    ai_quota_limit = models.IntegerField(
        default=100000,
        help_text="Monthly AI token quota for the entire school"
    )
    ai_quota_used = models.IntegerField(default=0)
    ai_quota_reset_date = models.DateField(blank=True, null=True)
    
    # Metadata
    total_students = models.IntegerField(default=0, help_text="Total number of students")
    total_teachers = models.IntegerField(default=0, help_text="Total number of teachers")
    total_admins = models.IntegerField(default=0, help_text="Total number of admins")
    
    # Approval
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_schools'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schools'
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
        ordering = ['name']
        indexes = [
            models.Index(fields=['udise_code']),
            models.Index(fields=['district', 'state']),
            models.Index(fields=['status']),
            models.Index(fields=['state']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.udise_code})"
    
    @property
    def total_users(self):
        """Get total number of users (admins + teachers + students)"""
        return self.total_admins + self.total_teachers + self.total_students
    
    @property
    def ai_quota_percentage(self):
        """Calculate AI quota usage percentage"""
        if self.ai_quota_limit > 0:
            return round((self.ai_quota_used / self.ai_quota_limit) * 100, 2)
        return 0
    
    def get_all_admins(self):
        """Get all admins associated with this school"""
        from admins.models import AdminProfile
        return AdminProfile.objects.filter(school=self).select_related('user')
    
    def get_all_teachers(self):
        """Get all teachers associated with this school"""
        from teachers.models import TeacherProfile
        return TeacherProfile.objects.filter(school=self).select_related('user')
    
    def get_all_students(self):
        """Get all students associated with this school"""
        from students.models import StudentProfile
        return StudentProfile.objects.filter(school=self).select_related('user')
    
    def get_all_users(self):
        """Get all users (admins, teachers, students) associated with this school"""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Get user IDs from SchoolUser relationships
        school_user_ids = self.school_users.filter(is_active=True).values_list('user_id', flat=True)

        # Return users
        return User.objects.filter(id__in=school_user_ids).select_related('user_role')


class SchoolUser(models.Model):
    """
    SchoolUser Model
    Many-to-Many relationship between Schools and Users
    Allows tracking of user associations with schools
    """
    
    ROLE_IN_SCHOOL_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('TEACHER', 'Teacher'),
        ('STUDENT', 'Student'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='school_users'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_schools'
    )
    role_in_school = models.CharField(max_length=20, choices=ROLE_IN_SCHOOL_CHOICES)
    is_active = models.BooleanField(default=True)
    joined_date = models.DateField(auto_now_add=True)
    left_date = models.DateField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'school_users'
        verbose_name = 'School User'
        verbose_name_plural = 'School Users'
        unique_together = ('school', 'user')  # A user can only have one record per school
        indexes = [
            models.Index(fields=['school', 'user']),
            models.Index(fields=['school', 'role_in_school']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} at {self.school.name} ({self.role_in_school})"


class Subject(models.Model):
    """
    Subject Model
    Represents academic subjects taught in schools
    """
    
    CATEGORY_CHOICES = [
        ('CORE', 'Core Subject'),
        ('ELECTIVE', 'Elective'),
        ('VOCATIONAL', 'Vocational'),
        ('EXTRA_CURRICULAR', 'Extra-Curricular'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text="Subject name (e.g., Mathematics)")
    code = models.CharField(max_length=20, unique=True, help_text="Subject code (e.g., MATH101)")
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='CORE')
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subjects'
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Class(models.Model):
    """
    Class Model (Template)
    Represents standard classes (Grade 1-12) that can be assigned to any school
    Subjects are linked to classes
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Class Information
    grade_number = models.IntegerField(unique=True, default=1, help_text="Grade/Class number (1-12)")
    name = models.CharField(max_length=50, help_text="Display name (e.g., 'Class 5', '5th Standard')")
    description = models.TextField(blank=True, null=True)
    
    # Subjects for this class
    subjects = models.ManyToManyField(
        Subject,
        through='ClassSubject',
        through_fields=('class_obj', 'subject'),
        related_name='classes',
        blank=True,
        help_text="Subjects taught in this class"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'classes'
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['grade_number']
    
    def __str__(self):
        return f"Class {self.grade_number}"
    
    @property
    def full_name(self):
        return self.name or f"Class {self.grade_number}"


class SchoolClass(models.Model):
    """
    Mapping between School and Class
    Links which classes a school offers
    Example: School A -> Class 1, Class 2, Class 5
             School B -> Class 5, Class 6, Class 7
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='school_classes'
    )
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='school_classes'
    )
    
    # Optional: Section for this school's class
    section = models.CharField(max_length=10, blank=True, null=True, help_text="Section (e.g., 'A', 'B', 'C')")
    
    # Class Details (school-specific)
    class_teacher = models.ForeignKey(
        'teachers.TeacherProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_classes',
        help_text="Class teacher/homeroom teacher"
    )
    room_number = models.CharField(max_length=20, blank=True, null=True)
    max_students = models.IntegerField(default=40, help_text="Maximum student capacity")
    current_students = models.IntegerField(default=0, help_text="Current number of students")
    
    # Academic Year
    academic_year = models.CharField(max_length=20, default='2024-2025', help_text="e.g., '2024-2025'")
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'school_classes'
        verbose_name = 'School Class'
        verbose_name_plural = 'School Classes'
        unique_together = ('school', 'class_obj', 'section', 'academic_year')
        ordering = ['school', 'class_obj__grade_number', 'section']
    
    def __str__(self):
        section_str = f" Section {self.section}" if self.section else ""
        return f"{self.school.name} - Class {self.class_obj.grade_number}{section_str}"
    
    @property
    def full_name(self):
        section_str = f" - Section {self.section}" if self.section else ""
        return f"Class {self.class_obj.grade_number}{section_str}"
    
    @property
    def is_full(self):
        return self.current_students >= self.max_students
    
    @property
    def available_seats(self):
        return max(0, self.max_students - self.current_students)
    
    @property
    def subjects(self):
        """Get subjects from the class template"""
        return self.class_obj.subjects.all()


class ClassSubject(models.Model):
    """
    Join table between Class and Subject
    Allows attaching many subjects to a class and tracking if they are core
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='class_subjects'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='class_subjects'
    )
    is_core = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    credits = models.IntegerField(default=0)
    weekly_hours = models.IntegerField(default=0)
    display_order = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_subjects'
        verbose_name = 'Class Subject'
        verbose_name_plural = 'Class Subjects'
        unique_together = ('class_obj', 'subject')
        ordering = ['class_obj', 'display_order', 'subject']
        indexes = [
            models.Index(fields=['class_obj', 'subject']),
            models.Index(fields=['subject']),
        ]

    def __str__(self):
        return f"{self.class_obj.full_name} -> {self.subject.name}"


class SuperAdminProfile(models.Model):
    """
    Super Admin Profile
    Extended profile for Super Administrator users
    """
    
    LEVEL_CHOICES = [
        ('NATIONAL', 'National Level'),
        ('STATE', 'State Level'),
        ('REGIONAL', 'Regional Level'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='superadmin_profile'
    )
    
    # Super Admin Specific Fields
    admin_level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='REGIONAL'
    )
    region = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Region/zone/state this super admin manages"
    )
    
    # Permissions
    can_create_admins = models.BooleanField(default=True)
    can_create_teachers = models.BooleanField(default=True)
    can_delete_users = models.BooleanField(default=True)
    can_manage_schools = models.BooleanField(default=True)
    can_view_platform_analytics = models.BooleanField(default=True)
    can_manage_system_settings = models.BooleanField(default=True)
    can_send_announcements = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'superadmin_profiles'
        verbose_name = 'Super Admin Profile'
        verbose_name_plural = 'Super Admin Profiles'
    
    def __str__(self):
        return f"Super Admin: {self.user.get_full_name()} ({self.admin_level})"


class PlatformAnalytics(models.Model):
    """
    Platform Analytics
    Daily snapshot of platform-wide metrics
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    snapshot_date = models.DateField(unique=True, db_index=True)
    
    # User Metrics
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    new_users_today = models.IntegerField(default=0)
    pending_users = models.IntegerField(default=0)
    
    # School Metrics
    total_schools = models.IntegerField(default=0)
    active_schools = models.IntegerField(default=0)
    new_schools_today = models.IntegerField(default=0)
    
    # Role-wise Breakdown
    total_students = models.IntegerField(default=0)
    total_teachers = models.IntegerField(default=0)
    total_admins = models.IntegerField(default=0)
    total_superadmins = models.IntegerField(default=0)
    
    # AI Metrics
    total_ai_queries_today = models.BigIntegerField(default=0)
    total_tokens_consumed_today = models.BigIntegerField(default=0)
    average_tokens_per_query = models.FloatField(default=0.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'platform_analytics'
        verbose_name = 'Platform Analytics'
        verbose_name_plural = 'Platform Analytics'
        ordering = ['-snapshot_date']
        indexes = [
            models.Index(fields=['-snapshot_date']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.snapshot_date}"


class SystemSettings(models.Model):
    """
    System Settings
    Platform-wide configuration settings
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    setting_key = models.CharField(max_length=100, unique=True, db_index=True)
    setting_value = models.TextField()
    setting_type = models.CharField(
        max_length=20,
        choices=[
            ('STRING', 'String'),
            ('INTEGER', 'Integer'),
            ('BOOLEAN', 'Boolean'),
            ('JSON', 'JSON'),
        ],
        default='STRING'
    )
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_settings_updates'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
        ordering = ['setting_key']
    
    def __str__(self):
        return self.setting_key


class Announcement(models.Model):
    """
    Announcements
    Platform-wide or targeted announcements
    """

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Content
    title = models.CharField(max_length=255)
    content = models.TextField(default='')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    is_active = models.BooleanField(default=True)

    # Dates
    published_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_announcements'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'announcements'
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['-published_at']),
            models.Index(fields=['status', 'is_active']),
        ]

    def __str__(self):
        return self.title

    def publish(self):
        """Publish the announcement"""
        self.status = 'PUBLISHED'
        self.published_at = timezone.now()
        self.save()

    def archive(self):
        """Archive the announcement"""
        self.status = 'ARCHIVED'
        self.is_active = False
        self.save()


class AnnouncementTarget(models.Model):
    """
    Announcement Targets
    Defines who should receive each announcement
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Announcement relationship
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name='targets'
    )

    # Target definition - determined by which field is set
    # School-level targeting
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcement_targets',
        help_text="Target all users in this school (school-level)"
    )

    # Class-level targeting
    school_class = models.ForeignKey(
        'SchoolClass',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcement_targets',
        help_text="Target all students in this class (class-level)"
    )

    # User-level targeting
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcement_targets',
        help_text="Target this specific user (user-level)"
    )

    # Role filtering (for school-level only)
    target_roles = models.JSONField(
        default=list,
        blank=True,
        help_text="For school targets: filter by roles ['STUDENT', 'TEACHER', 'ADMIN']"
    )

    # Status tracking
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'announcement_targets'
        verbose_name = 'Announcement Target'
        verbose_name_plural = 'Announcement Targets'
        indexes = [
            models.Index(fields=['announcement', 'school']),
            models.Index(fields=['announcement', 'school_class']),
            models.Index(fields=['announcement', 'user']),
            models.Index(fields=['school']),
            models.Index(fields=['school_class']),
            models.Index(fields=['user']),
            models.Index(fields=['is_sent']),
        ]

    def __str__(self):
        if self.school:
            return f"{self.announcement.title} → {self.school.name}"
        elif self.school_class:
            return f"{self.announcement.title} → {self.school_class.full_name}"
        elif self.user:
            return f"{self.announcement.title} → {self.user.get_full_name()}"
        else:
            return f"{self.announcement.title} → Invalid Target"

    @property
    def target_type(self):
        """Determine target type based on which field is set"""
        if self.school:
            return 'SCHOOL'
        elif self.school_class:
            return 'CLASS'
        elif self.user:
            return 'USER'
        return None

    def get_target_users(self):
        """
        Get the actual users this target should send to
        """
        from users.models import User, UserRole
        from students.models import StudentProfile

        if self.school:
            # School-level: Get all users associated with this school
            school_users = User.objects.filter(
                user_schools__school=self.school,
                user_schools__is_active=True,
                is_active=True
            ).select_related('user_role')

            # Filter by roles if specified
            if self.target_roles:
                school_users = school_users.filter(
                    user_role__role_type__in=self.target_roles
                )

            return school_users

        elif self.school_class:
            # Class-level: Get all students in this class
            student_user_ids = StudentProfile.objects.filter(
                school=self.school_class.school,
                current_class=self.school_class.class_obj
            ).values_list('user_id', flat=True)
            return User.objects.filter(id__in=student_user_ids, is_active=True)

        elif self.user:
            # User-level: Return the specific user
            return User.objects.filter(id=self.user.id, is_active=True)

        return User.objects.none()


class News(models.Model):
    """
    News Model
    Platform-wide news created by super admin
    Displayed to all users on the platform
    """
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="News headline")
    content = models.TextField(help_text="Full news content")
    summary = models.CharField(max_length=500, blank=True, null=True, help_text="Short summary for preview")
    
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Optional image
    image_url = models.URLField(blank=True, null=True, help_text="Cover image URL")
    
    # Publish settings
    published_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True, help_text="When the news should no longer be displayed")
    
    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_news'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'platform_news'
        verbose_name = 'News'
        verbose_name_plural = 'News'
        ordering = ['-published_at', '-created_at']
    
    def __str__(self):
        return self.title
    
    def publish(self):
        """Publish the news"""
        self.status = 'PUBLISHED'
        self.published_at = timezone.now()
        self.save()
    
    def archive(self):
        """Archive the news"""
        self.status = 'ARCHIVED'
        self.save()


class GovernmentScheme(models.Model):
    """
    Government Scheme / Event / Exam
    Platform-wide announcements about government programs, exams, scholarships, etc.
    Created by Super Admin
    """
    
    SCHEME_TYPE_CHOICES = [
        ('EXAM', 'Competitive Exam'),
        ('SCHOLARSHIP', 'Scholarship'),
        ('EVENT', 'Event'),
        ('PROGRAM', 'Government Program'),
        ('COMPETITION', 'Competition'),
        ('ADMISSION', 'Admission'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Scheme Details
    title = models.CharField(max_length=500)
    description = models.TextField()
    scheme_type = models.CharField(max_length=20, choices=SCHEME_TYPE_CHOICES, default='OTHER')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Eligibility & Requirements
    eligibility = models.TextField(blank=True, null=True, help_text="Who can apply/participate")
    requirements = models.TextField(blank=True, null=True, help_text="Documents or prerequisites needed")
    
    # Dates
    start_date = models.DateField(blank=True, null=True, help_text="Start date of the scheme/exam")
    end_date = models.DateField(blank=True, null=True, help_text="End date or deadline")
    application_deadline = models.DateField(blank=True, null=True)
    
    # Links
    official_link = models.URLField(blank=True, null=True, help_text="Official website or registration link")
    apply_link = models.URLField(blank=True, null=True, help_text="Direct application link")
    
    # Optional image
    image_url = models.URLField(blank=True, null=True)
    
    # Target audience
    target_classes = models.JSONField(
        default=list,
        blank=True,
        help_text="List of class names that this scheme is for (e.g., ['Class 10', 'Class 12']). Empty means all classes."
    )
    
    # Publish settings
    published_at = models.DateTimeField(blank=True, null=True)
    
    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_schemes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'government_schemes'
        verbose_name = 'Government Scheme'
        verbose_name_plural = 'Government Schemes'
        ordering = ['-priority', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'scheme_type']),
            models.Index(fields=['application_deadline']),
            models.Index(fields=['-priority', '-published_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_scheme_type_display()})"
    
    def publish(self):
        """Publish the scheme"""
        self.status = 'PUBLISHED'
        self.published_at = timezone.now()
        self.save()


class AdminTask(models.Model):
    """
    Tasks assigned by Super Admin to Admins only
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Task content
    title = models.CharField(max_length=255)
    description = models.TextField(default='')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Assigned to (Admin only)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_admin_tasks'
    )
    
    # Optionally assign to a specific school context
    school = models.ForeignKey(
        School,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_tasks'
    )
    
    # Created by (Super Admin)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_admin_tasks'
    )
    
    # Dates
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_tasks'
        verbose_name = 'Admin Task'
        verbose_name_plural = 'Admin Tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.assigned_to}"


class AdminTaskReply(models.Model):
    """
    Replies/Updates on Admin Tasks
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    task = models.ForeignKey(
        AdminTask,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    
    message = models.TextField()
    
    replied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_task_replies'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_task_replies'
        verbose_name = 'Admin Task Reply'
        verbose_name_plural = 'Admin Task Replies'
        ordering = ['created_at']

"""
Admin Serializers
Serializers for Admin models and API responses
"""

from rest_framework import serializers
from .models import AdminProfile
from users.serializers import UserSerializer
from django.utils import timezone


class AdminSchoolSerializer(serializers.ModelSerializer):
    """Serializer for AdminSchool model"""

    school_name = serializers.CharField(source='school.name', read_only=True)
    school_udise_code = serializers.CharField(source='school.udise_code', read_only=True)

    class Meta:
        from .models import AdminSchool
        model = AdminSchool
        fields = [
            'id', 'school', 'school_name', 'school_udise_code', 'is_primary',
            'can_add_teachers', 'can_remove_teachers', 'can_add_students',
            'can_approve_ai_quota', 'can_view_analytics', 'can_broadcast_announcements',
            'is_active', 'assigned_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'school_name', 'school_udise_code', 'assigned_at', 'updated_at'
        ]


class AdminProfileSerializer(serializers.ModelSerializer):
    """Serializer for AdminProfile model"""

    user = UserSerializer(read_only=True)
    schools_data = serializers.SerializerMethodField()
    schools_count = serializers.SerializerMethodField()
    primary_school_name = serializers.SerializerMethodField()

    class Meta:
        model = AdminProfile
        fields = [
            'id', 'user', 'schools', 'schools_data', 'schools_count',
            'primary_school_name', 'employee_id', 'designation', 'department',
            'can_add_teachers', 'can_remove_teachers', 'can_add_students',
            'can_approve_ai_quota', 'can_view_analytics', 'can_broadcast_announcements',
            'joined_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'schools_data', 'schools_count', 'primary_school_name',
            'joined_at', 'updated_at'
        ]

    def get_schools_data(self, obj):
        """Get detailed school data"""
        from .models import AdminSchool
        admin_schools = AdminSchool.objects.filter(
            admin=obj, is_active=True
        ).select_related('school')
        return AdminSchoolSerializer(admin_schools, many=True).data

    def get_schools_count(self, obj):
        return obj.schools.count()

    def get_primary_school_name(self, obj):
        primary_school = obj.get_primary_school()
        return primary_school.name if primary_school else None


class NotificationSerializer(serializers.Serializer):
    """Serializer for creating notifications"""

    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(choices=[
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('BOTH', 'Email and SMS')
    ])

    # Targeting options - flexible approach
    # School-level targeting
    target_schools = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text="List of school IDs for school-level notifications"
    )
    school_target_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('STUDENT', 'Students'),
            ('TEACHER', 'Teachers'),
            ('ADMIN', 'Admins')
        ]),
        required=False,
        allow_empty=True,
        help_text="Roles to target within schools (leave empty for all)"
    )

    # User-level targeting
    target_users = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text="List of specific user IDs"
    )

    # Legacy support (for backward compatibility)
    target_class_id = serializers.UUIDField(required=False, allow_null=True)
    target_user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )

    scheduled_date = serializers.DateTimeField(required=False)
    priority = serializers.ChoiceField(
        choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('URGENT', 'Urgent')],
        default='MEDIUM'
    )

    def validate(self, data):
        """Validate that at least one targeting method is provided"""
        has_schools = bool(data.get('target_schools'))
        has_users = bool(data.get('target_users'))
        has_legacy_class = bool(data.get('target_class_id'))
        has_legacy_users = bool(data.get('target_user_ids'))
        has_legacy_audience = bool(data.get('target_audience'))

        # Check if any targeting method is provided
        if not (has_schools or has_users or has_legacy_class or has_legacy_users or has_legacy_audience):
            raise serializers.ValidationError(
                "At least one targeting method must be provided: target_schools, target_users, "
                "target_class_id, target_user_ids, or target_audience"
            )

        return data


class TaskSerializer(serializers.Serializer):
    """Serializer for creating tasks"""

    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    task_type = serializers.ChoiceField(choices=[
        ('HOMEWORK', 'Homework'),
        ('ASSIGNMENT', 'Assignment'),
        ('PROJECT', 'Project'),
        ('ACTIVITY', 'Activity'),
        ('GENERAL', 'General Task')
    ])
    assigned_to_role = serializers.ChoiceField(choices=[
        ('STUDENT', 'Student'),
        ('TEACHER', 'Teacher')
    ])
    assigned_to_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
    subject_id = serializers.UUIDField(required=False, allow_null=True)
    due_date = serializers.DateTimeField()
    priority = serializers.ChoiceField(
        choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High')],
        default='MEDIUM'
    )
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True
    )


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard data"""

    profile = AdminProfileSerializer()
    school_stats = serializers.DictField()
    recent_activities = serializers.ListField()
    pending_approvals = serializers.IntegerField()
    ai_quota_usage = serializers.DictField()
    notifications_count = serializers.IntegerField()
    tasks_count = serializers.IntegerField()


class SchoolUserManagementSerializer(serializers.Serializer):
    """Serializer for managing school users"""

    user_id = serializers.UUIDField()
    role_in_school = serializers.ChoiceField(
        choices=[
            ('ADMIN', 'Administrator'),
            ('TEACHER', 'Teacher'),
            ('STUDENT', 'Student'),
        ]
    )
    is_active = serializers.BooleanField(default=True)


class BulkUserCreationSerializer(serializers.Serializer):
    """Serializer for bulk user creation"""

    users = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )


class UserActionSerializer(serializers.Serializer):
    """Serializer for user actions (activate, deactivate, remove)"""

    action = serializers.ChoiceField(choices=[
        ('ACTIVATE', 'Activate'),
        ('DEACTIVATE', 'Deactivate'),
        ('SUSPEND', 'Suspend'),
        ('REMOVE', 'Remove from School')
    ])
    reason = serializers.CharField(max_length=500, required=False)


class AIQuotaUpdateSerializer(serializers.Serializer):
    """Serializer for updating AI quota"""

    user_id = serializers.UUIDField()
    new_quota_limit = serializers.IntegerField(min_value=0)
    reason = serializers.CharField(max_length=255, required=False)


class AnalyticsDataSerializer(serializers.Serializer):
    """Serializer for analytics data"""

    period = serializers.ChoiceField(choices=[
        ('today', 'Today'),
        ('week', 'This Week'),
        ('month', 'This Month'),
        ('year', 'This Year'),
    ])
    metrics = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'user_registrations',
            'attendance_rates',
            'ai_usage',
            'homework_completion',
            'subject_performance',
            'notifications_sent',
            'tasks_created'
        ]),
        required=False
    )


class StudentReportSerializer(serializers.Serializer):
    """Serializer for student reports"""

    school_id = serializers.UUIDField(required=False, help_text="School ID (required if admin manages multiple schools)")
    student_id = serializers.UUIDField(required=False)
    class_id = serializers.UUIDField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    include_attendance = serializers.BooleanField(default=True)
    include_homework = serializers.BooleanField(default=True)
    include_ai_usage = serializers.BooleanField(default=True)


class TeacherReportSerializer(serializers.Serializer):
    """Serializer for teacher reports"""

    school_id = serializers.UUIDField(required=False, help_text="School ID (required if admin manages multiple schools)")
    teacher_id = serializers.UUIDField(required=False)
    subject_id = serializers.UUIDField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    include_attendance = serializers.BooleanField(default=True)
    include_classes = serializers.BooleanField(default=True)
    include_homework = serializers.BooleanField(default=True)


class SchoolReportSerializer(serializers.Serializer):
    """Serializer for school reports"""

    school_id = serializers.UUIDField(required=False, help_text="School ID (required if admin manages multiple schools)")
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    include_students = serializers.BooleanField(default=True)
    include_teachers = serializers.BooleanField(default=True)
    include_attendance = serializers.BooleanField(default=True)
    include_ai_usage = serializers.BooleanField(default=True)
    include_notifications = serializers.BooleanField(default=True)

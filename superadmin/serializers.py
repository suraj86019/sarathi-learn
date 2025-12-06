"""
Super Admin Serializers
"""

from rest_framework import serializers
from .models import School, Subject, Class, SchoolUser, Announcement, AnnouncementTarget, SystemSettings
from users.serializers import UserSerializer


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model"""
    
    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'description', 'category',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School model"""
    
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    ai_quota_percentage = serializers.FloatField(read_only=True)
    total_users = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'udise_code', 'contact_email', 'contact_phone',
            'principal_name', 'address', 'city', 'district', 'state', 'pincode',
            'established_date', 'board', 'status', 'plan_type',
            'ai_quota_limit', 'ai_quota_used', 'ai_quota_reset_date',
            'total_students', 'total_teachers', 'total_admins',
            'approved_by', 'approved_by_name', 'approved_at',
            'ai_quota_percentage', 'total_users',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'approved_by_name', 'ai_quota_percentage', 
            'total_users', 'created_at', 'updated_at'
        ]


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model"""
    
    school_name = serializers.CharField(source='school.name', read_only=True)
    class_teacher_name = serializers.CharField(source='class_teacher.user.get_full_name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    available_seats = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Class
        fields = [
            'id', 'school', 'school_name', 'name', 'grade', 'section',
            'class_teacher', 'class_teacher_name', 'room_number',
            'max_students', 'current_students', 'academic_year', 'is_active',
            'full_name', 'is_full', 'available_seats',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'school_name', 'class_teacher_name', 'full_name',
            'is_full', 'available_seats', 'created_at', 'updated_at'
        ]


class SchoolUserSerializer(serializers.ModelSerializer):
    """Serializer for SchoolUser model"""
    
    school_name = serializers.CharField(source='school.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SchoolUser
        fields = [
            'id', 'school', 'school_name', 'user', 'user_name', 'user_email',
            'role_in_school', 'is_active', 'joined_date', 'left_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'school_name', 'user_name', 'user_email',
            'created_at', 'updated_at'
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for Announcement model"""

    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    targets_count = serializers.SerializerMethodField()
    sent_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'status', 'is_active',
            'published_at', 'expires_at', 'created_by', 'created_by_name',
            'targets_count', 'sent_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by_name', 'targets_count', 'sent_count',
            'created_at', 'updated_at'
        ]

    def get_targets_count(self, obj):
        return obj.targets.count()

    def get_sent_count(self, obj):
        return obj.targets.filter(is_sent=True).count()


class AnnouncementTargetSerializer(serializers.ModelSerializer):
    """Serializer for AnnouncementTarget model"""

    school_name = serializers.CharField(source='school.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.user_role.role_type', read_only=True)
    announcement_title = serializers.CharField(source='announcement.title', read_only=True)
    target_type = serializers.CharField(read_only=True)  # Computed property

    class Meta:
        model = AnnouncementTarget
        fields = [
            'id', 'announcement', 'announcement_title', 'target_type',
            'school', 'school_name', 'user', 'user_name', 'user_email',
            'user_role', 'target_roles', 'is_sent', 'sent_at',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'school_name', 'user_name', 'user_email', 'user_role',
            'announcement_title', 'target_type', 'is_sent', 'sent_at',
            'error_message', 'created_at', 'updated_at'
        ]


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SystemSettings model"""
    
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = SystemSettings
        fields = [
            'id', 'setting_key', 'setting_value', 'setting_type',
            'description', 'is_active', 'updated_by', 'updated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_by_name', 'created_at', 'updated_at']

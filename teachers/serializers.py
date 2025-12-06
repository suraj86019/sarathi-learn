"""
Teacher Serializers
Serializers for teacher-related models
"""

from rest_framework import serializers
from .models import (
    TeacherProfile, TeacherSubject, TeacherClassAssignment,
    ClassSchedule, Attendance
)
from users.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested representation"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'status', 'is_active']

    def get_full_name(self, obj):
        return obj.get_full_name()


class TeacherSubjectSerializer(serializers.ModelSerializer):
    """Serializer for teacher subjects"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = TeacherSubject
        fields = ['id', 'subject', 'subject_name', 'subject_code', 'is_primary', 'years_teaching']


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for teacher profile"""
    user = UserBasicSerializer(read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    subjects_count = serializers.SerializerMethodField()
    classes_count = serializers.SerializerMethodField()
    teacher_subjects = TeacherSubjectSerializer(many=True, read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user', 'school', 'school_name', 'employee_id',
            'primary_subject', 'qualification', 'experience_years',
            'specialization', 'certifications',
            'can_mark_attendance', 'can_assign_homework', 'can_grade_assignments',
            'subjects_count', 'classes_count', 'teacher_subjects',
            'created_at', 'updated_at'
        ]

    def get_subjects_count(self, obj):
        return obj.subjects.count()

    def get_classes_count(self, obj):
        return obj.class_assignments.filter(is_active=True).count()


class TeacherProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for teacher list views"""
    user = UserBasicSerializer(read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    subjects_count = serializers.SerializerMethodField()
    classes_count = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user', 'school', 'school_name', 'employee_id',
            'qualification', 'experience_years',
            'subjects_count', 'classes_count',
            'created_at'
        ]

    def get_subjects_count(self, obj):
        return obj.subjects.count()

    def get_classes_count(self, obj):
        return obj.class_assignments.filter(is_active=True).count()


class TeacherClassAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for teacher class assignments"""
    class_name = serializers.CharField(source='school_class.full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)

    class Meta:
        model = TeacherClassAssignment
        fields = [
            'id', 'teacher', 'teacher_name', 'school_class', 'class_name',
            'subject', 'subject_name', 'academic_year', 'is_active',
            'created_at', 'updated_at'
        ]


class ClassScheduleSerializer(serializers.ModelSerializer):
    """Serializer for class schedules"""
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    class_name = serializers.CharField(source='teacher_assignment.school_class.full_name', read_only=True)
    subject_name = serializers.CharField(source='teacher_assignment.subject.name', read_only=True)

    class Meta:
        model = ClassSchedule
        fields = [
            'id', 'teacher_assignment', 'day_of_week', 'day_name',
            'start_time', 'end_time', 'room_number',
            'class_name', 'subject_name',
            'created_at', 'updated_at'
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance records"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    class_name = serializers.CharField(source='school_class.full_name', read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'school_class', 'class_name',
            'date', 'status', 'marked_by', 'marked_by_name', 'marked_at', 'remarks'
        ]

    def get_marked_by_name(self, obj):
        if obj.marked_by:
            return obj.marked_by.user.get_full_name()
        return None


class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating attendance records"""

    class Meta:
        model = Attendance
        fields = ['student', 'school_class', 'date', 'status', 'remarks']


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance marking"""
    school_class = serializers.UUIDField()
    date = serializers.DateField()
    attendance_records = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

    def validate_attendance_records(self, value):
        """Validate attendance records format"""
        for record in value:
            if 'student_id' not in record or 'status' not in record:
                raise serializers.ValidationError(
                    "Each record must have 'student_id' and 'status'"
                )
            if record['status'] not in ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']:
                raise serializers.ValidationError(
                    f"Invalid status: {record['status']}"
                )
        return value


class TeacherDashboardSerializer(serializers.Serializer):
    """Serializer for teacher dashboard data"""
    teacher = TeacherProfileSerializer()
    today_classes = ClassScheduleSerializer(many=True)
    pending_attendance = serializers.IntegerField()
    total_students = serializers.IntegerField()
    recent_activities = serializers.ListField()


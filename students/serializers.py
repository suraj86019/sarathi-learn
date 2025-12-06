"""
Student Serializers
Serializers for Student models and API responses
"""

from rest_framework import serializers
from .models import StudentProfile, StudentSubject, Homework
from users.serializers import UserSerializer


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile model"""

    user = UserSerializer(read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    class_section = serializers.CharField(source='current_class.section', read_only=True)
    full_class_name = serializers.CharField(read_only=True)
    ai_quota_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'school', 'school_name', 'udise_student_id',
            'roll_no', 'current_class', 'class_name', 'class_section',
            'full_class_name', 'parent_name', 'parent_phone', 'parent_email',
            'ai_quota_limit', 'ai_quota_used', 'ai_quota_percentage',
            'enrollment_date', 'academic_year', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'school_name', 'class_name', 'class_section',
            'full_class_name', 'ai_quota_percentage', 'created_at', 'updated_at'
        ]


class StudentSubjectSerializer(serializers.ModelSerializer):
    """Serializer for StudentSubject model"""

    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)

    class Meta:
        model = StudentSubject
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name',
            'subject_code', 'teacher', 'teacher_name', 'academic_year',
            'is_active', 'current_grade', 'attendance_percentage',
            'enrolled_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student_name', 'subject_name', 'subject_code',
            'teacher_name', 'enrolled_at', 'updated_at'
        ]


class HomeworkSerializer(serializers.ModelSerializer):
    """Serializer for Homework model"""

    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Homework
        fields = [
            'id', 'student', 'student_name', 'assigned_by', 'assigned_by_name',
            'subject', 'subject_name', 'subject_code', 'title', 'description',
            'assigned_date', 'due_date', 'submitted_date', 'status',
            'submission_text', 'submission_file', 'grade', 'feedback', 'is_overdue'
        ]
        read_only_fields = [
            'id', 'student_name', 'assigned_by_name', 'subject_name',
            'subject_code', 'assigned_date', 'is_overdue'
        ]

    def get_is_overdue(self, obj):
        """Check if homework is overdue"""
        from django.utils import timezone
        return obj.due_date < timezone.now().date() and obj.status != 'GRADED'


class StudentDashboardSerializer(serializers.Serializer):
    """Serializer for student dashboard data"""

    profile = StudentProfileSerializer()
    pending_homework = serializers.IntegerField()
    completed_homework = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
    ai_quota_used = serializers.IntegerField()
    ai_quota_limit = serializers.IntegerField()
    ai_quota_percentage = serializers.FloatField()
    subjects_count = serializers.IntegerField()


class StudentHomeworkSubmissionSerializer(serializers.Serializer):
    """Serializer for homework submission"""

    submission_text = serializers.CharField(required=False, allow_blank=True)
    submission_file = serializers.FileField(required=False, allow_null=True)

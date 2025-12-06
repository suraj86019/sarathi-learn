"""
Student Models
Student profiles and related data
"""

from django.db import models
from django.conf import settings
import uuid


class StudentProfile(models.Model):
    """
    Student Profile
    Extended profile for Student users
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    
    # School Association
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='students',
        null=True,  # Allow null for self-registering students
        blank=True,
        help_text="The school this student belongs to (assigned during approval)"
    )
    
    # Student Specific Fields
    udise_student_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique UDISE Student ID (Required - 21 digits)"
    )
    roll_no = models.CharField(max_length=50, blank=True, null=True, help_text="Roll number")
    
    # Class Association - Link to Class Model
    current_class = models.ForeignKey(
        'superadmin.Class',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        help_text="Current class/grade the student is enrolled in"
    )
    
    # Legacy class fields (kept for backward compatibility)
    class_name = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="e.g., 10 (legacy field, use current_class instead)"
    )
    section = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="e.g., A, B, C (legacy field, use current_class instead)"
    )
    
    # Parent/Guardian Information
    parent_name = models.CharField(max_length=200, blank=True, null=True)
    parent_phone = models.CharField(max_length=20, blank=True, null=True)
    parent_email = models.EmailField(blank=True, null=True)
    
    # AI Quota
    ai_quota_limit = models.IntegerField(default=100, help_text="Monthly AI query quota")
    ai_quota_used = models.IntegerField(default=0)
    ai_quota_reset_date = models.DateField(blank=True, null=True)
    
    # Academic
    enrollment_date = models.DateField(blank=True, null=True)
    academic_year = models.CharField(max_length=20, blank=True, null=True, help_text="e.g., '2024-2025'")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_profiles'
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'
        indexes = [
            models.Index(fields=['udise_student_id']),
            models.Index(fields=['school']),
            models.Index(fields=['current_class']),
        ]
    
    def __str__(self):
        if self.current_class:
            return f"{self.user.get_full_name()} - {self.current_class.full_name} - {self.school.name if self.school else 'No School'}"
        return f"{self.user.get_full_name()} - {self.school.name if self.school else 'No School'}"
    
    @property
    def ai_quota_percentage(self):
        """Calculate AI quota usage percentage"""
        if self.ai_quota_limit > 0:
            return round((self.ai_quota_used / self.ai_quota_limit) * 100, 2)
        return 0
    
    @property
    def full_class_name(self):
        """Get full class name"""
        if self.current_class:
            return self.current_class.full_name
        elif self.class_name and self.section:
            return f"Grade {self.class_name} - Section {self.section}"
        return "Not Assigned"


class StudentSubject(models.Model):
    """
    Student-Subject Enrollment
    Links students with subjects they are enrolled in
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='subject_enrollments'
    )
    subject = models.ForeignKey(
        'superadmin.Subject',
        on_delete=models.CASCADE,
        related_name='enrolled_students'
    )
    teacher = models.ForeignKey(
        'teachers.TeacherProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_subject_teachings'
    )
    
    # Enrollment Details
    academic_year = models.CharField(max_length=20, help_text="e.g., '2024-2025'")
    is_active = models.BooleanField(default=True)
    
    # Performance (optional)
    current_grade = models.CharField(max_length=10, blank=True, null=True)
    attendance_percentage = models.FloatField(default=0.0)
    
    # Timestamps
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_subjects'
        verbose_name = 'Student Subject Enrollment'
        verbose_name_plural = 'Student Subject Enrollments'
        unique_together = ('student', 'subject', 'academic_year')
        indexes = [
            models.Index(fields=['student', 'subject']),
            models.Index(fields=['academic_year']),
        ]
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} enrolled in {self.subject.name}"


class Homework(models.Model):
    """
    Homework Assignments
    """
    
    STATUS_CHOICES = [
        ('ASSIGNED', 'Assigned'),
        ('SUBMITTED', 'Submitted'),
        ('GRADED', 'Graded'),
        ('LATE', 'Late Submission'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='homework'
    )
    assigned_by = models.ForeignKey(
        'teachers.TeacherProfile',
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_homework'
    )
    
    # Subject
    subject = models.ForeignKey(
        'superadmin.Subject',
        on_delete=models.CASCADE,
        related_name='homework_assignments'
    )
    
    # Homework Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Dates
    assigned_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    submitted_date = models.DateTimeField(blank=True, null=True)
    
    # Submission
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ASSIGNED')
    submission_text = models.TextField(blank=True, null=True)
    submission_file = models.FileField(upload_to='homework_submissions/', blank=True, null=True)
    
    # Grading
    grade = models.CharField(max_length=10, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'homework'
        verbose_name = 'Homework'
        verbose_name_plural = 'Homework Assignments'
        ordering = ['-assigned_date']
        indexes = [
            models.Index(fields=['student', '-assigned_date']),
            models.Index(fields=['status']),
            models.Index(fields=['subject']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.student.user.get_full_name()}"

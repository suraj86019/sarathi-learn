"""
Teacher Models
Teacher profiles and related data
"""

from django.db import models
from django.conf import settings
import uuid


class TeacherProfile(models.Model):
    """
    Teacher Profile
    Extended profile for Teacher users
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teacher_profile'
    )
    
    # School Association
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='teacher_profiles'
    )
    
    # Teacher Specific Fields
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique employee ID"
    )
    
    # Primary Subject (kept for backward compatibility)
    primary_subject = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Primary subject taught (legacy field)"
    )
    
    # Subject Relationships - Many-to-Many
    subjects = models.ManyToManyField(
        'superadmin.Subject',
        through='TeacherSubject',
        related_name='teachers',
        help_text="Subjects taught by this teacher"
    )
    
    # Qualifications
    qualification = models.CharField(max_length=200, blank=True, null=True)
    experience_years = models.IntegerField(default=0, help_text="Years of teaching experience")
    
    # Additional Info
    specialization = models.CharField(max_length=200, blank=True, null=True)
    certifications = models.JSONField(default=list, blank=True, help_text="List of certifications")
    
    # Permissions
    can_mark_attendance = models.BooleanField(default=True)
    can_assign_homework = models.BooleanField(default=True)
    can_grade_assignments = models.BooleanField(default=True)
    
    # Primary Class for Attendance (the class this teacher takes attendance for)
    attendance_class = models.ForeignKey(
        'superadmin.Class',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_teachers',
        help_text="The class this teacher is assigned to take attendance for"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_profiles'
        verbose_name = 'Teacher Profile'
        verbose_name_plural = 'Teacher Profiles'
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['school']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.school.name}"
    
    def get_subjects(self):
        """Get all subjects taught by this teacher"""
        return self.subjects.all()
    
    def get_classes(self):
        """Get all classes taught by this teacher"""
        return self.class_assignments.select_related('school_class', 'subject').all()


class TeacherSubject(models.Model):
    """
    Teacher-Subject Relationship
    Links teachers with subjects they teach
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='teacher_subjects'
    )
    subject = models.ForeignKey(
        'superadmin.Subject',
        on_delete=models.CASCADE,
        related_name='subject_teachers'
    )
    
    # Additional details
    is_primary = models.BooleanField(default=False, help_text="Is this the teacher's primary subject?")
    years_teaching = models.IntegerField(default=0, help_text="Years teaching this subject")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_subjects'
        verbose_name = 'Teacher Subject'
        verbose_name_plural = 'Teacher Subjects'
        unique_together = ('teacher', 'subject')
        indexes = [
            models.Index(fields=['teacher', 'subject']),
        ]
    
    def __str__(self):
        return f"{self.teacher.user.get_full_name()} teaches {self.subject.name}"


class TeacherClassAssignment(models.Model):
    """
    Teacher Class Assignment
    Links teachers with classes they teach for specific subjects
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='class_assignments'
    )
    school_class = models.ForeignKey(
        'superadmin.Class',
        on_delete=models.CASCADE,
        related_name='teacher_assignments'
    )
    subject = models.ForeignKey(
        'superadmin.Subject',
        on_delete=models.CASCADE,
        related_name='class_teacher_assignments'
    )
    
    # Schedule
    academic_year = models.CharField(max_length=20, help_text="e.g., '2024-2025'")
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_class_assignments'
        verbose_name = 'Teacher Class Assignment'
        verbose_name_plural = 'Teacher Class Assignments'
        unique_together = ('school_class', 'subject', 'academic_year')  # One teacher per subject per class per year
        indexes = [
            models.Index(fields=['teacher', 'school_class']),
            models.Index(fields=['school_class', 'subject']),
            models.Index(fields=['academic_year']),
        ]
    
    def __str__(self):
        return f"{self.teacher.user.get_full_name()} teaches {self.subject.name} to {self.school_class.full_name}"


class ClassSchedule(models.Model):
    """
    Class Schedule
    Daily class schedule for teachers
    """
    
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher_assignment = models.ForeignKey(
        TeacherClassAssignment,
        on_delete=models.CASCADE,
        related_name='schedules'
    )
    
    # Schedule Details
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'class_schedules'
        verbose_name = 'Class Schedule'
        verbose_name_plural = 'Class Schedules'
        ordering = ['day_of_week', 'start_time']
        indexes = [
            models.Index(fields=['teacher_assignment', 'day_of_week']),
        ]
    
    def __str__(self):
        return f"{self.teacher_assignment.school_class.full_name} - {self.teacher_assignment.subject.name} - {self.get_day_of_week_display()}"


class Attendance(models.Model):
    """
    Attendance
    Student attendance records
    """
    
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    school_class = models.ForeignKey(
        'superadmin.Class',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # Marked by
    marked_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marked_attendance'
    )
    marked_at = models.DateTimeField(auto_now_add=True)
    
    # Additional info
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'attendance'
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance'
        unique_together = ('student', 'date')  # One attendance record per student per day
        ordering = ['-date']
        indexes = [
            models.Index(fields=['student', '-date']),
            models.Index(fields=['school_class', 'date']),
            models.Index(fields=['date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.date} - {self.status}"


class TeacherTask(models.Model):
    """
    Teacher Task
    Tasks assigned to teachers by admins with reply/comment functionality
    """
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CLOSED', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Task Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    
    # Assigned To
    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='assigned_tasks'
    )
    
    # Assigned By (Admin)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_teacher_tasks'
    )
    
    # School Reference (for filtering)
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='teacher_tasks'
    )
    
    # Dates
    due_date = models.DateField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_teacher_tasks'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_tasks'
        verbose_name = 'Teacher Task'
        verbose_name_plural = 'Teacher Tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['teacher', 'status']),
            models.Index(fields=['school', 'status']),
            models.Index(fields=['assigned_by', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.teacher.user.get_full_name()}"
    
    @property
    def replies_count(self):
        return self.replies.count()
    
    @property
    def last_reply(self):
        return self.replies.order_by('-created_at').first()


class TeacherTaskReply(models.Model):
    """
    Teacher Task Reply
    Replies/comments on teacher tasks - can be from teacher or admin
    """
    
    REPLY_TYPE_CHOICES = [
        ('TEACHER', 'Teacher Reply'),
        ('ADMIN', 'Admin Reply'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Parent Task
    task = models.ForeignKey(
        TeacherTask,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    
    # Reply Details
    content = models.TextField()
    reply_type = models.CharField(max_length=10, choices=REPLY_TYPE_CHOICES)
    
    # Reply By
    replied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='teacher_task_replies'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_task_replies'
        verbose_name = 'Teacher Task Reply'
        verbose_name_plural = 'Teacher Task Replies'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['task', 'created_at']),
        ]
    
    def __str__(self):
        return f"Reply by {self.replied_by.get_full_name() if self.replied_by else 'Unknown'} on {self.task.title}"


class SchoolHoliday(models.Model):
    """
    School Holiday
    Track holidays for calendar display
    """
    
    HOLIDAY_TYPE_CHOICES = [
        ('PUBLIC', 'Public Holiday'),
        ('SCHOOL', 'School Holiday'),
        ('EXAM', 'Exam Period'),
        ('VACATION', 'Vacation'),
        ('OTHER', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='holidays'
    )
    
    date = models.DateField(db_index=True)
    name = models.CharField(max_length=200)
    holiday_type = models.CharField(max_length=20, choices=HOLIDAY_TYPE_CHOICES, default='PUBLIC')
    description = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'school_holidays'
        verbose_name = 'School Holiday'
        verbose_name_plural = 'School Holidays'
        unique_together = ('school', 'date')
        ordering = ['date']
        indexes = [
            models.Index(fields=['school', 'date']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.date} ({self.school.name})"

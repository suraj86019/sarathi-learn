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
    can_update_pii = models.BooleanField(default=False, help_text="Can update student Personally Identifiable Information")
    
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


class StudentTask(models.Model):
    """
    Student Task
    Tasks/notes created by teachers for students
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
    
    TYPE_CHOICES = [
        ('TASK', 'Task'),
        ('NOTE', 'Note'),
        ('REMINDER', 'Reminder'),
        ('HOMEWORK', 'Homework'),
        ('FOLLOWUP', 'Follow-up'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Task Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    task_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TASK')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    
    # Student Reference
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='student_tasks'
    )
    
    # Created By (Teacher)
    created_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_student_tasks'
    )
    
    # School Reference
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='student_tasks'
    )
    
    # Dates
    due_date = models.DateField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_tasks'
        verbose_name = 'Student Task'
        verbose_name_plural = 'Student Tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['school', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.student.user.get_full_name()}"


class StudentTaskReply(models.Model):
    """
    Student Task Reply
    Replies/responses to student tasks from either student or teacher
    """
    
    REPLY_TYPE_CHOICES = [
        ('STUDENT', 'Student Reply'),
        ('TEACHER', 'Teacher Reply'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    task = models.ForeignKey(
        StudentTask,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    
    content = models.TextField()
    reply_type = models.CharField(max_length=10, choices=REPLY_TYPE_CHOICES)
    
    # Who replied
    replied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='student_task_replies'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_task_replies'
        verbose_name = 'Student Task Reply'
        verbose_name_plural = 'Student Task Replies'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply to {self.task.title} by {self.replied_by.get_full_name() if self.replied_by else 'Unknown'}"


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


class Activity(models.Model):
    """
    Activity
    Activities created by teachers for classes or individual students
    """
    
    LEVEL_CHOICES = [
        ('CLASS', 'Class Level'),
        ('STUDENT', 'Student Level'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Activity Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='CLASS')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Subject Reference
    subject = models.ForeignKey(
        'superadmin.Subject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    
    # Class Reference (for CLASS level activities)
    school_class = models.ForeignKey(
        'superadmin.Class',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activities'
    )
    
    # Student Reference (for STUDENT level activities)
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assigned_activities'
    )
    
    # School Reference
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='activities'
    )
    
    # Meeting Links
    google_meet_link = models.URLField(max_length=500, blank=True, null=True)
    zoom_link = models.URLField(max_length=500, blank=True, null=True)
    other_link = models.URLField(max_length=500, blank=True, null=True)
    link_label = models.CharField(max_length=100, blank=True, null=True, help_text="Label for other_link")
    
    # Schedule
    scheduled_date = models.DateField(blank=True, null=True)
    scheduled_time = models.TimeField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    
    # Created By
    created_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_activities'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'activities'
        verbose_name = 'Activity'
        verbose_name_plural = 'Activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school_class', '-created_at']),
            models.Index(fields=['school', '-created_at']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['level', 'status']),
            models.Index(fields=['scheduled_date']),
        ]
    
    def __str__(self):
        if self.level == 'CLASS':
            return f"{self.title} - {self.school_class.full_name if self.school_class else 'No Class'}"
        return f"{self.title} - {self.student.user.get_full_name() if self.student else 'No Student'}"
    
    @property
    def submissions_count(self):
        return self.submissions.count()
    
    @property
    def completed_submissions_count(self):
        return self.submissions.filter(status='COMPLETED').count()


class ActivitySubmission(models.Model):
    """
    Activity Submission
    Student submissions/responses to activities
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUBMITTED', 'Submitted'),
        ('COMPLETED', 'Completed'),
        ('LATE', 'Late Submission'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Activity Reference
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    
    # Student Reference
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='activity_submissions'
    )
    
    # Submission Details
    response = models.TextField(blank=True, null=True, help_text="Student's response/answer")
    attachment_url = models.URLField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Grading (optional)
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    graded_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_submissions'
    )
    graded_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'activity_submissions'
        verbose_name = 'Activity Submission'
        verbose_name_plural = 'Activity Submissions'
        unique_together = ('activity', 'student')
        ordering = ['-submitted_at', '-created_at']
        indexes = [
            models.Index(fields=['activity', 'status']),
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.activity.title}"


class Report(models.Model):
    """
    Report/Progress Card
    Created by teacher for a class (e.g., Half Yearly Exam, Annual Exam)
    """
    
    REPORT_TYPE_CHOICES = [
        ('EXAM', 'Exam Report'),
        ('PROGRESS', 'Progress Report'),
        ('ASSESSMENT', 'Assessment'),
        ('QUARTERLY', 'Quarterly Report'),
        ('HALF_YEARLY', 'Half Yearly Report'),
        ('ANNUAL', 'Annual Report'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Info
    name = models.CharField(max_length=255, help_text="e.g., Half Yearly Exam 2024")
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES, default='EXAM')
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Class Reference
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='reports'
    )
    class_ref = models.ForeignKey(
        'superadmin.Class',
        on_delete=models.CASCADE,
        related_name='reports'
    )
    
    # Academic Period
    academic_year = models.CharField(max_length=20, default='2024-2025')
    exam_date = models.DateField(blank=True, null=True)
    
    # Subjects included in this report (stored as JSON)
    subjects = models.JSONField(
        default=list,
        help_text="List of subject objects: [{id, name, max_marks}]"
    )
    
    # Created by
    created_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'reports'
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'class_ref', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['report_type', 'academic_year']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.class_ref.name}"


class StudentMark(models.Model):
    """
    Student marks for a report
    Stores individual subject marks for each student
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Report Reference
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='student_marks'
    )
    
    # Student Reference
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='report_marks'
    )
    
    # Marks stored as JSON: {subject_id: {marks: 85, max_marks: 100, grade: 'A'}}
    marks = models.JSONField(
        default=dict,
        help_text="Subject-wise marks: {subject_id: {marks: 85, max_marks: 100}}"
    )
    
    # Calculated fields (updated on save)
    total_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    total_max_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True, null=True)
    rank = models.PositiveIntegerField(blank=True, null=True)
    
    # Teacher remarks
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_marks'
        verbose_name = 'Student Mark'
        verbose_name_plural = 'Student Marks'
        unique_together = ('report', 'student')
        ordering = ['-percentage', 'student__roll_no']
        indexes = [
            models.Index(fields=['report', '-percentage']),
            models.Index(fields=['student', '-created_at']),
        ]
    
    def calculate_totals(self):
        """Calculate total marks, max marks, percentage, and grade"""
        total = 0
        max_total = 0
        for subject_id, data in self.marks.items():
            if isinstance(data, dict):
                total += float(data.get('marks', 0) or 0)
                max_total += float(data.get('max_marks', 100) or 100)
        
        self.total_marks = total
        self.total_max_marks = max_total
        
        if max_total > 0:
            self.percentage = (total / max_total) * 100
            # Calculate grade based on percentage
            if self.percentage >= 90:
                self.grade = 'A+'
            elif self.percentage >= 80:
                self.grade = 'A'
            elif self.percentage >= 70:
                self.grade = 'B+'
            elif self.percentage >= 60:
                self.grade = 'B'
            elif self.percentage >= 50:
                self.grade = 'C'
            elif self.percentage >= 40:
                self.grade = 'D'
            else:
                self.grade = 'F'
        else:
            self.percentage = 0
            self.grade = 'N/A'
    
    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.report.name}"

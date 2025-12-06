"""
Admin Models
School Admin profiles and management
"""

from django.db import models
from django.conf import settings
import uuid


class AdminProfile(models.Model):
    """
    Admin Profile
    Extended profile for School Admin users
    Admins can manage multiple schools
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_profile'
    )

    # Multiple Schools Association (Admin can manage multiple schools)
    schools = models.ManyToManyField(
        'superadmin.School',
        through='AdminSchool',
        related_name='admins',
        help_text="Schools this admin manages"
    )

    # Admin Specific Fields
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique employee ID"
    )
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    # Global Permissions (can be overridden at school level)
    can_add_teachers = models.BooleanField(default=True)
    can_remove_teachers = models.BooleanField(default=True)
    can_add_students = models.BooleanField(default=True)
    can_approve_ai_quota = models.BooleanField(default=True)
    can_view_analytics = models.BooleanField(default=True)
    can_broadcast_announcements = models.BooleanField(default=True)

    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_profiles'
        verbose_name = 'Admin Profile'
        verbose_name_plural = 'Admin Profiles'
        indexes = [
            models.Index(fields=['employee_id']),
        ]

    def __str__(self):
        school_count = self.schools.count()
        if school_count == 1:
            return f"{self.user.get_full_name()} - Admin at {self.schools.first().name}"
        return f"{self.user.get_full_name()} - Admin at {school_count} schools"

    def get_schools(self):
        """Get all schools this admin manages"""
        return self.schools.all()

    def get_primary_school(self):
        """Get the primary school (first assigned or marked as primary)"""
        primary = self.admin_schools.filter(is_primary=True).first()
        if primary:
            return primary.school
        return self.schools.first()

    def has_school_access(self, school):
        """Check if admin has access to a specific school"""
        return self.schools.filter(id=school.id).exists()


class AdminSchool(models.Model):
    """
    Admin-School Relationship
    Links admins with schools they manage with specific permissions
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.ForeignKey(
        AdminProfile,
        on_delete=models.CASCADE,
        related_name='admin_schools'
    )
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        related_name='school_admins'
    )

    # Primary school flag
    is_primary = models.BooleanField(
        default=False,
        help_text="Is this the admin's primary school?"
    )

    # School-specific permissions (override global if set)
    can_add_teachers = models.BooleanField(default=True)
    can_remove_teachers = models.BooleanField(default=True)
    can_add_students = models.BooleanField(default=True)
    can_approve_ai_quota = models.BooleanField(default=True)
    can_view_analytics = models.BooleanField(default=True)
    can_broadcast_announcements = models.BooleanField(default=True)

    # Status
    is_active = models.BooleanField(default=True)

    # Timestamps
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_schools'
        verbose_name = 'Admin School Assignment'
        verbose_name_plural = 'Admin School Assignments'
        unique_together = ('admin', 'school')
        indexes = [
            models.Index(fields=['admin', 'school']),
            models.Index(fields=['school']),
        ]

    def __str__(self):
        return f"{self.admin.user.get_full_name()} manages {self.school.name}"

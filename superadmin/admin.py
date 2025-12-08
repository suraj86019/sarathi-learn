from django.contrib import admin
from .models import (
    School,
    Subject,
    Class,
    ClassSubject,
    SchoolClass,
    SchoolUser,
    Announcement,
    AnnouncementTarget,
    SystemSettings,
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'udise_code', 'district', 'state', 'status', 'plan_type')
    search_fields = ('name', 'udise_code', 'district', 'state')
    list_filter = ('status', 'plan_type', 'state')
    ordering = ('name',)


class ClassSubjectInline(admin.TabularInline):
    model = ClassSubject
    extra = 0
    autocomplete_fields = ('subject',)
    fields = ('subject', 'is_core', 'display_order')
    ordering = ('display_order', 'subject__name')


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    """Admin for Class templates (Grade 1-12)"""
    list_display = ('grade_number', 'name', 'is_active')
    search_fields = ('name', 'grade_number', 'description')
    list_filter = ('is_active',)
    ordering = ('grade_number',)
    inlines = [ClassSubjectInline]


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    """Admin for School-Class mappings"""
    list_display = ('school', 'class_obj', 'section', 'academic_year', 'is_active')
    search_fields = ('school__name', 'class_obj__name', 'section')
    list_filter = ('school', 'class_obj', 'academic_year', 'is_active')
    ordering = ('school', 'class_obj__grade_number', 'section')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'is_active')
    search_fields = ('name', 'code', 'description')
    list_filter = ('category', 'is_active')
    ordering = ('name',)


@admin.register(SchoolUser)
class SchoolUserAdmin(admin.ModelAdmin):
    list_display = ('school', 'user', 'role_in_school', 'is_active', 'joined_date')
    search_fields = ('school__name', 'user__email', 'user__first_name', 'user__last_name')
    list_filter = ('role_in_school', 'is_active')


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'priority', 'status', 'is_active', 'published_at')
    search_fields = ('title', 'content')
    list_filter = ('priority', 'status', 'is_active')


@admin.register(AnnouncementTarget)
class AnnouncementTargetAdmin(admin.ModelAdmin):
    list_display = ('announcement', 'school', 'user', 'target_type', 'is_sent')
    search_fields = ('announcement__title', 'school__name', 'user__email')
    list_filter = ('is_sent',)


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('setting_key', 'setting_type', 'is_active')
    search_fields = ('setting_key', 'description')
    list_filter = ('setting_type', 'is_active')

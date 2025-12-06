"""
User Admin Configuration
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserRole, UserSession, ActivityLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    
    list_display = [
        'email', 'get_full_name', 'get_role_type',
        'status', 'is_active', 'created_at'
    ]
    list_filter = ['status', 'is_active', 'created_at']
    search_fields = ['email', 'phone', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'phone', 'password')
        }),
        ('Personal Info', {
            'fields': (
                'first_name', 'last_name', 'date_of_birth', 
                'gender', 'profile_picture'
            )
        }),
        ('Address', {
            'fields': ('address', 'city', 'district', 'state', 'pincode', 'country')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions')
        }),
        ('Approval', {
            'fields': ('approved_by', 'approved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_login')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'phone', 'password1', 'password2',
                'first_name', 'last_name', 'is_active'
            ),
        }),
    )
    
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_role_type(self, obj):
        """Get user role type"""
        try:
            return obj.user_role.get_role_type_display()
        except:
            return '-'
    get_role_type.short_description = 'Role'


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """User Role Admin"""
    
    list_display = ['get_user_email', 'get_user_name', 'role_type', 'assigned_at']
    list_filter = ['role_type', 'assigned_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    ordering = ['-assigned_at']
    
    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = 'Email'
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()
    get_user_name.short_description = 'Name'


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """User Session Admin"""
    
    list_display = ['get_user_email', 'ip_address', 'started_at', 'ended_at', 'is_active']
    list_filter = ['is_active', 'started_at']
    search_fields = ['user__email', 'ip_address']
    ordering = ['-started_at']
    readonly_fields = ['id', 'started_at']
    
    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = 'User'


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """Activity Log Admin"""
    
    list_display = ['get_user_email', 'action', 'description', 'target_type', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__email', 'description', 'target_id']
    ordering = ['-timestamp']
    readonly_fields = ['id', 'timestamp']
    
    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = 'User'
    
    def has_add_permission(self, request):
        # Activity logs should not be manually created
        return False
    
    def has_change_permission(self, request, obj=None):
        # Activity logs should not be edited
        return False

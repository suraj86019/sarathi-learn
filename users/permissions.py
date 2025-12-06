"""
Custom permissions for Sarathi Learn
"""

from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Permission check for Super Admin role
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.user_role.role_type == 'SUPER_ADMIN'
        except:
            return False


class IsAdmin(permissions.BasePermission):
    """
    Permission check for Admin role
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.user_role.role_type in ['SUPER_ADMIN', 'ADMIN']
        except:
            return False


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Permission check for Admin or Super Admin role
    Alias for IsAdmin for backward compatibility
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.user_role.role_type in ['SUPER_ADMIN', 'ADMIN']
        except:
            return False


class IsTeacher(permissions.BasePermission):
    """
    Permission check for Teacher role
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.user_role.role_type in ['SUPER_ADMIN', 'ADMIN', 'TEACHER']
        except:
            return False


class IsStudent(permissions.BasePermission):
    """
    Permission check for Student role
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.user_role.role_type == 'STUDENT'
        except:
            return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners or admins to edit an object
    """
    
    def has_object_permission(self, request, view, obj):
        # Super admins can do anything
        if hasattr(request.user, 'user_role') and request.user.user_role.role_type == 'SUPER_ADMIN':
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return obj == request.user

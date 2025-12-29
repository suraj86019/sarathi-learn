"""
User Views - Authentication and User Management
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import User, UserRole, UserSession, ActivityLog
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    UserSessionSerializer, ActivityLogSerializer, 
    PasswordChangeSerializer, UserProfileSerializer, UserRoleSerializer
)
from .permissions import IsSuperAdmin, IsAdminOrSuperAdmin

User = get_user_model()


class LoginView(APIView):
    """
    User Login View
    All users authenticate with email/phone + password
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Get user profile with role info
        profile_serializer = UserProfileSerializer(user)
        
        # Log activity
        ActivityLog.objects.create(
            user=user,
            action='LOGIN',
            description=f"User {user.email} logged in",
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': profile_serializer.data
            }
        }, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip


class LogoutView(APIView):
    """User Logout View"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='LOGOUT',
            description=f"User {request.user.email} logged out",
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip


class RegisterView(APIView):
    """
    User Registration View
    For self-registration (if allowed)
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Registration successful. Please wait for approval.',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    """
    User Management ViewSet
    CRUD operations for users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['me', 'profile']:
            return UserProfileSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users based on user type"""
        user = self.request.user
        
        try:
            role = user.user_role.role_type
        except:
            return User.objects.none()
        
        if role == 'SUPER_ADMIN':
            # Super admin can see all users
            return User.objects.all().select_related('user_role')
        elif role == 'ADMIN':
            # Admin can see users from their school
            try:
                school_id = user.admin_profile.school.udise_code
                return User.objects.filter(
                    admin_profile__school__udise_code=school_id
                ) | User.objects.filter(
                    teacher_profile__school__udise_code=school_id
                ) | User.objects.filter(
                    student_profile__school__udise_code=school_id
                )
            except:
                return User.objects.none()
        elif role == 'TEACHER':
            # Teacher can see students from their school
            try:
                school_id = user.teacher_profile.school.udise_code
                return User.objects.filter(
                    student_profile__school__udise_code=school_id,
                    user_role__role_type='STUDENT'
                )
            except:
                return User.objects.none()
        else:
            # Students can only see themselves
            return User.objects.filter(id=user.id)
    
    def create(self, request, *args, **kwargs):
        """Create new user"""
        # Check permission
        try:
            role = request.user.user_role.role_type
            if role not in ['SUPER_ADMIN', 'ADMIN']:
                return Response({
                    'success': False,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
        except:
            return Response({
                'success': False,
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='CREATE',
            description=f"Created user {user.email}",
            target_type='User',
            target_id=str(user.id)
        )
        
        return Response({
            'success': True,
            'message': 'User created successfully',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        """Approve pending user"""
        user = self.get_object()
        user.activate(approved_by=request.user)
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='APPROVE',
            description=f"Approved user {user.email}",
            target_type='User',
            target_id=str(user.id)
        )
        
        return Response({
            'success': True,
            'message': 'User approved successfully',
            'data': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSuperAdmin])
    def suspend(self, request, pk=None):
        """Suspend user"""
        user = self.get_object()
        user.suspend()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='SUSPEND',
            description=f"Suspended user {user.email}",
            target_type='User',
            target_id=str(user.id)
        )
        
        return Response({
            'success': True,
            'message': 'User suspended successfully',
            'data': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSuperAdmin])
    def activate(self, request, pk=None):
        """Activate suspended user"""
        user = self.get_object()
        user.activate(approved_by=request.user)
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='ACTIVATE',
            description=f"Activated user {user.email}",
            target_type='User',
            target_id=str(user.id)
        )
        
        return Response({
            'success': True,
            'message': 'User activated successfully',
            'data': UserSerializer(user).data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user profile with full details"""
        serializer = UserProfileSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='UPDATE',
            description='Updated profile'
        )
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'success': False,
                'message': 'Old password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=user,
            action='UPDATE',
            description='Password changed'
        )
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })


class UserRoleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User Role ViewSet
    View user roles
    """
    queryset = UserRole.objects.all().select_related('user')
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on permissions"""
        user = self.request.user
        
        try:
            role = user.user_role.role_type
            if role == 'SUPER_ADMIN':
                return UserRole.objects.all()
            elif role == 'ADMIN':
                # Get roles from same school
                school_id = user.admin_profile.school.udise_code
                return UserRole.objects.filter(
                    user__admin_profile__school__udise_code=school_id
                ) | UserRole.objects.filter(
                    user__teacher_profile__school__udise_code=school_id
                ) | UserRole.objects.filter(
                    user__student_profile__school__udise_code=school_id
                )
            else:
                return UserRole.objects.filter(user=user)
        except:
            return UserRole.objects.none()


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Activity Log ViewSet
    Read-only access to activity logs
    """
    queryset = ActivityLog.objects.all().select_related('user')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter activity logs based on user type"""
        user = self.request.user
        
        try:
            role = user.user_role.role_type
            if role == 'SUPER_ADMIN':
                # Super admin can see all logs
                return ActivityLog.objects.all()
            elif role == 'ADMIN':
                # Admin can see logs from their school users
                school_id = user.admin_profile.school.udise_code
                return ActivityLog.objects.filter(
                    user__admin_profile__school__udise_code=school_id
                ) | ActivityLog.objects.filter(
                    user__teacher_profile__school__udise_code=school_id
                ) | ActivityLog.objects.filter(
                    user__student_profile__school__udise_code=school_id
                )
            else:
                # Others can only see their own logs
                return ActivityLog.objects.filter(user=user)
        except:
            return ActivityLog.objects.filter(user=user)

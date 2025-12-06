"""
User Serializers - Authentication and User Management
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserRole, UserSession, ActivityLog


class UserSerializer(serializers.ModelSerializer):
    """Base user serializer"""
    
    full_name = serializers.SerializerMethodField()
    role_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'full_name',
            'first_name', 'last_name', 'date_of_birth', 'gender',
            'profile_picture', 'address', 'city', 'district',
            'state', 'pincode', 'country', 'status', 'is_active',
            'role_type', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_role_type(self, obj):
        try:
            return obj.user_role.role_type
        except:
            return None


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    
    password = serializers.CharField(write_only=True, required=False)
    role_type = serializers.ChoiceField(
        choices=UserRole.ROLE_CHOICES,
        write_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'phone', 'password', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'address', 'city', 'district',
            'state', 'pincode', 'role_type'
        ]
    
    def validate(self, data):
        """Validate user data based on role_type"""
        role_type = data.get('role_type')
        
        # Super Admin, Admin, and Teacher require password
        if role_type in ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] and not data.get('password'):
            raise serializers.ValidationError({
                'password': 'Password is required for this user type'
            })
        
        # Student requires date_of_birth (for login)
        if role_type == 'STUDENT' and not data.get('date_of_birth'):
            raise serializers.ValidationError({
                'date_of_birth': 'Date of birth is required for students'
            })
        
        return data
    
    def create(self, validated_data):
        """Create user with role"""
        role_type = validated_data.pop('role_type')
        password = validated_data.pop('password', None)
        
        # Create user
        user = User(**validated_data)
        if password:
            user.set_password(password)
        
        # Auto-approve super admins, others pending
        if role_type == 'SUPER_ADMIN':
            user.status = 'ACTIVE'
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
        
        user.save()
        
        # Create user role
        UserRole.objects.create(user=user, role_type=role_type)
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    Supports multiple authentication methods based on role
    """
    
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    date_of_birth = serializers.DateField(required=False)
    
    def validate(self, data):
        """Validate login credentials"""
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')
        date_of_birth = data.get('date_of_birth')
        
        # Must provide either email or phone
        if not email and not phone:
            raise serializers.ValidationError('Email or phone is required')
        
        # Find user
        try:
            if email:
                user = User.objects.get(email=email)
            else:
                user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')
        
        # Check if user has a role
        try:
            role = user.user_role.role_type
        except:
            raise serializers.ValidationError('User role not assigned')
        
        # Authentication based on role
        if role == 'STUDENT':
            # Students login with date of birth
            if not date_of_birth:
                raise serializers.ValidationError('Date of birth is required for students')
            if user.date_of_birth != date_of_birth:
                raise serializers.ValidationError('Invalid credentials')
        else:
            # Other users login with password
            if not password:
                raise serializers.ValidationError('Password is required')
            if not user.check_password(password):
                raise serializers.ValidationError('Invalid credentials')
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError(
                f'Account is {user.status.lower()}. Please contact administrator.'
            )
        
        data['user'] = user
        return data


class UserRoleSerializer(serializers.ModelSerializer):
    """User role serializer"""
    
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRole
        fields = ['user', 'user_email', 'user_name', 'role_type', 'assigned_at']
        read_only_fields = ['assigned_at']
    
    def get_user_email(self, obj):
        return obj.user.email
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserSession
        fields = ['id', 'user', 'session_token', 'ip_address', 
                  'started_at', 'ended_at', 'is_active']
        read_only_fields = ['id', 'started_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action', 'description',
                  'target_type', 'target_id', 'ip_address', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validate password change"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        if len(data['new_password']) < 8:
            raise serializers.ValidationError({
                'new_password': 'Password must be at least 8 characters'
            })
        
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Extended user profile serializer with role information
    """
    
    full_name = serializers.SerializerMethodField()
    role_type = serializers.SerializerMethodField()
    role_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'full_name',
            'first_name', 'last_name', 'date_of_birth', 'gender',
            'profile_picture', 'address', 'city', 'district',
            'state', 'pincode', 'country', 'status', 'is_active',
            'role_type', 'role_profile', 'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_role_type(self, obj):
        try:
            return obj.user_role.role_type
        except:
            return None
    
    def get_role_profile(self, obj):
        """Get role-specific profile data"""
        try:
            role = obj.user_role.role_type
            
            if role == 'SUPER_ADMIN':
                profile = obj.superadmin_profile
                return {
                    'admin_level': profile.admin_level,
                    'region': profile.region,
                }
            elif role == 'ADMIN':
                profile = obj.admin_profile
                return {
                    'school_id': str(profile.school.id),
                    'school_name': profile.school.name,
                    'employee_id': profile.employee_id,
                    'designation': profile.designation,
                }
            elif role == 'TEACHER':
                profile = obj.teacher_profile
                return {
                    'school_id': str(profile.school.id),
                    'school_name': profile.school.name,
                    'employee_id': profile.employee_id,
                    'subject': profile.subject,
                    'classes_taught': profile.classes_taught,
                }
            elif role == 'STUDENT':
                profile = obj.student_profile
                return {
                    'school_id': str(profile.school.id),
                    'school_name': profile.school.name,
                    'udise_student_id': profile.udise_student_id,
                    'roll_no': profile.roll_no,
                    'class_name': profile.class_name,
                    'section': profile.section,
                    'ai_quota_limit': profile.ai_quota_limit,
                    'ai_quota_used': profile.ai_quota_used,
                }
            
            return None
        except:
            return None

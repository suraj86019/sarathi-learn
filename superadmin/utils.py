"""
Super Admin Utilities
Utility functions for super admin operations organized in classes
"""

from rest_framework import status
from rest_framework.response import Response


class ResponseUtils:
    """Utility class for creating standardized API responses"""

    @staticmethod
    def create_error_response(message, status_code=status.HTTP_400_BAD_REQUEST):
        """
        Create a standardized error response

        Args:
            message (str): Error message
            status_code: HTTP status code

        Returns:
            Response: Error response
        """
        return Response({
            'success': False,
            'message': message
        }, status=status_code)

    @staticmethod
    def create_success_response(message, data=None, status_code=status.HTTP_200_OK):
        """
        Create a standardized success response

        Args:
            message (str): Success message
            data: Response data
            status_code: HTTP status code

        Returns:
            Response: Success response
        """
        response_data = {
            'success': True,
            'message': message
        }

        if data is not None:
            response_data['data'] = data

        return Response(response_data, status=status_code)


class UserResponseUtils:
    """Utility class for user-related response formatting"""

    @staticmethod
    def format_admin_creation_response(user, admin_profile, schools):
        """
        Format response data for admin creation

        Args:
            user: User instance
            admin_profile: AdminProfile instance
            schools: List of School instances

        Returns:
            dict: Formatted response data
        """
        from users.serializers import UserSerializer

        return {
            'id': str(admin_profile.id),
            'user': UserSerializer(user).data,
            'schools': [
                {
                    'id': str(school.id),
                    'name': school.name,
                    'udise_code': school.udise_code
                } for school in schools
            ],
            'employee_id': admin_profile.employee_id,
            'designation': admin_profile.designation,
            'joined_at': admin_profile.joined_at.isoformat()
        }

    @staticmethod
    def format_teacher_creation_response(user, teacher_profile, school, subjects):
        """
        Format response data for teacher creation

        Args:
            user: User instance
            teacher_profile: TeacherProfile instance
            school: School instance
            subjects: QuerySet of Subject instances

        Returns:
            dict: Formatted response data
        """
        from users.serializers import UserSerializer

        return {
            'id': str(teacher_profile.id),
            'user': UserSerializer(user).data,
            'school': {
                'id': str(school.id),
                'name': school.name,
                'udise_code': school.udise_code
            },
            'employee_id': teacher_profile.employee_id,
            'subjects': [{'id': str(s.id), 'name': s.name, 'code': s.code} for s in subjects],
            'qualification': teacher_profile.qualification,
            'experience_years': teacher_profile.experience_years,
            'created_at': teacher_profile.created_at.isoformat()
        }


class SchoolResponseUtils:
    """Utility class for school-related response formatting"""

    @staticmethod
    def format_school_approval_response(school):
        """
        Format response data for school approval

        Args:
            school: School instance

        Returns:
            dict: Formatted response data
        """
        from .serializers import SchoolSerializer
        return {
            'success': True,
            'message': f'School {school.name} approved successfully',
            'data': SchoolSerializer(school).data
        }

    @staticmethod
    def format_school_suspension_response(school):
        """
        Format response data for school suspension

        Args:
            school: School instance

        Returns:
            dict: Formatted response data
        """
        from .serializers import SchoolSerializer
        return {
            'success': True,
            'message': f'School {school.name} suspended',
            'data': SchoolSerializer(school).data
        }

    @staticmethod
    def format_school_users_response(users):
        """
        Format response data for school users

        Args:
            users: QuerySet of users

        Returns:
            dict: Formatted response data
        """
        from users.serializers import UserSerializer
        return {
            'success': True,
            'data': UserSerializer(users, many=True).data
        }

    @staticmethod
    def format_school_statistics_response(statistics):
        """
        Format response data for school statistics

        Args:
            statistics: Statistics dict

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'data': statistics
        }


class SubjectResponseUtils:
    """Utility class for subject-related response formatting"""

    @staticmethod
    def format_subjects_by_category_response(subjects_by_category):
        """
        Format response data for subjects by category

        Args:
            subjects_by_category: Dict of subjects grouped by category

        Returns:
            dict: Formatted response data
        """
        from .serializers import SubjectSerializer
        result = {}

        for category, subjects in subjects_by_category.items():
            result[category] = SubjectSerializer(subjects, many=True).data

        return {
            'success': True,
            'data': result
        }


class ClassResponseUtils:
    """Utility class for class-related response formatting"""

    @staticmethod
    def format_class_students_response(students):
        """
        Format response data for class students

        Args:
            students: QuerySet of students

        Returns:
            dict: Formatted response data
        """
        from students.serializers import StudentProfileSerializer
        return {
            'success': True,
            'data': StudentProfileSerializer(students, many=True).data
        }


class AnnouncementResponseUtils:
    """Utility class for announcement-related response formatting"""

    @staticmethod
    def format_announcement_publish_response(announcement):
        """
        Format response data for announcement publish

        Args:
            announcement: Announcement instance

        Returns:
            dict: Formatted response data
        """
        from .serializers import AnnouncementSerializer
        return {
            'success': True,
            'message': 'Announcement published successfully',
            'data': AnnouncementSerializer(announcement).data
        }

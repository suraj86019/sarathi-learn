"""
Admin Utilities
Utility functions for admin operations organized in classes
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


class NotificationResponseUtils:
    """Utility class for notification-related response formatting"""

    @staticmethod
    def format_notification_creation_response(result):
        """
        Format response data for notification creation

        Args:
            result (dict): Notification creation result

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'message': f'Notification created successfully. Sent to {result.get("total_target_users", 0)} users.',
            'data': {
                'announcement_id': result['announcement_id'],
                'targets_created': result.get('targets_created', 0),
                'total_target_users': result.get('total_target_users', 0),
                'scheduled': result.get('scheduled', False),
                'scheduled_date': result.get('scheduled_date')
            }
        }


class TaskResponseUtils:
    """Utility class for task-related response formatting"""

    @staticmethod
    def format_task_creation_response(result):
        """
        Format response data for task creation

        Args:
            result (dict): Task creation result

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'message': f'{result["task_type"]} assigned to {result["assigned_to_count"]} users successfully.',
            'data': {
                'tasks_created': result['tasks_created'],
                'assigned_to_count': result['assigned_to_count'],
                'task_type': result['task_type']
            }
        }


class UserManagementResponseUtils:
    """Utility class for user management response formatting"""

    @staticmethod
    def format_user_creation_response(user, profile, role_type):
        """
        Format response data for user creation

        Args:
            user: User instance
            profile: Profile instance (StudentProfile or TeacherProfile)
            role_type (str): Type of user created

        Returns:
            dict: Formatted response data
        """
        from users.serializers import UserSerializer

        data = {
            'id': str(profile.id),
            'user': UserSerializer(user).data,
            'role_type': role_type,
            'school_name': profile.school.name
        }

        if role_type == 'STUDENT':
            data.update({
                'udise_student_id': profile.udise_student_id,
                'class_name': profile.current_class.name if profile.current_class else None,
                'enrollment_date': profile.enrollment_date
            })
        elif role_type == 'TEACHER':
            data.update({
                'employee_id': profile.employee_id,
                'qualification': profile.qualification,
                'experience_years': profile.experience_years
            })

        return {
            'success': True,
            'message': f'{role_type.title()} added to school successfully',
            'data': data
        }

    @staticmethod
    def format_user_action_response(result):
        """
        Format response data for user actions

        Args:
            result (dict): User action result

        Returns:
            dict: Formatted response data
        """
        action_messages = {
            'ACTIVATE': 'activated',
            'DEACTIVATE': 'deactivated',
            'SUSPEND': 'suspended',
            'REMOVE': 'removed from school'
        }

        return {
            'success': True,
            'message': f'User {action_messages.get(result["action"], "updated")} successfully',
            'data': result
        }


class ReportResponseUtils:
    """Utility class for report response formatting"""

    @staticmethod
    def format_student_report_response(report_data):
        """
        Format response data for student report

        Args:
            report_data (dict): Student report data

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'message': f'Student report generated for {report_data["school_name"]}',
            'data': report_data
        }

    @staticmethod
    def format_teacher_report_response(report_data):
        """
        Format response data for teacher report

        Args:
            report_data (dict): Teacher report data

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'message': f'Teacher report generated for {report_data["school_name"]}',
            'data': report_data
        }

    @staticmethod
    def format_school_report_response(report_data):
        """
        Format response data for school report

        Args:
            report_data (dict): School report data

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'message': f'School report generated for {report_data["school_name"]}',
            'data': report_data
        }


class DashboardResponseUtils:
    """Utility class for dashboard response formatting"""

    @staticmethod
    def format_dashboard_response(dashboard_data):
        """
        Format response data for admin dashboard

        Args:
            dashboard_data (dict): Dashboard data

        Returns:
            dict: Formatted response data
        """
        return {
            'success': True,
            'message': 'Dashboard data retrieved successfully',
            'data': dashboard_data
        }

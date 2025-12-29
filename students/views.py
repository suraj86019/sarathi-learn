"""
Student Views
API endpoints for student operations
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services import StudentDashboardService


class StudentDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for student dashboard operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get student dashboard data
        GET /students/dashboard/
        """
        try:
            service = self._get_service(request)
            data = service.get_dashboard_data()
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load dashboard'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """
        Get student profile
        GET /students/profile/
        """
        try:
            service = self._get_service(request)
            data = service.get_profile()
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentNewsViewSet(viewsets.ViewSet):
    """
    ViewSet for student news operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get news list
        GET /students/news/
        """
        try:
            limit = int(request.query_params.get('limit', 10))
            service = self._get_service(request)
            data = service.get_news(limit=limit)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load news'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get single news item
        GET /students/news/{id}/
        """
        try:
            service = self._get_service(request)
            data = service.get_news_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'News not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load news'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentSubjectsViewSet(viewsets.ViewSet):
    """
    ViewSet for student subject operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get enrolled subjects
        GET /students/subjects/
        """
        try:
            service = self._get_service(request)
            data = service.get_enrolled_subjects()
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load subjects'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentAttendanceViewSet(viewsets.ViewSet):
    """
    ViewSet for student attendance operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get attendance summary for current month
        GET /students/attendance/summary/
        """
        try:
            service = self._get_service(request)
            data = service.get_attendance_summary()
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load attendance summary'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """
        Get attendance calendar for a specific month
        GET /students/attendance/calendar/?year=2024&month=12
        """
        try:
            from datetime import date
            today = date.today()
            year = int(request.query_params.get('year', today.year))
            month = int(request.query_params.get('month', today.month))
            
            service = self._get_service(request)
            data = service.get_attendance_calendar(year, month)
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load attendance calendar'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        Get recent attendance history
        GET /students/attendance/history/?limit=30
        """
        try:
            limit = int(request.query_params.get('limit', 30))
            service = self._get_service(request)
            data = service.get_attendance_history(limit=limit)
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load attendance history'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentActivityViewSet(viewsets.ViewSet):
    """
    ViewSet for student activity operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get activities list
        GET /students/activities/?status=ACTIVE&page=1&page_size=10
        """
        try:
            status_filter = request.query_params.get('status')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            service = self._get_service(request)
            data = service.get_activities(
                status_filter=status_filter,
                page=page,
                page_size=page_size
            )
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load activities'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get single activity detail
        GET /students/activities/{id}/
        """
        try:
            service = self._get_service(request)
            data = service.get_activity_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'Activity not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load activity'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit activity response
        POST /students/activities/{id}/submit/
        {
            "response": "My answer...",
            "attachment_url": "https://..."
        }
        """
        try:
            response_text = request.data.get('response', '')
            attachment_url = request.data.get('attachment_url')
            
            if not response_text:
                return Response({
                    'success': False,
                    'error': 'Response is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            service = self._get_service(request)
            data = service.submit_activity(
                activity_id=pk,
                response=response_text,
                attachment_url=attachment_url
            )
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to submit activity'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        """
        Get count of pending activities
        GET /students/activities/pending_count/
        """
        try:
            service = self._get_service(request)
            count = service.get_pending_activities_count()
            return Response({
                'success': True,
                'data': {'count': count}
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to get pending count'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentTaskViewSet(viewsets.ViewSet):
    """
    ViewSet for student task operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get tasks list
        GET /students/tasks/?status=OPEN&page=1&page_size=10
        """
        try:
            status_filter = request.query_params.get('status')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            service = self._get_service(request)
            data = service.get_tasks(
                status_filter=status_filter,
                page=page,
                page_size=page_size
            )
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load tasks'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get single task detail with replies
        GET /students/tasks/{id}/
        """
        try:
            service = self._get_service(request)
            data = service.get_task_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'Task not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load task'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """
        Add a reply to a task
        POST /students/tasks/{id}/reply/
        {
            "content": "My response..."
        }
        """
        try:
            content = request.data.get('content', '')
            
            if not content:
                return Response({
                    'success': False,
                    'error': 'Content is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            service = self._get_service(request)
            data = service.add_task_reply(task_id=pk, content=content)
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to add reply'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update task status
        POST /students/tasks/{id}/update_status/
        {
            "status": "COMPLETED"
        }
        """
        try:
            new_status = request.data.get('status', '')
            
            if not new_status:
                return Response({
                    'success': False,
                    'error': 'Status is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            service = self._get_service(request)
            data = service.update_task_status(task_id=pk, status=new_status)
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to update task'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentSchemeViewSet(viewsets.ViewSet):
    """
    ViewSet for government scheme operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        """Get the service instance for the current user"""
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get schemes list
        GET /students/schemes/?type=EXAM&page=1&page_size=10
        """
        try:
            scheme_type = request.query_params.get('type')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            service = self._get_service(request)
            data = service.get_schemes(
                scheme_type=scheme_type,
                page=page,
                page_size=page_size
            )
            return Response({
                'success': True,
                'data': data
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load schemes'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get single scheme detail
        GET /students/schemes/{id}/
        """
        try:
            service = self._get_service(request)
            data = service.get_scheme_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'Scheme not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load scheme'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """
        Get scheme types with counts
        GET /students/schemes/types/
        """
        try:
            service = self._get_service(request)
            data = service.get_scheme_types()
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load scheme types'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentReportViewSet(viewsets.ViewSet):
    """
    ViewSet for student report/progress card operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        from .services import StudentDashboardService
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get all published reports for the student
        GET /students/reports/
        """
        try:
            service = self._get_service(request)
            reports = service.get_reports()
            return Response({
                'success': True,
                'data': {
                    'reports': reports,
                    'count': len(reports)
                }
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load reports'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get detailed report with subject-wise marks
        GET /students/reports/<id>/
        """
        try:
            service = self._get_service(request)
            data = service.get_report_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'Report not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load report'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentAnnouncementViewSet(viewsets.ViewSet):
    """
    ViewSet for student announcement operations
    """
    permission_classes = [IsAuthenticated]
    
    def _get_service(self, request):
        from .services import StudentDashboardService
        return StudentDashboardService(request.user)
    
    def list(self, request):
        """
        Get all announcements for the student
        GET /students/announcements/
        Query params: page, page_size
        """
        try:
            service = self._get_service(request)
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            data = service.get_announcements(page, page_size)
            return Response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load announcements'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        Get announcement detail
        GET /students/announcements/<id>/
        """
        try:
            service = self._get_service(request)
            data = service.get_announcement_detail(pk)
            if data:
                return Response({
                    'success': True,
                    'data': data
                })
            return Response({
                'success': False,
                'error': 'Announcement not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to load announcement'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """
        Get unread announcement count (last 7 days)
        GET /students/announcements/count/
        """
        try:
            service = self._get_service(request)
            count = service.get_unread_announcement_count()
            return Response({
                'success': True,
                'data': {
                    'count': count
                }
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to get count'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

"""
Teacher Views
API views for teacher-related operations
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action

from .services import TeacherDashboardService, TeacherAttendanceService, TeacherStudentService
from users.permissions import IsTeacher


class TeacherDashboardViewSet(ViewSet):
    """ViewSet for teacher dashboard operations"""
    
    permission_classes = [IsAuthenticated, IsTeacher]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get teacher dashboard data including news, stats, and tasks
        """
        service = TeacherDashboardService(request.user)
        data = service.get_dashboard_data()
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'])
    def news(self, request):
        """
        Get news/announcements for the teacher
        Query params: limit (default 10)
        """
        service = TeacherDashboardService(request.user)
        limit = int(request.query_params.get('limit', 10))
        news = service.get_news(limit=limit)
        
        return Response({
            'success': True,
            'data': {
                'news': news,
                'count': len(news)
            }
        })
    
    @action(detail=True, methods=['get'], url_path='news-detail')
    def news_detail(self, request, pk=None):
        """
        Get a single news/announcement by ID
        """
        service = TeacherDashboardService(request.user)
        news = service.get_single_news(pk)
        
        if not news:
            return Response({
                'success': False,
                'error': 'Announcement not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': news
        })
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """
        Get teacher profile information
        """
        service = TeacherDashboardService(request.user)
        data = service._get_teacher_info()
        
        if not data:
            return Response({
                'success': False,
                'error': 'Teacher profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'])
    def school(self, request):
        """
        Get school information for the teacher
        """
        service = TeacherDashboardService(request.user)
        data = service._get_school_info()
        
        if not data:
            return Response({
                'success': False,
                'error': 'School not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get dashboard statistics
        """
        service = TeacherDashboardService(request.user)
        data = service._get_dashboard_stats()
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'])
    def schedule(self, request):
        """
        Get today's class schedule
        """
        service = TeacherDashboardService(request.user)
        data = service._get_today_schedule()
        
        return Response({
            'success': True,
            'data': {
                'schedule': data,
                'count': len(data)
            }
        })
    
    @action(detail=False, methods=['get'])
    def teachers(self, request):
        """
        Get all teachers in the same school
        """
        service = TeacherDashboardService(request.user)
        data = service.get_school_teachers()
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'], url_path='school-students')
    def school_students(self, request):
        """
        Get all students in the school
        Query params: class_id (optional), search (optional)
        """
        service = TeacherDashboardService(request.user)
        class_id = request.query_params.get('class_id')
        search = request.query_params.get('search')
        data = service.get_school_students(class_id=class_id, search=search)
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'])
    def classes(self, request):
        """
        Get all classes in the school
        """
        service = TeacherDashboardService(request.user)
        data = service.get_school_classes()
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['get'], url_path='extended-stats')
    def extended_stats(self, request):
        """
        Get extended dashboard statistics with all counts
        """
        service = TeacherDashboardService(request.user)
        data = service.get_extended_stats()
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': data
        })


class TeacherTaskViewSet(ViewSet):
    """ViewSet for teacher task operations"""
    
    permission_classes = [IsAuthenticated, IsTeacher]
    
    @action(detail=False, methods=['get'])
    def tasks(self, request):
        """
        Get teacher's tasks
        Query params: status (OPEN, IN_PROGRESS, COMPLETED, CLOSED), limit (default 10)
        """
        service = TeacherDashboardService(request.user)
        task_status = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 10))
        
        if task_status:
            tasks = service.get_tasks(limit=limit, status=task_status)
        else:
            tasks = service.get_tasks(limit=limit)
        
        return Response({
            'success': True,
            'data': {
                'tasks': tasks,
                'count': len(tasks)
            }
        })
    
    @action(detail=False, methods=['get'], url_path='all')
    def all_tasks(self, request):
        """
        Get all teacher's tasks
        """
        service = TeacherDashboardService(request.user)
        tasks = service.get_all_tasks()
        
        return Response({
            'success': True,
            'data': {
                'tasks': tasks,
                'count': len(tasks)
            }
        })
    
    @action(detail=True, methods=['get'])
    def task_detail(self, request, pk=None):
        """
        Get detailed task information with replies
        """
        service = TeacherDashboardService(request.user)
        task = service.get_task_detail(pk)
        
        if not task:
            return Response({
                'success': False,
                'error': 'Task not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': task
        })
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """
        Add a reply to a task
        Body: { content: string }
        """
        content = request.data.get('content')
        
        if not content:
            return Response({
                'success': False,
                'error': 'Content is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = TeacherDashboardService(request.user)
        reply = service.reply_to_task(pk, content)
        
        if not reply:
            return Response({
                'success': False,
                'error': 'Task not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': reply
        })
    
    @action(detail=True, methods=['post'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Update task status
        Body: { status: 'IN_PROGRESS' | 'COMPLETED' }
        """
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({
                'success': False,
                'error': 'Status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = TeacherDashboardService(request.user)
        result = service.update_task_status(pk, new_status)
        
        if not result:
            return Response({
                'success': False,
                'error': 'Task not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if 'error' in result:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': result
        })


class TeacherAttendanceViewSet(ViewSet):
    """ViewSet for teacher attendance operations"""
    
    permission_classes = [IsAuthenticated, IsTeacher]
    
    @action(detail=False, methods=['get'])
    def students(self, request):
        """
        Get students in attendance class with their attendance status
        Query params: date (YYYY-MM-DD, default today)
        """
        service = TeacherAttendanceService(request.user)
        date = request.query_params.get('date')
        data = service.get_attendance_class_students(date)
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=False, methods=['post'])
    def mark(self, request):
        """
        Mark attendance for students
        Body: {
            date: 'YYYY-MM-DD',
            attendance: [
                { student_id: string, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED', remarks?: string }
            ]
        }
        """
        date = request.data.get('date')
        attendance_records = request.data.get('attendance', [])
        
        if not date:
            return Response({
                'success': False,
                'error': 'Date is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not attendance_records:
            return Response({
                'success': False,
                'error': 'Attendance records are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = TeacherAttendanceService(request.user)
        result = service.mark_attendance(date, attendance_records)
        
        if 'error' in result:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': result
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get attendance summary for a date range
        Query params: start_date, end_date (YYYY-MM-DD)
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({
                'success': False,
                'error': 'start_date and end_date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = TeacherAttendanceService(request.user)
        data = service.get_attendance_summary(start_date, end_date)
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': data
        })


class TeacherStudentViewSet(ViewSet):
    """ViewSet for teacher student operations"""
    
    permission_classes = [IsAuthenticated, IsTeacher]
    
    @action(detail=False, methods=['get'])
    def students(self, request):
        """
        Get students in teacher's classes
        Query params: class_id (optional)
        """
        service = TeacherStudentService(request.user)
        class_id = request.query_params.get('class_id')
        students = service.get_my_students(class_id)
        
        return Response({
            'success': True,
            'data': {
                'students': students,
                'count': len(students)
            }
        })
    
    @action(detail=True, methods=['get'])
    def student_detail(self, request, pk=None):
        """
        Get detailed student information
        """
        service = TeacherStudentService(request.user)
        student = service.get_student_detail(pk)
        
        if not student:
            return Response({
                'success': False,
                'error': 'Student not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if 'error' in student:
            return Response({
                'success': False,
                'error': student['error']
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'success': True,
            'data': student
        })
    
    @action(detail=True, methods=['get'], url_path='attendance-calendar')
    def attendance_calendar(self, request, pk=None):
        """
        Get student attendance calendar for a specific month
        Query params: year (int), month (int)
        """
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if not year or not month:
            from django.utils import timezone
            now = timezone.now()
            year = now.year
            month = now.month
        else:
            year = int(year)
            month = int(month)
        
        service = TeacherStudentService(request.user)
        data = service.get_student_attendance_calendar(pk, year, month)
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=True, methods=['post'], url_path='update-pii')
    def update_pii(self, request, pk=None):
        """
        Update student PII (Personally Identifiable Information)
        Requires teacher to have can_update_pii permission
        """
        service = TeacherStudentService(request.user)
        data = service.update_student_pii(pk, request.data)
        
        if 'error' in data:
            return Response({
                'success': False,
                'error': data['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': data
        })
    
    @action(detail=True, methods=['get'], url_path='tasks')
    def student_tasks(self, request, pk=None):
        """
        Get all tasks for a student
        """
        service = TeacherStudentService(request.user)
        tasks = service.get_student_tasks(pk)
        
        return Response({
            'success': True,
            'data': {
                'tasks': tasks,
                'count': len(tasks)
            }
        })
    
    @action(detail=True, methods=['post'], url_path='create-task')
    def create_task(self, request, pk=None):
        """
        Create a task for a student
        """
        service = TeacherStudentService(request.user)
        result = service.create_student_task(pk, request.data)
        
        if 'error' in result:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='task/(?P<task_id>[^/.]+)/status')
    def update_task_status(self, request, task_id=None):
        """
        Update the status of a student task
        """
        status_value = request.data.get('status')
        if not status_value:
            return Response({
                'success': False,
                'error': 'Status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = TeacherStudentService(request.user)
        result = service.update_student_task_status(task_id, status_value)
        
        if 'error' in result:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': result
        })

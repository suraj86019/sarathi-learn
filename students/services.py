"""
Student Dashboard Services
Business logic for student-related operations
"""

from typing import Dict, Any, Optional, List
from django.utils import timezone
from django.db.models import Q, Count
from datetime import date, timedelta
import calendar
from .models import StudentProfile, StudentSubject, Homework
from superadmin.models import News, GovernmentScheme
from teachers.models import Attendance, Activity, ActivitySubmission, StudentTask, StudentTaskReply


class StudentDashboardService:
    """
    Service class for student dashboard operations
    """
    
    def __init__(self, user):
        self.user = user
        self.student_profile = None
        if hasattr(user, 'student_profile'):
            self.student_profile = user.student_profile
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Get complete dashboard data for student
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        return {
            'profile': self._get_profile_info(),
            'school': self._get_school_info(),
            'stats': self._get_stats(),
            'news': self._get_news(limit=10),
        }
    
    def _get_profile_info(self) -> Dict[str, Any]:
        """
        Get student profile information
        """
        profile = self.student_profile
        user = self.user
        
        return {
            'id': str(profile.id),
            'name': user.get_full_name(),
            'email': user.email,
            'phone': user.phone or '',
            'address': user.address or '',
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'udise_student_id': profile.udise_student_id,
            'roll_no': profile.roll_no or '',
            'class_info': {
                'id': str(profile.current_class.id) if profile.current_class else None,
                'name': profile.current_class.full_name if profile.current_class else 'Not Assigned',
                'class_name': profile.class_name or '',
                'section': profile.section or '',
            },
            'parent_info': {
                'name': profile.parent_name or '',
                'phone': profile.parent_phone or '',
                'email': profile.parent_email or '',
            },
            'ai_quota': {
                'limit': profile.ai_quota_limit,
                'used': profile.ai_quota_used,
                'remaining': profile.ai_quota_limit - profile.ai_quota_used,
                'percentage': profile.ai_quota_percentage,
            },
            'academic_year': profile.academic_year or '',
            'enrollment_date': profile.enrollment_date.isoformat() if profile.enrollment_date else None,
        }
    
    def _get_school_info(self) -> Optional[Dict[str, Any]]:
        """
        Get student's school information
        """
        if not self.student_profile.school:
            return None
        
        school = self.student_profile.school
        return {
            'id': str(school.id),
            'name': school.name,
            'code': school.code if hasattr(school, 'code') else '',
            'address': school.address if hasattr(school, 'address') else '',
        }
    
    def _get_stats(self) -> Dict[str, Any]:
        """
        Get student's stats
        """
        profile = self.student_profile
        
        # Count subjects enrolled
        subjects_count = StudentSubject.objects.filter(
            student=profile,
            is_active=True
        ).count()
        
        # Count pending homework
        pending_homework = Homework.objects.filter(
            student=profile,
            status='ASSIGNED',
            due_date__gte=timezone.now().date()
        ).count()
        
        # Count overdue homework
        overdue_homework = Homework.objects.filter(
            student=profile,
            status='ASSIGNED',
            due_date__lt=timezone.now().date()
        ).count()
        
        return {
            'subjects_enrolled': subjects_count,
            'pending_homework': pending_homework,
            'overdue_homework': overdue_homework,
            'ai_quota_used': profile.ai_quota_used,
            'ai_quota_limit': profile.ai_quota_limit,
        }
    
    def _get_news(self, limit: int = 10) -> list:
        """
        Get platform news for student
        """
        news_items = News.objects.filter(
            status='PUBLISHED',
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
        ).order_by('-published_at', '-created_at')[:limit]
        
        return [
            {
                'id': str(item.id),
                'title': item.title,
                'content': item.content,
                'summary': item.summary,
                'priority': item.priority,
                'image_url': item.image_url,
                'published_at': item.published_at.isoformat() if item.published_at else None,
                'created_at': item.created_at.isoformat(),
                'created_by': item.created_by.get_full_name() if item.created_by else 'System',
            }
            for item in news_items
        ]
    
    def get_profile(self) -> Dict[str, Any]:
        """
        Get detailed student profile
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        return self._get_profile_info()
    
    def get_news(self, limit: int = 10) -> Dict[str, Any]:
        """
        Get news list with count
        """
        news = self._get_news(limit=limit)
        return {
            'news': news,
            'count': len(news),
        }
    
    def get_news_detail(self, news_id: str) -> Optional[Dict[str, Any]]:
        """
        Get single news item detail
        """
        try:
            item = News.objects.get(
                id=news_id,
                status='PUBLISHED',
                is_active=True
            )
            return {
                'id': str(item.id),
                'title': item.title,
                'content': item.content,
                'summary': item.summary,
                'priority': item.priority,
                'image_url': item.image_url,
                'published_at': item.published_at.isoformat() if item.published_at else None,
                'created_at': item.created_at.isoformat(),
                'created_by': item.created_by.get_full_name() if item.created_by else 'System',
            }
        except News.DoesNotExist:
            return None
    
    def get_enrolled_subjects(self) -> list:
        """
        Get list of subjects student is enrolled in
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        enrollments = StudentSubject.objects.filter(
            student=self.student_profile,
            is_active=True
        ).select_related('subject', 'teacher', 'teacher__user')
        
        return [
            {
                'id': str(enrollment.id),
                'subject': {
                    'id': str(enrollment.subject.id),
                    'name': enrollment.subject.name,
                    'code': enrollment.subject.code,
                },
                'teacher': {
                    'id': str(enrollment.teacher.id) if enrollment.teacher else None,
                    'name': enrollment.teacher.user.get_full_name() if enrollment.teacher else 'Not Assigned',
                } if enrollment.teacher else None,
                'current_grade': enrollment.current_grade,
                'attendance_percentage': enrollment.attendance_percentage,
            }
            for enrollment in enrollments
        ]

    # ============ ATTENDANCE METHODS ============
    
    def get_attendance_summary(self) -> Dict[str, Any]:
        """
        Get attendance summary for current month
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        today = timezone.now().date()
        first_day = today.replace(day=1)
        
        # Get attendance records for current month
        records = Attendance.objects.filter(
            student=self.student_profile,
            date__gte=first_day,
            date__lte=today
        )
        
        present_count = records.filter(status='PRESENT').count()
        absent_count = records.filter(status='ABSENT').count()
        late_count = records.filter(status='LATE').count()
        excused_count = records.filter(status='EXCUSED').count()
        total_days = records.count()
        
        attendance_percentage = 0
        if total_days > 0:
            attendance_percentage = round((present_count + late_count) / total_days * 100, 1)
        
        return {
            'present': present_count,
            'absent': absent_count,
            'late': late_count,
            'excused': excused_count,
            'total_days': total_days,
            'percentage': attendance_percentage,
            'month': today.strftime('%B %Y'),
        }
    
    def get_attendance_calendar(self, year: int, month: int) -> Dict[str, Any]:
        """
        Get attendance calendar data for a specific month
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        # Get first and last day of month
        first_day = date(year, month, 1)
        last_day = date(year, month, calendar.monthrange(year, month)[1])
        
        # Get attendance records for the month
        records = Attendance.objects.filter(
            student=self.student_profile,
            date__gte=first_day,
            date__lte=last_day
        ).order_by('date')
        
        # Build calendar data
        calendar_data = {}
        for record in records:
            calendar_data[record.date.isoformat()] = {
                'status': record.status,
                'marked_at': record.marked_at.isoformat() if record.marked_at else None,
                'remarks': record.remarks,
            }
        
        # Calculate summary
        present_count = records.filter(status='PRESENT').count()
        absent_count = records.filter(status='ABSENT').count()
        late_count = records.filter(status='LATE').count()
        excused_count = records.filter(status='EXCUSED').count()
        total_days = records.count()
        
        attendance_percentage = 0
        if total_days > 0:
            attendance_percentage = round((present_count + late_count) / total_days * 100, 1)
        
        return {
            'year': year,
            'month': month,
            'month_name': first_day.strftime('%B'),
            'calendar': calendar_data,
            'summary': {
                'present': present_count,
                'absent': absent_count,
                'late': late_count,
                'excused': excused_count,
                'total_days': total_days,
                'percentage': attendance_percentage,
            }
        }
    
    def get_attendance_history(self, limit: int = 30) -> List[Dict[str, Any]]:
        """
        Get recent attendance history
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        records = Attendance.objects.filter(
            student=self.student_profile
        ).select_related('marked_by', 'marked_by__user').order_by('-date')[:limit]
        
        return [
            {
                'id': str(record.id),
                'date': record.date.isoformat(),
                'status': record.status,
                'marked_by': record.marked_by.user.get_full_name() if record.marked_by else None,
                'marked_at': record.marked_at.isoformat() if record.marked_at else None,
                'remarks': record.remarks,
            }
            for record in records
        ]

    # ============ ACTIVITY METHODS ============
    
    def get_activities(self, status_filter: str = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        Get activities assigned to the student
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        profile = self.student_profile
        
        # Get activities for student's class or specifically assigned to student
        activities = Activity.objects.filter(
            Q(level='CLASS', school_class=profile.current_class) |
            Q(level='STUDENT', student=profile),
            school=profile.school,
            status__in=['ACTIVE', 'CLOSED']
        ).select_related(
            'subject', 'school_class', 'created_by', 'created_by__user'
        ).order_by('-created_at')
        
        if status_filter:
            activities = activities.filter(status=status_filter)
        
        # Pagination
        total = activities.count()
        start = (page - 1) * page_size
        end = start + page_size
        activities = activities[start:end]
        
        # Get submission status for each activity
        result = []
        for activity in activities:
            submission = ActivitySubmission.objects.filter(
                activity=activity,
                student=profile
            ).first()
            
            result.append({
                'id': str(activity.id),
                'title': activity.title,
                'description': activity.description,
                'level': activity.level,
                'status': activity.status,
                'subject': {
                    'id': str(activity.subject.id) if activity.subject else None,
                    'name': activity.subject.name if activity.subject else 'General',
                },
                'due_date': activity.due_date.isoformat() if activity.due_date else None,
                'scheduled_date': activity.scheduled_date.isoformat() if activity.scheduled_date else None,
                'scheduled_time': activity.scheduled_time.strftime('%H:%M') if activity.scheduled_time else None,
                'created_by': activity.created_by.user.get_full_name() if activity.created_by else 'Unknown',
                'created_at': activity.created_at.isoformat(),
                'google_meet_link': activity.google_meet_link,
                'zoom_link': activity.zoom_link,
                'other_link': activity.other_link,
                'link_label': activity.link_label,
                'submission': {
                    'id': str(submission.id) if submission else None,
                    'status': submission.status if submission else 'NOT_SUBMITTED',
                    'submitted_at': submission.submitted_at.isoformat() if submission and submission.submitted_at else None,
                    'score': float(submission.score) if submission and submission.score else None,
                    'max_score': float(submission.max_score) if submission and submission.max_score else None,
                    'feedback': submission.feedback if submission else None,
                } if submission else {
                    'id': None,
                    'status': 'NOT_SUBMITTED',
                    'submitted_at': None,
                    'score': None,
                    'max_score': None,
                    'feedback': None,
                },
            })
        
        return {
            'activities': result,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
        }
    
    def get_activity_detail(self, activity_id: str) -> Optional[Dict[str, Any]]:
        """
        Get single activity detail with submission
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        profile = self.student_profile
        
        try:
            activity = Activity.objects.select_related(
                'subject', 'school_class', 'created_by', 'created_by__user'
            ).get(id=activity_id)
            
            # Check if student has access to this activity
            has_access = False
            if activity.level == 'CLASS' and activity.school_class == profile.current_class:
                has_access = True
            elif activity.level == 'STUDENT' and activity.student == profile:
                has_access = True
            
            if not has_access:
                return None
            
            # Get submission
            submission = ActivitySubmission.objects.filter(
                activity=activity,
                student=profile
            ).first()
            
            return {
                'id': str(activity.id),
                'title': activity.title,
                'description': activity.description,
                'level': activity.level,
                'status': activity.status,
                'subject': {
                    'id': str(activity.subject.id) if activity.subject else None,
                    'name': activity.subject.name if activity.subject else 'General',
                },
                'class_name': activity.school_class.full_name if activity.school_class else None,
                'due_date': activity.due_date.isoformat() if activity.due_date else None,
                'scheduled_date': activity.scheduled_date.isoformat() if activity.scheduled_date else None,
                'scheduled_time': activity.scheduled_time.strftime('%H:%M') if activity.scheduled_time else None,
                'created_by': activity.created_by.user.get_full_name() if activity.created_by else 'Unknown',
                'created_at': activity.created_at.isoformat(),
                'google_meet_link': activity.google_meet_link,
                'zoom_link': activity.zoom_link,
                'other_link': activity.other_link,
                'link_label': activity.link_label,
                'submission': {
                    'id': str(submission.id) if submission else None,
                    'status': submission.status if submission else 'NOT_SUBMITTED',
                    'response': submission.response if submission else None,
                    'attachment_url': submission.attachment_url if submission else None,
                    'submitted_at': submission.submitted_at.isoformat() if submission and submission.submitted_at else None,
                    'score': float(submission.score) if submission and submission.score else None,
                    'max_score': float(submission.max_score) if submission and submission.max_score else None,
                    'feedback': submission.feedback if submission else None,
                } if submission else None,
            }
        except Activity.DoesNotExist:
            return None
    
    def submit_activity(self, activity_id: str, response: str, attachment_url: str = None) -> Dict[str, Any]:
        """
        Submit response to an activity
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        profile = self.student_profile
        
        try:
            activity = Activity.objects.get(id=activity_id)
            
            # Check if student has access
            has_access = False
            if activity.level == 'CLASS' and activity.school_class == profile.current_class:
                has_access = True
            elif activity.level == 'STUDENT' and activity.student == profile:
                has_access = True
            
            if not has_access:
                raise ValueError("You don't have access to this activity")
            
            # Check if activity is still open
            if activity.status == 'CLOSED':
                raise ValueError("This activity is closed for submissions")
            
            # Check due date
            is_late = False
            if activity.due_date and timezone.now().date() > activity.due_date:
                is_late = True
            
            # Create or update submission
            submission, created = ActivitySubmission.objects.update_or_create(
                activity=activity,
                student=profile,
                defaults={
                    'response': response,
                    'attachment_url': attachment_url,
                    'status': 'LATE' if is_late else 'SUBMITTED',
                    'submitted_at': timezone.now(),
                }
            )
            
            return {
                'id': str(submission.id),
                'status': submission.status,
                'submitted_at': submission.submitted_at.isoformat(),
                'message': 'Submission updated successfully' if not created else 'Activity submitted successfully',
            }
        except Activity.DoesNotExist:
            raise ValueError("Activity not found")
    
    def get_pending_activities_count(self) -> int:
        """
        Get count of pending activities
        """
        if not self.student_profile:
            return 0
        
        profile = self.student_profile
        
        # Get active activities for student
        activities = Activity.objects.filter(
            Q(level='CLASS', school_class=profile.current_class) |
            Q(level='STUDENT', student=profile),
            school=profile.school,
            status='ACTIVE'
        )
        
        # Count activities without submission or pending submission
        activity_ids = activities.values_list('id', flat=True)
        submitted_ids = ActivitySubmission.objects.filter(
            activity_id__in=activity_ids,
            student=profile,
            status__in=['SUBMITTED', 'COMPLETED']
        ).values_list('activity_id', flat=True)
        
        pending_count = activities.exclude(id__in=submitted_ids).count()
        return pending_count

    # ============ TASK METHODS ============
    
    def get_tasks(self, status_filter: str = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        Get tasks assigned to the student
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        tasks = StudentTask.objects.filter(
            student=self.student_profile
        ).select_related('created_by', 'created_by__user').order_by('-created_at')
        
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        total = tasks.count()
        start = (page - 1) * page_size
        end = start + page_size
        tasks_page = tasks[start:end]
        
        return {
            'tasks': [self._format_task(task) for task in tasks_page],
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'counts': {
                'open': StudentTask.objects.filter(student=self.student_profile, status='OPEN').count(),
                'in_progress': StudentTask.objects.filter(student=self.student_profile, status='IN_PROGRESS').count(),
                'completed': StudentTask.objects.filter(student=self.student_profile, status='COMPLETED').count(),
            }
        }
    
    def _format_task(self, task: StudentTask) -> Dict[str, Any]:
        """Format a task for response"""
        return {
            'id': str(task.id),
            'title': task.title,
            'description': task.description,
            'task_type': task.task_type,
            'priority': task.priority,
            'status': task.status,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'created_by': {
                'id': str(task.created_by.id) if task.created_by else None,
                'name': task.created_by.user.get_full_name() if task.created_by else 'Unknown',
            },
            'created_at': task.created_at.isoformat(),
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'replies_count': task.replies.count(),
        }
    
    def get_task_detail(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get single task detail with replies
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        try:
            task = StudentTask.objects.select_related(
                'created_by', 'created_by__user'
            ).prefetch_related('replies', 'replies__replied_by').get(
                id=task_id,
                student=self.student_profile
            )
            
            data = self._format_task(task)
            data['replies'] = [
                {
                    'id': str(reply.id),
                    'content': reply.content,
                    'reply_type': reply.reply_type,
                    'replied_by': {
                        'id': str(reply.replied_by.id) if reply.replied_by else None,
                        'name': reply.replied_by.get_full_name() if reply.replied_by else 'Unknown',
                    },
                    'created_at': reply.created_at.isoformat(),
                }
                for reply in task.replies.all().order_by('created_at')
            ]
            return data
        except StudentTask.DoesNotExist:
            return None
    
    def add_task_reply(self, task_id: str, content: str) -> Dict[str, Any]:
        """
        Add a reply to a task
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        try:
            task = StudentTask.objects.get(
                id=task_id,
                student=self.student_profile
            )
            
            reply = StudentTaskReply.objects.create(
                task=task,
                content=content,
                reply_type='STUDENT',
                replied_by=self.user
            )
            
            # Update task status to IN_PROGRESS if it was OPEN
            if task.status == 'OPEN':
                task.status = 'IN_PROGRESS'
                task.save()
            
            return {
                'id': str(reply.id),
                'content': reply.content,
                'reply_type': reply.reply_type,
                'replied_by': {
                    'id': str(reply.replied_by.id) if reply.replied_by else None,
                    'name': reply.replied_by.get_full_name() if reply.replied_by else 'Unknown',
                },
                'created_at': reply.created_at.isoformat(),
            }
        except StudentTask.DoesNotExist:
            raise ValueError("Task not found")
    
    def update_task_status(self, task_id: str, status: str) -> Dict[str, Any]:
        """
        Update task status (student can mark as completed)
        """
        if not self.student_profile:
            raise ValueError("Student profile not found")
        
        if status not in ['IN_PROGRESS', 'COMPLETED']:
            raise ValueError("Invalid status. Students can only update to IN_PROGRESS or COMPLETED")
        
        try:
            task = StudentTask.objects.get(
                id=task_id,
                student=self.student_profile
            )
            
            task.status = status
            if status == 'COMPLETED':
                task.completed_at = timezone.now()
            task.save()
            
            return self._format_task(task)
        except StudentTask.DoesNotExist:
            raise ValueError("Task not found")

    # ============ GOVERNMENT SCHEME METHODS ============
    
    def get_schemes(self, scheme_type: str = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        Get government schemes/exams/events
        """
        schemes = GovernmentScheme.objects.filter(
            status='PUBLISHED',
            is_active=True
        ).order_by('-priority', '-published_at')
        
        if scheme_type:
            schemes = schemes.filter(scheme_type=scheme_type)
        
        # Filter by student's class if applicable
        if self.student_profile and self.student_profile.current_class:
            class_name = self.student_profile.current_class.full_name
            # Include schemes for all classes (empty target_classes) or specific class
            schemes = schemes.filter(
                Q(target_classes=[]) | Q(target_classes__contains=[class_name])
            )
        
        total = schemes.count()
        start = (page - 1) * page_size
        end = start + page_size
        schemes_page = schemes[start:end]
        
        return {
            'schemes': [self._format_scheme(scheme) for scheme in schemes_page],
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
        }
    
    def _format_scheme(self, scheme: GovernmentScheme) -> Dict[str, Any]:
        """Format a scheme for response"""
        return {
            'id': str(scheme.id),
            'title': scheme.title,
            'description': scheme.description,
            'scheme_type': scheme.scheme_type,
            'priority': scheme.priority,
            'eligibility': scheme.eligibility,
            'requirements': scheme.requirements,
            'start_date': scheme.start_date.isoformat() if scheme.start_date else None,
            'end_date': scheme.end_date.isoformat() if scheme.end_date else None,
            'application_deadline': scheme.application_deadline.isoformat() if scheme.application_deadline else None,
            'official_link': scheme.official_link,
            'apply_link': scheme.apply_link,
            'image_url': scheme.image_url,
            'target_classes': scheme.target_classes,
            'published_at': scheme.published_at.isoformat() if scheme.published_at else None,
            'created_at': scheme.created_at.isoformat(),
        }
    
    def get_scheme_detail(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        """
        Get single scheme detail
        """
        try:
            scheme = GovernmentScheme.objects.get(
                id=scheme_id,
                status='PUBLISHED',
                is_active=True
            )
            return self._format_scheme(scheme)
        except GovernmentScheme.DoesNotExist:
            return None
    
    def get_scheme_types(self) -> List[Dict[str, str]]:
        """
        Get list of scheme types with counts
        """
        type_counts = GovernmentScheme.objects.filter(
            status='PUBLISHED',
            is_active=True
        ).values('scheme_type').annotate(count=Count('id'))
        
        type_labels = dict(GovernmentScheme.SCHEME_TYPE_CHOICES)
        
        return [
            {
                'type': item['scheme_type'],
                'label': type_labels.get(item['scheme_type'], item['scheme_type']),
                'count': item['count'],
            }
            for item in type_counts
        ]
    
    # ========== REPORTS / PROGRESS CARDS ==========
    
    def get_reports(self) -> List[Dict[str, Any]]:
        """
        Get all published reports for the student's class
        """
        if not self.student_profile:
            return []
        
        from teachers.models import Report, StudentMark
        
        # Get reports for student's current class that are published
        reports = Report.objects.filter(
            school=self.student_profile.school,
            class_ref=self.student_profile.current_class,
            status='PUBLISHED'
        ).order_by('-published_at', '-created_at')
        
        result = []
        for report in reports:
            # Get student's marks for this report
            try:
                student_mark = StudentMark.objects.get(
                    report=report,
                    student=self.student_profile
                )
                result.append({
                    'id': str(report.id),
                    'name': report.name,
                    'report_type': report.report_type,
                    'class_name': report.class_ref.name,
                    'academic_year': report.academic_year,
                    'exam_date': report.exam_date.isoformat() if report.exam_date else None,
                    'published_at': report.published_at.isoformat() if report.published_at else None,
                    'subjects_count': len(report.subjects),
                    'total_marks': float(student_mark.total_marks),
                    'total_max_marks': float(student_mark.total_max_marks),
                    'percentage': float(student_mark.percentage),
                    'grade': student_mark.grade,
                    'rank': student_mark.rank,
                    'has_marks': True,
                })
            except StudentMark.DoesNotExist:
                # Report exists but student has no marks yet
                result.append({
                    'id': str(report.id),
                    'name': report.name,
                    'report_type': report.report_type,
                    'class_name': report.class_ref.name,
                    'academic_year': report.academic_year,
                    'exam_date': report.exam_date.isoformat() if report.exam_date else None,
                    'published_at': report.published_at.isoformat() if report.published_at else None,
                    'subjects_count': len(report.subjects),
                    'total_marks': 0,
                    'total_max_marks': 0,
                    'percentage': 0,
                    'grade': 'N/A',
                    'rank': None,
                    'has_marks': False,
                })
        
        return result
    
    def get_report_detail(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed report with student's subject-wise marks
        """
        if not self.student_profile:
            return None
        
        from teachers.models import Report, StudentMark
        
        try:
            report = Report.objects.get(
                id=report_id,
                school=self.student_profile.school,
                class_ref=self.student_profile.current_class,
                status='PUBLISHED'
            )
        except Report.DoesNotExist:
            return None
        
        # Get student's marks
        try:
            student_mark = StudentMark.objects.get(
                report=report,
                student=self.student_profile
            )
            marks_data = student_mark.marks
        except StudentMark.DoesNotExist:
            marks_data = {}
        
        # Format subject-wise marks
        subjects_marks = []
        for subject in report.subjects:
            subject_id = subject.get('id')
            subject_data = marks_data.get(subject_id, {})
            subjects_marks.append({
                'id': subject_id,
                'name': subject.get('name'),
                'max_marks': subject.get('max_marks', 100),
                'marks': subject_data.get('marks') if subject_data else None,
                'status': 'passed' if (subject_data.get('marks') or 0) >= (subject.get('max_marks', 100) * 0.33) else 'failed'
            })
        
        try:
            student_mark_obj = StudentMark.objects.get(report=report, student=self.student_profile)
            return {
                'id': str(report.id),
                'name': report.name,
                'report_type': report.report_type,
                'description': report.description,
                'class_name': report.class_ref.name,
                'academic_year': report.academic_year,
                'exam_date': report.exam_date.isoformat() if report.exam_date else None,
                'published_at': report.published_at.isoformat() if report.published_at else None,
                'subjects': subjects_marks,
                'total_marks': float(student_mark_obj.total_marks),
                'total_max_marks': float(student_mark_obj.total_max_marks),
                'percentage': float(student_mark_obj.percentage),
                'grade': student_mark_obj.grade,
                'rank': student_mark_obj.rank,
                'remarks': student_mark_obj.remarks,
            }
        except StudentMark.DoesNotExist:
            return {
                'id': str(report.id),
                'name': report.name,
                'report_type': report.report_type,
                'description': report.description,
                'class_name': report.class_ref.name,
                'academic_year': report.academic_year,
                'exam_date': report.exam_date.isoformat() if report.exam_date else None,
                'published_at': report.published_at.isoformat() if report.published_at else None,
                'subjects': subjects_marks,
                'total_marks': 0,
                'total_max_marks': 0,
                'percentage': 0,
                'grade': 'N/A',
                'rank': None,
                'remarks': None,
            }
    
    # ========== ANNOUNCEMENTS ==========
    
    def get_announcements(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """
        Get announcements for the student
        - School-level announcements (with STUDENT role or empty roles)
        - Class-level announcements (for student's class)
        - User-level announcements (specifically for this student)
        """
        if not self.student_profile:
            return {'announcements': [], 'count': 0, 'pagination': {}}
        
        from superadmin.models import Announcement, AnnouncementTarget
        from django.utils import timezone
        
        # Get IDs of announcements that target this student
        announcement_ids = set()
        
        # 1. User-level: specifically targeted to this student
        user_targets = AnnouncementTarget.objects.filter(
            user=self.user,
            announcement__status='PUBLISHED',
            announcement__is_active=True
        ).values_list('announcement_id', flat=True)
        announcement_ids.update(user_targets)
        
        # 2. Class-level: targeted to student's class
        if self.student_profile.current_class:
            from superadmin.models import SchoolClass
            # Find the SchoolClass for this student
            school_classes = SchoolClass.objects.filter(
                school=self.student_profile.school,
                class_obj=self.student_profile.current_class,
                is_active=True
            )
            
            for school_class in school_classes:
                class_targets = AnnouncementTarget.objects.filter(
                    school_class=school_class,
                    announcement__status='PUBLISHED',
                    announcement__is_active=True
                ).values_list('announcement_id', flat=True)
                announcement_ids.update(class_targets)
        
        # 3. School-level: targeted to student's school (with STUDENT role or no role filter)
        school_targets = AnnouncementTarget.objects.filter(
            school=self.student_profile.school,
            announcement__status='PUBLISHED',
            announcement__is_active=True
        )
        
        for target in school_targets:
            # Include if target_roles is empty or contains 'STUDENT'
            if not target.target_roles or 'STUDENT' in target.target_roles:
                announcement_ids.add(target.announcement_id)
        
        # Get all matching announcements
        announcements = Announcement.objects.filter(
            id__in=list(announcement_ids)
        ).order_by('-published_at', '-created_at')
        
        # Filter out expired announcements
        now = timezone.now()
        announcements = [a for a in announcements if not a.expires_at or a.expires_at > now]
        
        # Pagination
        total = len(announcements)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = announcements[start:end]
        
        return {
            'announcements': [
                {
                    'id': str(a.id),
                    'title': a.title,
                    'content': a.content,
                    'priority': a.priority,
                    'published_at': a.published_at.isoformat() if a.published_at else None,
                    'created_at': a.created_at.isoformat(),
                    'expires_at': a.expires_at.isoformat() if a.expires_at else None,
                }
                for a in paginated
            ],
            'count': total,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
                'has_next': end < total,
                'has_previous': page > 1,
            }
        }
    
    def get_announcement_detail(self, announcement_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single announcement detail
        """
        if not self.student_profile:
            return None
        
        from superadmin.models import Announcement, AnnouncementTarget
        
        try:
            announcement = Announcement.objects.get(
                id=announcement_id,
                status='PUBLISHED',
                is_active=True
            )
        except Announcement.DoesNotExist:
            return None
        
        # Verify this student has access to this announcement
        has_access = False
        
        # Check user-level target
        if AnnouncementTarget.objects.filter(
            announcement=announcement,
            user=self.user
        ).exists():
            has_access = True
        
        # Check class-level target
        if not has_access and self.student_profile.current_class:
            from superadmin.models import SchoolClass
            school_classes = SchoolClass.objects.filter(
                school=self.student_profile.school,
                class_obj=self.student_profile.current_class,
                is_active=True
            )
            if AnnouncementTarget.objects.filter(
                announcement=announcement,
                school_class__in=school_classes
            ).exists():
                has_access = True
        
        # Check school-level target
        if not has_access:
            school_targets = AnnouncementTarget.objects.filter(
                announcement=announcement,
                school=self.student_profile.school
            )
            for target in school_targets:
                if not target.target_roles or 'STUDENT' in target.target_roles:
                    has_access = True
                    break
        
        if not has_access:
            return None
        
        return {
            'id': str(announcement.id),
            'title': announcement.title,
            'content': announcement.content,
            'priority': announcement.priority,
            'published_at': announcement.published_at.isoformat() if announcement.published_at else None,
            'created_at': announcement.created_at.isoformat(),
            'expires_at': announcement.expires_at.isoformat() if announcement.expires_at else None,
        }
    
    def get_unread_announcement_count(self) -> int:
        """
        Get count of announcements from last 7 days
        """
        if not self.student_profile:
            return 0
        
        from superadmin.models import Announcement, AnnouncementTarget
        from django.utils import timezone
        from datetime import timedelta
        
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        # Get IDs of recent announcements for this student
        announcement_ids = set()
        
        # User-level
        user_targets = AnnouncementTarget.objects.filter(
            user=self.user,
            announcement__status='PUBLISHED',
            announcement__is_active=True,
            announcement__published_at__gte=seven_days_ago
        ).values_list('announcement_id', flat=True)
        announcement_ids.update(user_targets)
        
        # Class-level
        if self.student_profile.current_class:
            from superadmin.models import SchoolClass
            school_classes = SchoolClass.objects.filter(
                school=self.student_profile.school,
                class_obj=self.student_profile.current_class,
                is_active=True
            )
            class_targets = AnnouncementTarget.objects.filter(
                school_class__in=school_classes,
                announcement__status='PUBLISHED',
                announcement__is_active=True,
                announcement__published_at__gte=seven_days_ago
            ).values_list('announcement_id', flat=True)
            announcement_ids.update(class_targets)
        
        # School-level
        school_targets = AnnouncementTarget.objects.filter(
            school=self.student_profile.school,
            announcement__status='PUBLISHED',
            announcement__is_active=True,
            announcement__published_at__gte=seven_days_ago
        )
        for target in school_targets:
            if not target.target_roles or 'STUDENT' in target.target_roles:
                announcement_ids.add(target.announcement_id)
        
        return len(announcement_ids)


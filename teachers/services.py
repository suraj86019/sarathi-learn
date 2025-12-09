"""
Teacher Services
Business logic for teacher-related operations
"""

from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from typing import Optional, Dict, Any, List

from .models import TeacherProfile, Attendance, TeacherTask, TeacherTaskReply, TeacherClassAssignment
from superadmin.models import Announcement, AnnouncementTarget, School, SchoolClass
from students.models import StudentProfile
from users.models import User


class TeacherDashboardService:
    """Service for teacher dashboard operations"""
    
    def __init__(self, user: User):
        self.user = user
        self.teacher_profile = self._get_teacher_profile()
    
    def _get_teacher_profile(self) -> Optional[TeacherProfile]:
        """Get the teacher profile for the current user"""
        try:
            return TeacherProfile.objects.select_related('school', 'user', 'attendance_class').get(user=self.user)
        except TeacherProfile.DoesNotExist:
            return None
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get complete dashboard data for teacher"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        return {
            'teacher': self._get_teacher_info(),
            'school': self._get_school_info(),
            'news': self.get_news(limit=10),
            'stats': self._get_dashboard_stats(),
            'tasks': self.get_tasks(limit=5),
            'today_schedule': self._get_today_schedule(),
        }
    
    def _get_teacher_info(self) -> Dict[str, Any]:
        """Get teacher profile information"""
        if not self.teacher_profile:
            return {}
        
        profile = self.teacher_profile
        subjects = profile.subjects.all()
        
        return {
            'id': str(profile.id),
            'name': profile.user.get_full_name(),
            'email': profile.user.email,
            'phone': profile.user.phone,
            'employee_id': profile.employee_id,
            'qualification': profile.qualification,
            'experience_years': profile.experience_years,
            'specialization': profile.specialization,
            'primary_subject': profile.primary_subject,
            'subjects': [
                {
                    'id': str(s.id),
                    'name': s.name,
                    'code': s.code
                } for s in subjects
            ],
            'permissions': {
                'can_mark_attendance': profile.can_mark_attendance,
                'can_assign_homework': profile.can_assign_homework,
                'can_grade_assignments': profile.can_grade_assignments,
                'can_update_pii': getattr(profile, 'can_update_pii', False),
            },
            'attendance_class': {
                'id': str(profile.attendance_class.id),
                'name': profile.attendance_class.full_name
            } if profile.attendance_class else None,
        }
    
    def _get_school_info(self) -> Dict[str, Any]:
        """Get school information"""
        if not self.teacher_profile or not self.teacher_profile.school:
            return {}
        
        school = self.teacher_profile.school
        return {
            'id': str(school.id),
            'name': school.name,
            'udise_code': school.udise_code,
            'address': school.address,
            'city': school.city,
            'district': school.district,
            'state': school.state,
            'pincode': school.pincode,
            'principal_name': school.principal_name,
            'contact_email': school.contact_email,
            'contact_phone': school.contact_phone,
            'total_students': school.total_students,
            'total_teachers': school.total_teachers,
        }
    
    def get_news(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top news/announcements for the teacher
        Includes school-level and user-level announcements
        """
        if not self.teacher_profile:
            return []
        
        school = self.teacher_profile.school
        
        # Get announcement IDs that target this school or this specific user
        target_announcement_ids = AnnouncementTarget.objects.filter(
            Q(school=school) | Q(user=self.user)
        ).values_list('announcement_id', flat=True).distinct()
        
        # Get published announcements that target this teacher
        announcements = Announcement.objects.filter(
            id__in=target_announcement_ids,
            status='PUBLISHED',
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).order_by('-published_at', '-created_at')[:limit]
        
        return [
            {
                'id': str(ann.id),
                'title': ann.title,
                'content': ann.content,
                'priority': ann.priority,
                'published_at': ann.published_at.isoformat() if ann.published_at else None,
                'created_at': ann.created_at.isoformat(),
                'created_by': ann.created_by.get_full_name() if ann.created_by else 'System',
            }
            for ann in announcements
        ]
    
    def get_single_news(self, news_id: str) -> Optional[Dict[str, Any]]:
        """Get a single news/announcement by ID"""
        try:
            announcement = Announcement.objects.get(id=news_id, status='PUBLISHED', is_active=True)
            return {
                'id': str(announcement.id),
                'title': announcement.title,
                'content': announcement.content,
                'priority': announcement.priority,
                'published_at': announcement.published_at.isoformat() if announcement.published_at else None,
                'created_at': announcement.created_at.isoformat(),
                'created_by': announcement.created_by.get_full_name() if announcement.created_by else 'System',
            }
        except Announcement.DoesNotExist:
            return None
    
    def _get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        if not self.teacher_profile:
            return {}
        
        school = self.teacher_profile.school
        today = timezone.now().date()
        
        try:
            # Get classes assigned to this teacher (these are Class ids)
            teacher_classes = list(TeacherClassAssignment.objects.filter(
                teacher=self.teacher_profile,
                is_active=True
            ).values_list('school_class_id', flat=True))
            
            # Get students count in teacher's classes (current_class is a Class)
            students_count = StudentProfile.objects.filter(
                school=school,
                current_class_id__in=teacher_classes
            ).count() if teacher_classes else 0
            
            # Get attendance class students count (attendance_class is a Class)
            attendance_class_students = 0
            if self.teacher_profile.attendance_class:
                attendance_class_students = StudentProfile.objects.filter(
                    current_class=self.teacher_profile.attendance_class
                ).count()
            
            # Today's attendance stats (if attendance class is assigned)
            # Both Attendance.school_class and TeacherProfile.attendance_class point to Class
            today_attendance = {'present': 0, 'absent': 0, 'late': 0, 'total': 0, 'marked': False}
            if self.teacher_profile.attendance_class:
                try:
                    attendance_records = Attendance.objects.filter(
                        school_class=self.teacher_profile.attendance_class,
                        date=today
                    )
                    today_attendance = {
                        'present': attendance_records.filter(status='PRESENT').count(),
                        'absent': attendance_records.filter(status='ABSENT').count(),
                        'late': attendance_records.filter(status='LATE').count(),
                        'total': attendance_class_students,
                        'marked': attendance_records.exists(),
                    }
                except Exception as e:
                    print(f"Error getting attendance stats: {e}")
            
            # Pending tasks count
            pending_tasks = TeacherTask.objects.filter(
                teacher=self.teacher_profile,
                status__in=['OPEN', 'IN_PROGRESS']
            ).count()
            
            # Get class assignments count
            classes_count = len(teacher_classes)
            
            return {
                'total_students': students_count,
                'attendance_class_students': attendance_class_students,
                'today_attendance': today_attendance,
                'pending_tasks': pending_tasks,
                'classes_count': classes_count,
                'subjects_count': self.teacher_profile.subjects.count(),
            }
        except Exception as e:
            print(f"Error getting dashboard stats: {e}")
            return {
                'total_students': 0,
                'attendance_class_students': 0,
                'today_attendance': {'present': 0, 'absent': 0, 'late': 0, 'total': 0, 'marked': False},
                'pending_tasks': 0,
                'classes_count': 0,
                'subjects_count': 0,
            }
    
    def get_tasks(self, limit: int = 5, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get teacher tasks assigned by admin"""
        if not self.teacher_profile:
            return []
        
        tasks_query = TeacherTask.objects.filter(
            teacher=self.teacher_profile
        ).select_related('assigned_by', 'school')
        
        if status:
            tasks_query = tasks_query.filter(status=status)
        else:
            # Default: show open and in progress first
            tasks_query = tasks_query.filter(status__in=['OPEN', 'IN_PROGRESS'])
        
        tasks = tasks_query.order_by('-created_at')[:limit]
        
        return [
            {
                'id': str(task.id),
                'title': task.title,
                'description': task.description,
                'priority': task.priority,
                'status': task.status,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'assigned_by': task.assigned_by.get_full_name() if task.assigned_by else 'Admin',
                'created_at': task.created_at.isoformat(),
                'replies_count': task.replies_count,
            }
            for task in tasks
        ]
    
    def get_all_tasks(self) -> List[Dict[str, Any]]:
        """Get all teacher tasks"""
        if not self.teacher_profile:
            return []
        
        tasks = TeacherTask.objects.filter(
            teacher=self.teacher_profile
        ).select_related('assigned_by', 'school').order_by('-created_at')
        
        def get_user_role(user):
            """Helper to safely get user role"""
            if not user:
                return 'ADMIN'
            try:
                return user.user_role.role_type
            except:
                return 'ADMIN'
        
        return [
            {
                'id': str(task.id),
                'title': task.title,
                'description': task.description,
                'priority': task.priority,
                'status': task.status,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'assigned_by': {
                    'id': str(task.assigned_by.id) if task.assigned_by else None,
                    'name': task.assigned_by.get_full_name() if task.assigned_by else 'Admin',
                    'role': get_user_role(task.assigned_by),
                },
                'created_at': task.created_at.isoformat(),
                'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                'replies_count': task.replies_count,
            }
            for task in tasks
        ]
    
    def get_task_detail(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed task information with replies"""
        if not self.teacher_profile:
            return None
        
        try:
            task = TeacherTask.objects.select_related('assigned_by', 'school').get(
                id=task_id,
                teacher=self.teacher_profile
            )
        except TeacherTask.DoesNotExist:
            return None
        
        replies = TeacherTaskReply.objects.filter(task=task).select_related('replied_by').order_by('created_at')
        
        def get_user_role(user):
            """Helper to safely get user role"""
            if not user:
                return 'ADMIN'
            try:
                return user.user_role.role_type
            except:
                return 'ADMIN'
        
        return {
            'id': str(task.id),
            'title': task.title,
            'description': task.description,
            'priority': task.priority,
            'status': task.status,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'assigned_by': {
                'id': str(task.assigned_by.id) if task.assigned_by else None,
                'name': task.assigned_by.get_full_name() if task.assigned_by else 'Admin',
                'role': get_user_role(task.assigned_by),
            },
            'school_name': task.school.name,
            'created_at': task.created_at.isoformat(),
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'closed_at': task.closed_at.isoformat() if task.closed_at else None,
            'replies': [
                {
                    'id': str(reply.id),
                    'content': reply.content,
                    'reply_type': reply.reply_type,
                    'replied_by': {
                        'id': str(reply.replied_by.id) if reply.replied_by else None,
                        'name': reply.replied_by.get_full_name() if reply.replied_by else 'Unknown',
                        'role': get_user_role(reply.replied_by) if reply.replied_by else None,
                    },
                    'created_at': reply.created_at.isoformat(),
                }
                for reply in replies
            ],
        }
    
    def reply_to_task(self, task_id: str, content: str) -> Optional[Dict[str, Any]]:
        """Add a reply to a task"""
        if not self.teacher_profile:
            return None
        
        try:
            task = TeacherTask.objects.get(id=task_id, teacher=self.teacher_profile)
        except TeacherTask.DoesNotExist:
            return None
        
        reply = TeacherTaskReply.objects.create(
            task=task,
            content=content,
            reply_type='TEACHER',
            replied_by=self.user
        )
        
        return {
            'id': str(reply.id),
            'content': reply.content,
            'reply_type': reply.reply_type,
            'replied_by': reply.replied_by.get_full_name(),
            'created_at': reply.created_at.isoformat(),
        }
    
    def update_task_status(self, task_id: str, status: str) -> Optional[Dict[str, Any]]:
        """Update task status"""
        if not self.teacher_profile:
            return None
        
        valid_statuses = ['IN_PROGRESS', 'COMPLETED']  # Teachers can only set these statuses
        if status not in valid_statuses:
            return {'error': f'Invalid status. Must be one of: {valid_statuses}'}
        
        try:
            task = TeacherTask.objects.get(id=task_id, teacher=self.teacher_profile)
        except TeacherTask.DoesNotExist:
            return None
        
        task.status = status
        if status == 'COMPLETED':
            task.completed_at = timezone.now()
        task.save()
        
        return {
            'id': str(task.id),
            'status': task.status,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
        }
    
    def _get_today_schedule(self) -> List[Dict[str, Any]]:
        """Get today's class schedule"""
        if not self.teacher_profile:
            return []
        
        from .models import ClassSchedule
        
        today = timezone.now().date()
        day_of_week = today.weekday()  # 0 = Monday, 6 = Sunday
        
        try:
            schedules = ClassSchedule.objects.filter(
                teacher_assignment__teacher=self.teacher_profile,
                teacher_assignment__is_active=True,
                day_of_week=day_of_week
            ).select_related(
                'teacher_assignment__school_class',
                'teacher_assignment__subject'
            ).order_by('start_time')
            
            result = []
            for schedule in schedules:
                # school_class is actually a Class model (template class)
                class_obj = schedule.teacher_assignment.school_class
                result.append({
                    'id': str(schedule.id),
                    'class_name': class_obj.full_name if class_obj else 'Unknown',
                    'subject': schedule.teacher_assignment.subject.name if schedule.teacher_assignment.subject else 'Unknown',
                    'start_time': schedule.start_time.strftime('%H:%M'),
                    'end_time': schedule.end_time.strftime('%H:%M'),
                    'room': schedule.room_number,
                })
            return result
        except Exception as e:
            print(f"Error getting today's schedule: {e}")
            return []
    
    def get_school_teachers(self) -> Dict[str, Any]:
        """Get all teachers in the same school"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        school = self.teacher_profile.school
        teachers = TeacherProfile.objects.filter(
            school=school
        ).select_related('user', 'attendance_class').prefetch_related('subjects')
        
        teachers_list = []
        for teacher in teachers:
            subjects = teacher.subjects.all()
            teachers_list.append({
                'id': str(teacher.id),
                'user_id': str(teacher.user.id),
                'name': teacher.user.get_full_name(),
                'email': teacher.user.email,
                'phone': teacher.user.phone,
                'employee_id': teacher.employee_id,
                'qualification': teacher.qualification,
                'experience_years': teacher.experience_years,
                'specialization': teacher.specialization,
                'subjects': [{'id': str(s.id), 'name': s.name, 'code': s.code} for s in subjects],
                'subjects_count': subjects.count(),
                'attendance_class': {
                    'id': str(teacher.attendance_class.id),
                    'name': teacher.attendance_class.full_name
                } if teacher.attendance_class else None,
                'is_active': teacher.user.is_active,
                'is_current_user': teacher.user.id == self.user.id,
            })
        
        return {
            'school_id': str(school.id),
            'school_name': school.name,
            'teachers': teachers_list,
            'total_count': len(teachers_list),
        }
    
    def get_school_students(self, class_id: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Get all students in the school"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        school = self.teacher_profile.school
        
        try:
            # current_class points to Class (template), not SchoolClass
            students_query = StudentProfile.objects.filter(
                school=school
            ).select_related('user', 'current_class')
            
            # Filter by class if provided (class_id should be a Class id)
            if class_id:
                students_query = students_query.filter(current_class_id=class_id)
            
            # Search by name or roll number
            if search:
                students_query = students_query.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(roll_no__icontains=search) |
                    Q(udise_student_id__icontains=search)
                )
            
            students = students_query.order_by(
                'current_class__grade_number',
                'roll_no',
                'user__first_name'
            )
            
            students_list = []
            for student in students:
                # current_class is a Class model (has grade_number, name, full_name)
                class_obj = student.current_class
                students_list.append({
                    'id': str(student.id),
                    'user_id': str(student.user.id),
                    'name': student.user.get_full_name(),
                    'email': student.user.email,
                    'phone': student.user.phone,
                    'roll_no': student.roll_no,
                    'udise_student_id': student.udise_student_id,
                    'class_id': str(class_obj.id) if class_obj else None,
                    'class_name': class_obj.full_name if class_obj else 'Not Assigned',
                    'grade': class_obj.grade_number if class_obj else None,
                    'section': student.section,  # Section is stored on StudentProfile (legacy)
                    'parent_name': student.parent_name,
                    'parent_phone': student.parent_phone,
                    'is_active': student.user.is_active,
                })
            
            return {
                'school_id': str(school.id),
                'school_name': school.name,
                'students': students_list,
                'total_count': len(students_list),
            }
        except Exception as e:
            print(f"Error getting school students: {e}")
            return {
                'school_id': str(school.id),
                'school_name': school.name,
                'students': [],
                'total_count': 0,
                'error': str(e)
            }
    
    def get_school_classes(self) -> Dict[str, Any]:
        """Get all classes in the school"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        school = self.teacher_profile.school
        
        try:
            school_classes = SchoolClass.objects.filter(
                school=school,
                is_active=True
            ).select_related('class_obj', 'class_teacher', 'class_teacher__user').order_by(
                'class_obj__grade_number', 'section'
            )
            
            # Get teacher's attendance class (it's a Class, not SchoolClass)
            teacher_attendance_class_id = None
            if self.teacher_profile.attendance_class:
                teacher_attendance_class_id = self.teacher_profile.attendance_class.id
            
            classes_list = []
            for sc in school_classes:
                # Count students in this class
                # StudentProfile.current_class points to Class, and sc.class_obj is the Class
                student_count = StudentProfile.objects.filter(current_class=sc.class_obj).count()
                
                # Check if this SchoolClass's class_obj matches the teacher's attendance_class
                is_my_class = (sc.class_obj.id == teacher_attendance_class_id) if teacher_attendance_class_id else False
                
                classes_list.append({
                    'id': str(sc.id),
                    'class_id': str(sc.class_obj.id),
                    'name': sc.full_name,
                    'grade': sc.class_obj.grade_number,
                    'section': sc.section,
                    'room_number': sc.room_number,
                    'max_students': sc.max_students,
                    'current_students': student_count,
                    'available_seats': sc.max_students - student_count,
                    'is_full': student_count >= sc.max_students,
                    'academic_year': sc.academic_year,
                    'class_teacher': {
                        'id': str(sc.class_teacher.id),
                        'name': sc.class_teacher.user.get_full_name(),
                    } if sc.class_teacher else None,
                    'is_my_attendance_class': is_my_class,
                })
            
            return {
                'school_id': str(school.id),
                'school_name': school.name,
                'classes': classes_list,
                'total_count': len(classes_list),
            }
        except Exception as e:
            print(f"Error getting school classes: {e}")
            return {
                'school_id': str(school.id),
                'school_name': school.name,
                'classes': [],
                'total_count': 0,
                'error': str(e)
            }
    
    def get_extended_stats(self) -> Dict[str, Any]:
        """Get extended dashboard statistics with all counts"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        school = self.teacher_profile.school
        today = timezone.now().date()
        
        try:
            # Get teacher's assigned classes (these are Class ids, not SchoolClass)
            teacher_class_ids = list(TeacherClassAssignment.objects.filter(
                teacher=self.teacher_profile,
                is_active=True
            ).values_list('school_class_id', flat=True))
            
            # Add attendance class if assigned (it's a Class, not SchoolClass)
            if self.teacher_profile.attendance_class:
                if self.teacher_profile.attendance_class.id not in teacher_class_ids:
                    teacher_class_ids.append(self.teacher_profile.attendance_class.id)
            
            # Students in my classes (current_class is a Class)
            my_students_count = StudentProfile.objects.filter(
                current_class_id__in=teacher_class_ids
            ).count() if teacher_class_ids else 0
            
            # All school counts
            total_school_students = StudentProfile.objects.filter(school=school).count()
            total_school_teachers = TeacherProfile.objects.filter(school=school).count()
            total_school_classes = SchoolClass.objects.filter(school=school, is_active=True).count()
            
            # Attendance class students (attendance_class is a Class)
            attendance_class_students = 0
            if self.teacher_profile.attendance_class:
                attendance_class_students = StudentProfile.objects.filter(
                    current_class=self.teacher_profile.attendance_class
                ).count()
            
            # Today's attendance
            # Both Attendance.school_class and TeacherProfile.attendance_class point to Class
            today_attendance = {'present': 0, 'absent': 0, 'late': 0, 'total': 0, 'marked': False, 'percentage': 0}
            if self.teacher_profile.attendance_class:
                try:
                    attendance_records = Attendance.objects.filter(
                        school_class=self.teacher_profile.attendance_class,
                        date=today
                    )
                    present_count = attendance_records.filter(status='PRESENT').count()
                    total = attendance_class_students
                    today_attendance = {
                        'present': present_count,
                        'absent': attendance_records.filter(status='ABSENT').count(),
                        'late': attendance_records.filter(status='LATE').count(),
                        'total': total,
                        'marked': attendance_records.exists(),
                        'percentage': round((present_count / total * 100) if total > 0 else 0, 1),
                    }
                except Exception as e:
                    print(f"Error getting attendance: {e}")
            
            # Tasks
            all_tasks = TeacherTask.objects.filter(teacher=self.teacher_profile)
            pending_tasks = all_tasks.filter(status__in=['OPEN', 'IN_PROGRESS']).count()
            completed_tasks = all_tasks.filter(status='COMPLETED').count()
            
            return {
                # My stats
                'my_classes_count': len(teacher_class_ids),
                'my_students_count': my_students_count,
                'my_subjects_count': self.teacher_profile.subjects.count(),
                'attendance_class_students': attendance_class_students,
                'today_attendance': today_attendance,
                
                # School stats
                'school_total_students': total_school_students,
                'school_total_teachers': total_school_teachers,
                'school_total_classes': total_school_classes,
                
                # Tasks stats
                'pending_tasks': pending_tasks,
                'completed_tasks': completed_tasks,
                'total_tasks': all_tasks.count(),
            }
        except Exception as e:
            print(f"Error getting extended stats: {e}")
            return {
                'my_classes_count': 0,
                'my_students_count': 0,
                'my_subjects_count': 0,
                'attendance_class_students': 0,
                'today_attendance': {'present': 0, 'absent': 0, 'late': 0, 'total': 0, 'marked': False, 'percentage': 0},
                'school_total_students': 0,
                'school_total_teachers': 0,
                'school_total_classes': 0,
                'pending_tasks': 0,
                'completed_tasks': 0,
                'total_tasks': 0,
                'error': str(e)
            }


class TeacherAttendanceService:
    """Service for teacher attendance operations"""
    
    def __init__(self, user: User):
        self.user = user
        self.teacher_profile = self._get_teacher_profile()
    
    def _get_teacher_profile(self) -> Optional[TeacherProfile]:
        """Get the teacher profile for the current user"""
        try:
            return TeacherProfile.objects.select_related('school', 'attendance_class').get(user=self.user)
        except TeacherProfile.DoesNotExist:
            return None
    
    def get_attendance_class_students(self, date: Optional[str] = None) -> Dict[str, Any]:
        """Get students in the teacher's attendance class with their attendance status"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        if not self.teacher_profile.attendance_class:
            return {'error': 'No attendance class assigned'}
        
        if not self.teacher_profile.can_mark_attendance:
            return {'error': 'You do not have permission to mark attendance'}
        
        # attendance_class is a Class (template), not SchoolClass
        attendance_class = self.teacher_profile.attendance_class
        target_date = timezone.now().date() if not date else timezone.datetime.strptime(date, '%Y-%m-%d').date()
        
        try:
            # Get students in this class (current_class points to Class)
            students = StudentProfile.objects.filter(
                current_class=attendance_class
            ).select_related('user').order_by('roll_no', 'user__first_name')
            
            # Get existing attendance records for this date
            # Attendance.school_class also points to Class
            existing_attendance = {
                str(att.student_id): att
                for att in Attendance.objects.filter(
                    school_class=attendance_class,
                    date=target_date
                )
            }
            
            students_data = []
            for student in students:
                att_record = existing_attendance.get(str(student.id))
                students_data.append({
                    'id': str(student.id),
                    'user_id': str(student.user.id),
                    'name': student.user.get_full_name(),
                    'roll_no': student.roll_no,
                    'status': att_record.status if att_record else None,
                    'attendance_id': str(att_record.id) if att_record else None,
                    'remarks': att_record.remarks if att_record else None,
                })
            
            return {
                'class': {
                    'id': str(attendance_class.id),
                    'name': attendance_class.full_name,
                    'grade': attendance_class.grade_number,  # Class has grade_number directly
                    'section': None,  # Class doesn't have section (SchoolClass does)
                },
                'date': target_date.isoformat(),
                'total_students': len(students_data),
                'marked_count': len(existing_attendance),
                'students': students_data,
            }
        except Exception as e:
            print(f"Error getting attendance class students: {e}")
            return {'error': str(e)}
    
    def mark_attendance(self, date: str, attendance_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Mark attendance for students"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        if not self.teacher_profile.attendance_class:
            return {'error': 'No attendance class assigned'}
        
        if not self.teacher_profile.can_mark_attendance:
            return {'error': 'You do not have permission to mark attendance'}
        
        # attendance_class is a Class (template)
        attendance_class = self.teacher_profile.attendance_class
        target_date = timezone.datetime.strptime(date, '%Y-%m-%d').date()
        
        try:
            created_count = 0
            updated_count = 0
            
            for record in attendance_records:
                student_id = record.get('student_id')
                status = record.get('status', 'PRESENT')
                remarks = record.get('remarks', '')
                
                if status not in ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']:
                    continue
                
                # Get or create attendance record
                # Attendance.school_class points to Class
                attendance, created = Attendance.objects.update_or_create(
                    student_id=student_id,
                    date=target_date,
                    defaults={
                        'school_class': attendance_class,
                        'status': status,
                        'marked_by': self.teacher_profile,
                        'remarks': remarks,
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            
            return {
                'success': True,
                'class_id': str(attendance_class.id),
                'date': target_date.isoformat(),
                'created': created_count,
                'updated': updated_count,
                'total_processed': created_count + updated_count,
            }
        except Exception as e:
            print(f"Error marking attendance: {e}")
            return {'error': str(e)}
    
    def get_attendance_summary(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get attendance summary for the attendance class"""
        if not self.teacher_profile or not self.teacher_profile.attendance_class:
            return {'error': 'No attendance class assigned'}
        
        # attendance_class is a Class (template)
        attendance_class = self.teacher_profile.attendance_class
        start = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        end = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        
        try:
            # Attendance.school_class points to Class
            records = Attendance.objects.filter(
                school_class=attendance_class,
                date__gte=start,
                date__lte=end
            ).values('date', 'status').annotate(count=Count('id'))
            
            # Organize by date
            summary = {}
            for record in records:
                date_str = record['date'].isoformat()
                if date_str not in summary:
                    summary[date_str] = {'present': 0, 'absent': 0, 'late': 0, 'excused': 0}
                summary[date_str][record['status'].lower()] = record['count']
            
            return {
                'class_id': str(attendance_class.id),
                'class_name': attendance_class.full_name,
                'start_date': start_date,
                'end_date': end_date,
                'summary': summary,
            }
        except Exception as e:
            print(f"Error getting attendance summary: {e}")
            return {'error': str(e)}


class TeacherStudentService:
    """Service for teacher student operations"""
    
    def __init__(self, user: User):
        self.user = user
        self.teacher_profile = self._get_teacher_profile()
    
    def _get_teacher_profile(self) -> Optional[TeacherProfile]:
        """Get the teacher profile for the current user"""
        try:
            return TeacherProfile.objects.select_related('school', 'attendance_class').get(user=self.user)
        except TeacherProfile.DoesNotExist:
            return None
    
    def get_my_students(self, class_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all students in the classes taught by this teacher"""
        if not self.teacher_profile:
            return []
        
        try:
            # Get classes assigned to this teacher (these are Class ids)
            if class_id:
                class_ids = [class_id]
            else:
                class_ids = list(TeacherClassAssignment.objects.filter(
                    teacher=self.teacher_profile,
                    is_active=True
                ).values_list('school_class_id', flat=True))
                
                # Also include attendance class if assigned (it's a Class)
                if self.teacher_profile.attendance_class:
                    if self.teacher_profile.attendance_class.id not in class_ids:
                        class_ids.append(self.teacher_profile.attendance_class.id)
            
            if not class_ids:
                return []
            
            # current_class points to Class (template), not SchoolClass
            students = StudentProfile.objects.filter(
                current_class_id__in=class_ids
            ).select_related('user', 'current_class').order_by(
                'current_class__grade_number', 'roll_no', 'user__first_name'
            )
            
            return [
                {
                    'id': str(student.id),
                    'user_id': str(student.user.id),
                    'name': student.user.get_full_name(),
                    'email': student.user.email,
                    'phone': student.user.phone,
                    'roll_no': student.roll_no,
                    'udise_student_id': student.udise_student_id,
                    'class_name': student.current_class.full_name if student.current_class else None,
                    'parent_name': student.parent_name,
                    'parent_phone': student.parent_phone,
                    'is_active': student.user.is_active,
                }
                for student in students
            ]
        except Exception as e:
            print(f"Error getting my students: {e}")
            return []
    
    def get_student_detail(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a student"""
        if not self.teacher_profile:
            return None
        
        try:
            # current_class points to Class (template), not SchoolClass
            student = StudentProfile.objects.select_related(
                'user', 'school', 'current_class'
            ).get(id=student_id)
        except StudentProfile.DoesNotExist:
            return None
        
        # Check if teacher has access to this student (same school)
        if student.school != self.teacher_profile.school:
            return {'error': 'Access denied'}
        
        # Get attendance summary for this student
        last_30_days = timezone.now().date() - timedelta(days=30)
        attendance_records = Attendance.objects.filter(
            student=student,
            date__gte=last_30_days
        )
        
        attendance_summary = {
            'total': attendance_records.count(),
            'present': attendance_records.filter(status='PRESENT').count(),
            'absent': attendance_records.filter(status='ABSENT').count(),
            'late': attendance_records.filter(status='LATE').count(),
        }
        
        class_obj = student.current_class
        
        return {
            'id': str(student.id),
            'user_id': str(student.user.id),
            'name': student.user.get_full_name(),
            'first_name': student.user.first_name,
            'last_name': student.user.last_name,
            'email': student.user.email,
            'phone': student.user.phone,
            'date_of_birth': student.user.date_of_birth.isoformat() if student.user.date_of_birth else None,
            'gender': student.user.gender,
            'roll_no': student.roll_no,
            'udise_student_id': student.udise_student_id,
            'class_name': class_obj.full_name if class_obj else None,
            'class_id': str(class_obj.id) if class_obj else None,
            'school_name': student.school.name if student.school else None,
            'parent_name': student.parent_name,
            'parent_phone': student.parent_phone,
            'parent_email': student.parent_email,
            'address': student.user.address,
            'city': student.user.city,
            'district': student.user.district,
            'state': student.user.state,
            'pincode': student.user.pincode,
            'ai_quota_used': student.ai_quota_used,
            'ai_quota_limit': student.ai_quota_limit,
            'enrollment_date': student.enrollment_date.isoformat() if student.enrollment_date else None,
            'academic_year': student.academic_year,
            'is_active': student.user.is_active,
            'status': student.user.status,
            'attendance_summary': attendance_summary,
        }
    
    def get_student_tasks(self, student_id: str) -> List[Dict[str, Any]]:
        """Get all tasks for a student created by any teacher"""
        if not self.teacher_profile:
            return []
        
        try:
            from teachers.models import StudentTask
            
            tasks = StudentTask.objects.filter(
                student_id=student_id,
                school=self.teacher_profile.school
            ).select_related('created_by', 'created_by__user').order_by('-created_at')
            
            return [
                {
                    'id': str(task.id),
                    'title': task.title,
                    'description': task.description,
                    'task_type': task.task_type,
                    'priority': task.priority,
                    'status': task.status,
                    'due_date': task.due_date.isoformat() if task.due_date else None,
                    'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                    'created_by': {
                        'id': str(task.created_by.id),
                        'name': task.created_by.user.get_full_name(),
                    } if task.created_by else None,
                    'created_at': task.created_at.isoformat(),
                    'is_mine': task.created_by == self.teacher_profile if task.created_by else False,
                }
                for task in tasks
            ]
        except Exception as e:
            print(f"Error getting student tasks: {e}")
            return []
    
    def create_student_task(self, student_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a task for a student"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return {'error': 'Student not found'}
        
        # Check if teacher has access (same school)
        if student.school_id != self.teacher_profile.school_id:
            return {'error': 'Access denied'}
        
        try:
            from teachers.models import StudentTask
            
            task = StudentTask.objects.create(
                title=data.get('title'),
                description=data.get('description', ''),
                task_type=data.get('task_type', 'TASK'),
                priority=data.get('priority', 'MEDIUM'),
                due_date=data.get('due_date'),
                student=student,
                created_by=self.teacher_profile,
                school=self.teacher_profile.school,
            )
            
            return {
                'success': True,
                'task': {
                    'id': str(task.id),
                    'title': task.title,
                    'description': task.description,
                    'task_type': task.task_type,
                    'priority': task.priority,
                    'status': task.status,
                    'due_date': task.due_date.isoformat() if task.due_date else None,
                    'created_at': task.created_at.isoformat(),
                }
            }
        except Exception as e:
            print(f"Error creating student task: {e}")
            return {'error': str(e)}
    
    def update_student_task_status(self, task_id: str, status: str) -> Dict[str, Any]:
        """Update the status of a student task"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            from teachers.models import StudentTask
            
            task = StudentTask.objects.get(id=task_id, school=self.teacher_profile.school)
            
            task.status = status
            if status == 'COMPLETED':
                task.completed_at = timezone.now()
            task.save()
            
            return {
                'success': True,
                'task_id': str(task.id),
                'status': task.status,
                'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            }
        except StudentTask.DoesNotExist:
            return {'error': 'Task not found'}
        except Exception as e:
            print(f"Error updating student task: {e}")
            return {'error': str(e)}
    
    def update_student_pii(self, student_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update student PII (Personally Identifiable Information)"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        # Check if teacher has PII update permission
        if not getattr(self.teacher_profile, 'can_update_pii', False):
            return {'error': 'You do not have permission to update student PII'}
        
        try:
            student = StudentProfile.objects.select_related('user').get(id=student_id)
        except StudentProfile.DoesNotExist:
            return {'error': 'Student not found'}
        
        # Check if teacher has access (same school)
        if student.school_id != self.teacher_profile.school_id:
            return {'error': 'Access denied'}
        
        try:
            # Update user fields
            user = student.user
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'phone' in data:
                user.phone = data['phone']
            user.save()
            
            # Update student profile fields
            if 'roll_no' in data:
                student.roll_no = data['roll_no']
            if 'parent_name' in data:
                student.parent_name = data['parent_name']
            if 'parent_phone' in data:
                student.parent_phone = data['parent_phone']
            if 'parent_email' in data:
                student.parent_email = data['parent_email']
            student.save()
            
            return {
                'success': True,
                'message': 'Student information updated successfully',
                'student_id': str(student.id),
            }
        except Exception as e:
            print(f"Error updating student PII: {e}")
            return {'error': str(e)}
    
    def get_student_attendance_calendar(self, student_id: str, year: int, month: int) -> Dict[str, Any]:
        """Get student attendance calendar for a specific month"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            student = StudentProfile.objects.select_related('user', 'current_class').get(id=student_id)
        except StudentProfile.DoesNotExist:
            return {'error': 'Student not found'}
        
        # Check if teacher has access to this student (same school)
        if student.school_id != self.teacher_profile.school_id:
            return {'error': 'Access denied'}
        
        import calendar
        from teachers.models import SchoolHoliday
        
        # Get calendar for the month
        cal = calendar.Calendar(firstweekday=6)  # Start from Sunday
        month_days = cal.monthdayscalendar(year, month)
        
        # Get attendance records for this student in this month
        start_date = timezone.datetime(year, month, 1).date()
        last_day = calendar.monthrange(year, month)[1]
        end_date = timezone.datetime(year, month, last_day).date()
        
        attendance_records = {
            att.date: att.status
            for att in Attendance.objects.filter(
                student=student,
                date__gte=start_date,
                date__lte=end_date
            )
        }
        
        # Get holidays for this month
        holidays = {
            h.date: {'name': h.name, 'type': h.holiday_type}
            for h in SchoolHoliday.objects.filter(
                school=self.teacher_profile.school,
                date__gte=start_date,
                date__lte=end_date
            )
        }
        
        # Build calendar data
        calendar_data = []
        today = timezone.now().date()
        
        for day in range(1, last_day + 1):
            date = timezone.datetime(year, month, day).date()
            weekday = date.weekday()  # 0=Monday, 6=Sunday
            is_weekend = weekday in [5, 6]  # Saturday and Sunday
            
            day_data = {
                'date': date.isoformat(),
                'day': day,
                'is_weekend': is_weekend,
                'is_holiday': date in holidays,
                'holiday_info': holidays.get(date),
                'status': attendance_records.get(date),
                'is_future': date > today,
            }
            calendar_data.append(day_data)
        
        # Calculate summary
        present = sum(1 for d in calendar_data if d['status'] == 'PRESENT')
        absent = sum(1 for d in calendar_data if d['status'] == 'ABSENT')
        late = sum(1 for d in calendar_data if d['status'] == 'LATE')
        excused = sum(1 for d in calendar_data if d['status'] == 'EXCUSED')
        holidays_count = sum(1 for d in calendar_data if d['is_holiday'])
        weekends_count = sum(1 for d in calendar_data if d['is_weekend'])
        total_school_days = len([d for d in calendar_data if not d['is_weekend'] and not d['is_holiday'] and not d['is_future']])
        
        attendance_percentage = round((present / total_school_days * 100), 1) if total_school_days > 0 else 0
        
        return {
            'student': {
                'id': str(student.id),
                'name': student.user.get_full_name(),
                'roll_no': student.roll_no,
                'class_name': student.current_class.full_name if student.current_class else None,
            },
            'year': year,
            'month': month,
            'month_name': calendar.month_name[month],
            'calendar': calendar_data,
            'summary': {
                'total_days': total_school_days,
                'present': present,
                'absent': absent,
                'late': late,
                'excused': excused,
                'holidays': holidays_count,
                'weekends': weekends_count,
                'attendance_percentage': attendance_percentage,
            }
        }


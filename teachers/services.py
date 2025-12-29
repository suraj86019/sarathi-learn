"""
Teacher Services
Business logic for teacher-related operations
"""

from django.db import transaction
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from typing import Optional, Dict, Any, List

from .models import TeacherProfile, Attendance, TeacherTask, TeacherTaskReply, TeacherClassAssignment, Activity, ActivitySubmission
from superadmin.models import Announcement, AnnouncementTarget, School, SchoolClass, Class, Subject
from students.models import StudentProfile
from users.models import User
from django.core.paginator import Paginator


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
            'address': profile.user.address,
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
        Get top news items for the teacher
        News are platform-wide items created by super admin
        """
        from superadmin.models import News
        
        # Get published news that haven't expired
        news_items = News.objects.filter(
            status='PUBLISHED',
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).order_by('-published_at', '-created_at')[:limit]
        
        return [
            {
                'id': str(news.id),
                'title': news.title,
                'content': news.content,
                'summary': news.summary,
                'priority': news.priority,
                'image_url': news.image_url,
                'published_at': news.published_at.isoformat() if news.published_at else None,
                'created_at': news.created_at.isoformat(),
                'created_by': news.created_by.get_full_name() if news.created_by else 'System',
            }
            for news in news_items
        ]
    
    def get_single_news(self, news_id: str) -> Optional[Dict[str, Any]]:
        """Get a single news item by ID"""
        from superadmin.models import News
        
        try:
            news = News.objects.get(id=news_id, status='PUBLISHED', is_active=True)
            return {
                'id': str(news.id),
                'title': news.title,
                'content': news.content,
                'summary': news.summary,
                'priority': news.priority,
                'image_url': news.image_url,
                'published_at': news.published_at.isoformat() if news.published_at else None,
                'created_at': news.created_at.isoformat(),
                'created_by': news.created_by.get_full_name() if news.created_by else 'System',
            }
        except News.DoesNotExist:
            return None
    
    def update_own_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update teacher's own profile information (phone, email, address)
        Teachers can only update their own contact info, not name or other fields
        """
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            # Update phone on User model if provided
            if 'phone' in data:
                self.user.phone = data['phone']
            
            # Update address on User model if provided  
            if 'address' in data:
                self.user.address = data['address']
            
            # Update email on User model
            if 'email' in data and data['email']:
                self.user.email = data['email']
            
            self.user.save()
            
            return {
                'phone': self.user.phone,
                'email': self.user.email,
                'address': self.user.address,
            }
        except Exception as e:
            return {'error': str(e)}
    
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
    
    def add_student(self, class_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new student to a class (requires can_update_pii permission)"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        if not self.teacher_profile.can_update_pii:
            return {'error': 'You do not have permission to add students'}
        
        from users.models import User, UserRole
        from superadmin.models import Class
        
        try:
            # Get the class
            class_obj = Class.objects.get(id=class_id)
            
            # Required fields
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            
            if not first_name:
                return {'error': 'First name is required'}
            
            # Generate email/username
            email = data.get('email', '').strip()
            if not email:
                # Generate unique email
                import uuid
                unique_id = str(uuid.uuid4())[:8]
                email = f"student_{unique_id}@{self.teacher_profile.school.udise_code}.edu"
            
            # Check if email exists
            if User.objects.filter(email=email).exists():
                return {'error': 'A user with this email already exists'}
            
            with transaction.atomic():
                # Create user
                user = User.objects.create(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=data.get('phone', ''),
                    status='ACTIVE',
                    is_active=True,
                )
                
                # Set date of birth as password (for students)
                date_of_birth = data.get('date_of_birth')
                if date_of_birth:
                    from datetime import datetime
                    dob = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
                    user.date_of_birth = dob
                    user.set_password(dob.strftime('%d%m%Y'))
                else:
                    user.set_password('student123')
                user.save()
                
                # Create user role
                UserRole.objects.create(user=user, role_type='STUDENT')
                
                # Create student profile
                student = StudentProfile.objects.create(
                    user=user,
                    school=self.teacher_profile.school,
                    current_class=class_obj,
                    roll_no=data.get('roll_no', ''),
                    parent_name=data.get('parent_name', ''),
                    parent_phone=data.get('parent_phone', ''),
                    parent_email=data.get('parent_email', ''),
                    enrollment_date=timezone.now().date(),
                    academic_year=data.get('academic_year', '2024-2025'),
                )
                
                return {
                    'success': True,
                    'student': {
                        'id': str(student.id),
                        'name': user.get_full_name(),
                        'email': user.email,
                        'roll_no': student.roll_no,
                        'class': class_obj.full_name,
                    }
                }
                
        except Class.DoesNotExist:
            return {'error': 'Class not found'}
        except Exception as e:
            return {'error': f'Failed to create student: {str(e)}'}
    
    def update_student_details(self, student_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update student details (requires can_update_pii permission)"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        if not self.teacher_profile.can_update_pii:
            return {'error': 'You do not have permission to edit student details'}
        
        try:
            student = StudentProfile.objects.select_related('user').get(id=student_id)
            
            # Verify same school
            if student.school_id != self.teacher_profile.school_id:
                return {'error': 'Access denied'}
            
            with transaction.atomic():
                # Update user fields
                if 'first_name' in data:
                    student.user.first_name = data['first_name']
                if 'last_name' in data:
                    student.user.last_name = data['last_name']
                if 'phone' in data:
                    student.user.phone = data['phone']
                if 'date_of_birth' in data and data['date_of_birth']:
                    from datetime import datetime
                    student.user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
                
                student.user.save()
                
                # Update student profile fields
                if 'roll_no' in data:
                    student.roll_no = data['roll_no']
                if 'parent_name' in data:
                    student.parent_name = data['parent_name']
                if 'parent_phone' in data:
                    student.parent_phone = data['parent_phone']
                if 'parent_email' in data:
                    student.parent_email = data['parent_email']
                if 'class_id' in data and data['class_id']:
                    from superadmin.models import Class
                    student.current_class = Class.objects.get(id=data['class_id'])
                
                student.save()
                
                return {
                    'success': True,
                    'student': {
                        'id': str(student.id),
                        'name': student.user.get_full_name(),
                        'roll_no': student.roll_no,
                    }
                }
                
        except StudentProfile.DoesNotExist:
            return {'error': 'Student not found'}
        except Exception as e:
            return {'error': f'Failed to update student: {str(e)}'}
    
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
    
    def get_student_task_detail(self, task_id: str) -> Dict[str, Any]:
        """Get a single task with all replies"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            from teachers.models import StudentTask, StudentTaskReply
            
            task = StudentTask.objects.select_related(
                'student', 'student__user', 'created_by', 'created_by__user'
            ).prefetch_related('replies', 'replies__replied_by').get(
                id=task_id,
                school=self.teacher_profile.school
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
                    'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                    'created_by': {
                        'id': str(task.created_by.id) if task.created_by else None,
                        'name': task.created_by.user.get_full_name() if task.created_by else 'Unknown',
                    },
                    'student': {
                        'id': str(task.student.id),
                        'name': task.student.user.get_full_name(),
                    },
                    'created_at': task.created_at.isoformat(),
                    'is_mine': task.created_by == self.teacher_profile if task.created_by else False,
                    'replies': [
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
                    ],
                }
            }
        except StudentTask.DoesNotExist:
            return {'error': 'Task not found'}
        except Exception as e:
            print(f"Error getting student task detail: {e}")
            return {'error': str(e)}
    
    def add_student_task_reply(self, task_id: str, content: str) -> Dict[str, Any]:
        """Add a reply to a student task"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        if not content or not content.strip():
            return {'error': 'Content is required'}
        
        try:
            from teachers.models import StudentTask, StudentTaskReply
            
            task = StudentTask.objects.get(id=task_id, school=self.teacher_profile.school)
            
            reply = StudentTaskReply.objects.create(
                task=task,
                content=content.strip(),
                reply_type='TEACHER',
                replied_by=self.user,
            )
            
            # Update task status to IN_PROGRESS if it was OPEN
            if task.status == 'OPEN':
                task.status = 'IN_PROGRESS'
                task.save()
            
            return {
                'success': True,
                'reply': {
                    'id': str(reply.id),
                    'content': reply.content,
                    'reply_type': reply.reply_type,
                    'replied_by': {
                        'id': str(reply.replied_by.id) if reply.replied_by else None,
                        'name': reply.replied_by.get_full_name() if reply.replied_by else 'Unknown',
                    },
                    'created_at': reply.created_at.isoformat(),
                }
            }
        except StudentTask.DoesNotExist:
            return {'error': 'Task not found'}
        except Exception as e:
            print(f"Error adding student task reply: {e}")
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


class TeacherActivityService:
    """Service for teacher activity operations"""
    
    def __init__(self, user: User):
        self.user = user
        self.teacher_profile = self._get_teacher_profile()
    
    def _get_teacher_profile(self) -> Optional[TeacherProfile]:
        """Get the teacher profile for the current user"""
        try:
            return TeacherProfile.objects.select_related('school', 'user', 'attendance_class').get(user=self.user)
        except TeacherProfile.DoesNotExist:
            return None
    
    def get_classes_for_activities(self) -> List[Dict[str, Any]]:
        """Get all classes assigned to this teacher for creating activities"""
        if not self.teacher_profile:
            return []
        
        classes = {}
        
        # 1. Get classes from teacher's attendance_class (primary class assignment)
        if self.teacher_profile.attendance_class:
            class_obj = self.teacher_profile.attendance_class
            student_count = StudentProfile.objects.filter(
                school=self.teacher_profile.school,
                current_class=class_obj
            ).count()
            
            # Get only subjects assigned to THIS teacher for this class
            teacher_subjects = TeacherClassAssignment.objects.filter(
                teacher=self.teacher_profile,
                school_class=class_obj,
                is_active=True
            ).select_related('subject')
            
            # If teacher has no specific subject assignments for this class, 
            # get subjects from their teacher_subjects
            if not teacher_subjects.exists():
                from teachers.models import TeacherSubject
                teacher_subject_objs = TeacherSubject.objects.filter(
                    teacher=self.teacher_profile
                ).select_related('subject')
                subject_list = [
                    {
                        'id': str(ts.subject.id),
                        'name': ts.subject.name,
                        'code': ts.subject.code,
                    }
                    for ts in teacher_subject_objs
                ]
            else:
                subject_list = [
                    {
                        'id': str(ta.subject.id),
                        'name': ta.subject.name,
                        'code': ta.subject.code,
                    }
                    for ta in teacher_subjects
                ]
            
            classes[str(class_obj.id)] = {
                'id': str(class_obj.id),
                'name': class_obj.name,
                'section': getattr(class_obj, 'section', ''),
                'full_name': class_obj.full_name,
                'student_count': student_count,
                'subjects': subject_list
            }
        
        # 2. Get classes from teacher assignments (additional class assignments)
        assignments = TeacherClassAssignment.objects.filter(
            teacher=self.teacher_profile,
            is_active=True
        ).select_related('school_class', 'subject')
        
        for assignment in assignments:
            class_obj = assignment.school_class
            if str(class_obj.id) not in classes:
                # Count students in this class
                student_count = StudentProfile.objects.filter(
                    school=self.teacher_profile.school,
                    current_class=class_obj
                ).count()
                
                classes[str(class_obj.id)] = {
                    'id': str(class_obj.id),
                    'name': class_obj.name,
                    'section': getattr(class_obj, 'section', ''),
                    'full_name': class_obj.full_name,
                    'student_count': student_count,
                    'subjects': []
                }
            
            # Add subject if not already in list
            subject_ids = [s['id'] for s in classes[str(class_obj.id)]['subjects']]
            if str(assignment.subject.id) not in subject_ids:
                classes[str(class_obj.id)]['subjects'].append({
                    'id': str(assignment.subject.id),
                    'name': assignment.subject.name,
                    'code': assignment.subject.code,
                })
        
        return list(classes.values())
    
    def get_class_students(self, class_id: str) -> List[Dict[str, Any]]:
        """Get all students in a class"""
        if not self.teacher_profile:
            return []
        
        students = StudentProfile.objects.filter(
            school=self.teacher_profile.school,
            current_class_id=class_id
        ).select_related('user', 'current_class').order_by('roll_no', 'user__first_name')
        
        return [
            {
                'id': str(student.id),
                'name': student.user.get_full_name(),
                'roll_no': student.roll_no,
                'email': student.user.email,
            }
            for student in students
        ]
    
    def get_subjects(self) -> List[Dict[str, Any]]:
        """Get subjects taught by this teacher"""
        if not self.teacher_profile:
            return []
        
        subjects = Subject.objects.filter(
            class_teacher_assignments__teacher=self.teacher_profile,
            class_teacher_assignments__is_active=True
        ).distinct()
        
        return [
            {
                'id': str(subject.id),
                'name': subject.name,
                'code': subject.code,
            }
            for subject in subjects
        ]
    
    def create_activity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new activity"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        level = data.get('level', 'CLASS')
        title = data.get('title')
        description = data.get('description', '')
        subject_id = data.get('subject_id')
        class_id = data.get('class_id')
        student_ids = data.get('student_ids', [])  # For student level activities
        
        # Meeting links
        google_meet_link = data.get('google_meet_link')
        zoom_link = data.get('zoom_link')
        other_link = data.get('other_link')
        link_label = data.get('link_label')
        
        # Schedule
        scheduled_date = data.get('scheduled_date')
        scheduled_time = data.get('scheduled_time')
        due_date = data.get('due_date')
        
        if not title:
            return {'error': 'Title is required'}
        
        # Get subject if provided
        subject = None
        if subject_id:
            try:
                subject = Subject.objects.get(id=subject_id)
            except Subject.DoesNotExist:
                return {'error': 'Subject not found'}
        
        # Get class if provided
        school_class = None
        if class_id:
            try:
                school_class = Class.objects.get(id=class_id)
            except Class.DoesNotExist:
                return {'error': 'Class not found'}
        
        # Parse dates
        from datetime import datetime
        parsed_scheduled_date = None
        parsed_due_date = None
        parsed_scheduled_time = None
        
        if scheduled_date:
            try:
                parsed_scheduled_date = datetime.strptime(scheduled_date, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        if due_date:
            try:
                parsed_due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        if scheduled_time:
            try:
                parsed_scheduled_time = datetime.strptime(scheduled_time, '%H:%M').time()
            except ValueError:
                pass
        
        created_activities = []
        
        if level == 'CLASS':
            # Create one activity for the class
            activity = Activity.objects.create(
                title=title,
                description=description,
                level='CLASS',
                subject=subject,
                school_class=school_class,
                school=self.teacher_profile.school,
                google_meet_link=google_meet_link,
                zoom_link=zoom_link,
                other_link=other_link,
                link_label=link_label,
                scheduled_date=parsed_scheduled_date,
                scheduled_time=parsed_scheduled_time,
                due_date=parsed_due_date,
                created_by=self.teacher_profile,
            )
            
            # Create submissions for all students in the class
            students = StudentProfile.objects.filter(
                school=self.teacher_profile.school,
                current_class=school_class
            )
            
            for student in students:
                ActivitySubmission.objects.create(
                    activity=activity,
                    student=student,
                    status='PENDING'
                )
            
            created_activities.append(activity)
        
        elif level == 'STUDENT':
            # Create individual activities for selected students
            if not student_ids:
                return {'error': 'At least one student is required for student level activity'}
            
            for student_id in student_ids:
                try:
                    student = StudentProfile.objects.get(id=student_id, school=self.teacher_profile.school)
                except StudentProfile.DoesNotExist:
                    continue
                
                activity = Activity.objects.create(
                    title=title,
                    description=description,
                    level='STUDENT',
                    subject=subject,
                    student=student,
                    school=self.teacher_profile.school,
                    google_meet_link=google_meet_link,
                    zoom_link=zoom_link,
                    other_link=other_link,
                    link_label=link_label,
                    scheduled_date=parsed_scheduled_date,
                    scheduled_time=parsed_scheduled_time,
                    due_date=parsed_due_date,
                    created_by=self.teacher_profile,
                )
                
                # Create submission for this student
                ActivitySubmission.objects.create(
                    activity=activity,
                    student=student,
                    status='PENDING'
                )
                
                created_activities.append(activity)
        
        return {
            'success': True,
            'message': f'{len(created_activities)} activity(s) created successfully',
            'activities': [
                {
                    'id': str(a.id),
                    'title': a.title,
                    'level': a.level,
                }
                for a in created_activities
            ]
        }
    
    def get_class_activities(self, class_id: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """Get activities for a specific class with pagination"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        activities = Activity.objects.filter(
            school=self.teacher_profile.school,
            school_class_id=class_id,
            level='CLASS'
        ).select_related('subject', 'school_class', 'created_by').order_by('-created_at')
        
        paginator = Paginator(activities, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'activities': [
                {
                    'id': str(activity.id),
                    'title': activity.title,
                    'description': activity.description[:100] + '...' if len(activity.description) > 100 else activity.description,
                    'subject': {
                        'id': str(activity.subject.id),
                        'name': activity.subject.name,
                    } if activity.subject else None,
                    'status': activity.status,
                    'scheduled_date': activity.scheduled_date.isoformat() if activity.scheduled_date else None,
                    'scheduled_time': activity.scheduled_time.strftime('%H:%M') if activity.scheduled_time else None,
                    'due_date': activity.due_date.isoformat() if activity.due_date else None,
                    'google_meet_link': activity.google_meet_link,
                    'zoom_link': activity.zoom_link,
                    'other_link': activity.other_link,
                    'link_label': activity.link_label,
                    'submissions_count': activity.submissions_count,
                    'completed_count': activity.completed_submissions_count,
                    'created_at': activity.created_at.isoformat(),
                }
                for activity in page_obj
            ],
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }
    
    def get_all_activities(self, page: int = 1, page_size: int = 10, status: str = None) -> Dict[str, Any]:
        """Get all activities created by this teacher with pagination"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        activities = Activity.objects.filter(
            created_by=self.teacher_profile
        ).select_related('subject', 'school_class', 'student__user').order_by('-created_at')
        
        if status:
            activities = activities.filter(status=status)
        
        paginator = Paginator(activities, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'activities': [
                {
                    'id': str(activity.id),
                    'title': activity.title,
                    'description': activity.description[:100] + '...' if len(activity.description) > 100 else activity.description,
                    'level': activity.level,
                    'subject': {
                        'id': str(activity.subject.id),
                        'name': activity.subject.name,
                    } if activity.subject else None,
                    'class': {
                        'id': str(activity.school_class.id),
                        'name': activity.school_class.full_name,
                    } if activity.school_class else None,
                    'student': {
                        'id': str(activity.student.id),
                        'name': activity.student.user.get_full_name(),
                    } if activity.student else None,
                    'status': activity.status,
                    'scheduled_date': activity.scheduled_date.isoformat() if activity.scheduled_date else None,
                    'scheduled_time': activity.scheduled_time.strftime('%H:%M') if activity.scheduled_time else None,
                    'due_date': activity.due_date.isoformat() if activity.due_date else None,
                    'google_meet_link': activity.google_meet_link,
                    'zoom_link': activity.zoom_link,
                    'other_link': activity.other_link,
                    'link_label': activity.link_label,
                    'submissions_count': activity.submissions_count,
                    'completed_count': activity.completed_submissions_count,
                    'created_at': activity.created_at.isoformat(),
                }
                for activity in page_obj
            ],
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }
    
    def get_activity_detail(self, activity_id: str) -> Dict[str, Any]:
        """Get detailed activity information"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            activity = Activity.objects.select_related(
                'subject', 'school_class', 'student__user', 'created_by__user'
            ).get(id=activity_id, school=self.teacher_profile.school)
        except Activity.DoesNotExist:
            return {'error': 'Activity not found'}
        
        return {
            'id': str(activity.id),
            'title': activity.title,
            'description': activity.description,
            'level': activity.level,
            'status': activity.status,
            'subject': {
                'id': str(activity.subject.id),
                'name': activity.subject.name,
                'code': activity.subject.code,
            } if activity.subject else None,
            'class': {
                'id': str(activity.school_class.id),
                'name': activity.school_class.full_name,
            } if activity.school_class else None,
            'student': {
                'id': str(activity.student.id),
                'name': activity.student.user.get_full_name(),
            } if activity.student else None,
            'google_meet_link': activity.google_meet_link,
            'zoom_link': activity.zoom_link,
            'other_link': activity.other_link,
            'link_label': activity.link_label,
            'scheduled_date': activity.scheduled_date.isoformat() if activity.scheduled_date else None,
            'scheduled_time': activity.scheduled_time.strftime('%H:%M') if activity.scheduled_time else None,
            'due_date': activity.due_date.isoformat() if activity.due_date else None,
            'created_by': activity.created_by.user.get_full_name() if activity.created_by else None,
            'submissions_count': activity.submissions_count,
            'completed_count': activity.completed_submissions_count,
            'created_at': activity.created_at.isoformat(),
        }
    
    def get_activity_submissions(self, activity_id: str, page: int = 1, page_size: int = 20, status: str = None) -> Dict[str, Any]:
        """Get submissions for an activity with pagination"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            activity = Activity.objects.get(id=activity_id, school=self.teacher_profile.school)
        except Activity.DoesNotExist:
            return {'error': 'Activity not found'}
        
        submissions = ActivitySubmission.objects.filter(
            activity=activity
        ).select_related('student__user', 'graded_by__user').order_by('-submitted_at', 'student__roll_no')
        
        if status:
            submissions = submissions.filter(status=status)
        
        paginator = Paginator(submissions, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'activity': {
                'id': str(activity.id),
                'title': activity.title,
            },
            'submissions': [
                {
                    'id': str(sub.id),
                    'student': {
                        'id': str(sub.student.id),
                        'name': sub.student.user.get_full_name(),
                        'roll_no': sub.student.roll_no,
                    },
                    'response': sub.response,
                    'attachment_url': sub.attachment_url,
                    'status': sub.status,
                    'score': float(sub.score) if sub.score else None,
                    'max_score': float(sub.max_score) if sub.max_score else None,
                    'feedback': sub.feedback,
                    'graded_by': sub.graded_by.user.get_full_name() if sub.graded_by else None,
                    'graded_at': sub.graded_at.isoformat() if sub.graded_at else None,
                    'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None,
                }
                for sub in page_obj
            ],
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            },
            'stats': {
                'total': paginator.count,
                'pending': submissions.filter(status='PENDING').count(),
                'submitted': submissions.filter(status='SUBMITTED').count(),
                'completed': submissions.filter(status='COMPLETED').count(),
                'late': submissions.filter(status='LATE').count(),
            }
        }
    
    def update_activity_status(self, activity_id: str, status: str) -> Dict[str, Any]:
        """Update activity status"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        if status not in ['DRAFT', 'ACTIVE', 'CLOSED']:
            return {'error': 'Invalid status'}
        
        try:
            activity = Activity.objects.get(id=activity_id, created_by=self.teacher_profile)
        except Activity.DoesNotExist:
            return {'error': 'Activity not found or access denied'}
        
        activity.status = status
        activity.save()
        
        return {
            'success': True,
            'id': str(activity.id),
            'status': activity.status,
        }
    
    def update_activity(self, activity_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update activity details"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            activity = Activity.objects.get(id=activity_id, created_by=self.teacher_profile)
        except Activity.DoesNotExist:
            return {'error': 'Activity not found or access denied'}
        
        # Update basic fields
        if 'title' in data:
            activity.title = data['title']
        if 'description' in data:
            activity.description = data['description']
        if 'activity_type' in data:
            activity.activity_type = data['activity_type']
        if 'priority' in data:
            activity.priority = data['priority']
        
        # Update dates
        if 'scheduled_date' in data:
            activity.scheduled_date = data['scheduled_date'] if data['scheduled_date'] else None
        if 'scheduled_time' in data:
            activity.scheduled_time = data['scheduled_time'] if data['scheduled_time'] else None
        if 'due_date' in data:
            activity.due_date = data['due_date'] if data['due_date'] else None
        
        # Update meeting links
        if 'google_meet_link' in data:
            activity.google_meet_link = data['google_meet_link'] if data['google_meet_link'] else None
        if 'zoom_link' in data:
            activity.zoom_link = data['zoom_link'] if data['zoom_link'] else None
        if 'other_link' in data:
            activity.other_link = data['other_link'] if data['other_link'] else None
        if 'link_label' in data:
            activity.link_label = data['link_label'] if data['link_label'] else None
        
        # Update subject if provided
        if 'subject_id' in data and data['subject_id']:
            from superadmin.models import Subject
            try:
                activity.subject = Subject.objects.get(id=data['subject_id'])
            except Subject.DoesNotExist:
                pass
        
        activity.save()
        
        return {
            'success': True,
            'id': str(activity.id),
            'title': activity.title,
            'description': activity.description,
            'status': activity.status,
        }
    
    def grade_submission(self, submission_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Grade a student's submission"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        try:
            submission = ActivitySubmission.objects.select_related('activity').get(
                id=submission_id,
                activity__school=self.teacher_profile.school
            )
        except ActivitySubmission.DoesNotExist:
            return {'error': 'Submission not found'}
        
        score = data.get('score')
        max_score = data.get('max_score')
        feedback = data.get('feedback')
        new_status = data.get('status', 'COMPLETED')
        
        if score is not None:
            submission.score = score
        if max_score is not None:
            submission.max_score = max_score
        if feedback:
            submission.feedback = feedback
        
        submission.status = new_status
        submission.graded_by = self.teacher_profile
        submission.graded_at = timezone.now()
        submission.save()
        
        return {
            'success': True,
            'id': str(submission.id),
            'status': submission.status,
            'score': float(submission.score) if submission.score else None,
        }


class TeacherAnnouncementService:
    """Service for teacher announcement operations"""
    
    def __init__(self, user):
        self.user = user
        self.teacher_profile = None
        try:
            from teachers.models import TeacherProfile
            self.teacher_profile = TeacherProfile.objects.select_related('school').get(user=user)
        except TeacherProfile.DoesNotExist:
            pass
    
    def get_announcements(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Get announcements targeted to this teacher (school-level or user-level)"""
        if not self.teacher_profile:
            return {'announcements': [], 'pagination': None}
        
        from superadmin.models import Announcement, AnnouncementTarget
        from django.db.models import Q
        
        # Get announcements where:
        # 1. School-level targets for this school (filter target_roles in Python for SQLite compatibility)
        # 2. User-level targeting this teacher
        
        # First get user-level targets
        user_target_ids = AnnouncementTarget.objects.filter(
            user=self.user
        ).values_list('announcement_id', flat=True)
        
        # Get school-level targets and filter in Python
        school_targets = AnnouncementTarget.objects.filter(
            school=self.teacher_profile.school
        )
        school_target_ids = [
            t.announcement_id for t in school_targets
            if not t.target_roles or 'TEACHER' in t.target_roles
        ]
        
        # Combine announcement IDs
        all_announcement_ids = list(set(list(user_target_ids) + school_target_ids))
        
        announcements = Announcement.objects.filter(
            id__in=all_announcement_ids,
            status='PUBLISHED',
            is_active=True
        ).order_by('-published_at', '-created_at')
        
        paginator = Paginator(announcements, page_size)
        page_obj = paginator.get_page(page)
        
        announcements_data = []
        for ann in page_obj:
            # Get target info
            targets = AnnouncementTarget.objects.filter(announcement=ann).select_related('school', 'school_class', 'user')
            target_info = []
            for t in targets:
                if t.school:
                    target_info.append({'type': 'SCHOOL', 'name': t.school.name})
                elif t.school_class:
                    target_info.append({'type': 'CLASS', 'name': t.school_class.full_name})
                elif t.user:
                    target_info.append({'type': 'USER', 'name': t.user.get_full_name()})
            
            announcements_data.append({
                'id': str(ann.id),
                'title': ann.title,
                'content': ann.content,
                'priority': ann.priority,
                'status': ann.status,
                'published_at': ann.published_at.isoformat() if ann.published_at else None,
                'expires_at': ann.expires_at.isoformat() if ann.expires_at else None,
                'created_by': ann.created_by.get_full_name() if ann.created_by else None,
                'created_at': ann.created_at.isoformat(),
                'targets': target_info,
            })
        
        return {
            'announcements': announcements_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }
    
    def get_my_announcements(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Get announcements created by this teacher"""
        if not self.teacher_profile:
            return {'announcements': [], 'pagination': None}
        
        from superadmin.models import Announcement, AnnouncementTarget
        
        announcements = Announcement.objects.filter(
            created_by=self.user
        ).order_by('-created_at')
        
        paginator = Paginator(announcements, page_size)
        page_obj = paginator.get_page(page)
        
        announcements_data = []
        for ann in page_obj:
            targets = AnnouncementTarget.objects.filter(announcement=ann).select_related('school', 'school_class', 'user')
            target_info = []
            for t in targets:
                if t.school:
                    target_info.append({'type': 'SCHOOL', 'name': t.school.name})
                elif t.school_class:
                    target_info.append({'type': 'CLASS', 'name': t.school_class.full_name})
                elif t.user:
                    target_info.append({'type': 'USER', 'name': t.user.get_full_name()})
            
            announcements_data.append({
                'id': str(ann.id),
                'title': ann.title,
                'content': ann.content,
                'priority': ann.priority,
                'status': ann.status,
                'published_at': ann.published_at.isoformat() if ann.published_at else None,
                'expires_at': ann.expires_at.isoformat() if ann.expires_at else None,
                'created_at': ann.created_at.isoformat(),
                'targets': target_info,
            })
        
        return {
            'announcements': announcements_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }
    
    def create_announcement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an announcement at class or student level"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        from superadmin.models import Announcement, AnnouncementTarget, SchoolClass
        from students.models import StudentProfile
        
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        level = data.get('level', 'CLASS')  # CLASS or STUDENT
        priority = data.get('priority', 'MEDIUM')
        
        if not title:
            return {'error': 'Title is required'}
        
        try:
            with transaction.atomic():
                # Create announcement
                announcement = Announcement.objects.create(
                    title=title,
                    content=content,
                    priority=priority,
                    status='PUBLISHED',
                    published_at=timezone.now(),
                    created_by=self.user,
                )
                
                if level == 'CLASS':
                    class_id = data.get('class_id')
                    if not class_id:
                        return {'error': 'class_id is required for class-level announcements'}
                    
                    try:
                        school_class = SchoolClass.objects.get(
                            id=class_id,
                            school=self.teacher_profile.school
                        )
                    except SchoolClass.DoesNotExist:
                        return {'error': 'Class not found'}
                    
                    # Create class-level target
                    AnnouncementTarget.objects.create(
                        announcement=announcement,
                        school_class=school_class,
                    )
                    
                elif level == 'STUDENT':
                    student_id = data.get('student_id')
                    if not student_id:
                        return {'error': 'student_id is required for student-level announcements'}
                    
                    try:
                        student = StudentProfile.objects.select_related('user').get(
                            id=student_id,
                            school=self.teacher_profile.school
                        )
                    except StudentProfile.DoesNotExist:
                        return {'error': 'Student not found'}
                    
                    # Create user-level target
                    AnnouncementTarget.objects.create(
                        announcement=announcement,
                        user=student.user,
                    )
                
                else:
                    return {'error': 'Invalid level. Use CLASS or STUDENT'}
                
                return {
                    'success': True,
                    'announcement': {
                        'id': str(announcement.id),
                        'title': announcement.title,
                        'level': level,
                        'status': announcement.status,
                    }
                }
        
        except Exception as e:
            return {'error': f'Failed to create announcement: {str(e)}'}
    
    def get_classes_for_announcements(self) -> List[Dict[str, Any]]:
        """Get classes assigned to this teacher for creating announcements"""
        if not self.teacher_profile:
            return []
        
        from superadmin.models import SchoolClass
        from teachers.models import TeacherClassAssignment
        
        # Get unique class IDs from assignments and attendance_class
        # Note: TeacherClassAssignment.school_class is actually a ForeignKey to Class (template), not SchoolClass
        assigned_class_ids = set()
        if self.teacher_profile.attendance_class:
            assigned_class_ids.add(self.teacher_profile.attendance_class.id)
        
        assignments = TeacherClassAssignment.objects.filter(
            teacher=self.teacher_profile,
            is_active=True
        ).select_related('school_class')  # school_class IS the Class object
        
        for assignment in assignments:
            # school_class is the Class template object, not SchoolClass
            assigned_class_ids.add(assignment.school_class.id)
        
        # Get SchoolClass instances for these Class templates
        school_classes = SchoolClass.objects.filter(
            school=self.teacher_profile.school,
            class_obj__id__in=list(assigned_class_ids),
            is_active=True
        ).select_related('class_obj').order_by('class_obj__grade_number', 'section')
        
        return [
            {
                'id': str(sc.id),
                'class_id': str(sc.class_obj.id),
                'name': sc.class_obj.name,
                'section': sc.section,
                'full_name': sc.full_name,
            }
            for sc in school_classes
        ]
    
    def get_students_for_announcement(self, class_id: str) -> List[Dict[str, Any]]:
        """Get students in a class for student-level announcements"""
        if not self.teacher_profile:
            return []
        
        from superadmin.models import SchoolClass
        from students.models import StudentProfile
        
        try:
            school_class = SchoolClass.objects.get(
                id=class_id,
                school=self.teacher_profile.school
            )
        except SchoolClass.DoesNotExist:
            return []
        
        students = StudentProfile.objects.filter(
            school=self.teacher_profile.school,
            current_class=school_class.class_obj
        ).select_related('user').order_by('roll_no', 'user__first_name')
        
        return [
            {
                'id': str(s.id),
                'name': s.user.get_full_name(),
                'roll_no': s.roll_no,
            }
            for s in students
        ]


class TeacherReportService:
    """
    Service for managing student reports/progress cards
    """
    
    def __init__(self, user):
        self.user = user
        self.teacher_profile = None
        
        try:
            self.teacher_profile = TeacherProfile.objects.select_related('school').get(user=user)
        except TeacherProfile.DoesNotExist:
            pass
    
    def get_classes_for_reports(self) -> List[Dict[str, Any]]:
        """Get classes assigned to teacher for creating reports"""
        if not self.teacher_profile:
            return []
        
        from superadmin.models import SchoolClass
        
        # Get assigned class IDs
        assigned_class_ids = set()
        if self.teacher_profile.attendance_class:
            assigned_class_ids.add(self.teacher_profile.attendance_class.id)
        
        assignments = TeacherClassAssignment.objects.filter(
            teacher=self.teacher_profile,
            is_active=True
        ).select_related('school_class')
        
        for assignment in assignments:
            assigned_class_ids.add(assignment.school_class.id)
        
        # Get SchoolClass instances
        school_classes = SchoolClass.objects.filter(
            school=self.teacher_profile.school,
            class_obj__id__in=list(assigned_class_ids),
            is_active=True
        ).select_related('class_obj').order_by('class_obj__grade_number', 'section')
        
        return [
            {
                'id': str(sc.class_obj.id),
                'school_class_id': str(sc.id),
                'name': sc.class_obj.name,
                'section': sc.section,
                'full_name': sc.full_name,
            }
            for sc in school_classes
        ]
    
    def get_subjects_for_class(self, class_id: str) -> List[Dict[str, Any]]:
        """Get subjects for a class"""
        if not self.teacher_profile:
            return []
        
        from superadmin.models import Subject
        
        # Get subjects assigned to this teacher for this class
        subjects = Subject.objects.filter(is_active=True).order_by('name')
        
        return [
            {
                'id': str(s.id),
                'name': s.name,
                'code': s.code if hasattr(s, 'code') else s.name[:3].upper(),
            }
            for s in subjects
        ]
    
    def get_students_for_report(self, class_id: str) -> List[Dict[str, Any]]:
        """Get students in a class for report entry"""
        if not self.teacher_profile:
            return []
        
        from students.models import StudentProfile
        from superadmin.models import Class
        
        try:
            class_obj = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return []
        
        students = StudentProfile.objects.filter(
            school=self.teacher_profile.school,
            current_class=class_obj
        ).select_related('user').order_by('roll_no', 'user__first_name')
        
        return [
            {
                'id': str(s.id),
                'name': s.user.get_full_name(),
                'roll_no': s.roll_no or '',
                'email': s.user.email,
            }
            for s in students
        ]
    
    def get_reports(self, class_id: str = None) -> List[Dict[str, Any]]:
        """Get all reports for a class or all classes assigned to teacher"""
        if not self.teacher_profile:
            return []
        
        from teachers.models import Report
        
        # Get assigned class IDs
        assigned_class_ids = set()
        if self.teacher_profile.attendance_class:
            assigned_class_ids.add(self.teacher_profile.attendance_class.id)
        
        assignments = TeacherClassAssignment.objects.filter(
            teacher=self.teacher_profile,
            is_active=True
        )
        for assignment in assignments:
            assigned_class_ids.add(assignment.school_class.id)
        
        # Filter reports
        reports_qs = Report.objects.filter(
            school=self.teacher_profile.school,
            class_ref__id__in=list(assigned_class_ids)
        ).select_related('class_ref', 'created_by', 'created_by__user')
        
        if class_id:
            reports_qs = reports_qs.filter(class_ref_id=class_id)
        
        reports_qs = reports_qs.order_by('-created_at')
        
        return [
            {
                'id': str(r.id),
                'name': r.name,
                'report_type': r.report_type,
                'status': r.status,
                'class_name': r.class_ref.name,
                'class_id': str(r.class_ref.id),
                'academic_year': r.academic_year,
                'exam_date': r.exam_date.isoformat() if r.exam_date else None,
                'subjects': r.subjects,
                'created_by': r.created_by.user.get_full_name() if r.created_by else 'Unknown',
                'created_at': r.created_at.isoformat(),
                'published_at': r.published_at.isoformat() if r.published_at else None,
                'student_count': r.student_marks.count(),
            }
            for r in reports_qs
        ]
    
    def get_report_detail(self, report_id: str) -> Dict[str, Any]:
        """Get detailed report with all student marks"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        from teachers.models import Report, StudentMark
        
        try:
            report = Report.objects.select_related('class_ref', 'created_by', 'created_by__user').get(
                id=report_id,
                school=self.teacher_profile.school
            )
        except Report.DoesNotExist:
            return {'error': 'Report not found'}
        
        # Get all student marks
        student_marks = StudentMark.objects.filter(
            report=report
        ).select_related('student', 'student__user').order_by('-percentage', 'student__roll_no')
        
        return {
            'id': str(report.id),
            'name': report.name,
            'report_type': report.report_type,
            'description': report.description,
            'status': report.status,
            'class_name': report.class_ref.name,
            'class_id': str(report.class_ref.id),
            'academic_year': report.academic_year,
            'exam_date': report.exam_date.isoformat() if report.exam_date else None,
            'subjects': report.subjects,
            'created_by': report.created_by.user.get_full_name() if report.created_by else 'Unknown',
            'created_at': report.created_at.isoformat(),
            'published_at': report.published_at.isoformat() if report.published_at else None,
            'students': [
                {
                    'id': str(sm.student.id),
                    'student_mark_id': str(sm.id),
                    'name': sm.student.user.get_full_name(),
                    'roll_no': sm.student.roll_no or '',
                    'marks': sm.marks,
                    'total_marks': float(sm.total_marks),
                    'total_max_marks': float(sm.total_max_marks),
                    'percentage': float(sm.percentage),
                    'grade': sm.grade,
                    'rank': sm.rank,
                    'remarks': sm.remarks,
                }
                for sm in student_marks
            ]
        }
    
    def create_report(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new report"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        from teachers.models import Report
        from superadmin.models import Class
        
        name = data.get('name', '').strip()
        class_id = data.get('class_id')
        subjects = data.get('subjects', [])
        
        if not name:
            return {'error': 'Report name is required'}
        if not class_id:
            return {'error': 'Class is required'}
        if not subjects:
            return {'error': 'At least one subject is required'}
        
        try:
            class_obj = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return {'error': 'Class not found'}
        
        try:
            with transaction.atomic():
                report = Report.objects.create(
                    name=name,
                    report_type=data.get('report_type', 'EXAM'),
                    description=data.get('description', ''),
                    school=self.teacher_profile.school,
                    class_ref=class_obj,
                    academic_year=data.get('academic_year', '2024-2025'),
                    exam_date=data.get('exam_date'),
                    subjects=subjects,
                    created_by=self.teacher_profile,
                )
                
                return {
                    'success': True,
                    'report': {
                        'id': str(report.id),
                        'name': report.name,
                        'class_name': class_obj.name,
                    }
                }
        except Exception as e:
            print(f"Error creating report: {e}")
            return {'error': str(e)}
    
    def save_student_marks(self, report_id: str, marks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Save marks for multiple students"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        from teachers.models import Report, StudentMark
        from students.models import StudentProfile
        
        try:
            report = Report.objects.get(id=report_id, school=self.teacher_profile.school)
        except Report.DoesNotExist:
            return {'error': 'Report not found'}
        
        try:
            with transaction.atomic():
                saved_count = 0
                for entry in marks_data:
                    student_id = entry.get('student_id')
                    marks = entry.get('marks', {})
                    remarks = entry.get('remarks', '')
                    
                    if not student_id:
                        continue
                    
                    try:
                        student = StudentProfile.objects.get(id=student_id)
                    except StudentProfile.DoesNotExist:
                        continue
                    
                    # Create or update StudentMark
                    student_mark, created = StudentMark.objects.update_or_create(
                        report=report,
                        student=student,
                        defaults={
                            'marks': marks,
                            'remarks': remarks,
                        }
                    )
                    saved_count += 1
                
                # Calculate ranks after saving all marks
                self._calculate_ranks(report)
                
                return {
                    'success': True,
                    'saved_count': saved_count,
                }
        except Exception as e:
            print(f"Error saving marks: {e}")
            return {'error': str(e)}
    
    def _calculate_ranks(self, report):
        """Calculate and update ranks for all students in a report"""
        from teachers.models import StudentMark
        
        student_marks = StudentMark.objects.filter(report=report).order_by('-percentage')
        
        current_rank = 0
        current_percentage = None
        
        for i, sm in enumerate(student_marks):
            if sm.percentage != current_percentage:
                current_rank = i + 1
                current_percentage = sm.percentage
            sm.rank = current_rank
            StudentMark.objects.filter(id=sm.id).update(rank=current_rank)
    
    def publish_report(self, report_id: str) -> Dict[str, Any]:
        """Publish a report to make it visible to students"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        from teachers.models import Report
        
        try:
            report = Report.objects.get(id=report_id, school=self.teacher_profile.school)
            report.status = 'PUBLISHED'
            report.published_at = timezone.now()
            report.save()
            
            return {'success': True, 'status': 'PUBLISHED'}
        except Report.DoesNotExist:
            return {'error': 'Report not found'}
        except Exception as e:
            return {'error': str(e)}
    
    def delete_report(self, report_id: str) -> Dict[str, Any]:
        """Delete a report"""
        if not self.teacher_profile:
            return {'error': 'Teacher profile not found'}
        
        from teachers.models import Report
        
        try:
            report = Report.objects.get(id=report_id, school=self.teacher_profile.school)
            report.delete()
            return {'success': True}
        except Report.DoesNotExist:
            return {'error': 'Report not found'}
        except Exception as e:
            return {'error': str(e)}


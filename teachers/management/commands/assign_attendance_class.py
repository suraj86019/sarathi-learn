"""
Management command to assign attendance class to a teacher and students to that class
"""

from django.core.management.base import BaseCommand
from teachers.models import TeacherProfile
from students.models import StudentProfile
from superadmin.models import Class, SchoolClass


class Command(BaseCommand):
    help = 'Assign attendance class to teacher and students'

    def add_arguments(self, parser):
        parser.add_argument(
            '--teacher-email',
            type=str,
            default='teacher21@sarathilearn.com',
            help='Teacher email to assign attendance class'
        )
        parser.add_argument(
            '--class-name',
            type=str,
            default='Class 1 - Section A',
            help='Class name to search for (e.g., "Class 1 - Section A")'
        )
        parser.add_argument(
            '--grade',
            type=int,
            default=1,
            help='Grade number (1-12)'
        )
        parser.add_argument(
            '--num-students',
            type=int,
            default=4,
            help='Number of students to assign to the class'
        )

    def handle(self, *args, **options):
        teacher_email = options['teacher_email']
        class_name = options['class_name']
        grade = options['grade']
        num_students = options['num_students']

        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS(f"Attendance Class Assignment Script"))
        self.stdout.write(f"{'='*60}\n")

        # 1. Find the teacher
        try:
            teacher = TeacherProfile.objects.select_related('user', 'school').get(
                user__email=teacher_email
            )
            self.stdout.write(self.style.SUCCESS(f"✓ Found Teacher: {teacher.user.get_full_name()}"))
            self.stdout.write(f"  Email: {teacher.user.email}")
            self.stdout.write(f"  School: {teacher.school.name}")
        except TeacherProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"✗ Teacher not found with email: {teacher_email}"))
            return

        school = teacher.school

        # 2. Find or get the Class (template) for the given grade
        try:
            class_template = Class.objects.get(grade_number=grade)
            self.stdout.write(self.style.SUCCESS(f"✓ Found Class Template: {class_template.name} (Grade {class_template.grade_number})"))
        except Class.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"✗ Class template not found for grade: {grade}"))
            self.stdout.write("Creating Class template...")
            class_template = Class.objects.create(
                grade_number=grade,
                name=f"Class {grade}",
                description=f"Grade {grade} template class"
            )
            self.stdout.write(self.style.SUCCESS(f"✓ Created Class Template: {class_template.name}"))

        # 3. Assign attendance class to teacher
        teacher.attendance_class = class_template
        teacher.save()
        self.stdout.write(self.style.SUCCESS(f"✓ Assigned attendance class '{class_template.name}' to teacher"))

        # 4. Find or create SchoolClass with section
        section = 'A'  # Default section
        school_class, created = SchoolClass.objects.get_or_create(
            school=school,
            class_obj=class_template,
            section=section,
            defaults={
                'academic_year': '2024-2025',
                'max_students': 40,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f"✓ Created SchoolClass: {school_class.class_obj.name} - Section {section}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"✓ Found existing SchoolClass: {school_class.class_obj.name} - Section {section}"))

        # 5. Find students in the same school and assign them to the class
        students = StudentProfile.objects.filter(school=school).order_by('user__first_name')[:num_students]
        
        if students.count() < num_students:
            self.stdout.write(self.style.WARNING(f"! Only found {students.count()} students in the school"))
        
        assigned_count = 0
        for i, student in enumerate(students, 1):
            student.current_class = class_template
            student.section = section
            student.roll_no = str(i)
            student.save()
            assigned_count += 1
            self.stdout.write(f"  • Assigned {student.user.get_full_name()} to {class_template.name} - Section {section} (Roll: {i})")

        # Update school class student count
        school_class.current_students = assigned_count
        school_class.save()

        # Summary
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS("Summary:"))
        self.stdout.write(f"  - Teacher: {teacher.user.get_full_name()}")
        self.stdout.write(f"  - Attendance Class: {class_template.name}")
        self.stdout.write(f"  - School Class: {class_template.name} - Section {section}")
        self.stdout.write(f"  - Students Assigned: {assigned_count}")
        self.stdout.write(f"{'='*60}\n")

        self.stdout.write(self.style.SUCCESS("✓ Assignment completed successfully!"))


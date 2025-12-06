# 🎓 New Models Documentation - Sarathi Learn

## ✅ Complete Model Structure

---

## 📋 Table of Contents

1. [SchoolUser Model](#schooluser-model)
2. [Subject Model](#subject-model)
3. [Class Model](#class-model)
4. [Teacher-Subject Relationships](#teacher-subject-relationships)
5. [Student-Class Relationships](#student-class-relationships)
6. [Complete Relationship Map](#complete-relationship-map)
7. [Query Examples](#query-examples)

---

## 1. SchoolUser Model

### Purpose:
Many-to-Many junction table linking Schools with Users. Tracks user associations with schools.

### Fields:
```python
class SchoolUser(models.Model):
    id                (UUID, Primary Key)
    school            (ForeignKey → School)
    user              (ForeignKey → User)
    role_in_school    (ADMIN/TEACHER/STUDENT)
    is_active         (Boolean)
    joined_date       (Date)
    left_date         (Date, nullable)
    created_at        (DateTime)
    updated_at        (DateTime)
```

### Key Features:
- ✅ **Many-to-Many:** One user can be in multiple schools (e.g., transfer cases)
- ✅ **Unique Together:** (school, user) - One record per school-user combo
- ✅ **Role Tracking:** Know what role user has in each school
- ✅ **Active Status:** Track if association is currently active
- ✅ **Date Tracking:** When joined and when left

### Use Cases:
```python
# Get all schools a user is associated with
user.user_schools.all()

# Get all users in a school
school.school_users.all()

# Get all teachers in a school
school.school_users.filter(role_in_school='TEACHER')

# Check if user is active in school
SchoolUser.objects.filter(school=school, user=user, is_active=True).exists()
```

---

## 2. Subject Model

### Purpose:
Represents academic subjects taught in schools (Mathematics, Science, etc.)

### Fields:
```python
class Subject(models.Model):
    id            (UUID, Primary Key)
    name          (CharField, unique) - e.g., "Mathematics"
    code          (CharField, unique) - e.g., "MATH"
    description   (TextField)
    category      (CORE/ELECTIVE/VOCATIONAL/EXTRA_CURRICULAR)
    is_active     (Boolean)
    created_at    (DateTime)
    updated_at    (DateTime)
```

### Pre-loaded Subjects:
**Core Subjects (12):**
- Mathematics, Science, Physics, Chemistry, Biology
- English, Hindi, Social Studies, History, Geography, Civics, Economics

**Electives (12):**
- Sanskrit, French, German, Regional Language
- Computer Science, IT, Commerce, Accountancy, Business Studies
- Psychology, Sociology, Philosophy

**Vocational (4):**
- Arts & Crafts, Home Science, Agriculture, Entrepreneurship

**Extra-Curricular (5):**
- Physical Education, Music, Dance, Drama, Yoga

**Total: 33 subjects pre-loaded!**

### Use Cases:
```python
# Get all core subjects
Subject.objects.filter(category='CORE')

# Get a specific subject
math = Subject.objects.get(code='MATH')

# Get all active subjects
Subject.objects.filter(is_active=True)
```

---

## 3. Class Model

### Purpose:
Represents classes/grades in schools (Class 10-A, Class 5-B, etc.)

### Fields:
```python
class Class(models.Model):
    id                (UUID, Primary Key)
    school            (ForeignKey → School)
    name              (CharField) - e.g., "10th Standard"
    grade             (Integer) - 1 to 12
    section           (CharField) - e.g., "A", "B", "C"
    class_teacher     (ForeignKey → TeacherProfile, nullable)
    room_number       (CharField)
    max_students      (Integer, default=40)
    current_students  (Integer, default=0)
    academic_year     (CharField) - e.g., "2024-2025"
    is_active         (Boolean)
    created_at        (DateTime)
    updated_at        (DateTime)
```

### Key Features:
- ✅ **Unique:** (school, grade, section, academic_year)
- ✅ **Capacity Tracking:** max_students, current_students
- ✅ **Class Teacher:** Assigned homeroom teacher
- ✅ **Properties:** `full_name`, `is_full`, `available_seats`

### Use Cases:
```python
# Create a class
class_10a = Class.objects.create(
    school=school,
    name="10th Standard",
    grade=10,
    section="A",
    academic_year="2024-2025",
    max_students=40
)

# Get all classes in a school
school.classes.all()

# Get classes by grade
school.classes.filter(grade=10)

# Check if class is full
if class_10a.is_full:
    print("Class is at capacity!")

# Get available seats
print(f"Available seats: {class_10a.available_seats}")
```

---

## 4. Teacher-Subject Relationships

### 4.1 TeacherProfile (Updated)

```python
class TeacherProfile(models.Model):
    # ... existing fields ...
    
    # NEW: Many-to-Many with Subject
    subjects = models.ManyToManyField(
        Subject,
        through='TeacherSubject',
        related_name='teachers'
    )
```

### 4.2 TeacherSubject (Junction Table)

```python
class TeacherSubject(models.Model):
    id             (UUID, Primary Key)
    teacher        (ForeignKey → TeacherProfile)
    subject        (ForeignKey → Subject)
    is_primary     (Boolean) - Primary subject or not
    years_teaching (Integer) - Years teaching this subject
    created_at     (DateTime)
    updated_at     (DateTime)
```

### 4.3 TeacherClassAssignment

```python
class TeacherClassAssignment(models.Model):
    id             (UUID, Primary Key)
    teacher        (ForeignKey → TeacherProfile)
    school_class   (ForeignKey → Class)
    subject        (ForeignKey → Subject)
    academic_year  (CharField) - e.g., "2024-2025"
    is_active      (Boolean)
    created_at     (DateTime)
    updated_at     (DateTime)
```

**Key Feature:** One teacher teaches one subject to one class per academic year

### Workflow:

```
1. Teacher created with school association
   ↓
2. Teacher assigned to subjects (TeacherSubject)
   ↓
3. Teacher assigned to classes for specific subjects (TeacherClassAssignment)
   ↓
4. Schedule created for each assignment (ClassSchedule)
```

### Use Cases:
```python
# Assign subjects to teacher
teacher.subjects.add(math, physics, chemistry)

# Mark primary subject
TeacherSubject.objects.filter(
    teacher=teacher,
    subject=math
).update(is_primary=True)

# Assign teacher to class for a subject
assignment = TeacherClassAssignment.objects.create(
    teacher=teacher,
    school_class=class_10a,
    subject=math,
    academic_year="2024-2025"
)

# Get all subjects taught by a teacher
teacher.get_subjects()

# Get all classes taught by a teacher
teacher.get_classes()

# Get teacher teaching math to Class 10-A
assignment = TeacherClassAssignment.objects.get(
    school_class=class_10a,
    subject=math,
    academic_year="2024-2025"
)
teacher = assignment.teacher
```

---

## 5. Student-Class Relationships

### 5.1 StudentProfile (Updated)

```python
class StudentProfile(models.Model):
    # ... existing fields ...
    
    # NEW: Direct class association
    current_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    
    # Legacy fields (still kept)
    class_name = CharField (e.g., "10")
    section = CharField (e.g., "A")
```

### 5.2 StudentSubject (Junction Table)

```python
class StudentSubject(models.Model):
    id                      (UUID, Primary Key)
    student                 (ForeignKey → StudentProfile)
    subject                 (ForeignKey → Subject)
    teacher                 (ForeignKey → TeacherProfile, nullable)
    academic_year           (CharField)
    is_active               (Boolean)
    current_grade           (CharField, nullable)
    attendance_percentage   (Float)
    enrolled_at             (DateTime)
    updated_at              (DateTime)
```

**Key Feature:** Tracks which subjects a student is enrolled in

### Workflow:

```
1. Student registered and approved
   ↓
2. Admin assigns student to a class
   ↓
3. Student auto-enrolled in all subjects for that class
   ↓
4. Track performance per subject
```

### Use Cases:
```python
# Assign student to class
student.current_class = class_10a
student.save()

# Enroll student in subjects
for subject in class_10a.get_subjects():
    StudentSubject.objects.create(
        student=student,
        subject=subject,
        academic_year="2024-2025"
    )

# Get all students in a class
class_10a.students.all()

# Get all subjects for a student
student.subject_enrollments.all()

# Update subject performance
enrollment = StudentSubject.objects.get(
    student=student,
    subject=math
)
enrollment.current_grade = "A+"
enrollment.attendance_percentage = 95.5
enrollment.save()
```

---

## 6. Complete Relationship Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPLETE RELATIONSHIPS                     │
└─────────────────────────────────────────────────────────────────┘

SCHOOL
  ├─ One-to-Many → AdminProfile
  ├─ One-to-Many → TeacherProfile
  ├─ One-to-Many → StudentProfile
  ├─ One-to-Many → Class
  ├─ Many-to-Many (through SchoolUser) → User
  └─ One-to-Many → SchoolUser

USER
  ├─ One-to-One → UserRole
  ├─ One-to-One → SuperAdminProfile (if SUPER_ADMIN)
  ├─ One-to-One → AdminProfile (if ADMIN)
  ├─ One-to-One → TeacherProfile (if TEACHER)
  ├─ One-to-One → StudentProfile (if STUDENT)
  ├─ One-to-One → AIMachineProfile (if AI_MACHINE)
  └─ Many-to-Many (through SchoolUser) → School

SUBJECT
  ├─ Many-to-Many (through TeacherSubject) → TeacherProfile
  ├─ Many-to-Many (through StudentSubject) → StudentProfile
  ├─ One-to-Many → TeacherClassAssignment
  ├─ One-to-Many → Homework
  └─ One-to-Many → StudentSubject

CLASS
  ├─ ForeignKey ← School
  ├─ ForeignKey ← TeacherProfile (class_teacher)
  ├─ One-to-Many → StudentProfile (current_class)
  ├─ One-to-Many → TeacherClassAssignment
  └─ One-to-Many → Attendance

TEACHER
  ├─ ForeignKey ← School
  ├─ Many-to-Many (through TeacherSubject) → Subject
  ├─ One-to-Many → TeacherClassAssignment
  ├─ One-to-Many → ClassSchedule (through assignment)
  ├─ One-to-Many → Attendance (marked_by)
  ├─ One-to-Many → Homework (assigned_by)
  └─ Many-to-Many (through managed_classes) → Class

STUDENT
  ├─ ForeignKey ← School
  ├─ ForeignKey ← Class (current_class)
  ├─ Many-to-Many (through StudentSubject) → Subject
  ├─ One-to-Many → Homework
  ├─ One-to-Many → Attendance
  └─ One-to-Many → StudentSubject
```

---

## 7. Query Examples

### Get all teachers teaching Mathematics:
```python
math = Subject.objects.get(code='MATH')
teachers = math.teachers.all()
```

### Get all subjects a teacher teaches:
```python
teacher.subjects.all()
# or
teacher.get_subjects()
```

### Get all classes a teacher teaches:
```python
teacher.class_assignments.all()
# or
teacher.get_classes()
```

### Get all students in a class:
```python
class_10a.students.all()
```

### Get all subjects a student is enrolled in:
```python
student.subject_enrollments.all()
```

### Get teacher teaching specific subject to specific class:
```python
assignment = TeacherClassAssignment.objects.get(
    school_class=class_10a,
    subject=math,
    academic_year="2024-2025"
)
teacher = assignment.teacher
```

### Get all users in a school:
```python
# Method 1: Using get_all_users()
school.get_all_users()

# Method 2: Using SchoolUser
school.school_users.all()

# Method 3: By role
school.school_users.filter(role_in_school='TEACHER')
```

### Get school statistics:
```python
print(f"Total Teachers: {school.total_teachers}")
print(f"Total Students: {school.total_students}")
print(f"Total Classes: {school.classes.count()}")
print(f"Total Subjects: {Subject.objects.count()}")
```

---

## 🎯 Summary

| Model | Purpose | Key Feature |
|-------|---------|-------------|
| **SchoolUser** | School-User junction | Many-to-Many, tracks role in school |
| **Subject** | Academic subjects | 33 pre-loaded subjects |
| **Class** | School classes | Grade + Section, capacity tracking |
| **TeacherSubject** | Teacher-Subject link | Primary subject, years teaching |
| **TeacherClassAssignment** | Teacher teaches subject to class | One teacher per subject per class |
| **StudentSubject** | Student-Subject enrollment | Performance tracking per subject |

---

## 🚀 Initialization Commands

```bash
# Initialize default subjects (33 subjects)
python manage.py init_subjects

# Create Super Admin
python manage.py create_superadmin

# Check what's in database
python manage.py shell
>>> from superadmin.models import Subject
>>> Subject.objects.count()  # Should show 33
```

---

**All models are ready and documented! 🎉**


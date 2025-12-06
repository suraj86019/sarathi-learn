# 🗄️ Backend Models Structure

## Database Architecture

### ✅ Clean Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                      USER MODEL (Base)                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • UUID (Primary Key)                                       │
│  • Email (unique)                                           │
│  • Phone (unique)                                           │
│  • First Name, Last Name                                    │
│  • Date of Birth, Gender                                    │
│  • Profile Picture                                          │
│  • Address, City, District, State, Pincode, Country        │
│  • Status, Permissions                                      │
│  • Timestamps (created_at, updated_at, last_login)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────────────────────┐
                              │                                  │
                    ┌─────────▼────────┐              ┌─────────▼────────┐
                    │   USER ROLE      │              │  ACTIVITY LOGS   │
                    │  ━━━━━━━━━━━━━━  │              │  ━━━━━━━━━━━━━━  │
                    │  • user_id (FK)  │              │  • user_id (FK)  │
                    │  • role_type:    │              │  • action        │
                    │    - SUPER_ADMIN │              │  • description   │
                    │    - ADMIN       │              │  • timestamp     │
                    │    - TEACHER     │              └──────────────────┘
                    │    - STUDENT     │
                    │    - AI_MACHINE  │
                    └──────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┬─────────────────────┐
        │                     │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│ SUPER ADMIN    │  │  ADMIN PROFILE  │  │ TEACHER PROFILE │  │ STUDENT PROFILE │
│   PROFILE      │  │  ━━━━━━━━━━━━━━ │  │  ━━━━━━━━━━━━━━ │  │  ━━━━━━━━━━━━━━ │
│ ━━━━━━━━━━━━━━ │  │  • user_id (FK) │  │  • user_id (FK) │  │  • user_id (FK) │
│ • user_id (FK) │  │  • school_id    │  │  • school_id    │  │  • school_id    │
│ • admin_level  │  │  • employee_id  │  │  • employee_id  │  │  • udise_id     │
│ • region       │  │  • designation  │  │  • subject      │  │  • roll_no      │
│ • permissions  │  │  • permissions  │  │  • classes      │  │  • class/section│
└────────────────┘  └─────────────────┘  │  • schedules    │  │  • parent info  │
                                          │  • attendance   │  │  • ai_quota     │
                                          └─────────────────┘  └─────────────────┘
```

---

## 📊 Model Details

### 1. **users.User** (Base Model)
**Purpose:** Store all common user information

**Fields:**
- `id` (UUID) - Primary key
- `email` (unique) - Login identifier
- `phone` (unique) - Alternative identifier
- `first_name`, `last_name`
- `date_of_birth`, `gender`
- `profile_picture`
- `address`, `city`, `district`, `state`, `pincode`, `country`
- `status` (ACTIVE, PENDING, SUSPENDED, INACTIVE)
- `is_active`, `is_staff`, `is_superuser`
- `created_at`, `updated_at`, `last_login`

**Usage:**
```python
user = User.objects.get(email='user@example.com')
print(user.address)  # Can access address directly
print(user.state)    # Can access state directly
```

---

### 2. **users.UserRole**
**Purpose:** Define user's role type

**Fields:**
- `user` (OneToOne FK to User) - Primary key
- `role_type` - SUPER_ADMIN, ADMIN, TEACHER, STUDENT, AI_MACHINE
- `assigned_at`, `updated_at`

**Usage:**
```python
user = User.objects.get(email='user@example.com')
role = user.user_role.role_type  # Get role type
if role == 'SUPER_ADMIN':
    # Access super admin profile
    profile = user.superadmin_profile
```

---

### 3. **superadmin.SuperAdminProfile**
**Purpose:** Extended profile for Super Admins

**Fields:**
- `id` (UUID) - Primary key
- `user` (OneToOne FK to User)
- `admin_level` (NATIONAL, STATE, REGIONAL)
- `region` - Region/zone managed
- Permissions (can_create_admins, can_delete_users, etc.)

**Usage:**
```python
# Get user with all details
user = User.objects.get(email='superadmin@example.com')
profile = user.superadmin_profile
print(f"{user.first_name} manages {profile.region}")
print(f"Lives in: {user.city}, {user.state}")
```

---

### 4. **admins.AdminProfile**
**Purpose:** Extended profile for School Admins

**Fields:**
- `id` (UUID) - Primary key
- `user` (OneToOne FK to User)
- `school` (FK to School)
- `employee_id` (unique)
- `designation`, `department`
- Permissions (can_add_teachers, can_approve_ai_quota, etc.)

**Usage:**
```python
# Get admin with school info
user = User.objects.get(email='admin@school.edu')
profile = user.admin_profile
print(f"{user.first_name} works at {profile.school.name}")
print(f"Employee ID: {profile.employee_id}")
print(f"Contact: {user.phone}")
```

---

### 5. **teachers.TeacherProfile**
**Purpose:** Extended profile for Teachers

**Fields:**
- `id` (UUID) - Primary key
- `user` (OneToOne FK to User)
- `school` (FK to School)
- `employee_id` (unique)
- `subject`, `additional_subjects`
- `qualification`, `experience_years`
- `classes_taught` (JSON)
- Permissions

**Related Models:**
- `ClassSchedule` - Teacher's class schedule
- `Attendance` - Attendance records marked by teacher

**Usage:**
```python
# Get teacher with all info
user = User.objects.get(email='teacher@school.edu')
profile = user.teacher_profile
print(f"{user.first_name} teaches {profile.subject}")
print(f"School: {profile.school.name}")
print(f"Address: {user.address}, {user.city}")
```

---

### 6. **students.StudentProfile**
**Purpose:** Extended profile for Students

**Fields:**
- `id` (UUID) - Primary key
- `user` (OneToOne FK to User)
- `school` (FK to School)
- `udise_student_id` (unique)
- `roll_no`, `class_name`, `section`
- `parent_name`, `parent_phone`, `parent_email`
- `ai_quota_limit`, `ai_quota_used`
- `enrollment_date`

**Related Models:**
- `Homework` - Student homework assignments
- `AIChatSession` - AI chat sessions

**Usage:**
```python
# Get student with all info
user = User.objects.get(email='student@school.edu')
profile = user.student_profile
print(f"{user.first_name} - Class {profile.class_name}{profile.section}")
print(f"UDISE ID: {profile.udise_student_id}")
print(f"Parent: {profile.parent_name} ({profile.parent_phone})")
print(f"Lives at: {user.address}")
```

---

### 7. **ai_machine.AIMachineProfile**
**Purpose:** Profile for AI system services

**Fields:**
- `id` (UUID) - Primary key
- `user` (OneToOne FK to User)
- `api_key` (unique)
- `service_name`, `service_version`
- `is_online`, `last_ping`

**Related Models:**
- `AIChatSession` - AI chat sessions
- `ChatMessage` - Individual messages
- `AIUsageMetrics` - Usage statistics

---

## 🔗 Relationships

### Fetching User by Role:

```python
# Get all super admins
from users.models import UserRole, User
from superadmin.models import SuperAdminProfile

super_admin_users = User.objects.filter(
    user_role__role_type='SUPER_ADMIN'
)

# Get super admin with profile
for user in super_admin_users:
    profile = user.superadmin_profile
    print(f"{user.email} - {profile.admin_level}")
```

### Fetching by School:

```python
# Get all teachers in a school
from teachers.models import TeacherProfile

teachers = TeacherProfile.objects.filter(
    school__udise_code='DL001234'
).select_related('user')

for teacher in teachers:
    user = teacher.user
    print(f"{user.first_name} - {user.phone}")
    print(f"Address: {user.city}, {user.state}")
```

### Cross-role queries:

```python
# Get all users from a specific state
users_in_state = User.objects.filter(state='Delhi')

# For each user, check their role and get profile
for user in users_in_state:
    role = user.user_role.role_type
    if role == 'TEACHER':
        profile = user.teacher_profile
        print(f"Teacher: {user.email} at {profile.school.name}")
    elif role == 'STUDENT':
        profile = user.student_profile
        print(f"Student: {user.email} in Class {profile.class_name}")
```

---

## 💡 Advantages of This Structure

### ✅ Clean Separation
- **User model**: Common fields (name, contact, address)
- **UserRole**: Role identification
- **Profile models**: Role-specific data

### ✅ Easy Queries
```python
# Get user with any role
user = User.objects.get(email='user@example.com')

# Check role
role = user.user_role.role_type

# Access profile based on role
if role == 'TEACHER':
    profile = user.teacher_profile
elif role == 'STUDENT':
    profile = user.student_profile
```

### ✅ No Duplication
- Address stored once in User model
- State stored once in User model
- No need to repeat in every profile

### ✅ Flexibility
```python
# Update user address (works for all roles)
user = User.objects.get(email='user@example.com')
user.address = "New Address"
user.city = "New City"
user.save()
```

---

## 📦 Summary

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Common user data | email, phone, name, address, state, city |
| **UserRole** | Role identification | user_id, role_type |
| **SuperAdminProfile** | Super admin extras | user_id, admin_level, region |
| **AdminProfile** | School admin extras | user_id, school_id, employee_id |
| **TeacherProfile** | Teacher extras | user_id, school_id, subject, classes |
| **StudentProfile** | Student extras | user_id, school_id, udise_id, class |
| **AIMachineProfile** | AI service extras | user_id, api_key, service_name |

---

**Perfect separation! All common fields in User model, role-specific fields in profile models.** ✅

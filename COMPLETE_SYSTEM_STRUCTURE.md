# 🏫 Complete System Structure - Sarathi Learn

## 📊 Database Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

User (Central Authentication)
├── id (UUID, Primary Key)
├── email* (unique)
├── phone (unique)
├── first_name*
├── last_name*
├── date_of_birth
├── gender
├── profile_picture
├── address, city, district, state, pincode, country
├── status (PENDING/ACTIVE/INACTIVE/SUSPENDED)
├── is_staff, is_active
└── date_joined, last_login

UserRole (Defines user type)
├── user_id → User (OneToOne)
├── role_type* (SUPER_ADMIN/ADMIN/TEACHER/STUDENT/AI_MACHINE)
└── created_at, updated_at

UserSession (Track login sessions)
├── user_id → User
├── session_key
├── ip_address, user_agent
├── login_time, logout_time
└── is_active

ActivityLog (Track all actions)
├── user_id → User
├── action
├── timestamp
├── details (JSON)
└── ip_address

┌─────────────────────────────────────────────────────────────────┐
│                       SCHOOL SYSTEM                             │
└─────────────────────────────────────────────────────────────────┘

School (Central school entity)
├── id (UUID)
├── name*
├── udise_code* (11 digits, unique)
├── contact_email, contact_phone
├── principal_name
├── address*, city*, district*, state*, pincode
├── established_date, board
├── status (PENDING/ACTIVE/INACTIVE/SUSPENDED)
├── plan_type (BASIC/STANDARD/PREMIUM)
├── ai_quota_limit, ai_quota_used, ai_quota_reset_date
├── total_students, total_teachers, total_admins
├── approved_by → User (SuperAdmin)
├── approved_at
└── created_at, updated_at

┌─────────────────────────────────────────────────────────────────┐
│                      PROFILE SYSTEMS                            │
└─────────────────────────────────────────────────────────────────┘

SuperAdminProfile
├── user_id → User (OneToOne)
├── admin_level (NATIONAL/STATE/REGIONAL)
├── region
├── Permissions:
│   ├── can_create_admins
│   ├── can_create_teachers
│   ├── can_delete_users
│   ├── can_manage_schools
│   ├── can_view_platform_analytics
│   ├── can_manage_system_settings
│   └── can_send_announcements
└── created_at, updated_at

AdminProfile
├── user_id → User (OneToOne)
├── school_id → School* (ForeignKey - REQUIRED)
├── employee_id (unique)
├── designation
├── permissions (JSON)
└── created_at, updated_at

TeacherProfile
├── user_id → User (OneToOne)
├── school_id → School* (ForeignKey - REQUIRED)
├── employee_id (unique)
├── subject*
├── classes_taught (JSON)
├── permissions (JSON)
└── created_at, updated_at

StudentProfile
├── user_id → User (OneToOne)
├── school_id → School (ForeignKey - Initially NULL, assigned during approval)
├── udise_student_id* (21 digits, unique - REQUIRED)
├── roll_no
├── class_name, section
├── parent_name, parent_phone, parent_email
├── ai_quota_limit, ai_quota_used, ai_quota_reset_date
├── enrollment_date
└── created_at, updated_at

AIMachineProfile
├── user_id → User (OneToOne)
├── api_key* (unique)
├── service_name
├── is_active
├── last_heartbeat
└── created_at, updated_at

┌─────────────────────────────────────────────────────────────────┐
│                   SCHOOL RELATIONSHIPS                          │
└─────────────────────────────────────────────────────────────────┘

School Methods:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
get_all_admins()
  → Returns all AdminProfile objects for this school

get_all_teachers()
  → Returns all TeacherProfile objects for this school

get_all_students()
  → Returns all StudentProfile objects for this school

get_all_users()
  → Returns all User objects (admins + teachers + students)
  → Combined from admin_profiles, teacher_profiles, students relationships

Related Names:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
school.admin_profiles.all()        # All admins
school.teacher_profiles.all()      # All teachers
school.students.all()               # All students
school.announcements.all()          # School-specific announcements
school.ai_usage_metrics.all()       # AI usage data

User Relationships:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
user.user_role                      # UserRole object
user.superadmin_profile             # If SUPER_ADMIN
user.admin_profile                  # If ADMIN
user.teacher_profile                # If TEACHER
user.student_profile                # If STUDENT
user.ai_machine_profile             # If AI_MACHINE
user.sessions.all()                 # All sessions
user.activity_logs.all()            # All activities
user.approved_schools.all()         # Schools approved by this user


# 👥 User Creation Guide - Sarathi Learn

## User Creation Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                    USER CREATION FLOW                        │
└──────────────────────────────────────────────────────────────┘

🔧 SUPER ADMIN
   Created by: System Admin via Django command
   Command: python manage.py create_superadmin
   ↓
   Can create: ADMIN users
   ↓
👤 ADMIN
   Created by: Super Admin (via Super Admin Dashboard)
   ↓
   Can create: TEACHER users
   ↓
👨‍🏫 TEACHER
   Created by: Admin (via Admin Dashboard)
   Cannot create other users
   ↓
👨‍🎓 STUDENT
   Self-registration: Yes (via /register/student page)
   Approval required: Yes (by School Admin)
```

---

## 1. Creating Super Admin (System Level)

### Method 1: Interactive Command
```bash
cd "Sarathi Learn"
source venv/bin/activate
python manage.py create_superadmin
```

**You'll be prompted for:**
- Email address
- First name
- Last name
- Phone number (optional)
- Region/zone to manage (optional)
- Admin level (NATIONAL/STATE/REGIONAL)
- Password

**Example:**
```
Creating Super Admin User

Email address: superadmin@sarathi.gov.in
First name: System
Last name: Administrator
Phone number (optional): +919876543210
Region/zone to manage (optional): Northern Region
Admin level (NATIONAL/STATE/REGIONAL) [REGIONAL]: NATIONAL
Password: ********
Password (again): ********

✅ Super Admin created successfully!

Email: superadmin@sarathi.gov.in
Name: System Administrator
Level: NATIONAL
Region: Northern Region

User can now login at: http://localhost:3000/login
```

### Method 2: Non-Interactive Command
```bash
python manage.py create_superadmin \
  --email superadmin@sarathi.gov.in \
  --first-name System \
  --last-name Administrator \
  --phone +919876543210 \
  --region "Northern Region" \
  --level NATIONAL \
  --password SecurePassword123 \
  --non-interactive
```

---

## 2. Creating Admin (Super Admin Dashboard)

**Who can create:** Super Admin only

**Steps:**
1. Login as Super Admin
2. Go to Super Admin Dashboard → User Management
3. Click "Create User" button
4. Select role: "Admin"
5. Fill in details:
   - Email *
   - Phone
   - First name *
   - Last name *
   - Password *
   - Assign School *
   - Employee ID
   - Designation
6. Click "Create User"
7. Admin receives email with credentials
8. Admin can now login

**Fields required:**
```json
{
  "email": "admin@dpsdelhi.edu",
  "phone": "+919876543211",
  "password": "Admin@123",
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "school_id": "school-uuid-here",
  "employee_id": "EMP001",
  "designation": "Principal"
}
```

---

## 3. Creating Teacher (Admin Dashboard)

**Who can create:** School Admin only

**Steps:**
1. Login as Admin
2. Go to Admin Dashboard → Teacher Management
3. Click "Add Teacher" button
4. Fill in details:
   - Email *
   - Phone
   - First name *
   - Last name *
   - Password *
   - Employee ID *
   - Subject *
   - Qualification
   - Experience years
5. Click "Create Teacher"
6. Teacher receives email with credentials
7. Teacher can now login

**Fields required:**
```json
{
  "email": "teacher@dpsdelhi.edu",
  "phone": "+919876543212",
  "password": "Teacher@123",
  "first_name": "Priya",
  "last_name": "Sharma",
  "employee_id": "EMP101",
  "subject": "Mathematics",
  "qualification": "M.Sc Mathematics",
  "experience_years": 5
}
```

---

## 4. Student Self-Registration

**Who can create:** Students themselves

**Steps:**
1. Go to: http://localhost:3000/login
2. Select "Student" role
3. Click "Register as Student"
4. Fill registration form:
   - Email *
   - Phone *
   - First name *
   - Last name *
   - Date of Birth * (used for login!)
   - Gender
   - Address
   - City, District, State
   - Pincode
5. Click "Create Student Account"
6. Account created with status: PENDING
7. Wait for admin approval
8. Once approved, login with: Email + Date of Birth

**Important Notes:**
- ⚠️ **No password required** - Students use Date of Birth to login
- ⏳ Account is **PENDING** until admin approves
- 📧 Student receives email when approved
- 🔐 Login with: **Email + Date of Birth**

**Fields required:**
```json
{
  "email": "student@example.com",
  "phone": "+919876543213",
  "first_name": "Amit",
  "last_name": "Patel",
  "date_of_birth": "2005-05-15",
  "gender": "MALE",
  "address": "123 Main Street",
  "city": "Delhi",
  "district": "Central Delhi",
  "state": "Delhi",
  "pincode": "110001"
}
```

---

## 📋 User Creation Matrix

| User Type | Created By | Creation Method | Requires Approval | Login Method |
|-----------|------------|-----------------|-------------------|--------------|
| **Super Admin** | System Admin | Django command | ❌ No (auto-active) | Email + Password |
| **Admin** | Super Admin | Super Admin Dashboard | ✅ Yes | Email + Password |
| **Teacher** | School Admin | Admin Dashboard | ✅ Yes | Email + Password |
| **Student** | Self | Registration page | ✅ Yes | Email + Date of Birth |

---

## 🔐 Login Credentials Summary

### Super Admin, Admin, Teacher:
```
Username: Email address
Password: Set during creation
```

### Student:
```
Username: Email address
Password: Date of Birth (YYYY-MM-DD)
```

---

## 🎯 Quick Commands

### Create Super Admin:
```bash
python manage.py create_superadmin
```

### List all users (Django shell):
```bash
python manage.py shell
```
```python
from users.models import User, UserRole

# List all super admins
User.objects.filter(user_role__role_type='SUPER_ADMIN')

# List all admins
User.objects.filter(user_role__role_type='ADMIN')

# List all teachers
User.objects.filter(user_role__role_type='TEACHER')

# List all students
User.objects.filter(user_role__role_type='STUDENT')

# Count by status
User.objects.filter(status='PENDING').count()
User.objects.filter(status='ACTIVE').count()
```

---

## 📝 Status Workflow

### User Status Flow:
```
PENDING → (Approval) → ACTIVE → (Can use system)
   ↓         ↓              ↓
   ↓    (Rejection)    (Suspension)
   ↓         ↓              ↓
INACTIVE  INACTIVE    SUSPENDED
```

---

## 🚀 Getting Started

### First Time Setup:

1. **Create Super Admin:**
   ```bash
   python manage.py create_superadmin
   ```

2. **Login as Super Admin:**
   - Go to: http://localhost:3000/login
   - Select: Super Admin
   - Enter email + password

3. **Create Schools:**
   - In Super Admin Dashboard → Schools
   - Add schools to the system

4. **Create School Admins:**
   - In Super Admin Dashboard → Users
   - Create admin for each school

5. **Admins Create Teachers:**
   - Login as Admin
   - Create teachers for their school

6. **Students Self-Register:**
   - Students visit registration page
   - Fill form and submit
   - Admin approves students

---

## ✅ Permissions Summary

| Permission | Super Admin | Admin | Teacher | Student |
|------------|-------------|-------|---------|---------|
| Create Super Admin | ❌ | ❌ | ❌ | ❌ |
| Create Admin | ✅ | ❌ | ❌ | ❌ |
| Create Teacher | ✅ | ✅ | ❌ | ❌ |
| Create Student | ✅ | ✅ | ❌ | ✅ (self) |
| Approve Users | ✅ | ✅ (school only) | ❌ | ❌ |
| Suspend Users | ✅ | ✅ (school only) | ❌ | ❌ |

---

**Now you have a complete user creation hierarchy! 🎉**


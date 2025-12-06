# 🎓 Student Registration Flow

## Overview

Students can **self-register** through the registration page. Their accounts are created with **PENDING** status and require admin approval before they can use the system.

---

## 🔄 Registration Flow

```
Student visits registration page
    ↓
Fills registration form
    ↓
Submits form
    ↓
Account created with status: PENDING
    ↓
Admin gets notification
    ↓
Admin reviews application
    ↓
Admin approves & assigns school
    ↓
Student status → ACTIVE
    ↓
Student can now login
```

---

## 📝 Registration Page

**URL:** `http://localhost:3000/register/student`

**Required Fields:**
- ✅ Email *
- ✅ Phone *  
- ✅ First Name *
- ✅ Last Name *
- ✅ Date of Birth * (Used for login!)
- Gender
- Address
- City
- District
- ✅ State *
- Pincode

---

## 🔐 Student Login Method

**Important:** Students **do NOT use password** for login!

### Login Credentials:
- **Username:** Email address
- **Password:** Date of Birth (YYYY-MM-DD)

Example:
```
Email: student@example.com
Date of Birth: 2005-05-15
```

---

## 📊 Account Status Flow

### 1. PENDING (After Registration)
- Account created
- Cannot login yet
- Waiting for admin approval
- No school assigned

### 2. ACTIVE (After Approval)
- Admin approved account
- School assigned by admin
- Can login and use system
- Has AI quota

### 3. INACTIVE / SUSPENDED
- Account disabled
- Cannot login
- Needs admin intervention

---

## 👨‍💼 Admin Approval Process

### What Admin Sees:
1. **Pending Students List** in Admin Dashboard
2. Student details:
   - Name
   - Email
   - Phone
   - Date of Birth
   - Address
   - Registration date

### What Admin Does:
1. Review student application
2. Verify student details
3. Select school to assign
4. Set class & section
5. Set UDISE Student ID
6. Approve account

### After Approval:
- Student status → ACTIVE
- School assigned
- Welcome email sent
- Student can login

---

## 📧 Email Notifications

### On Registration:
**To Student:**
```
Subject: Registration Successful - Sarathi Learn

Your account has been created successfully!

Your registration is pending approval from school administration.
You will receive an email once your account is approved.

Registration Details:
- Email: student@example.com
- Name: John Doe
- State: Maharashtra

Next Steps:
1. Wait for admin approval
2. You'll receive approval email
3. Login with: Email + Date of Birth

Thank you!
```

### On Approval:
**To Student:**
```
Subject: Account Approved - Sarathi Learn

Great news! Your account has been approved!

School: ABC Public School
UDISE Student ID: 1234567890
Class: 10 A

You can now login to the portal:
👉 http://localhost:3000/login

Login Credentials:
- Email: student@example.com
- Date of Birth: [Your DOB]

Start learning with AI!
```

---

## 🎯 Implementation Details

### Frontend Component:
```typescript
// File: frontend/src/pages/StudentRegisterPage.tsx

- Beautiful registration form
- Field validation
- Date of birth picker
- Address fields
- Submit to API
- Success/error handling
- Toast notifications
```

### Backend API:
```python
# Endpoint: POST /api/users/auth/register/

Request:
{
  "email": "student@example.com",
  "phone": "+919876543210",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2005-05-15",
  "gender": "MALE",
  "state": "Maharashtra",
  "role_type": "STUDENT"
}

Response:
{
  "success": true,
  "message": "Registration successful! Your account is pending approval.",
  "data": {
    "user_id": "uuid-here",
    "status": "PENDING"
  }
}
```

### Database:
```sql
-- User created with:
status = 'PENDING'
is_active = True
role_type = 'STUDENT'

-- StudentProfile created with:
school = NULL  -- Will be assigned during approval
udise_student_id = 'TEMP_[user_id]'  -- Temp ID until approved
```

---

## 🚫 What Students CANNOT Do While PENDING

- ❌ Login to system
- ❌ Access student dashboard
- ❌ Use AI learning features
- ❌ View homework
- ❌ View attendance

## ✅ What Students CAN Do After APPROVAL

- ✅ Login with email + DOB
- ✅ Access student dashboard
- ✅ Use AI learning assistant
- ✅ View homework & assignments
- ✅ View attendance
- ✅ View news & events
- ✅ Update profile

---

## 🔧 Testing the Flow

### Step 1: Student Registration
```bash
# Frontend should be running
cd "Sarathi Learn/frontend"
npm run dev
```

1. Go to: `http://localhost:3000/login`
2. Select "Student" role
3. Click "Register as Student"
4. Fill the registration form
5. Submit

### Step 2: Check Database
```bash
# In Django shell
cd "Sarathi Learn"
source venv/bin/activate
python manage.py shell
```

```python
from users.models import User

# Find the pending student
student = User.objects.filter(status='PENDING', user_role__role_type='STUDENT').first()

print(f"Name: {student.get_full_name()}")
print(f"Email: {student.email}")
print(f"Status: {student.status}")
print(f"School: {student.student_profile.school}")  # Should be None
```

### Step 3: Admin Approval (Coming Soon)
- Login as Admin
- View pending students
- Approve & assign school
- Student can now login

---

## 📋 Key Points

1. ⚠️ **No Password** - Students use Date of Birth for login
2. ⏳ **Pending by Default** - All new students are PENDING
3. 🏫 **No School Initially** - School assigned during approval
4. 📧 **Email Notifications** - Sent on registration & approval
5. 🔐 **Secure** - Date of Birth validated during login

---

## 🎉 Summary

| Aspect | Detail |
|--------|--------|
| **Registration** | Self-service via web form |
| **Login Method** | Email + Date of Birth (no password) |
| **Initial Status** | PENDING |
| **School Assignment** | During admin approval |
| **Approval Required** | Yes, by School Admin |
| **Can Self-Register** | ✅ Yes |

---

**Students can now register themselves! 🚀**


# 🔐 Authentication Guide - Sarathi Learn

## Authentication System Overview

Sarathi Learn uses a role-based authentication system with JWT tokens.

---

## 🎯 Login Methods

### Different login methods for different user types:

| User Type | Login Identifier | Authentication Method |
|-----------|------------------|----------------------|
| **Super Admin** | Email or Phone | Password |
| **Admin** | Email or Phone | Password |
| **Teacher** | Email or Phone | Password |
| **Student** | Email or Phone | Date of Birth |
| **AI Machine** | Email | API Key |

---

## 📡 API Endpoints

### Base URL: `http://localhost:8000/api/`

### 1. **Login**
**Endpoint:** `POST /api/users/auth/login/`

#### For Super Admin/Admin/Teacher:
```json
{
  "email": "admin@school.edu",
  "password": "SecurePassword123"
}
```

#### For Students:
```json
{
  "email": "student@school.edu",
  "date_of_birth": "2005-05-15"
}
```

#### Success Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role_type": "TEACHER",
      "role_profile": {
        "school_name": "DPS Delhi",
        "employee_id": "EMP001",
        "subject": "Mathematics"
      }
    }
  }
}
```

---

### 2. **Logout**
**Endpoint:** `POST /api/users/auth/logout/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 3. **Register** (Optional - if self-registration is allowed)
**Endpoint:** `POST /api/users/auth/register/`

```json
{
  "email": "newuser@example.com",
  "phone": "+919876543210",
  "password": "SecurePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role_type": "TEACHER",
  "address": "123 Main St",
  "city": "Delhi",
  "state": "Delhi"
}
```

---

### 4. **Refresh Token**
**Endpoint:** `POST /api/users/auth/refresh/`

```json
{
  "refresh": "refresh_token_here"
}
```

**Response:**
```json
{
  "access": "new_access_token_here"
}
```

---

### 5. **Get Current User Profile**
**Endpoint:** `GET /api/users/users/me/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role_type": "TEACHER",
    "role_profile": {
      "school_id": "school-uuid",
      "school_name": "DPS Delhi",
      "employee_id": "EMP001",
      "subject": "Mathematics",
      "classes_taught": ["Class 10A", "Class 9B"]
    },
    "address": "123 Main St",
    "city": "Delhi",
    "state": "Delhi"
  }
}
```

---

### 6. **Update Profile**
**Endpoint:** `PUT/PATCH /api/users/users/update_profile/`

**Headers:**
```
Authorization: Bearer <access_token>
```

```json
{
  "first_name": "Updated Name",
  "phone": "+919999999999",
  "address": "New Address",
  "city": "Mumbai"
}
```

---

### 7. **Change Password**
**Endpoint:** `POST /api/users/users/change_password/`

**Headers:**
```
Authorization: Bearer <access_token>
```

```json
{
  "old_password": "OldPassword123",
  "new_password": "NewPassword456",
  "confirm_password": "NewPassword456"
}
```

---

## 🔑 JWT Token Usage

### Include token in every authenticated request:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Token Lifetime:
- **Access Token**: 24 hours
- **Refresh Token**: 7 days

---

## 🧪 Testing the API

### Using cURL:

#### 1. Login:
```bash
curl -X POST http://localhost:8000/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

#### 2. Get Profile:
```bash
curl -X GET http://localhost:8000/api/users/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Python requests:

```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/users/auth/login/',
    json={
        'email': 'admin@example.com',
        'password': 'password123'
    }
)
data = response.json()
access_token = data['data']['access_token']

# Get profile
profile = requests.get(
    'http://localhost:8000/api/users/users/me/',
    headers={'Authorization': f'Bearer {access_token}'}
)
print(profile.json())
```

---

## 🔐 Security Features

### ✅ Implemented:
- JWT-based authentication
- Password hashing (PBKDF2)
- CORS protection
- Role-based access control
- Activity logging
- Account status checking (active/suspended/pending)

### 🔒 Best Practices:
- Never share access tokens
- Use HTTPS in production
- Rotate tokens regularly
- Store tokens securely (httpOnly cookies recommended)
- Implement rate limiting

---

## 👥 Role-Based Access

### Permissions by Role:

#### Super Admin:
- ✅ Full platform access
- ✅ Create/delete users
- ✅ Manage all schools
- ✅ View all analytics
- ✅ System settings

#### Admin:
- ✅ Manage own school
- ✅ Add/remove teachers
- ✅ Add/remove students
- ✅ Approve AI quotas
- ✅ View school analytics

#### Teacher:
- ✅ Mark attendance
- ✅ Upload content
- ✅ Schedule classes
- ✅ View student reports
- ✅ Assign homework

#### Student:
- ✅ AI chat access
- ✅ View homework
- ✅ View schedule
- ✅ View profile

---

## 🚀 Next Steps

Now that authentication is set up:

1. **Run the server**:
   ```bash
   python manage.py runserver
   ```

2. **Access API**:
   ```
   http://localhost:8000/api/
   ```

3. **Admin Panel**:
   ```
   http://localhost:8000/admin/
   ```

4. **Create Super Admin** (via command line):
   ```bash
   python manage.py createsuperuser
   ```

---

**Authentication system is ready! 🎉**

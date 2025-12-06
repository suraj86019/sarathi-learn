# 🌐 API Documentation - Sarathi Learn

## 🔐 Authentication

**Base URL:** `http://localhost:8000/api`

### Login
```bash
POST /users/auth/login/
Content-Type: application/json

{
  "email": "surajshukla@gmail.com",
  "password": "Suraj@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid",
      "email": "surajshukla@gmail.com",
      "first_name": "Suraj",
      "last_name": "Shukla",
      "role_type": "SUPER_ADMIN",
      ...
    }
  }
}
```

### Use Token in Requests
```bash
GET /schools/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 🏫 Schools API

### List All Schools
```bash
GET /schools/
Authorization: Bearer <token>
```

**Query Parameters:**
- `?search=name` - Search by school name, UDISE code, city
- `?status=ACTIVE` - Filter by status
- `?state=Delhi` - Filter by state
- `?district=Central Delhi` - Filter by district
- `?ordering=name` - Sort by field
- `?page=1` - Pagination

**Response:**
```json
{
  "count": 30,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Government High School",
      "udise_code": "12345678901",
      "contact_email": "school@example.com",
      "principal_name": "Principal Kumar",
      "address": "123 Main Road",
      "city": "Delhi",
      "district": "Central Delhi",
      "state": "Delhi",
      "pincode": "110001",
      "board": "CBSE",
      "status": "ACTIVE",
      "plan_type": "PREMIUM",
      "total_students": 500,
      "total_teachers": 50,
      "total_admins": 2,
      "ai_quota_limit": 100000,
      "ai_quota_used": 5000,
      "ai_quota_percentage": 5.0,
      "created_at": "2024-11-09T...",
      "updated_at": "2024-11-09T..."
    }
  ]
}
```

### Get School Details
```bash
GET /schools/{id}/
Authorization: Bearer <token>
```

### Create School
```bash
POST /schools/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Government School",
  "udise_code": "12345678902",
  "address": "456 School Road",
  "city": "Mumbai",
  "district": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "board": "CBSE",
  "status": "PENDING"
}
```

### Update School
```bash
PUT /schools/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated School Name",
  "status": "ACTIVE"
}
```

### Approve School
```bash
POST /schools/{id}/approve/
Authorization: Bearer <token>
```

### Get School Statistics
```bash
GET /schools/{id}/statistics/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_admins": 2,
    "total_teachers": 50,
    "total_students": 500,
    "total_users": 552,
    "total_classes": 30,
    "ai_quota_used": 5000,
    "ai_quota_limit": 100000,
    "ai_quota_percentage": 5.0
  }
}
```

---

## 📚 Subjects API

### List All Subjects
```bash
GET /subjects/
```

**No authentication required for listing subjects!**

**Query Parameters:**
- `?search=math` - Search by subject name or code
- `?category=CORE` - Filter by category
- `?ordering=name` - Sort by field

**Response:**
```json
{
  "count": 33,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Mathematics",
      "code": "MATH",
      "description": "Mathematics and numerical skills",
      "category": "CORE",
      "is_active": true,
      "created_at": "2024-11-09T...",
      "updated_at": "2024-11-09T..."
    }
  ]
}
```

### Get Subjects by Category
```bash
GET /subjects/by_category/
```

**Response:**
```json
{
  "success": true,
  "data": {
    "core": [
      {
        "id": "uuid",
        "name": "Mathematics",
        "code": "MATH",
        ...
      }
    ],
    "elective": [...],
    "vocational": [...],
    "extra_curricular": [...]
  }
}
```

### Get Subject Details
```bash
GET /subjects/{id}/
```

---

## 🏛️ Classes API

### List All Classes
```bash
GET /classes/
Authorization: Bearer <token>
```

**Query Parameters:**
- `?school=uuid` - Filter by school
- `?grade=10` - Filter by grade
- `?section=A` - Filter by section
- `?academic_year=2024-2025` - Filter by year

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "school": "school-uuid",
      "school_name": "Government High School",
      "name": "10th Standard",
      "grade": 10,
      "section": "A",
      "class_teacher": "teacher-uuid",
      "class_teacher_name": "Mr. Kumar",
      "room_number": "101",
      "max_students": 40,
      "current_students": 35,
      "academic_year": "2024-2025",
      "is_active": true,
      "full_name": "Grade 10 - Section A",
      "is_full": false,
      "available_seats": 5
    }
  ]
}
```

### Get Class Students
```bash
GET /classes/{id}/students/
Authorization: Bearer <token>
```

---

## 🔗 Example Integration

### React/TypeScript Example

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// 1. Login
async function login(email: string, password: string) {
  const response = await axios.post(`${API_BASE}/users/auth/login/`, {
    email,
    password
  });
  
  const { access_token, refresh_token, user } = response.data.data;
  
  // Store tokens
  localStorage.setItem('accessToken', access_token);
  localStorage.setItem('refreshToken', refresh_token);
  
  return user;
}

// 2. Get all schools
async function getSchools() {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(`${API_BASE}/schools/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data.results;
}

// 3. Search schools
async function searchSchools(query: string) {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(`${API_BASE}/schools/`, {
    params: { search: query },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data.results;
}

// 4. Get all subjects (no auth required)
async function getSubjects() {
  const response = await axios.get(`${API_BASE}/subjects/`);
  return response.data.results;
}

// 5. Get subjects by category
async function getSubjectsByCategory() {
  const response = await axios.get(`${API_BASE}/subjects/by_category/`);
  return response.data.data;
}
```

---

## 🧪 Testing with cURL

### Test Login
```bash
curl -X POST http://localhost:8000/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "surajshukla@gmail.com",
    "password": "Suraj@123"
  }'
```

### Test Get Schools
```bash
# Get token from login response first
TOKEN="your-access-token-here"

curl -X GET "http://localhost:8000/api/schools/" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Search Schools
```bash
curl -X GET "http://localhost:8000/api/schools/?search=Government" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Get Subjects (No Auth)
```bash
curl -X GET "http://localhost:8000/api/subjects/"
```

---

## 📊 Available Filters & Searches

### Schools
- **Search fields:** name, udise_code, city, district, state, principal_name
- **Filter fields:** status, state, district, plan_type
- **Ordering:** name, created_at, total_students, total_teachers

### Subjects
- **Search fields:** name, code, description
- **Filter fields:** category, is_active
- **Ordering:** name, code, category

### Classes
- **Filter fields:** school, grade, section, academic_year, is_active
- **Search fields:** name, grade, section

---

## 🚀 Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/users/auth/login/` | POST | No | User login |
| `/schools/` | GET | Yes | List schools |
| `/schools/?search=` | GET | Yes | Search schools |
| `/schools/{id}/` | GET | Yes | Get school |
| `/schools/{id}/approve/` | POST | Yes | Approve school |
| `/subjects/` | GET | No | List subjects |
| `/subjects/by_category/` | GET | No | Get grouped |
| `/classes/` | GET | Yes | List classes |
| `/classes/{id}/students/` | GET | Yes | Get students |

---

## 🔐 Credentials

**Super Admin:**
- Email: `surajshukla@gmail.com`
- Password: `Suraj@123`

**Test Data:**
- 30 Schools
- 33 Subjects
- Ready for testing!

---

**API is ready for frontend integration! 🎉**


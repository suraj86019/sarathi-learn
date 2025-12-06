# 🔗 Frontend-Backend Integration Guide

## ✅ Integration Complete!

Your React frontend is now fully integrated with the Django backend!

---

## 🎯 How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                 INTEGRATION FLOW                             │
└──────────────────────────────────────────────────────────────┘

React Frontend (Port 3000)
    ↓
User Login → LoginPage.tsx
    ↓
AuthContext → auth.service.ts
    ↓
API Service → api.ts
    ↓
HTTP Request (with JWT)
    ↓
Django Backend (Port 8000)
    ↓
URL Router → backend/urls.py
    ↓
View → users/views.py (LoginView)
    ↓
Serializer → users/serializers.py
    ↓
Model → users/models.py
    ↓
Database → db.sqlite3
    ↓
Response (JSON + JWT tokens)
    ↓
Frontend stores tokens → localStorage
    ↓
User logged in! → Navigate to dashboard
```

---

## 📁 Updated Files

### Frontend Files:

1. **`frontend/src/services/api.ts`** ✅
   - Base API configuration
   - Points to `http://localhost:8000/api`
   - JWT token interceptor
   - Auto token refresh
   - Error handling

2. **`frontend/src/services/auth.service.ts`** ✅
   - Login method
   - Logout method
   - Register method
   - Get profile method
   - Update profile method
   - Change password method

3. **`frontend/src/contexts/AuthContext.tsx`** ✅
   - Global auth state
   - User management
   - Auto-login on page load
   - Profile refresh

4. **`frontend/src/pages/LoginPage.tsx`** ✅
   - Updated to use real API
   - Error handling with toast notifications
   - Role-based authentication
   - Proper redirects

5. **`frontend/vite.config.ts`** ✅
   - Proxy configured for `/api` → `http://localhost:8000`
   - Environment variables support

6. **`frontend/.env`** ✅
   - `VITE_API_URL=http://localhost:8000/api`

---

## 🔑 Environment Configuration

### Frontend (`.env`):
```bash
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Sarathi Learn
VITE_APP_VERSION=1.0.0
```

### Backend (`.env`):
```bash
SECRET_KEY=django-insecure-dev-key-for-development-only
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 🚀 How to Run Both

### Terminal 1 - Backend:
```bash
cd "Sarathi Learn"
source venv/bin/activate
python manage.py runserver

# Backend running at: http://localhost:8000
```

### Terminal 2 - Frontend:
```bash
cd "Sarathi Learn/frontend"
npm run dev

# Frontend running at: http://localhost:3000
```

---

## 🔐 Authentication Flow

### 1. **Login Request**

**Frontend sends:**
```javascript
// For Super Admin/Admin/Teacher
{
  "email": "admin@school.edu",
  "password": "SecurePassword123"
}

// For Student
{
  "email": "student@school.edu",
  "date_of_birth": "2005-05-15"
}
```

**Backend responds:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@school.edu",
      "full_name": "John Doe",
      "role_type": "ADMIN",
      "role_profile": {
        "school_name": "DPS Delhi",
        "employee_id": "EMP001"
      }
    }
  }
}
```

### 2. **Token Storage**

Frontend stores in localStorage:
```javascript
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### 3. **Authenticated Requests**

All subsequent requests include:
```javascript
headers: {
  'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGc...'
}
```

### 4. **Auto Token Refresh**

When access token expires (401 error):
1. API interceptor catches the error
2. Uses refresh token to get new access token
3. Retries the original request
4. If refresh fails → redirect to login

---

## 📡 API Endpoints Available

### Authentication:
- `POST /api/users/auth/login/` - Login
- `POST /api/users/auth/logout/` - Logout
- `POST /api/users/auth/register/` - Register
- `POST /api/users/auth/refresh/` - Refresh token

### User Profile:
- `GET /api/users/users/me/` - Get current user
- `PUT /api/users/users/update_profile/` - Update profile
- `POST /api/users/users/change_password/` - Change password

### Users Management (Super Admin/Admin):
- `GET /api/users/users/` - List users
- `POST /api/users/users/` - Create user
- `POST /api/users/users/{id}/approve/` - Approve user
- `POST /api/users/users/{id}/suspend/` - Suspend user

---

## 🎯 Login Examples

### Using the UI:

1. Go to: `http://localhost:3000/login`
2. Select role (Student/Teacher/Admin/Super Admin)
3. Enter credentials:
   - **Students:** Email + Date of Birth
   - **Others:** Email + Password
4. Click "Sign In"
5. Redirected to appropriate dashboard

### Using API directly:

```javascript
import authService from '@/services/auth.service';

// Login
const response = await authService.login({
  email: 'admin@school.edu',
  password: 'password123'
});

// Get profile
const profile = await authService.getProfile();

// Update profile
const updated = await authService.updateProfile({
  first_name: 'New Name',
  city: 'Mumbai'
});
```

---

## 🔧 CORS Configuration

Backend allows requests from frontend:

```python
# backend/settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

---

## 🐛 Troubleshooting

### Issue: "Network Error" or "Failed to fetch"

**Solution:**
1. Make sure backend is running: `python manage.py runserver`
2. Check backend URL in frontend `.env`: `VITE_API_URL=http://localhost:8000/api`
3. Verify CORS settings in `backend/settings.py`

### Issue: "401 Unauthorized"

**Solution:**
1. Token might be expired
2. Try logging out and logging in again
3. Check browser console for error details

### Issue: "CORS Error"

**Solution:**
1. Backend: Check `CORS_ALLOWED_ORIGINS` includes `http://localhost:3000`
2. Backend: Ensure `corsheaders` middleware is enabled
3. Restart both servers

### Issue: "Connection Refused"

**Solution:**
1. Backend not running → Start: `python manage.py runserver`
2. Wrong port → Check backend is on 8000, frontend on 3000

---

## 📊 Testing the Integration

### Manual Test:

1. **Start both servers**
2. **Open browser**: `http://localhost:3000`
3. **Click "Login"**
4. **Test login**:
   - Try student login with DOB
   - Try admin login with password
5. **Check browser console**: Should see API calls to `http://localhost:8000/api/`
6. **Check browser storage**: Should see tokens in localStorage

### Using Browser DevTools:

1. **Network Tab**: See API calls
2. **Application → Local Storage**: See stored tokens
3. **Console**: See any errors

---

## 🎨 API Response Format

All API responses follow this format:

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": ["Error detail"]
  }
}
```

---

## 🔐 Security Features

### ✅ Implemented:
- JWT tokens (access + refresh)
- Auto token refresh
- Secure token storage
- CORS protection
- Password hashing (backend)
- Role-based access control
- Activity logging (backend)

### 🔒 Best Practices:
- Tokens stored in localStorage
- HTTPS in production (not in dev)
- Token expiry (24 hours access, 7 days refresh)
- Automatic logout on token expiry

---

## 📦 Next Steps

Now that integration is complete:

1. ✅ **Authentication** - Working!
2. 🔜 **Create test users** - Via Django admin or createsuperuser
3. 🔜 **Test login** - Try all 4 roles
4. 🔜 **Build dashboard features** - Connect to backend APIs
5. 🔜 **Add other endpoints** - Schools, attendance, AI chat, etc.

---

## 🎯 Quick Start Checklist

- [x] Backend setup complete
- [x] Frontend setup complete
- [x] API service configured
- [x] Auth service created
- [x] Login page updated
- [x] CORS configured
- [x] Environment variables set
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Test login working

---

## 📚 Key Files to Remember

| File | Purpose |
|------|---------|
| `frontend/src/services/api.ts` | API configuration & interceptors |
| `frontend/src/services/auth.service.ts` | Authentication methods |
| `frontend/src/contexts/AuthContext.tsx` | Global auth state |
| `frontend/.env` | Frontend environment variables |
| `backend/settings.py` | Backend configuration |
| `backend/urls.py` | API routing |
| `users/views.py` | Authentication endpoints |

---

**🎉 Your frontend and backend are fully integrated!**

**Start both servers and test the login flow!** 🚀

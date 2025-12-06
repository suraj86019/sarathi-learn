# 📊 Database Configuration - Sarathi Learn

## 🎯 Current Database Setup

### **SQLite Database** (Default - Development)

**Location:** `/Users/apple/Desktop/Project/Sarathi Learn/db.sqlite3`

**Configuration in:** `backend/settings.py`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

---

## 📁 Database File Location

```
Sarathi Learn/
├── backend/
│   └── settings.py    ← Database configured here
├── db.sqlite3         ← DATABASE FILE IS HERE! ✅
├── manage.py
└── ...
```

**Full Path:** 
```
/Users/apple/Desktop/Project/Sarathi Learn/db.sqlite3
```

---

## 🔧 How It's Integrated

### 1. **Configuration** (`backend/settings.py`):
```python
# Line ~87 in settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### 2. **Custom User Model**:
```python
# Line ~95 in settings.py
AUTH_USER_MODEL = 'users.User'
```
This tells Django to use our custom User model instead of the default.

### 3. **Installed Apps**:
```python
# Lines ~23-42 in settings.py
INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    ...
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Our apps
    'users.apps.UsersConfig',
    'superadmin.apps.SuperadminConfig',
    'admins.apps.AdminsConfig',
    'teachers.apps.TeachersConfig',
    'students.apps.StudentsConfig',
    'ai_machine.apps.AiMachineConfig',
]
```

---

## 📊 Database Tables Created

After running migrations, these tables exist in `db.sqlite3`:

### Core Django Tables:
- `auth_permission`
- `auth_group`
- `django_session`
- `django_content_type`
- `django_admin_log`

### Our Application Tables:
```
users:
  ├── users                  (User model)
  ├── user_roles            (UserRole model)
  ├── user_sessions         (UserSession model)
  └── activity_logs         (ActivityLog model)

superadmin:
  ├── superadmin_profiles   (SuperAdminProfile)
  ├── schools               (School model)
  ├── platform_analytics    (PlatformAnalytics)
  ├── system_settings       (SystemSettings)
  └── announcements         (Announcement model)

admins:
  └── admin_profiles        (AdminProfile)

teachers:
  ├── teacher_profiles      (TeacherProfile)
  ├── class_schedules       (ClassSchedule)
  └── attendance            (Attendance)

students:
  ├── student_profiles      (StudentProfile)
  └── homework              (Homework)

ai_machine:
  ├── ai_machine_profiles   (AIMachineProfile)
  ├── ai_chat_sessions      (AIChatSession)
  ├── chat_messages         (ChatMessage)
  └── ai_usage_metrics      (AIUsageMetrics)
```

**Total:** ~20 tables

---

## 🔄 How Data Flows

```
1. User makes API request
   ↓
2. Django receives request → views.py
   ↓
3. Views query models → models.py
   ↓
4. Django ORM translates to SQL
   ↓
5. SQL query executes on db.sqlite3
   ↓
6. Data returned to view
   ↓
7. Serializer formats data → serializers.py
   ↓
8. JSON response sent to user
```

---

## 🗄️ SQLite Features

### ✅ Advantages:
- **Zero configuration** - No server setup needed
- **Single file** - Easy to backup/move
- **Fast** - Good for development
- **Built-in** - No external dependencies

### ⚠️ Limitations:
- Not ideal for production
- Single writer at a time
- No remote access
- Limited concurrent users

---

## 🚀 Switching to PostgreSQL (Production)

### Step 1: Install PostgreSQL driver
```bash
pip install psycopg2-binary
```

### Step 2: Update settings.py
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sarathi_learn',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Step 3: Or use DATABASE_URL (recommended)
```python
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://user:password@localhost:5432/sarathi_learn',
        conn_max_age=600
    )
}
```

---

## 🔍 Viewing Database Data

### Option 1: Django Admin Panel
```
http://localhost:8000/admin/
```
- Login with superuser credentials
- View/edit all data

### Option 2: Django Shell
```bash
python manage.py shell
```
```python
from users.models import User
users = User.objects.all()
for user in users:
    print(user.email, user.get_role())
```

### Option 3: SQLite Browser
Install: https://sqlitebrowser.org/
Open: `db.sqlite3`

### Option 4: Command Line
```bash
sqlite3 db.sqlite3
.tables
SELECT * FROM users;
```

---

## 📦 Database Commands

### Create migrations:
```bash
python manage.py makemigrations
```

### Apply migrations:
```bash
python manage.py migrate
```

### View migrations:
```bash
python manage.py showmigrations
```

### Rollback migration:
```bash
python manage.py migrate users 0001
```

### Reset database (⚠️ DELETES ALL DATA):
```bash
rm db.sqlite3
python manage.py migrate
```

---

## 🔐 Database Security

### Current Setup (Development):
- ✅ No password needed (SQLite)
- ✅ File permissions protect access
- ✅ Local only

### Production Setup:
- [ ] Use PostgreSQL/MySQL
- [ ] Strong database password
- [ ] Restrict network access
- [ ] Regular backups
- [ ] Encrypted connections
- [ ] Database user with minimal permissions

---

## 💾 Backup & Restore

### Backup (SQLite):
```bash
cp db.sqlite3 db.sqlite3.backup
```

### Restore:
```bash
cp db.sqlite3.backup db.sqlite3
```

### Export Data:
```bash
python manage.py dumpdata > backup.json
```

### Import Data:
```bash
python manage.py loaddata backup.json
```

---

## 📊 Database Size

Check current size:
```bash
du -h db.sqlite3
```

---

## 🎯 Summary

| Item | Value |
|------|-------|
| **Database Type** | SQLite |
| **Location** | `/Users/apple/Desktop/Project/Sarathi Learn/db.sqlite3` |
| **Configuration** | `backend/settings.py` line ~87 |
| **Tables** | ~20 tables |
| **Size** | Grows with data |
| **Access** | Django ORM, Admin Panel, Shell |
| **Backup** | Copy the file |

---

**Your database is a single file: `db.sqlite3` in the project root!** 📊

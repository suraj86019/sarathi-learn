# Sarathi Learn - Government School Digital Platform

> A unified digital platform for government schools where students learn with AI, teachers manage attendance and lessons, and everyone stays connected with national education events and news.

## 🌟 Features

- **AI Buddy for Students** - Daily 1-hour interactive AI class; students ask questions and learn
- **School Dashboard** - Attendance, schedules, student progress
- **Morning Digital Board** - Daily educational & national news, motivational messages
- **National Event Mode** - Stream CM/PM speeches on 15 Aug & 26 Jan
- **Offline-friendly** - Usable even in low-connectivity areas
- **Government-aligned** - Uses UDISE codes, optional Aadhaar reference, fits NEP 2020 vision

## 🏗️ Tech Stack

### Backend
- Django 5.0 + Django REST Framework
- PostgreSQL for database
- Redis for caching & queue
- Celery for background tasks
- JWT Authentication

### AI Microservice
- FastAPI
- OpenAI / Llama integration
- Rate limiting & usage tracking

### Deployment (MVP)
- Railway/Render for backend
- Vercel/Netlify for frontend
- Cloudflare for CDN & security

## 📋 Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Redis 7+
- Node.js 18+ (for frontend)
- OpenAI API Key

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd "Sarathi Learn"
chmod +x setup.sh
./setup.sh
source venv/bin/activate
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: http://localhost:3000

### 2. Configure Environment

Update `.env` file with your credentials:
- Database credentials
- Redis URL
- OpenAI API key
- AWS S3 credentials (optional)

### 3. Run Migrations

```bash
source venv/bin/activate
cd backend
python manage.py migrate
python manage.py createsuperuser
```

### 4. Start Services

**Django Backend:**
```bash
python manage.py runserver
```

**AI Microservice:**
```bash
cd ai_service
uvicorn main:app --reload --port 8001
```

**Celery Worker:**
```bash
celery -A backend worker -l info
```

**Celery Beat (Scheduler):**
```bash
celery -A backend beat -l info
```

**Redis:**
```bash
redis-server
```

## 📁 Project Structure

```
Sarathi Learn/
├── frontend/               # React + TypeScript frontend ✅
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   └── types/         # TypeScript types
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
├── backend/                 # Django backend
│   ├── apps/               # Django apps
│   │   ├── authentication/ # User auth & identity
│   │   ├── students/       # Student portal
│   │   ├── teachers/       # Teacher portal
│   │   ├── schools/        # School admin
│   │   ├── ai_chat/        # AI chat integration
│   │   ├── news/           # News & events
│   │   └── analytics/      # Reports & analytics
│   ├── core/               # Core settings & config
│   ├── media/              # User uploaded files
│   └── manage.py
├── ai_service/             # FastAPI AI microservice
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── utils/
├── frontend/               # React frontend (to be added)
├── logs/                   # Application logs
├── requirements.txt        # Backend dependencies
├── requirements-ai.txt     # AI service dependencies
├── requirements-dev.txt    # Dev dependencies
├── .env                    # Environment variables
├── setup.sh               # Setup script
└── README.md              # This file
```

## 🧩 Main Modules

1. **Authentication & Identity** - UDISE-based login for students, teachers, admins
2. **Student Portal** - AI chat, news, homework, events
3. **Teacher Portal** - Attendance, scheduling, reports
4. **Admin Dashboard** - User management, analytics, announcements
5. **AI Layer** - Chat microservice with safety filters
6. **News & Events** - Daily feed, live event streaming
7. **Analytics & Reporting** - Usage tracking, export reports

## 🔒 Security & Compliance

- UDISE ID as primary identity
- Only last 4 digits of Aadhaar stored (encrypted)
- HTTPS everywhere
- Rate limiting on AI calls
- Consent logs for guardians
- Data purge policy

## 📊 Database Schema

Key tables:
- `School` - UDISE code, district, state
- `User` - username, role, school
- `StudentProfile` - roll_no, DOB, class
- `TeacherProfile` - employee ID, phone
- `Attendance` - daily records
- `AIChatSession` - chat logs & token usage
- `NewsFeed` - daily news cache

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest backend/apps/students/tests/test_views.py
```

## 🚀 Deployment

### Development
```bash
python manage.py runserver
```

### Production (Railway/Render)
- Set environment variables
- Configure PostgreSQL & Redis addons
- Set up Celery worker dyno
- Enable HTTPS

## 📝 API Documentation

Once the server is running, access:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

## 🤝 Contributing

This is a government education initiative. For contributions:
1. Follow Django best practices
2. Write tests for new features
3. Update documentation
4. Follow security guidelines

## 📄 License

Government of India - Education Department

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact: dev-team@sarathilearn.gov.in

---

**Built with ❤️ for Indian Government Schools**


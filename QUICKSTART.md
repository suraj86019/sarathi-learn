# Sarathi Learn - Quick Start Guide

## ✅ Setup Complete!

Your development environment is ready! Here's what was installed:

### Installed Components

**Backend (Django):**
- Django 5.0.1 + Django REST Framework
- PostgreSQL driver (psycopg)
- Redis & Celery for background tasks
- JWT Authentication
- AWS S3 integration

**AI Microservice (FastAPI):**
- FastAPI 0.115.6 + Uvicorn
- OpenAI 1.59.9
- LangChain 0.3.15
- AsyncPG for database
- Rate limiting with SlowAPI

**Development Tools:**
- pytest for testing
- black, flake8, isort for code formatting
- pylint, mypy for code quality
- IPython for interactive debugging
- pre-commit hooks

---

## 🚀 Next Steps

### 1. Copy Environment File

```bash
cd "Sarathi Learn"
cp .env.template .env
```

Then update `.env` with your actual configuration values.

### 2. Generate Django Secret Key

```bash
source venv/bin/activate
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and update `SECRET_KEY` in `.env`

### 3. Install PostgreSQL & Redis (if not installed)

**macOS (using Homebrew):**
```bash
brew install postgresql@14 redis
brew services start postgresql@14
brew services start redis
```

### 4. Create Database

```bash
# Create PostgreSQL database
createdb sarathi_learn

# Or using psql
psql postgres
CREATE DATABASE sarathi_learn;
\q
```

### 5. Run Database Migrations (Once Django project is set up)

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

### 6. Start Development Servers

**Terminal 1 - Django Backend:**
```bash
source venv/bin/activate
cd backend
python manage.py runserver
```

**Terminal 2 - AI Microservice:**
```bash
source venv/bin/activate
cd ai_service
uvicorn main:app --reload --port 8001
```

**Terminal 3 - Celery Worker:**
```bash
source venv/bin/activate
celery -A backend worker -l info
```

**Terminal 4 - Celery Beat (Scheduler):**
```bash
source venv/bin/activate
celery -A backend beat -l info
```

---

## 📦 Package Versions Summary

| Component | Version | Purpose |
|-----------|---------|---------|
| Python | 3.13.7 | Runtime |
| Django | 5.0.1 | Web framework |
| FastAPI | 0.115.6 | AI microservice |
| PostgreSQL | via psycopg 3.1.18 | Database |
| Redis | 5.0.1 | Cache & queue |
| Celery | 5.3.6 | Background tasks |
| OpenAI | 1.59.9 | AI integration |
| LangChain | 0.3.15 | AI orchestration |

---

## 🔧 Development Commands

### Virtual Environment

```bash
# Activate
source venv/bin/activate

# Deactivate
deactivate
```

### Code Quality

```bash
# Format code
black .

# Sort imports
isort .

# Lint code
flake8 .
pylint backend/

# Type checking
mypy backend/
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test
pytest backend/apps/students/tests/test_views.py
```

### Database

```bash
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Shell
python manage.py shell
```

---

## 📚 API Documentation

Once servers are running:

- **Django Backend**: http://localhost:8000/api/docs/
- **AI Service**: http://localhost:8001/docs
- **Admin Panel**: http://localhost:8000/admin/
- **Flower (Celery Monitor)**: http://localhost:5555

---

## 🐛 Troubleshooting

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running:
brew services start redis
```

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
pg_isready
# Should return: accepting connections

# If not running:
brew services start postgresql@14
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
pip install -r requirements-ai.txt
pip install -r requirements-dev.txt
```

---

## 📁 Recommended Project Structure

```
Sarathi Learn/
├── backend/                    # Django backend
│   ├── apps/                  # Django applications
│   │   ├── authentication/    # UDISE-based auth
│   │   ├── students/          # Student portal
│   │   ├── teachers/          # Teacher portal
│   │   ├── schools/           # School admin
│   │   ├── ai_chat/           # AI chat integration
│   │   ├── news/              # News & events
│   │   └── analytics/         # Reports & analytics
│   ├── core/                  # Core settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── manage.py
├── ai_service/                # FastAPI AI microservice
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── utils/
├── frontend/                  # React frontend (to be added)
├── logs/                      # Application logs
└── requirements.txt           # Dependencies
```

---

## 🎯 Ready to Start Coding!

You're all set! The project is configured and ready for development.

**Next actions:**
1. Update `.env` with your configuration
2. Set up PostgreSQL and Redis
3. Start building the Django backend structure
4. Implement AI microservice endpoints

**Need help?** Check the main `README.md` for detailed documentation.

---

**Happy Coding! 🚀**



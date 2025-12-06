#!/bin/bash

# Sarathi Learn - Project Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Sarathi Learn Platform..."
echo ""

# Check Python version
echo "📋 Checking Python version..."
python3 --version || { echo "❌ Python 3 not found. Please install Python 3.10+"; exit 1; }

# Create virtual environment
echo ""
echo "🔧 Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
pip install -r requirements.txt

# Install AI service dependencies
echo ""
echo "🤖 Installing AI service dependencies..."
pip install -r requirements-ai.txt

# Install development dependencies
echo ""
echo "🛠️  Installing development dependencies..."
pip install -r requirements-dev.txt

# Copy .env.example to .env if it doesn't exist
echo ""
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your configuration."
else
    echo "⚠️  .env file already exists. Skipping..."
fi

# Create necessary directories
echo ""
echo "📁 Creating project directories..."
mkdir -p backend/apps
mkdir -p backend/core
mkdir -p backend/media
mkdir -p backend/static
mkdir -p ai_service
mkdir -p logs
echo "✅ Directories created"

# Generate Django secret key
echo ""
echo "🔐 Generating Django secret key..."
DJANGO_SECRET=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
echo "Generated secret key (add to .env): $DJANGO_SECRET"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Activate virtual environment: source venv/bin/activate"
echo "   2. Update .env file with your configuration"
echo "   3. Install PostgreSQL and Redis if not already installed"
echo "   4. Run: python manage.py migrate"
echo "   5. Run: python manage.py createsuperuser"
echo "   6. Run: python manage.py runserver"
echo ""
echo "🎉 Happy coding!"


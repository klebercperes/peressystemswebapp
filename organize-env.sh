#!/bin/bash
# Script to organize .env file with proper sections

ENV_FILE=".env"
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

echo "=== Organizing .env file ==="
echo ""

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo "✅ Backed up existing .env to $BACKUP_FILE"
fi

# Create organized .env file
cat > "$ENV_FILE" << 'ENVEOF'
# ============================================
# Environment Variables Configuration
# ============================================
# Copy this file to .env and fill in your actual values
# DO NOT commit .env to version control!

# ============================================
# Database Configuration
# ============================================
POSTGRES_USER=msp_user
POSTGRES_PASSWORD=DzSdTbrnK_UaSfxTpFBeUw
POSTGRES_DB=msp_db

# Database connection URL (auto-constructed from above, or set directly)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Note: Use 'msp_postgres' as hostname in Docker Compose
DATABASE_URL=postgresql://msp_user:DzSdTbrnK_UaSfxTpFBeUw@msp_postgres:5432/msp_db

# ============================================
# JWT Authentication
# ============================================
# Generate a secure key with: python -c "import secrets; print(secrets.token_urlsafe(32))"
# Or: openssl rand -hex 32
SECRET_KEY=g73pYz09-8SIs9oL9gjCA9N5fPlVFnXxSWmJCq7bP-0

# Token expiration time in minutes (default: 30 days = 43200 minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# ============================================
# Frontend Configuration
# ============================================
# API URL for frontend (adjust based on your deployment)
# Production: https://peres.systems
# Local development: http://10.0.1.122:8000
VITE_API_URL=https://peres.systems

# Google OAuth Client ID (for Google sign-in)
VITE_GOOGLE_CLIENT_ID=195201008846-r2l59ff7tal07r7ursh2rb8pamob3n15.apps.googleusercontent.com

# Optional: Gemini AI (for AI Assistant feature)
# VITE_GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# GitHub Frontend Repository Configuration
# ============================================
# GitHub repository for frontend (format: username/repo-name)
GITHUB_REPO_URL=klebercperes/PeresSystemWebAppNew2

# GitHub branch to use (default: main)
GITHUB_BRANCH=main

# GitHub Personal Access Token (for pushing changes)
# Get token from: https://github.com/settings/tokens
# Select scope: 'repo' (full control of private repositories)
# Leave empty if repository is public or using SSH
GITHUB_TOKEN=

# ============================================
# Email/SMTP Configuration
# ============================================
# SMTP settings for email verification and password reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kleber@peres.au
SMTP_PASSWORD=axslrfhbwombgcai
SMTP_FROM_EMAIL=kleber@peres.au
SMTP_FROM_NAME=Peres Systems
FRONTEND_URL=https://peres.systems

# ============================================
# CORS Configuration
# ============================================
# Allowed origins for CORS (comma-separated)
# Add your frontend URLs here
CORS_ORIGINS=https://peres.systems,https://www.peres.systems,http://10.0.1.122:5173,http://localhost:5173,http://localhost:3000,http://frontend:5173

# ============================================
# Server Configuration (Optional)
# ============================================
# Gunicorn workers (default: 4)
# GUNICORN_WORKERS=4

# Log level (default: info)
# LOG_LEVEL=info

# Environment (production, development, staging)
# ENVIRONMENT=production

# ============================================
# Monitoring & Error Tracking (Optional)
# ============================================
# Sentry DSN for error tracking
# SENTRY_DSN=

# Sentry traces sample rate (0.0 to 1.0)
# SENTRY_TRACES_SAMPLE_RATE=0.1

# Sentry profiles sample rate (0.0 to 1.0)
# SENTRY_PROFILES_SAMPLE_RATE=0.1

# ============================================
# Rate Limiting (Optional)
# ============================================
# API rate limit (default: 100/minute)
# API_RATE_LIMIT=100/minute

# Auth rate limit (default: 5/minute)
# AUTH_RATE_LIMIT=5/minute

# Register rate limit (default: 3/hour)
# REGISTER_RATE_LIMIT=3/hour
ENVEOF

echo "✅ Created organized .env file"
echo ""
echo "📝 Next steps:"
echo "   1. Add your GITHUB_TOKEN if needed"
echo "   2. Review all values and update as necessary"
echo "   3. Your original .env is backed up to: $BACKUP_FILE"

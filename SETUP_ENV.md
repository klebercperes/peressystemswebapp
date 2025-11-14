# Environment Variables Setup Guide

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate a secure SECRET_KEY:**
   ```bash
   # Option 1: Using Python
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Option 2: Using OpenSSL
   openssl rand -hex 32
   
   # Option 3: Use the provided script
   ./generate-secret-key.sh
   ```

3. **Edit `.env` file and update:**
   - `SECRET_KEY` - Paste the generated key
   - `POSTGRES_PASSWORD` - Set a strong database password
   - `DATABASE_URL` - Update with your database password
   - `VITE_API_URL` - Set your frontend API URL (if different from default)

## Required Variables

### SECRET_KEY (REQUIRED)
- **Purpose**: Used to sign JWT tokens
- **Format**: Random string, minimum 32 characters
- **Security**: MUST be unique and secret - never commit to git
- **Generate**: Use the script or commands above

### POSTGRES_PASSWORD (REQUIRED)
- **Purpose**: Database password
- **Format**: Strong password (min 12 characters recommended)
- **Security**: Use a unique, strong password

### DATABASE_URL (REQUIRED)
- **Purpose**: Full database connection string
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- **Note**: Can be auto-constructed from POSTGRES_* variables

## Optional Variables

### ACCESS_TOKEN_EXPIRE_MINUTES
- **Default**: 43200 (30 days)
- **Purpose**: JWT token expiration time in minutes
- **Adjust**: Based on your security requirements

### VITE_API_URL
- **Default**: `http://localhost:8000`
- **Purpose**: Backend API URL for frontend
- **Production**: Set to your production API URL

### VITE_GEMINI_API_KEY
- **Optional**: Only needed for AI Assistant feature
- **Purpose**: Google Gemini API key

## Security Best Practices

1. ✅ **Never commit `.env` to git** (already in .gitignore)
2. ✅ **Use different secrets for each environment** (dev/staging/prod)
3. ✅ **Rotate secrets regularly** (especially SECRET_KEY)
4. ✅ **Use strong passwords** (min 12 characters, mix of chars)
5. ✅ **Restrict file permissions**: `chmod 600 .env`

## Docker Usage

When using Docker Compose, the `.env` file is automatically loaded:
```bash
docker-compose up
```

The `docker-compose.yml` file reads from `.env` using the `env_file` directive.

## Troubleshooting

### "SECRET_KEY environment variable is required"
- **Solution**: Make sure `.env` file exists and contains `SECRET_KEY=...`
- **Check**: Verify file is in project root directory

### "Could not connect to database"
- **Solution**: Check `DATABASE_URL` and `POSTGRES_PASSWORD` match
- **Check**: Ensure database container is running

### "Environment variable not found"
- **Solution**: Restart Docker containers after creating/updating `.env`
- **Command**: `docker-compose down && docker-compose up --build`

## Production Checklist

Before deploying to production:

- [ ] Generate a new, unique `SECRET_KEY` (don't reuse dev key)
- [ ] Set a strong `POSTGRES_PASSWORD` (min 16 characters)
- [ ] Update `VITE_API_URL` to production URL
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` appropriately
- [ ] Verify `.env` is NOT in git (check `.gitignore`)
- [ ] Set proper file permissions: `chmod 600 .env`
- [ ] Use a secrets manager in production (AWS Secrets Manager, etc.)


# Production Update Guide

**Last Updated**: November 2024

## 🚀 Quick Update Steps

### 1. Pull Latest Changes
```bash
cd /home/kleber/peres_systems
git pull origin main
```

### 2. Update Environment Variables

Make sure your `.env` file has all required variables:

```env
# Email/SMTP Configuration (REQUIRED for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Peres Systems
ADMIN_EMAIL=kleber@peres.systems
FRONTEND_URL=https://peres.systems

# WhatsApp Configuration (OPTIONAL)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_APP_ID=your-app-id
```

### 3. Rebuild and Restart Services

```bash
# Rebuild backend (to get latest code)
docker-compose build backend

# Rebuild frontend (if frontend changes)
docker-compose build frontend

# Restart services
docker-compose down
docker-compose up -d

# Or restart individually
docker-compose restart backend
docker-compose restart frontend
```

### 4. Verify Services

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost/health

# Check logs
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50
```

---

## 📋 Recent Updates (November 2024)

### ✅ Contact Form Email Fixes
- Fixed email sending endpoint to properly check if email was sent
- Added proper error handling and user feedback
- Fixed environment variable loading with `load_dotenv()`
- Fixed docker-compose.yml environment variable substitution
- Improved error messages for users

**Status**: ✅ **COMPLETE** - Contact form now works correctly

### ✅ WhatsApp Integration
- Complete WhatsApp Business API integration
- Twilio fallback support
- Webhook support for receiving messages
- Status update tracking (delivered, read, sent)
- Improved error handling and user messages
- Phone number normalization
- Rate limiting (10 messages/minute)

**Status**: ✅ **COMPLETE** - Ready for production use

### ✅ Email Service Improvements
- Better error handling with detailed logging
- Support for multiple email types (verification, password reset, contact)
- Improved email format (MIMEMultipart)
- Better error messages for frontend

**Status**: ✅ **COMPLETE** - Email service production-ready

### ✅ Environment Variable Fixes
- Fixed docker-compose.yml variable substitution issues
- Added explicit SMTP variables to docker-compose
- Fixed ADMIN_EMAIL configuration
- Improved .env file loading

**Status**: ✅ **COMPLETE** - All environment variables properly configured

---

## 🔧 Configuration Checklist

Before deploying to production, verify:

- [ ] `.env` file exists and has all required variables
- [ ] SMTP credentials are correct (for contact form)
- [ ] ADMIN_EMAIL is set to correct address
- [ ] WhatsApp credentials configured (if using WhatsApp)
- [ ] CORS_ORIGINS includes your production domain
- [ ] VITE_API_URL points to production API
- [ ] Database backups are configured
- [ ] SSL certificates are configured (if using HTTPS)

---

## 🧪 Testing After Update

### Test Contact Form
1. Visit your website
2. Go to Contact page
3. Fill out and submit the form
4. Check that you receive the email at ADMIN_EMAIL
5. Verify success message appears on website

### Test WhatsApp (if configured)
1. Visit your website
2. Click WhatsApp chat button
3. Send a test message
4. Check your WhatsApp for the message
5. Verify proper error messages if API not configured

### Test Email Verification
1. Try signing up with email
2. Check email for verification link
3. Click link to verify account
4. Verify account is activated

---

## 📊 Service Status

Check if services are running:

```bash
docker-compose ps
```

Expected output:
```
NAME          STATUS
msp_backend   Up
msp_frontend  Up
msp_postgres  Up
```

---

## 🐛 Troubleshooting

### Contact Form Not Sending Emails
1. Check SMTP credentials in `.env`
2. Verify ADMIN_EMAIL is set correctly
3. Check backend logs: `docker-compose logs backend | grep -i email`
4. Verify backend was restarted after .env changes

### WhatsApp Not Working
1. Check WhatsApp credentials in `.env`
2. Verify all WhatsApp variables are set
3. Check backend logs: `docker-compose logs backend | grep -i whatsapp`
4. Test with curl: `curl -X POST http://localhost:8000/api/whatsapp/send -H "Content-Type: application/json" -d '{"phone":"61493929511","message":"test"}'`

### Services Not Starting
1. Check logs: `docker-compose logs`
2. Verify `.env` file exists
3. Check Docker is running: `docker ps`
4. Check ports are available: `netstat -tuln | grep -E '80|8000|5432'`

---

## 📚 Related Documentation

- [WhatsApp Setup Guide](../features/WHATSAPP_SETUP_STEP_BY_STEP.md)
- [Email Verification Setup](../features/EMAIL_VERIFICATION_SETUP.md)
- [Production Readiness Assessment](./PRODUCTION_READINESS_ASSESSMENT.md)
- [Frontend Production Setup](./FRONTEND_PRODUCTION_SETUP.md)

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# Stop services
docker-compose down

# Restore from backup (if you have one)
cp .env.backup.* .env

# Restart with previous version
git checkout <previous-commit>
docker-compose up -d
```

---

**Status**: ✅ Production update guide complete and ready for use.


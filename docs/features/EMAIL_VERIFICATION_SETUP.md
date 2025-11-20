# Email Verification Setup Guide

## ✅ Implementation Complete

Email-only signup with email verification has been implemented. Users can now sign up with just their email address and verify it via email.

---

## 🔧 SMTP Configuration

To enable email sending, configure SMTP settings in your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kleber@peres.au
SMTP_PASSWORD=axslrfhbwombgcai
SMTP_FROM_EMAIL=kleber@peres.au
SMTP_FROM_NAME=Peres Systems
FRONTEND_URL=https://peres.systems
```

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASSWORD`

### Other Email Providers

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

**AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
```

---

## 📧 How It Works

### Email-Only Signup Flow

1. **User signs up with email only**:
   - Goes to signup page
   - Selects "Sign Up with Email Only"
   - Enters email and optional full name
   - Clicks "Send Verification Email"

2. **System sends verification email**:
   - Creates unverified user account
   - Generates unique verification token
   - Sends email with verification link
   - Token expires in 24 hours

3. **User verifies email**:
   - Clicks link in email
   - Redirected to verification page
   - Optionally sets password
   - Account activated and logged in

### Password Signup Flow (Unchanged)

- User signs up with username, email, and password
- Account is immediately verified and activated
- Auto-login after registration

---

## 🔌 API Endpoints

### POST `/api/auth/signup-email`

Sign up with email only (sends verification email).

**Request:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe"  // Optional
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox to verify your email address."
}
```

### POST `/api/auth/verify-email`

Verify email address and optionally set password.

**Request:**
```json
{
  "token": "verification-token-from-email",
  "password": "optional-password"  // Optional
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

---

## 🎨 Frontend Integration

### SignupPage

- Toggle between "Sign Up with Password" and "Sign Up with Email Only"
- Email-only mode: Only requires email and optional full name
- Shows success message after sending verification email

### VerifyEmailPage

- New page at `/verify-email?token=...`
- User can:
  - Set password during verification
  - Skip password (can set later)
- Auto-redirects to dashboard after verification

### App.tsx Route

Add to your routing:

```tsx
import VerifyEmailPage from './pages/VerifyEmailPage';

// In your router:
<Route path="/verify-email" element={<VerifyEmailPage onVerifySuccess={handleVerifySuccess} />} />
```

---

## 🧪 Testing Without SMTP

If SMTP is not configured, the system will:
- Log verification link to console/logs
- Still create user account
- You can manually test verification with the logged token

**Example log output:**
```
Verification link for user@example.com: https://peres.systems/verify-email?token=abc123...
```

---

## 🔒 Security Features

- **Token Expiration**: Verification tokens expire after 24 hours
- **Unique Tokens**: Each token is cryptographically secure (32 bytes)
- **Rate Limiting**: Signup endpoints are rate-limited
- **Email Validation**: Email format is validated
- **Account Status**: Unverified accounts are inactive until verified

---

## 📝 Database Changes

The following fields were added to the `users` table:

- `email_verified` (BOOLEAN, default: FALSE)
- `verification_token` (VARCHAR, unique, nullable)
- `verification_token_expires` (TIMESTAMP, nullable)
- `username` (now nullable for email-only signups)

Migration script: `backend/migrate_add_email_verification.py`

---

## 🚀 Deployment Checklist

- [ ] Configure SMTP settings in `.env`
- [ ] Restart backend container
- [ ] Update frontend App.tsx with VerifyEmailPage route
- [ ] Test email signup flow
- [ ] Test email verification
- [ ] Test password setting during verification
- [ ] Verify email templates look correct

---

## 🐛 Troubleshooting

**Emails not sending:**
- Check SMTP credentials in `.env`
- Verify SMTP port (587 for TLS, 465 for SSL)
- Check firewall/network restrictions
- Review backend logs for SMTP errors

**Verification link not working:**
- Check `FRONTEND_URL` in `.env` matches your domain
- Verify token hasn't expired (24 hours)
- Check token in database matches email token

**User can't verify:**
- Check if user account exists
- Verify `email_verified` is FALSE
- Check token expiration time
- Review backend logs for errors

---

## 📚 Related Files

- `backend/app/email_service.py` - Email sending service
- `backend/app/auth_routes.py` - Signup/verification endpoints
- `backend/migrate_add_email_verification.py` - Database migration
- `pages/SignupPage.tsx` - Updated signup page
- `pages/VerifyEmailPage.tsx` - Email verification page


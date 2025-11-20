# Customer Signup & Google OAuth Implementation

## ✅ What Was Implemented

### Backend Changes

1. **User Model Updates** (`backend/app/models.py`):
   - Added `UserRole` enum: `customer` or `team`
   - Added `role` column (default: `customer`)
   - Added `google_id` column (for OAuth users)
   - Made `hashed_password` nullable (for OAuth users)

2. **Registration Endpoint** (`backend/app/auth_routes.py`):
   - Updated to set user role (customers by default, team for first user)
   - Returns user with role information

3. **Google OAuth Endpoint** (`backend/app/auth_routes.py`):
   - New `/api/auth/google` endpoint
   - Verifies Google ID token
   - Creates or links user account
   - Returns JWT token

4. **Dependencies** (`backend/requirements.txt`):
   - Added `httpx==0.27.0` for Google token verification

### Frontend Changes

1. **Auth Service** (`services/auth.ts`):
   - Added `register()` method for user signup
   - Added `googleLogin()` method for Google OAuth
   - Updated `User` interface to include `role` field

2. **SignupPage** (`pages/SignupPage.tsx`):
   - Complete rewrite to use `/api/auth/register`
   - Creates user account (not client)
   - Auto-login after registration
   - Proper error handling

3. **LoginPage** (`pages/LoginPage.tsx`):
   - Implemented Google OAuth with Google Identity Services
   - Uses user role from API response (not hardcoded)
   - Supports both Google login and email/password login

4. **App.tsx**:
   - Updated to use role from user object (not localStorage)
   - Correctly routes to customer vs team dashboard

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
cd /home/kleber/peres_systems
docker exec msp_backend python3 /app/migrate_add_user_role.py
```

Or if running locally:
```bash
cd /home/kleber/peres_systems/backend
python3 migrate_add_user_role.py
```

This will:
- Add `role` column (default: `customer`)
- Add `google_id` column
- Make `hashed_password` nullable
- Update existing users: superusers → `team`, others → `customer`

### Step 2: Install httpx in Backend

```bash
docker exec msp_backend pip install httpx==0.27.0
```

Or rebuild the backend:
```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.github.yml build backend
docker-compose -f docker-compose.https-domain.github.yml up -d backend
```

### Step 3: Set Up Google OAuth

1. **Create Google OAuth Credentials:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins:
     - `https://peres.systems`
     - `https://www.peres.systems`
   - Authorized redirect URIs:
     - `https://peres.systems`
     - `https://www.peres.systems`
   - Copy the **Client ID** and **Client Secret**
   - **Important**: Never commit secrets to Git! Store them in `.env` file only.

2. **Add to Frontend Environment:**
   - ✅ **Already configured!** Added to `.env`:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```
   - ✅ **Already updated!** `docker-compose.https-domain.github.yml` includes:
   ```yaml
   frontend:
     build:
       args:
         VITE_GOOGLE_CLIENT_ID: ${VITE_GOOGLE_CLIENT_ID:-}
   ```
   - ✅ **Dockerfile updated** to accept and use `VITE_GOOGLE_CLIENT_ID`

### Step 4: Push Frontend Changes to GitHub

✅ **Already completed!** Frontend changes have been pushed to GitHub.

The following commits are on GitHub:
- `feat: Add customer signup and Google OAuth support (merged)`
- `feat: Add customer signup and Google OAuth support`
- `Integrate FastAPI authentication`

If you need to push again:
```bash
cd /tmp/PeresSystemWebAppNew2-check
# Use GITHUB_TOKEN from .env or environment variable
git push https://${GITHUB_TOKEN}@github.com/klebercperes/PeresSystemWebAppNew2.git main
```

### Step 5: Rebuild Frontend

```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
docker stop msp_frontend && docker rm msp_frontend
docker-compose -f docker-compose.https-domain.github.yml up -d frontend
```

---

## 🧪 Testing

### Test Customer Signup

1. Go to https://peres.systems
2. Click "Don't have a client account? Sign Up"
3. Fill in:
   - Username
   - Email
   - Full Name (optional)
   - Password (min 8 characters)
   - Confirm Password
4. Click "Sign Up"
5. Should auto-login and show **Customer Dashboard**

### Test Google OAuth

1. Go to https://peres.systems
2. Click "Sign in with Google"
3. Select Google account
4. Should login and show **Customer Dashboard**

### Test Team Login

1. Go to https://peres.systems
2. Use "Team Member Login"
3. Login with: `kleber` / `SecurePass123`
4. Should show **Team Dashboard** (full MSP dashboard)

---

## 📋 User Roles

- **Customer**: 
  - Created via signup or Google OAuth
  - Sees Customer Dashboard (limited view)
  - Can view their tickets/assets
  
- **Team**:
  - Created manually or first user becomes team
  - Sees full MSP Dashboard
  - Can manage all clients, tickets, assets

---

## 🔧 Troubleshooting

### Google OAuth Not Working

1. Check `VITE_GOOGLE_CLIENT_ID` is set in frontend build
2. Verify Google OAuth credentials are configured correctly
3. Check browser console for errors
4. Ensure authorized origins match your domain

### Signup Fails

1. Check backend logs: `docker logs msp_backend`
2. Verify database migration ran successfully
3. Check username/email is unique
4. Ensure password is at least 8 characters

### Wrong Dashboard Shown

1. Check user role in database:
   ```bash
   docker exec msp_postgres psql -U msp_user -d msp_db -c "SELECT username, email, role FROM users;"
   ```
2. Clear browser localStorage and login again
3. Check backend `/api/auth/me` returns correct role

---

## 📝 Notes

- First user to register automatically becomes `team` (admin)
- Google OAuth users are always `customer`
- Regular signups are always `customer`
- Team members must be created manually or be first user


# 🐛 Comprehensive Debugging Guide

## 🚀 Quick Test Links

### Local Development
- **Frontend**: http://10.0.1.122:5173 (if running `npm run dev`)
- **Backend API**: http://10.0.1.122:8000
- **API Docs**: http://10.0.1.122:8000/docs
- **Health Check**: http://10.0.1.122:8000/health

### Production
- **Frontend**: https://peres.systems
- **Backend API**: https://peres.systems/api
- **API Docs**: https://peres.systems/docs
- **Health Check**: https://peres.systems/api/health

---

## 🔍 Debugging Strategy

### 1. **Browser Developer Tools** (Primary Tool)

#### Open DevTools:
- **Chrome/Edge**: `F12` or `Ctrl+Shift+I`
- **Firefox**: `F12` or `Ctrl+Shift+I`
- **Safari**: `Cmd+Option+I` (enable in preferences first)

#### Key Tabs to Monitor:

**A. Console Tab** (Most Important)
- Shows JavaScript errors
- Shows API call errors
- Shows authentication errors
- **What to look for:**
  - Red errors (network failures, auth errors)
  - Failed API calls
  - Token issues

**B. Network Tab**
- Shows all HTTP requests
- Filter by `XHR` or `Fetch` to see API calls
- **What to check:**
  - Login request: `POST /api/auth/login` → Should return `200` with token
  - Data requests: `GET /api/clients`, `/api/tickets`, etc. → Should return `200`
  - Failed requests: `401` (not authenticated), `403` (forbidden), `500` (server error)
  - Request headers: Should include `Authorization: Bearer <token>` after login

**C. Application Tab → Local Storage**
- Check stored values:
  - `auth_token`: Should contain JWT token after login
  - `auth_user`: Should contain user info after login
- **To clear**: Right-click → Clear (useful for testing)

---

### 2. **Backend Logs** (Check API Responses)

```bash
# View backend logs in real-time
docker logs -f msp_backend

# Or view last 50 lines
docker logs --tail 50 msp_backend
```

**What to look for:**
- Login attempts: `POST /api/auth/login`
- Authentication errors: `401 Unauthorized`
- Successful logins: `200 OK` with token
- API calls with/without tokens

---

### 3. **Frontend Logs** (Check Nginx)

```bash
# View frontend/nginx logs
docker logs -f msp_frontend

# Or view last 50 lines
docker logs --tail 50 msp_frontend
```

**What to look for:**
- 404 errors (missing files)
- 502 errors (backend connection issues)
- Access logs (which files are being served)

---

### 4. **Network Connectivity**

```bash
# Test if frontend can reach backend
docker exec msp_frontend wget -O- http://msp_backend:8000/api/health 2>&1

# Test if nginx can reach backend
docker exec msp_nginx_proxy wget -O- http://msp_backend:8000/api/health 2>&1

# Test backend health endpoint
curl https://peres.systems/api/health
```

---

## 🎯 Step-by-Step: Debugging Login Flow

### Step 1: Clear Browser State
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. **Local Storage** → `https://peres.systems` (or `http://10.0.1.122:5173` for local)
4. Delete all items (especially `auth_token`)
5. Refresh page (`Ctrl+Shift+R` or `Cmd+Shift+R`)

### Step 2: Monitor Login Request
1. Open **Network** tab in DevTools
2. Filter by `XHR` or `Fetch`
3. Try to login with: `kleber` / `SecurePass123` (or your credentials)
4. Look for: `POST /api/auth/login`

**Expected Success:**
- Status: `200 OK`
- Response: `{"access_token": "...", "token_type": "bearer"}`
- Headers: `Content-Type: application/json`

**Common Errors:**
- `401 Unauthorized`: Wrong credentials
- `422 Unprocessable Entity`: Missing/invalid form data
- `500 Internal Server Error`: Backend issue (check backend logs)

### Step 3: Verify Token Storage
1. After successful login, check **Application** → **Local Storage**
2. Should see:
   - `auth_token`: JWT token string
   - `auth_user`: User object with username, etc.

### Step 4: Check Subsequent API Calls
1. After login, watch **Network** tab
2. Should see requests like:
   - `GET /api/clients`
   - `GET /api/tickets`
   - `GET /api/assets`
3. **Check Request Headers:**
   - Should include: `Authorization: Bearer <token>`
4. **Check Response:**
   - Should be `200 OK` with data
   - If `401`: Token not being sent or expired

---

## 🔧 Common Issues & Fixes

### Issue 1: "Connection Error" / "Failed to fetch"
**Symptoms:**
- Red error in console
- Network tab shows failed requests

**Debugging:**
1. Check **Network** tab → Find failed request
2. Check **Status Code**:
   - `CORS error`: Backend CORS not configured
   - `404`: Wrong API endpoint
   - `502`: Backend not running
   - `401`: Not authenticated

**Fixes:**
- Clear browser storage and login again
- Check backend is running: `docker ps | grep backend`
- Check backend logs: `docker logs msp_backend`

### Issue 2: Login Works But Data Doesn't Load
**Symptoms:**
- Login succeeds (token stored)
- But no data appears

**Debugging:**
1. Check **Network** tab → Look for data requests (`/api/clients`, etc.)
2. Check **Request Headers** → Should have `Authorization: Bearer <token>`
3. Check **Response** → Should be `200` with JSON data

**Fixes:**
- Verify token is being included in requests (check `services/api.ts` or similar)
- Check backend logs for authentication errors
- Verify API endpoints match backend routes

### Issue 3: "401 Not authenticated" After Login
**Symptoms:**
- Login succeeds
- But subsequent API calls return `401`

**Debugging:**
1. Check token is stored: **Application** → **Local Storage** → `auth_token`
2. Check token is sent: **Network** → Request Headers → `Authorization`
3. Check token format: Should start with `eyJ` (JWT format)

**Fixes:**
- Verify `authService.getAuthHeader()` is being called
- Check if token is being read correctly from storage
- Verify backend JWT validation is working

### Issue 4: Password Reset Not Working
**Symptoms:**
- "Forgot Password" button doesn't work
- Reset email not received

**Debugging:**
1. Check browser console for errors
2. Check Network tab for `/api/auth/forgot-password` request
3. Check backend logs for SMTP errors

**Fixes:**
- Verify SMTP credentials in `.env`
- Check backend logs: `docker logs msp_backend | grep -i smtp`
- Test SMTP connection manually

---

## 📝 Testing Checklist

### Login Page
- [ ] Login page appears on first visit
- [ ] Can enter username and password
- [ ] Login button works
- [ ] "Forgot Password?" button appears
- [ ] Error messages display for invalid credentials
- [ ] Success: Redirects to main app after login

### After Login
- [ ] Token is stored in Local Storage
- [ ] User info is stored in Local Storage
- [ ] Main dashboard/app loads
- [ ] Data loads automatically (clients, tickets, assets)
- [ ] All API calls include `Authorization` header
- [ ] "Users" menu appears in sidebar (for admins)

### Password Reset
- [ ] "Forgot Password?" button opens modal
- [ ] Can enter email address
- [ ] Reset email is sent (or logged if SMTP not configured)
- [ ] Reset link works
- [ ] Can set new password

### Admin Features
- [ ] "Users" menu visible in sidebar (admin only)
- [ ] Can view all users
- [ ] Can reset user passwords
- [ ] Password reset modal works

---

## 🚀 Quick Debugging Commands

```bash
# Check all services are running
docker ps | grep -E "(frontend|backend|nginx|postgres)"

# View backend logs (real-time)
docker logs -f msp_backend

# View frontend logs
docker logs -f msp_frontend

# View nginx logs
docker logs -f msp_nginx_proxy

# Test backend health
curl https://peres.systems/api/health
# Or locally:
curl http://10.0.1.122:8000/api/health

# Test login endpoint
curl -X POST https://peres.systems/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=kleber&password=SecurePass123"

# Rebuild frontend (if you make changes to GitHub repo)
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.github.yml up -d frontend
```

---

## 🔄 Pushing Frontend Changes to GitHub

### Option 1: Using GitHub Personal Access Token

1. **Get a token from**: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scope: **`repo`** (full control of private repositories)
   - Copy the token (starts with `ghp_`)

2. **Push using token**:
   ```bash
   cd /tmp/PeresSystemWebAppNew2
   git push https://YOUR_TOKEN@github.com/klebercperes/PeresSystemWebAppNew2.git main
   ```

3. **Or set in .env**:
   ```bash
   # Add to /home/kleber/peres_systems/.env
   GITHUB_TOKEN=ghp_your_token_here
   
   # Then push:
   cd /tmp/PeresSystemWebAppNew2
   TOKEN=$(grep "^GITHUB_TOKEN=" /home/kleber/peres_systems/.env | cut -d'=' -f2)
   git push https://${TOKEN}@github.com/klebercperes/PeresSystemWebAppNew2.git main
   ```

### Option 2: Use GitHub Desktop or Web Interface
- Open the repo in GitHub Desktop
- Push the commit
- Or use GitHub web interface to upload files

### Option 3: Set up SSH Keys (for future)
- Follow: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### After Pushing, Rebuild Frontend:
```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.github.yml up -d frontend
```

---

## 📊 Recommended Debugging Workflow

1. **Start with Browser DevTools** (Console + Network tabs)
   - Most issues are visible here first
   - Shows exact error messages

2. **Check Backend Logs** if API calls fail
   - `docker logs msp_backend`
   - Look for error messages

3. **Verify Authentication Flow**
   - Login → Token stored → Token sent in requests

4. **Test Individual API Endpoints**
   - Use `curl` or Postman to test backend directly
   - Bypass frontend to isolate issues

5. **Check Network Connectivity**
   - Frontend → Backend
   - Nginx → Backend
   - Browser → Nginx

---

## 💡 Tips

1. **Keep DevTools Open**: Always have Console and Network tabs visible while testing
2. **Clear Storage Often**: When testing login, clear Local Storage first
3. **Check Both Sides**: Frontend errors AND backend logs
4. **Test Incrementally**: Fix one thing at a time
5. **Use Network Tab Filters**: Filter by `XHR` to see only API calls

---

## 📞 Need Help?

If you encounter issues:
1. Check browser Console for errors
2. Check Network tab for failed requests
3. Check backend logs: `docker logs msp_backend`
4. Share the error message and what you were doing when it occurred

---

**Last Updated**: November 15, 2025


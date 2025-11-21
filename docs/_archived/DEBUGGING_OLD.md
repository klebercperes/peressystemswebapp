# 🐛 Debugging & Improvement Guide

## ✅ Current Setup Confirmed

**Yes, the new frontend WAS downloaded from GitHub!**

- **Source**: `klebercperes/PeresSystemWebAppNew2` (GitHub)
- **Branch**: `main`
- **Dockerfile**: `Dockerfile.frontend.github.prod` (clones from GitHub during build)
- **Last Build**: Recent (check with `docker images peres_systems_frontend`)
- **API URL**: `https://peres.systems` (configured in `.env` as `VITE_API_URL`)

---

## 🔍 Debugging Strategy

### 1. **Browser Developer Tools** (Primary Tool)

#### Open DevTools:
- **Chrome/Edge**: `F12` or `Ctrl+Shift+I`
- **Firefox**: `F12` or `Ctrl+Shift+I`

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

**D. Application Tab → Session Storage**
- Check for any session data

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
docker exec msp_frontend wget -O- http://backend:8000/api/health 2>&1

# Test if nginx can reach backend
docker exec msp_nginx_proxy wget -O- http://backend:8000/api/health 2>&1

# Test backend health endpoint
curl https://peres.systems/api/health
```

---

## 🎯 Step-by-Step: Debugging Login Flow

### Step 1: Clear Browser State
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. **Local Storage** → `https://peres.systems`
4. Delete all items (especially `auth_token`)
5. Refresh page (`Ctrl+Shift+R`)

### Step 2: Monitor Login Request
1. Open **Network** tab in DevTools
2. Filter by `XHR` or `Fetch`
3. Try to login with: `kleber` / `SecurePass123`
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

---

## 📝 Testing Checklist

### Login Page
- [ ] Login page appears on first visit
- [ ] Can enter username and password
- [ ] Login button works
- [ ] Error messages display for invalid credentials
- [ ] Success: Redirects to main app after login

### After Login
- [ ] Token is stored in Local Storage
- [ ] User info is stored in Local Storage
- [ ] Main dashboard/app loads
- [ ] Data loads automatically (clients, tickets, assets)
- [ ] All API calls include `Authorization` header

### Navigation
- [ ] Can navigate between pages
- [ ] Authentication persists on page refresh
- [ ] Logout works and clears storage

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

## 🔄 Making Changes to Frontend

### Option 1: Edit GitHub Repo Directly
1. Make changes in your GitHub repo (`PeresSystemWebAppNew2`)
2. Commit and push to `main` branch
3. Rebuild Docker image:
   ```bash
   cd /home/kleber/peres_systems
   docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
   docker stop msp_frontend && docker rm msp_frontend
   docker-compose -f docker-compose.https-domain.github.yml up -d frontend
   ```

### Option 2: Local Development (Faster Iteration)
1. Clone repo locally:
   ```bash
   cd /tmp
   git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git
   cd PeresSystemWebAppNew2
   ```
2. Make changes
3. Test locally with `npm run dev` (point to `http://localhost:8000`)
4. When ready, push to GitHub and rebuild Docker image

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

## 🎓 Next Steps for Improvement

### Priority 1: Login Flow
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials (error handling)
- [ ] Test token expiration handling
- [ ] Test logout functionality

### Priority 2: Data Loading After Login
- [ ] Verify clients load correctly
- [ ] Verify tickets load correctly
- [ ] Verify assets load correctly
- [ ] Check loading states (spinners, etc.)

### Priority 3: CRUD Operations
- [ ] Create new client
- [ ] Update existing client
- [ ] Delete client
- [ ] Same for tickets and assets

### Priority 4: Error Handling
- [ ] Network errors (offline, timeout)
- [ ] Authentication errors (token expired)
- [ ] Validation errors (form errors)
- [ ] User-friendly error messages

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


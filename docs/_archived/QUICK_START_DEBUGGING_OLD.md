# 🚀 Quick Start: Debugging & Improving Your Site

## ✅ Confirmed: New Frontend IS Downloaded from GitHub

**Status:**
- ✅ Frontend source: `klebercperes/PeresSystemWebAppNew2` (GitHub)
- ✅ Branch: `main`
- ✅ Last build: Recent (2025-11-15)
- ✅ All services running
- ✅ Login endpoint working (tested)
- ✅ Authentication working (tested)

---

## 🎯 Your Plan: Start with Login, Then Other Pages

### Step 1: Test Login Flow (Main Page)

#### A. Open Browser DevTools
1. Go to: **https://peres.systems**
2. Press **F12** (or `Ctrl+Shift+I`)
3. Open these tabs:
   - **Console** (for errors)
   - **Network** (for API calls)
   - **Application** → **Local Storage** (for token storage)

#### B. Clear Previous State
1. In **Application** tab → **Local Storage** → `https://peres.systems`
2. Right-click → **Clear** (or delete `auth_token` manually)
3. Refresh page (`Ctrl+Shift+R`)

#### C. Test Login
1. You should see a **LOGIN SCREEN**
2. Enter credentials:
   - Username: `kleber`
   - Password: `SecurePass123`
3. Click **Login**

#### D. What to Check in DevTools

**Network Tab:**
- Look for: `POST /api/auth/login`
- Status should be: **200 OK**
- Response should contain: `{"access_token": "...", "token_type": "bearer"}`

**Application Tab → Local Storage:**
- Should see: `auth_token` (JWT token)
- Should see: `auth_user` (user info)

**After Login:**
- Network tab should show:
  - `GET /api/clients` → 200 OK
  - `GET /api/tickets` → 200 OK
  - `GET /api/assets` → 200 OK
- Each request should have header: `Authorization: Bearer <token>`

---

### Step 2: Test Other Pages After Login

Once login works, test each page:

#### Checklist:
- [ ] **Dashboard/Home**: Data loads correctly
- [ ] **Clients Page**: 
  - [ ] List loads
  - [ ] Can create new client
  - [ ] Can edit client
  - [ ] Can delete client
- [ ] **Tickets Page**:
  - [ ] List loads
  - [ ] Can create new ticket
  - [ ] Can update ticket status
  - [ ] Can delete ticket
- [ ] **Assets Page**:
  - [ ] List loads
  - [ ] Can add asset
  - [ ] Can update asset
  - [ ] Can delete asset
- [ ] **Navigation**: Can switch between pages
- [ ] **Logout**: Works and clears storage

---

## 🔧 Quick Debugging Commands

### Test Login from Command Line
```bash
cd /home/kleber/peres_systems
./test-login-flow.sh
```

### View Backend Logs (Real-time)
```bash
docker logs -f msp_backend
```

### View Frontend Logs
```bash
docker logs -f msp_frontend
```

### Rebuild Frontend (After GitHub Changes)
```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
docker stop msp_frontend && docker rm msp_frontend
docker-compose -f docker-compose.https-domain.github.yml up -d frontend
```

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Connection Error" on Page Load
**Fix:**
1. Clear browser Local Storage
2. Refresh page
3. Login again

### Issue: Login Works But No Data Loads
**Check:**
1. Network tab → Are API calls being made?
2. Network tab → Do requests have `Authorization` header?
3. Network tab → What's the response status? (200, 401, 500?)

### Issue: "401 Not authenticated"
**Fix:**
1. Check Local Storage → Is `auth_token` present?
2. Check Network tab → Is token being sent in headers?
3. Try logging out and logging in again

---

## 📝 Making Changes to Frontend

### Option 1: Edit GitHub Repo (Recommended)
1. Make changes in your GitHub repo
2. Commit and push to `main` branch
3. Rebuild Docker image (see commands above)

### Option 2: Test Locally First
1. Clone repo: `git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git`
2. Make changes
3. Test with: `npm run dev` (point to `http://localhost:8000`)
4. When ready, push to GitHub and rebuild

---

## 📚 Full Documentation

For detailed debugging guide, see: **`DEBUGGING_GUIDE.md`**

---

## ✅ Current Status

Based on automated tests:
- ✅ Backend: Running
- ✅ Frontend: Running (from GitHub)
- ✅ Nginx: Running
- ✅ Login endpoint: Working
- ✅ Authentication: Working
- ✅ API calls: Working

**You're ready to start testing!** 🎉


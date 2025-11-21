# Fix Connection Error - Step by Step

## The Problem
You're seeing: "Failed to fetch initial data. Please ensure the backend server is running..."

This happens because:
1. **The API requires authentication** (JWT token)
2. **The frontend is trying to fetch data before you login**
3. **Or the token expired/is missing**

## Solution

### Step 1: Clear Browser Storage

1. Open **https://peres.systems** in your browser
2. Press **F12** to open Developer Tools
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click **Local Storage** → `https://peres.systems`
5. **Delete all items** (especially `auth_token`)
6. **Refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)

### Step 2: Login

After clearing storage, you should see a **login screen**. If not:

1. Check the **Console** tab for errors
2. Check the **Network** tab for failed requests

Login with:
- **Username**: `kleber`
- **Password**: `SecurePass123`

### Step 3: Test in Browser Console

After logging in, open the **Console** tab (F12) and run:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('auth_token') ? 'Found ✅' : 'Missing ❌');

// Test API call
fetch('https://peres.systems/api/clients', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data.length, 'clients'))
.catch(err => console.error('❌ Error:', err));
```

**Expected output:**
- `Token: Found ✅`
- `✅ Success: X clients` (where X is the number of clients)

### Step 4: If Still Not Working

#### Check Network Tab

1. Open **Network** tab (F12)
2. Refresh the page
3. Look for these requests:
   - `/api/auth/login` - Should be **200** (green)
   - `/api/clients` - Should be **200** (not 401)
   - `/api/tickets` - Should be **200** (not 401)
   - `/api/assets` - Should be **200** (not 401)

**If you see 401 errors:**
- The token is missing or expired
- Clear storage and login again

#### Check Console for Errors

Look for:
- `Session expired. Please login again.` → Token expired, login again
- `Network error: Cannot connect to API` → Backend not running
- `Request timeout` → Backend is slow or not responding

### Step 5: Rebuild Frontend (if needed)

If the error message still mentions "Django", the frontend might be outdated:

```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.yml up -d frontend
```

## Expected Behavior

1. **First Visit**: Login screen appears
2. **After Login**: 
   - Token stored in localStorage
   - Data fetched automatically
   - Dashboard shows clients, tickets, assets
3. **No Errors**: All API calls return 200 (success)

## Quick Diagnostic

Run this in browser console to check everything:

```javascript
// 1. Check token
const token = localStorage.getItem('auth_token');
console.log('1. Token:', token ? '✅ Found' : '❌ Missing');

// 2. Check API URL
const apiUrl = 'https://peres.systems';
console.log('2. API URL:', apiUrl);

// 3. Test login endpoint
fetch(`${apiUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=kleber&password=SecurePass123'
})
.then(r => r.json())
.then(data => {
  console.log('3. Login test:', data.access_token ? '✅ Works' : '❌ Failed');
  
  // 4. Test authenticated request
  if (data.access_token) {
    return fetch(`${apiUrl}/api/clients`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });
  }
})
.then(r => r ? r.json() : null)
.then(data => {
  if (data) {
    console.log('4. API test:', Array.isArray(data) ? `✅ Works (${data.length} clients)` : '❌ Failed');
  }
})
.catch(err => console.error('❌ Error:', err));
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Not authenticated" (401) | Token missing/expired | Clear storage, login again |
| "Network error" | Backend not running | Check `docker ps \| grep backend` |
| "Request timeout" | Backend slow | Check backend logs |
| Django error message | Old frontend build | Rebuild frontend |
| No login screen | Frontend error | Check browser console |

---

**Remember**: The JavaScript code must be run in the **browser console** (F12), not in the terminal!


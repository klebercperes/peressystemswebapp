# Debugging Connection Error

## Problem
Getting error: "Failed to fetch initial data. Please ensure the backend server is running and the API endpoints (/api/clients/, /api/tickets/, /api/assets/) are available."

The error message mentions Django, but we're using FastAPI.

## Root Cause
The API endpoints require authentication (JWT token). All requests are returning `401 Not authenticated`.

## Solution Steps

### Step 1: Verify You're Logged In

1. Open https://peres.systems in your browser
2. **You should see a login screen first**
3. Login with:
   - Username: `kleber`
   - Password: `SecurePass123`

### Step 2: Check Browser Console

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for:
   - Authentication errors
   - Network errors
   - Token-related messages

### Step 3: Check Network Tab

1. Go to **Network** tab
2. Refresh the page
3. Look for these requests:
   - `/api/auth/login` - Should be 200 (success)
   - `/api/clients` - Should be 200 (not 401)
   - `/api/tickets` - Should be 200 (not 401)
   - `/api/assets` - Should be 200 (not 401)

**If you see 401 errors:**
- The token is missing or expired
- Try logging out and logging back in

### Step 4: Clear Browser Storage

If login isn't working:

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → `https://peres.systems`
4. Delete all items (especially `auth_token`)
5. Refresh the page
6. Login again

### Step 5: Verify Backend is Running

```bash
# Check if backend is running
docker ps | grep backend

# Check backend logs
docker logs msp_backend --tail 20

# Test API directly
curl -X POST https://peres.systems/api/auth/login \
  -d "username=kleber&password=SecurePass123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

## Expected Behavior

1. **First Visit**: You see a login screen
2. **After Login**: 
   - Token is stored in localStorage
   - Data is fetched automatically
   - Dashboard shows clients, tickets, assets

## Common Issues

### Issue 1: "Not authenticated" (401)
**Cause**: Token missing or expired
**Fix**: Log out and log back in

### Issue 2: CORS Error
**Cause**: Backend CORS not configured
**Fix**: Check `CORS_ORIGINS` in `.env` includes `https://peres.systems`

### Issue 3: Network Error
**Cause**: Backend not running or nginx misconfigured
**Fix**: Check docker containers are running

### Issue 4: Old Error Message (Django)
**Cause**: Frontend build is outdated
**Fix**: Rebuild frontend:
```bash
docker-compose -f docker-compose.https-domain.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.yml up -d frontend
```

## Quick Test

Open browser console and run:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('auth_token'));

// Test API call
fetch('https://peres.systems/api/clients', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

## Next Steps

1. **If you see login screen**: Login and it should work
2. **If you see error immediately**: Check browser console for details
3. **If login doesn't work**: Check backend logs for errors

---

**Last Updated**: November 15, 2025



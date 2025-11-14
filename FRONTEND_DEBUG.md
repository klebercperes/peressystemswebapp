# Frontend Debugging Guide

## Current Status
✅ Backend API: Working (http://10.0.1.122:8000/docs)
✅ Frontend Server: Running (http://10.0.1.122:5173)
✅ Network Connectivity: Confirmed
✅ Environment Variables: Set correctly

## What to Check in Your Browser

### 1. Open Browser DevTools (F12 or Cmd+Option+I)

**Console Tab:**
- Look for any **red error messages**
- Common errors might be:
  - `Failed to fetch` - API connection issue
  - `CORS policy` - Cross-origin request blocked
  - `Cannot read property` - JavaScript error
  - `Module not found` - Import error

**Network Tab:**
- Check if requests to `/api/clients`, `/api/tickets`, `/api/assets` are being made
- Look for failed requests (red status codes)
- Check if requests are pending/hanging

### 2. Try These URLs

1. **Frontend App:** http://10.0.1.122:5173
2. **Backend API:** http://10.0.1.122:8000/api/clients (should return `[]`)
3. **API Docs:** http://10.0.1.122:8000/docs (you confirmed this works)

### 3. Common Issues

**Blank/White Page:**
- Check Console for JavaScript errors
- The app might be stuck in loading state
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

**"Failed to fetch" Error:**
- The frontend can't reach the backend
- Check if firewall is blocking port 8000
- Verify CORS is working (backend logs should show OPTIONS requests)

**CORS Errors:**
- Backend CORS is configured for http://10.0.1.122:5173
- If accessing from a different URL, you'll see CORS errors

## Quick Test

Open browser console and run:
```javascript
fetch('http://10.0.1.122:8000/api/clients')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

This should return `[]` if the API is accessible from your browser.

## Next Steps

Please share:
1. What you see when you open http://10.0.1.122:5173
   - Blank page?
   - Loading spinner?
   - Error message?
   - Something else?

2. Any errors from the browser console (F12 → Console tab)

3. Network tab status - are API requests being made?


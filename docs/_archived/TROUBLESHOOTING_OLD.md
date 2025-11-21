# Frontend Not Loading - Troubleshooting Guide

## Status Check

✅ **Backend is running** - API responding at http://10.0.1.122:8000
✅ **Frontend container is running** - Vite server is up
✅ **Containers can communicate** - Network connectivity confirmed

## Common Issues and Solutions

### 1. Blank/White Page

If you see a blank page, check the browser console (F12) for errors:

**Possible causes:**
- JavaScript errors preventing React from rendering
- API connection errors
- Missing dependencies

**Solution:**
- Open browser DevTools (F12)
- Check the Console tab for errors
- Check the Network tab to see if API calls are failing

### 2. Connection Refused / Timeout

**Check:**
- Is the frontend container running? `docker-compose ps`
- Can you access http://10.0.1.122:5173 directly?
- Check firewall settings on the server

### 3. CORS Errors

If you see CORS errors in the console:
- The backend CORS is configured for http://10.0.1.122:5173
- If accessing from a different URL, you may need to add it to CORS origins

### 4. API Connection Issues

The frontend is configured to connect to: `http://10.0.1.122:8000`

**Test the API:**
```bash
curl http://10.0.1.122:8000/api/clients
```

Should return: `[]` (empty array, which is correct for a new database)

## Quick Diagnostic Commands

```bash
# Check container status
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose ps
EOF

# Check frontend logs
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose logs --tail=50 frontend
EOF

# Check backend logs
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose logs --tail=50 backend
EOF

# Test API from server
curl http://localhost:8000/api/clients
```

## Next Steps

1. **Open browser DevTools** (F12) and check:
   - Console tab for JavaScript errors
   - Network tab to see if requests are being made
   - Application tab to check if React is loading

2. **Try accessing directly:**
   - http://10.0.1.122:5173
   - http://10.0.1.122:8000/docs (API documentation)

3. **Check browser console** for specific error messages


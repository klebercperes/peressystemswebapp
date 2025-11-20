# Migrating GitHub Frontend from Django to FastAPI

## Current Situation

- **Backend**: FastAPI (Python) ✅
- **Local Frontend**: Already works with FastAPI ✅
- **GitHub Frontend**: Designed for Django backend ⚠️

## Option 1: Use Local Frontend (Recommended - Easiest)

**Why**: Your local frontend already works perfectly with FastAPI.

```bash
# Just use the local frontend
docker-compose -f docker-compose.https-domain.yml up -d
```

**Benefits**:
- ✅ Already configured for FastAPI
- ✅ No modifications needed
- ✅ Tested and working
- ✅ All endpoints match

## Option 2: Modify GitHub Frontend for FastAPI

If you want to use the GitHub frontend, you'll need to modify it to work with FastAPI.

### Differences Between Django and FastAPI

1. **API Endpoints**:
   - Django REST Framework: `/api/clients/` (trailing slash)
   - FastAPI: `/api/clients` (no trailing slash required, but works with both)

2. **Authentication**:
   - Django: Session-based or Token authentication
   - FastAPI: JWT Bearer tokens (OAuth2)

3. **Response Format**:
   - Both use JSON, but structure might differ slightly

4. **Error Handling**:
   - Django: `{"detail": "error message"}`
   - FastAPI: `{"detail": "error message"}` (same format)

### Steps to Modify GitHub Frontend

1. **Clone the GitHub repository locally**:
   ```bash
   git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git
   cd PeresSystemWebAppNew2
   ```

2. **Update API Service Files**:
   - Find files that make API calls (usually in `services/` or `api/` directory)
   - Update API base URL to use `VITE_API_URL` environment variable
   - Ensure endpoints match FastAPI structure:
     - `/api/clients` (not `/api/clients/`)
     - `/api/tickets`
     - `/api/assets`
     - `/api/auth/login` (OAuth2 form data)
     - `/api/auth/register`

3. **Update Authentication**:
   - FastAPI uses JWT Bearer tokens
   - Update auth service to:
     - Send `Authorization: Bearer <token>` header
     - Handle token from `/api/auth/login` response: `{"access_token": "...", "token_type": "bearer"}`
     - Store token and include in all API requests

4. **Update API Calls**:
   - Check if Django frontend uses trailing slashes
   - Remove trailing slashes if present
   - Ensure request format matches FastAPI expectations

5. **Test Locally**:
   ```bash
   # Set API URL
   export VITE_API_URL=http://localhost:8000
   
   # Install and run
   npm install
   npm run dev
   ```

6. **Push Changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update frontend to work with FastAPI backend"
   git push origin main
   ```

### Example Changes Needed

**Before (Django):**
```typescript
// Django might use trailing slashes
const response = await fetch(`${API_URL}/api/clients/`, {
  method: 'GET',
  headers: {
    'Authorization': `Token ${token}`  // Django token auth
  }
});
```

**After (FastAPI):**
```typescript
// FastAPI works with or without trailing slash
const response = await fetch(`${API_URL}/api/clients`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,  // FastAPI JWT Bearer
    'Content-Type': 'application/json'
  }
});
```

## Option 3: Hybrid Approach

1. **Keep local frontend for production** (already works)
2. **Modify GitHub frontend in parallel** (for future use)
3. **Test both** and choose which one to use

## Recommendation

**Use Option 1 (Local Frontend)** because:
- ✅ Already works with FastAPI
- ✅ No modifications needed
- ✅ Tested and stable
- ✅ All features working

**Only use Option 2** if:
- You have specific features in GitHub frontend you need
- You want to maintain the GitHub frontend separately
- You have time to modify and test

## Quick Decision Guide

- **Want it working now?** → Use local frontend (Option 1)
- **Want to use GitHub frontend?** → Modify it first (Option 2)
- **Not sure?** → Use local frontend now, modify GitHub later

---

**Last Updated**: November 2024


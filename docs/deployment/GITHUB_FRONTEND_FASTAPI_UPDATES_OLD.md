# GitHub Frontend FastAPI Integration Updates

This document describes the changes made to integrate the GitHub frontend with your FastAPI backend.

## Files Updated

### 1. `services/auth.ts` (NEW FILE)
- Created authentication service for FastAPI integration
- Handles login via `/api/auth/login`
- Stores and retrieves JWT tokens
- Provides `getAuthHeader()` helper for API requests
- Handles token expiration and logout

### 2. `pages/LoginPage.tsx` (UPDATED)
- Now calls FastAPI `/api/auth/login` endpoint
- Uses `authService.login()` with username/password
- Stores JWT token after successful login
- Shows loading state and error messages
- Determines user role after login

### 3. `App.tsx` (UPDATED)
- Imports and uses `authService`
- Checks for valid token on app load
- Only fetches data after successful authentication
- All API calls now include `Authorization: Bearer <token>` header
- Handles 401 errors (token expired) by redirecting to login
- Removed trailing slashes from API endpoints (matches FastAPI routes)

## Key Changes

### Authentication Flow
1. User enters credentials in LoginPage
2. LoginPage calls `/api/auth/login` with username/password
3. FastAPI returns JWT token
4. Token is stored in localStorage
5. Token is included in all subsequent API requests

### API Request Format
All API requests now use:
```typescript
const response = await apiCall('/api/clients', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Endpoint Changes
- Removed trailing slashes: `/api/clients/` → `/api/clients`
- Uses `VITE_API_URL` environment variable (defaults to `https://peres.systems`)
- All endpoints now require authentication

## How to Apply These Changes

### Option 1: Copy Files to Your Repository

1. Copy the updated files from `/tmp/PeresSystemWebAppNew2-check/` to your GitHub repo:
   ```bash
   # Create services directory if it doesn't exist
   mkdir -p services
   
   # Copy files
   cp /tmp/PeresSystemWebAppNew2-check/services/auth.ts services/
   cp /tmp/PeresSystemWebAppNew2-check/pages/LoginPage.tsx pages/
   cp /tmp/PeresSystemWebAppNew2-check/App.tsx .
   ```

2. Commit and push to GitHub:
   ```bash
   git add services/auth.ts pages/LoginPage.tsx App.tsx
   git commit -m "Integrate FastAPI authentication"
   git push origin main
   ```

### Option 2: Manual Updates

If you prefer to update manually, here are the key changes:

#### LoginPage.tsx
- Replace `handleTeamLogin` to call `authService.login()`
- Add error handling and loading states
- Update `onLogin` prop to accept token

#### App.tsx
- Import `authService` from `./services/auth`
- Add `apiCall` helper function that includes auth headers
- Update all `fetch()` calls to use `apiCall()`
- Only fetch data when `isAuthenticated` is true
- Handle 401 errors by logging out and redirecting

#### Create services/auth.ts
- Copy the entire file from the updates

## Environment Variables

Make sure your build uses the correct API URL:
```bash
VITE_API_URL=https://peres.systems
```

This is set in your Docker build via `docker-compose.https-domain.github.yml`.

## Testing

After applying these changes:

1. Rebuild the frontend:
   ```bash
   docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
   ```

2. Restart services:
   ```bash
   docker-compose -f docker-compose.https-domain.github.yml up -d
   ```

3. Test login:
   - Go to https://peres.systems
   - Click login
   - Enter valid credentials
   - Should redirect to dashboard and load data

## FastAPI Backend Requirements

Your FastAPI backend should have:
- `/api/auth/login` endpoint (POST) - accepts `username` and `password` (form data)
- `/api/auth/me` endpoint (GET) - returns current user info (requires Bearer token)
- All `/api/clients`, `/api/tickets`, `/api/assets` endpoints require authentication

## Notes

- The frontend now properly handles token expiration
- All API calls include authentication headers
- Data is only fetched after successful login
- Error messages are user-friendly
- Loading states are shown during authentication


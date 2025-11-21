# Fix Frontend Repository Code

## Understanding the Difference

### Browser Console Instructions (FIX_CONNECTION_ERROR.md)
- **Purpose**: Debug and test in the browser
- **What it does**: Helps you see what's wrong (missing token, API errors, etc.)
- **Does NOT fix**: The actual frontend code in your repository

### Frontend Code Fix (This Guide)
- **Purpose**: Update the frontend code to work with FastAPI
- **What it does**: Changes the actual code files in your repository
- **Required if**: Your frontend code doesn't show login screen first or doesn't handle authentication

## Which Frontend Are You Using?

### Option 1: Local Frontend (in `/home/kleber/peres_systems/`)
- **Location**: Files in `services/`, `components/`, `App.tsx`, etc.
- **Status**: ✅ Already updated for FastAPI
- **Action**: Just rebuild if needed

### Option 2: GitHub Frontend (`PeresSystemWebAppNew2`)
- **Location**: https://github.com/klebercperes/PeresSystemWebAppNew2
- **Status**: ⚠️ May need FastAPI updates
- **Action**: Update the code in your GitHub repository

## How to Check Which Frontend You're Using

```bash
# Check if using GitHub frontend
grep "^GITHUB_REPO_URL" /home/kleber/peres_systems/.env

# If output shows a URL, you're using GitHub frontend
# If no output, you're using local frontend
```

## If Using GitHub Frontend - Update the Code

### Step 1: Check What Needs Updating

The GitHub frontend needs these files updated for FastAPI:

1. **`services/auth.ts`** - Authentication service
2. **`pages/LoginPage.tsx`** or **`components/Login.tsx`** - Login component
3. **`App.tsx`** - Main app component

### Step 2: Get the Updated Files

We prepared updated files earlier. Check if they exist:

```bash
ls -la /tmp/PeresSystemWebAppNew2-check/
```

Files should include:
- `services/auth.ts`
- `pages/LoginPage.tsx` or `components/Login.tsx`
- `App.tsx`

### Step 3: Copy to Your GitHub Repository

**Option A: Manual Copy**

1. Clone your GitHub repository:
   ```bash
   cd /tmp
   git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git
   cd PeresSystemWebAppNew2
   ```

2. Copy the updated files:
   ```bash
   cp /tmp/PeresSystemWebAppNew2-check/services/auth.ts services/
   cp /tmp/PeresSystemWebAppNew2-check/pages/LoginPage.tsx pages/  # or components/Login.tsx
   cp /tmp/PeresSystemWebAppNew2-check/App.tsx .
   ```

3. Commit and push:
   ```bash
   git add services/auth.ts pages/LoginPage.tsx App.tsx
   git commit -m "Update frontend for FastAPI authentication"
   git push origin main
   ```

**Option B: Use the Helper Script**

If the script exists:
```bash
bash /tmp/copy-frontend-updates.sh
```

### Step 4: Rebuild Docker Frontend

After pushing to GitHub:

```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.yml up -d frontend
```

## If Using Local Frontend - Just Rebuild

If you're using the local frontend (not GitHub), the code is already correct. Just rebuild:

```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.yml up -d frontend
```

## What the Browser Console Instructions Do

The instructions in `FIX_CONNECTION_ERROR.md` help you:

1. **Diagnose the problem**:
   - Check if token exists
   - Test API calls
   - See error messages

2. **Test if it's working**:
   - After you fix the code
   - To verify authentication works

3. **Debug runtime issues**:
   - Token expired
   - Network errors
   - CORS issues

**But they don't fix the code itself!**

## Summary

| Frontend Type | Code Status | Action Needed |
|--------------|-------------|---------------|
| **Local** | ✅ Already updated | Rebuild Docker image |
| **GitHub** | ⚠️ May need updates | Update code in GitHub repo, then rebuild |

## Quick Check

Run this to see which frontend you're using:

```bash
if grep -q "^GITHUB_REPO_URL" /home/kleber/peres_systems/.env 2>/dev/null; then
  echo "Using GitHub frontend - may need code updates"
  echo "Repository: $(grep "^GITHUB_REPO_URL" /home/kleber/peres_systems/.env | cut -d'=' -f2)"
else
  echo "Using local frontend - code already updated"
fi
```

---

**Remember**: 
- Browser console = Debugging/testing (doesn't fix code)
- Code updates = Fix the actual problem (update repository files)


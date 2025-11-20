# Update Your GitHub Frontend Repository

## Current Situation

- ✅ **You're using**: GitHub frontend (`klebercperes/PeresSystemWebAppNew2`)
- ⚠️ **Problem**: The frontend code needs FastAPI updates
- ❌ **Browser console won't fix**: It only helps debug, doesn't change code

## What You Need to Do

Update your GitHub repository with the FastAPI-compatible code, then rebuild the Docker image.

## Step-by-Step Instructions

### Step 1: Check if Updated Files Exist

```bash
ls -la /tmp/PeresSystemWebAppNew2-check/
```

You should see:
- `services/auth.ts`
- `pages/LoginPage.tsx` (or `components/Login.tsx`)
- `App.tsx`

### Step 2: Clone Your GitHub Repository

```bash
cd /tmp
git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git
cd PeresSystemWebAppNew2
```

### Step 3: Copy Updated Files

```bash
# Create services directory if it doesn't exist
mkdir -p services

# Copy the updated files
cp /tmp/PeresSystemWebAppNew2-check/services/auth.ts services/
cp /tmp/PeresSystemWebAppNew2-check/pages/LoginPage.tsx pages/ 2>/dev/null || \
cp /tmp/PeresSystemWebAppNew2-check/components/Login.tsx components/ 2>/dev/null || \
echo "Check which login file exists in your repo"
cp /tmp/PeresSystemWebAppNew2-check/App.tsx .
```

### Step 4: Commit and Push

```bash
# Add the files
git add services/auth.ts pages/LoginPage.tsx App.tsx 2>/dev/null || \
git add services/auth.ts components/Login.tsx App.tsx 2>/dev/null || \
git add services/auth.ts App.tsx

# Commit
git commit -m "Update frontend for FastAPI authentication

- Add auth service for JWT token management
- Update login to use FastAPI /api/auth/login
- Update App.tsx to require authentication before fetching data
- Include Authorization headers in all API requests"

# Push to GitHub
git push origin main
```

**Note**: If you get authentication errors, you'll need a GitHub Personal Access Token with `repo` scope.

### Step 5: Rebuild Docker Frontend

After pushing to GitHub:

```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.yml up -d frontend
```

### Step 6: Test

1. Open https://peres.systems
2. You should see a **login screen**
3. Login with `kleber` / `SecurePass123`
4. Data should load automatically

## What the Browser Console Instructions Do

The instructions in `FIX_CONNECTION_ERROR.md` are useful for:

1. **After you fix the code**: Test if authentication works
2. **Debugging**: See what errors are happening
3. **Testing**: Verify API calls are working

**But they don't fix the code itself!**

## If Updated Files Don't Exist

If `/tmp/PeresSystemWebAppNew2-check/` doesn't exist, we need to recreate the updated files. The key changes needed are:

1. **Create `services/auth.ts`**: Authentication service for FastAPI
2. **Update login component**: Call `/api/auth/login` instead of Django endpoint
3. **Update `App.tsx`**: Check authentication before fetching data

## Quick Check Script

Run this to see what you need:

```bash
echo "=== Frontend Status ==="
echo "Using: GitHub frontend (klebercperes/PeresSystemWebAppNew2)"
echo ""
if [ -d "/tmp/PeresSystemWebAppNew2-check" ]; then
  echo "✅ Updated files found in /tmp/PeresSystemWebAppNew2-check/"
  echo "Files:"
  ls -1 /tmp/PeresSystemWebAppNew2-check/ | head -5
else
  echo "❌ Updated files not found"
  echo "Need to recreate FastAPI-compatible files"
fi
```

---

**Summary**: 
- Browser console = Debugging tool (doesn't fix code)
- Update GitHub repo = Actually fixes the problem
- Rebuild Docker = Applies the fix


# 🔄 Swapping to GitHub Frontend

This guide helps you swap from the local frontend to the GitHub frontend: **klebercperes/PeresSystemWebAppNew2**

## 🚀 Quick Swap (Automated)

### Option 1: Use the Script (Recommended)

```bash
./swap-to-github-frontend.sh
```

This script will:
- ✅ Update your `.env` file with GitHub repository configuration
- ✅ Stop the current frontend
- ✅ Build the new frontend from GitHub
- ✅ Start services with GitHub frontend

## 📋 Manual Swap

### Step 1: Update `.env` File

Add or update these variables in your `.env` file:

```bash
# GitHub Frontend Configuration
GITHUB_REPO_URL=klebercperes/PeresSystemWebAppNew2
GITHUB_BRANCH=main

# Keep your existing VITE_API_URL or set it
VITE_API_URL=http://localhost:8000
# Or for HTTPS:
# VITE_API_URL=https://peres.systems
```

### Step 2: Stop Current Frontend

```bash
# Stop and remove current frontend
docker-compose stop frontend
docker rm msp_frontend
```

### Step 3: Build and Start GitHub Frontend

**For HTTP (Development):**
```bash
docker-compose -f docker-compose.github-frontend.yml up -d --build
```

**For HTTPS (Production):**
```bash
# The docker-compose.https-domain.yml now supports GitHub frontend automatically
# Just make sure GITHUB_REPO_URL is set in .env
docker-compose -f docker-compose.https-domain.yml up -d --build
```

## 🔍 Verify the Swap

### Check Services

```bash
# Check running containers
docker-compose -f docker-compose.github-frontend.yml ps

# Or if using HTTPS:
docker-compose -f docker-compose.https-domain.yml ps
```

### Check Logs

```bash
# Frontend logs
docker-compose -f docker-compose.github-frontend.yml logs -f frontend

# All services
docker-compose -f docker-compose.github-frontend.yml logs -f
```

### Test the Application

- **Frontend**: http://localhost:80
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔄 Switching Back to Local Frontend

If you want to switch back to the local frontend:

```bash
# Remove GitHub frontend variables from .env (or comment them out)
# GITHUB_REPO_URL=klebercperes/PeresSystemWebAppNew2

# Stop GitHub frontend
docker-compose -f docker-compose.github-frontend.yml stop frontend
docker rm msp_frontend

# Start local frontend
docker-compose up -d frontend
```

## 🎯 Using with HTTPS

The `docker-compose.https-domain.yml` now automatically detects if you're using GitHub frontend:

- If `GITHUB_REPO_URL` is set in `.env`, it uses `Dockerfile.frontend.github.prod`
- If not set, it uses the local `Dockerfile.frontend.prod`

**Setup for HTTPS:**

```bash
# 1. Update .env
GITHUB_REPO_URL=klebercperes/PeresSystemWebAppNew2
VITE_API_URL=https://peres.systems

# 2. Build and start
docker-compose -f docker-compose.https-domain.yml up -d --build
```

## 🛠️ Troubleshooting

### Build Fails: "Repository not found"

**Problem**: Repository URL is incorrect or repository is private

**Solution**:
```bash
# Verify repository is public and accessible
# If private, add GITHUB_TOKEN to .env
GITHUB_TOKEN=ghp_your_token_here
```

### Build Fails: "npm install" errors

**Problem**: Dependencies issue in GitHub repository

**Solution**:
1. Check the repository has `package.json`
2. Verify Node.js version compatibility
3. Check build logs: `docker-compose -f docker-compose.github-frontend.yml logs frontend`

### Frontend Not Loading

**Problem**: Build succeeded but frontend doesn't load

**Solution**:
1. Check nginx logs: `docker-compose -f docker-compose.github-frontend.yml logs frontend`
2. Verify `dist/` directory exists in repository
3. Check if build output is correct

### API Connection Issues

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify `VITE_API_URL` is correct in `.env`
2. Check CORS settings in backend
3. Rebuild frontend after changing `VITE_API_URL`:
   ```bash
   docker-compose -f docker-compose.github-frontend.yml build frontend
   docker-compose -f docker-compose.github-frontend.yml up -d frontend
   ```

## 📝 Configuration Reference

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITHUB_REPO_URL` | ✅ Yes | GitHub repo (username/repo) | `klebercperes/PeresSystemWebAppNew2` |
| `GITHUB_BRANCH` | ❌ No | Branch to clone (default: `main`) | `main` |
| `GITHUB_TOKEN` | ⚠️ Private | GitHub token for private repos | `ghp_xxx` |
| `VITE_API_URL` | ✅ Yes | Backend API URL | `http://localhost:8000` |

### Docker Compose Files

- **`docker-compose.github-frontend.yml`** - HTTP setup with GitHub frontend
- **`docker-compose.https-domain.yml`** - HTTPS setup (auto-detects GitHub or local)
- **`docker-compose.yml`** - Local frontend (original)

## ✅ Checklist

- [ ] `.env` file updated with `GITHUB_REPO_URL`
- [ ] `VITE_API_URL` configured correctly
- [ ] Current frontend stopped
- [ ] GitHub frontend built successfully
- [ ] Services started and running
- [ ] Frontend loads in browser
- [ ] API connection working

## 🎉 Success!

Once swapped, your application will use the frontend from:
**https://github.com/klebercperes/PeresSystemWebAppNew2**

To update the frontend, just push changes to GitHub and rebuild:
```bash
docker-compose -f docker-compose.github-frontend.yml up -d --build frontend
```

---

**Last Updated**: November 2024


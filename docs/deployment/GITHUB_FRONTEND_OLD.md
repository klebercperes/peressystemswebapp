# Using Frontend from GitHub Repository

This guide explains how to use a different frontend stored in your GitHub repository instead of the local frontend code.

## 🎯 Quick Start

### 1. Set Environment Variables

Add to your `.env` file:

```bash
# GitHub Repository Configuration
GITHUB_REPO_URL=username/repo-name
# Or use full URL: https://github.com/username/repo-name

# Optional: Branch name (default: main)
GITHUB_BRANCH=main

# Optional: GitHub token for private repositories
# Get token from: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_your_token_here

# Frontend build configuration
# For production with HTTPS: VITE_API_URL=https://peres.systems
# For local development: VITE_API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_key_here
```

### 2. Build and Run

```bash
# Build and start services
docker-compose -f docker-compose.github-frontend.yml up -d --build

# Or just rebuild frontend
docker-compose -f docker-compose.github-frontend.yml build frontend
docker-compose -f docker-compose.github-frontend.yml up -d frontend
```

## 📋 Configuration Options

### Public Repository

**Format 1: Short format**
```bash
GITHUB_REPO_URL=username/repo-name
```

**Format 2: Full URL**
```bash
GITHUB_REPO_URL=https://github.com/username/repo-name
```

**Example:**
```bash
GITHUB_REPO_URL=kleber/my-frontend-app
GITHUB_BRANCH=main
```

### Private Repository

For private repositories, you need a GitHub Personal Access Token:

1. **Create a GitHub Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scope: `repo` (for private repos)
   - Copy the token

2. **Add to `.env`:**
```bash
GITHUB_REPO_URL=username/private-repo-name
GITHUB_TOKEN=ghp_your_token_here
```

### Different Branch

```bash
GITHUB_REPO_URL=username/repo-name
GITHUB_BRANCH=develop
```

## 🔧 How It Works

The `Dockerfile.frontend.github.prod`:

1. **Clones** your GitHub repository during build
2. **Installs** dependencies (`npm install`)
3. **Builds** the frontend (`npm run build`)
4. **Serves** with nginx on port 80

## 📁 Repository Requirements

Your GitHub repository should have:

- ✅ `package.json` - Node.js dependencies
- ✅ `vite.config.ts` or similar build config
- ✅ Source code in standard structure
- ✅ Build script: `npm run build`
- ✅ Output directory: `dist/` (default for Vite)

## 🚀 Usage Examples

### Example 1: Public Repository (Main Branch)

```bash
# .env
GITHUB_REPO_URL=kleber/msp-frontend
GITHUB_BRANCH=main
VITE_API_URL=http://localhost:8000

# Build and run
docker-compose -f docker-compose.github-frontend.yml up -d --build
```

### Example 2: Private Repository (Production with HTTPS)

```bash
# .env
GITHUB_REPO_URL=kleber/private-frontend
GITHUB_BRANCH=production
GITHUB_TOKEN=ghp_abc123xyz789
VITE_API_URL=https://peres.systems  # Use HTTPS for production domain

# Build and run
docker-compose -f docker-compose.https-domain.github.yml up -d --build
```

**Note**: For production with HTTPS, use `https://peres.systems`. For local development, use `http://localhost:8000`.

### Example 3: Different Branch

```bash
# .env
GITHUB_REPO_URL=kleber/frontend-repo
GITHUB_BRANCH=staging
VITE_API_URL=http://localhost:8000

# Build and run
docker-compose -f docker-compose.github-frontend.yml up -d --build
```

## 🔄 Switching Between Local and GitHub Frontend

### Use Local Frontend (Current Setup)

```bash
docker-compose up -d
```

### Use GitHub Frontend

```bash
docker-compose -f docker-compose.github-frontend.yml up -d
```

### Use GitHub Frontend with HTTPS

```bash
# Copy frontend service from docker-compose.github-frontend.yml
# to docker-compose.https-domain.yml and update dockerfile
docker-compose -f docker-compose.https-domain.yml up -d
```

## 🛠️ Troubleshooting

### Build Fails: "Repository not found"

**Problem**: Private repository without token, or wrong URL

**Solution**:
1. Check `GITHUB_REPO_URL` format
2. For private repos, add `GITHUB_TOKEN`
3. Verify repository exists and is accessible

### Build Fails: "Branch not found"

**Problem**: Branch doesn't exist

**Solution**:
```bash
# Check available branches
git ls-remote --heads https://github.com/username/repo-name

# Update GITHUB_BRANCH in .env
GITHUB_BRANCH=main
```

### Build Fails: "npm install" errors

**Problem**: Dependencies issue

**Solution**:
1. Check `package.json` in your GitHub repo
2. Ensure Node.js version is compatible
3. Check build logs: `docker-compose logs frontend`

### Frontend Not Loading

**Problem**: Build succeeded but frontend doesn't load

**Solution**:
1. Check nginx logs: `docker-compose logs frontend`
2. Verify `dist/` directory exists in repo
3. Check build output: `docker-compose build frontend`

## 🔐 Security Best Practices

### For Private Repositories

1. **Use GitHub Tokens:**
   - Create token with minimal permissions (`repo` scope)
   - Store in `.env` file (not in git)
   - Rotate tokens regularly

2. **Token Permissions:**
   - For private repos: `repo` scope
   - For public repos: No token needed

3. **Environment Variables:**
   - Never commit `.env` to git
   - Use secrets management in production

## 📝 Integration with HTTPS Setup

To use GitHub frontend with HTTPS:

1. **Update `docker-compose.https-domain.yml`:**

```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile.frontend.github.prod
    args:
      GITHUB_REPO_URL: ${GITHUB_REPO_URL}
      GITHUB_BRANCH: ${GITHUB_BRANCH:-main}
      GITHUB_TOKEN: ${GITHUB_TOKEN:-}
      VITE_API_URL: ${VITE_API_URL:-https://peres.systems}
      VITE_GEMINI_API_KEY: ${VITE_GEMINI_API_KEY:-}
```

2. **Set environment variables:**
```bash
GITHUB_REPO_URL=username/repo-name
VITE_API_URL=https://peres.systems
```

3. **Build and run:**
```bash
docker-compose -f docker-compose.https-domain.yml up -d --build
```

## 🎯 Quick Reference

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITHUB_REPO_URL` | ✅ Yes | GitHub repo (username/repo or full URL) | `kleber/frontend` |
| `GITHUB_BRANCH` | ❌ No | Branch to clone (default: `main`) | `main`, `develop` |
| `GITHUB_TOKEN` | ⚠️ Private | GitHub token for private repos | `ghp_xxx` |
| `VITE_API_URL` | ✅ Yes | Backend API URL | `http://localhost:8000` (dev) or `https://peres.systems` (prod) |
| `VITE_GEMINI_API_KEY` | ❌ No | Gemini API key (if used) | `your_key` |

### Commands

```bash
# Build frontend from GitHub
docker-compose -f docker-compose.github-frontend.yml build frontend

# Start all services
docker-compose -f docker-compose.github-frontend.yml up -d

# View logs
docker-compose -f docker-compose.github-frontend.yml logs frontend

# Rebuild after GitHub changes
docker-compose -f docker-compose.github-frontend.yml up -d --build frontend
```

## ✅ Checklist

- [ ] GitHub repository is accessible
- [ ] Repository has `package.json`
- [ ] Repository has build script (`npm run build`)
- [ ] `GITHUB_REPO_URL` set in `.env`
- [ ] `GITHUB_TOKEN` set (if private repo)
- [ ] `VITE_API_URL` configured correctly
- [ ] Frontend builds successfully
- [ ] Frontend loads in browser

---

**Last Updated**: November 2024


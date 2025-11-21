# GitHub CI/CD Setup Guide

## Overview

GitHub Actions workflows for automated testing, building, and deployment.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request:

- ✅ **Backend Tests**: Unit and integration tests
- ✅ **Frontend Tests**: Linting and build verification
- ✅ **Docker Build**: Builds backend and frontend images
- ✅ **Security Scan**: Vulnerability scanning with Trivy

### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)

Runs on pushes to `main`/`master` branch:

- ✅ **Build Images**: Builds and pushes to GitHub Container Registry
- ✅ **Deploy to Server**: SSH deployment to production server
- ✅ **Run Migrations**: Automatically runs Alembic migrations
- ✅ **Health Check**: Verifies deployment success

## Setup Instructions

### Step 1: Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add remote
git remote add origin https://github.com/yourusername/peres_systems.git

# Add files
git add .

# Commit
git commit -m "Initial commit with CI/CD"

# Push to GitHub
git push -u origin main
```

### Step 2: Configure GitHub Secrets

Go to: `Settings` → `Secrets and variables` → `Actions`

Add these secrets:

#### Required for Deployment

1. **SSH_HOST**: Your server IP or domain
   ```
   43.247.67.119
   ```

2. **SSH_USER**: SSH username
   ```
   kleber
   ```

3. **SSH_PRIVATE_KEY**: Your SSH private key
   ```bash
   # Generate if needed
   ssh-keygen -t ed25519 -C "github-actions"
   
   # Copy private key content
   cat ~/.ssh/id_ed25519
   ```

#### Optional (for Container Registry)

- **GITHUB_TOKEN**: Automatically provided by GitHub Actions

### Step 3: Set Up SSH Key on Server

```bash
# On your server, add GitHub Actions public key to authorized_keys
# Or use existing SSH key pair
```

### Step 4: Enable GitHub Actions

1. Go to repository `Settings` → `Actions` → `General`
2. Enable "Allow all actions and reusable workflows"
3. Save changes

## Workflow Details

### CI Workflow

**Triggers:**
- Push to `main`, `master`, or `develop`
- Pull requests to `main`, `master`, or `develop`

**Jobs:**
1. **backend-tests**: Runs pytest with coverage
2. **frontend-tests**: Lints and builds frontend
3. **docker-build**: Builds Docker images
4. **security-scan**: Scans for vulnerabilities

### Deploy Workflow

**Triggers:**
- Push to `main` or `master`
- Tags starting with `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

**Steps:**
1. Build and push Docker images to GitHub Container Registry
2. SSH to server and pull latest images
3. Run database migrations
4. Restart services
5. Health check verification

## Testing the Setup

### Test CI Pipeline

```bash
# Make a small change and push
echo "# Test" >> README.md
git add README.md
git commit -m "Test CI pipeline"
git push
```

Check Actions tab in GitHub to see workflow running.

### Test Deploy Pipeline

```bash
# Push to main branch
git checkout main
git merge develop  # or make changes
git push origin main
```

Or manually trigger:
1. Go to `Actions` tab
2. Select "Deploy to Production"
3. Click "Run workflow"

## Customization

### Change Branch Names

Edit `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [ main, master, develop ]  # Change as needed
```

### Change Deployment Server

Update `deploy.yml`:

```yaml
host: ${{ secrets.SSH_HOST }}  # Your server
username: ${{ secrets.SSH_USER }}  # Your username
```

### Add Environment Variables

Add to workflow files:

```yaml
env:
  CUSTOM_VAR: ${{ secrets.CUSTOM_VAR }}
```

## Monitoring

### View Workflow Runs

1. Go to `Actions` tab in GitHub
2. Click on workflow name
3. View logs and status

### View Deployment Status

Check deployment logs in Actions tab or verify on server:

```bash
# SSH to server
ssh user@server

# Check services
cd /home/kleber/peres_systems
docker-compose ps

# Check logs
docker-compose logs --tail=50 backend
```

## Troubleshooting

### CI Fails: Tests Not Found

```bash
# Create test files in backend/tests/
mkdir -p backend/tests
touch backend/tests/__init__.py
touch backend/tests/test_main.py
```

### Deploy Fails: SSH Connection Error

1. Verify SSH secrets are correct
2. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/your_key user@server
   ```
3. Check server firewall allows SSH

### Deploy Fails: Docker Build Error

1. Check Dockerfile syntax
2. Verify all dependencies in requirements.txt
3. Check build logs in GitHub Actions

### Health Check Fails

1. Verify application is running:
   ```bash
   curl https://peres.systems/health
   ```
2. Check nginx configuration
3. Verify SSL certificates

## Best Practices

1. ✅ **Test before deploying** - Use staging environment
2. ✅ **Use feature branches** - Don't push directly to main
3. ✅ **Review pull requests** - Code review before merge
4. ✅ **Monitor deployments** - Watch for errors
5. ✅ **Keep secrets secure** - Never commit secrets
6. ✅ **Version tags** - Tag releases (v1.0.0, v1.1.0, etc.)

## Next Steps

1. ✅ Set up GitHub repository
2. ✅ Configure secrets
3. ✅ Create initial tests
4. ✅ Test CI pipeline
5. ✅ Test deployment
6. ✅ Set up monitoring

---

**Last Updated**: November 2024


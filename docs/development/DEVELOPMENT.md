# Development Guide

## 🚀 Quick Start

### Local Development URLs

- **Frontend Dev Server**: http://10.0.1.122:5173 (when running `npm run dev`)
- **Backend API**: http://10.0.1.122:8000
- **API Docs**: http://10.0.1.122:8000/docs
- **Health Check**: http://10.0.1.122:8000/health

### Production URLs

- **Frontend**: https://peres.systems
- **Backend API**: https://peres.systems/api
- **API Docs**: https://peres.systems/docs

---

## 📋 Development Strategy

See [Development Strategy](DEVELOPMENT_STRATEGY.md) for detailed guidance on prioritizing features vs infrastructure.

**Quick Summary:**
- ✅ **Let's Encrypt Certificates** (1-2 hours) - Quick win
- ✅ **Frontend/Backend improvements** - Focus here
- ✅ **Add tests incrementally** - As you develop
- ✅ **Complete infrastructure** - Before production

---

## 🔄 Making Changes to Frontend

### Option 1: Edit GitHub Repo Directly (Production)

1. Make changes in your GitHub repo (`PeresSystemWebAppNew2`)
2. Commit and push to `main` branch
3. Rebuild Docker image:
   ```bash
   cd /home/kleber/peres_systems
   docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
   docker stop msp_frontend && docker rm msp_frontend
   docker-compose -f docker-compose.https-domain.github.yml up -d frontend
   ```

### Option 2: Local Development (Faster Iteration)

> 📚 **For detailed setup instructions, see [START_DEV_SERVER.md](START_DEV_SERVER.md)**

**Prerequisites**: Node.js 20+ and npm must be installed. If not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

1. **Clone repo locally** (if not already cloned):
   ```bash
   cd /tmp
   git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git
   cd PeresSystemWebAppNew2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set environment variables** (create `.env.local`):
   ```bash
   cat > .env.local << 'EOF'
   VITE_API_URL=http://10.0.1.122:8000
   VITE_GEMINI_API_KEY=your_key_here
   VITE_GOOGLE_CLIENT_ID=195201008846-r2l59ff7tal07r7ursh2rb8pamob3n15.apps.googleusercontent.com
   EOF
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - From server: http://10.0.1.122:5173
   - From network: http://10.0.1.122:5173
   - From localhost: http://localhost:5173

6. When ready, push to GitHub and rebuild Docker image

**Note**: The dev server is configured to listen on `0.0.0.0` (all network interfaces), so it's accessible from your network IP address.

### Troubleshooting Dev Server

> 📚 **For comprehensive troubleshooting, see [START_DEV_SERVER.md](START_DEV_SERVER.md)**

**"npm: command not found":**
- Install Node.js and npm (see prerequisites above)

**Can't access from network:**
- Ensure `vite.config.ts` has `host: '0.0.0.0'` (not `localhost`)
- Check firewall: `sudo ufw allow 5173/tcp`
- Verify port is not in use: `lsof -i :5173`
- Verify dev server is running: `ps aux | grep vite`

**Port already in use:**
```bash
# Find and kill process
lsof -i :5173
kill -9 PID

# Or use different port
npm run dev -- --port 3000
```

**Connection refused:**
- Dev server not running - Start with `npm run dev`
- Check if server started successfully - Look for "Network: http://10.0.1.122:5173" in output

---

## 🔄 Pushing Frontend Changes to GitHub

### Using GitHub Personal Access Token

1. **Get a token from**: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scope: **`repo`** (full control of private repositories)
   - Copy the token (starts with `ghp_`)

2. **Add token to `.env`**:
   ```bash
   # Edit /home/kleber/peres_systems/.env
   GITHUB_TOKEN=ghp_your_token_here
   ```

3. **Commit and push using token**:
   ```bash
   cd /tmp/PeresSystemWebAppNew2
   
   # First, commit any uncommitted changes
   git add .
   git commit -m "Your commit message here"
   
   # Pull latest changes from remote (if needed)
   TOKEN=$(grep "^GITHUB_TOKEN=" /home/kleber/peres_systems/.env | cut -d'=' -f2)
   git pull https://${TOKEN}@github.com/klebercperes/PeresSystemWebAppNew2.git main
   
   # Then push your changes
   git push https://${TOKEN}@github.com/klebercperes/PeresSystemWebAppNew2.git main
   ```
   
   **Note**: If you get "rejected (fetch first)" error, it means the remote has changes you don't have locally. Always pull first, then push.

### Using GitHub Desktop or Web Interface
- Open the repo in GitHub Desktop
- Push the commit
- Or use GitHub web interface to upload files

### After Pushing, Rebuild Frontend:
```bash
cd /home/kleber/peres_systems
docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
docker-compose -f docker-compose.https-domain.github.yml up -d frontend
```

---

## 🧪 Testing

### Testing URLs

**Local Development:**
- Frontend Dev: http://10.0.1.122:5173
- Backend API: http://10.0.1.122:8000
- API Docs: http://10.0.1.122:8000/docs
- Health Check: http://10.0.1.122:8000/health

**Production:**
- Frontend: https://peres.systems
- Backend API: https://peres.systems/api
- API Docs: https://peres.systems/docs

### Quick Test Commands

```bash
# Test backend health
curl http://10.0.1.122:8000/health

# Test login
curl -X POST http://10.0.1.122:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=kleber&password=SecurePass123"

# Test authenticated request (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://10.0.1.122:8000/api/clients
```

### Testing Checklist

#### Login Flow
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials (error handling)
- [ ] Test token expiration handling
- [ ] Test logout functionality
- [ ] Test "Forgot Password" flow

#### Data Loading After Login
- [ ] Verify clients load correctly
- [ ] Verify tickets load correctly
- [ ] Verify assets load correctly
- [ ] Check loading states (spinners, etc.)

#### CRUD Operations
- [ ] Create new client
- [ ] Update existing client
- [ ] Delete client
- [ ] Same for tickets and assets

#### Admin Features
- [ ] "Users" menu visible (admin only)
- [ ] Can view all users
- [ ] Can reset user passwords

#### Error Handling
- [ ] Network errors (offline, timeout)
- [ ] Authentication errors (token expired)
- [ ] Validation errors (form errors)
- [ ] User-friendly error messages

---

## 📝 Code Quality

### Best Practices

1. **Follow existing patterns** - Keep code consistent
2. **Add comments** - Explain complex logic
3. **Handle errors gracefully** - Show user-friendly messages
4. **Validate inputs** - Both frontend and backend
5. **Test critical paths** - At minimum, test new features

### Code Review Checklist

- [ ] Code follows existing patterns
- [ ] Error handling is implemented
- [ ] User-facing messages are clear
- [ ] No hardcoded values (use environment variables)
- [ ] API calls include proper authentication
- [ ] Frontend and backend field names match (camelCase vs snake_case)

---

## 🔧 Development Tools

### Backend Development

```bash
# View logs
docker logs -f msp_backend

# Restart backend
docker restart msp_backend

# Run migrations
docker exec msp_backend alembic upgrade head

# Create admin user
docker exec msp_backend python create_admin.py username email password
```

### Frontend Development

```bash
# Local development
cd /tmp/PeresSystemWebAppNew2
npm run dev

# Build for production
npm run build

# View production logs
docker logs -f msp_frontend
```

### Database

```bash
# Connect to database
docker exec -it msp_postgres psql -U msp_user -d msp_db

# Backup database
./scripts/backup-database.sh

# Restore database
./scripts/restore-database.sh backup_file.sql.gz
```

---

## 📚 Related Documentation

- [Setup Guide](../setup/SETUP.md)
- [Deployment Guide](../deployment/PRODUCTION.md)
- [Debugging Guide](../troubleshooting/DEBUGGING.md)
- [Development Strategy](DEVELOPMENT_STRATEGY.md)
- [Testing Links](TESTING_LINKS.md) - Detailed API endpoint reference

---

**Last Updated**: November 15, 2025

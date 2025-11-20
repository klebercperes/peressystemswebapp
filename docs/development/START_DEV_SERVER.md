# Starting the Development Server

## 🚀 Quick Start

### Step 1: Check Prerequisites

```bash
# Check if Node.js is installed
node --version
# Should show: v20.x.x or similar

# Check if npm is installed
npm --version
# Should show: 10.x.x or similar
```

**If Node.js/npm is not installed**, install it:
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Step 2: Navigate to Repository

```bash
cd /tmp/PeresSystemWebAppNew2
```

If the repository doesn't exist, clone it:
```bash
cd /tmp
git clone https://github.com/klebercperes/PeresSystemWebAppNew2.git
cd PeresSystemWebAppNew2
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages. Wait for it to complete.

### Step 4: Create Environment File

```bash
cat > .env.local << 'EOF'
VITE_API_URL=http://10.0.1.122:8000
VITE_GEMINI_API_KEY=your_key_here
VITE_GOOGLE_CLIENT_ID=195201008846-r2l59ff7tal07r7ursh2rb8pamob3n15.apps.googleusercontent.com
EOF
```

### Step 5: Start Development Server

```bash
npm run dev
```

You should see output like:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.0.1.122:5173/
  ➜  press h + enter to show help
```

### Step 6: Access the Application

- **From server**: http://10.0.1.122:5173
- **From network**: http://10.0.1.122:5173
- **From localhost**: http://localhost:5173

## 🔧 Troubleshooting

### "npm: command not found"

**Solution**: Install Node.js and npm (see Step 1 above)

### "Port 5173 already in use"

**Solution**:
```bash
# Find what's using the port
lsof -i :5173
# Or
netstat -tulpn | grep 5173

# Kill the process (replace PID)
kill -9 PID

# Or use a different port
npm run dev -- --port 3000
```

### "Cannot find module" errors

**Solution**: Run `npm install` again
```bash
cd /tmp/PeresSystemWebAppNew2
npm install
```

### Server starts but can't access from network

**Check vite.config.ts** has:
```typescript
server: {
  host: '0.0.0.0', // Not 'localhost'
  port: 5173,
}
```

**Check firewall**:
```bash
# Ubuntu/Debian
sudo ufw allow 5173/tcp
sudo ufw reload
```

### Connection Refused

**Possible causes**:
1. Dev server not running - Start with `npm run dev`
2. Wrong IP address - Verify with `hostname -I`
3. Firewall blocking - Check firewall rules
4. Server not listening on 0.0.0.0 - Check vite.config.ts

## 📝 Quick Commands

```bash
# Start dev server
cd /tmp/PeresSystemWebAppNew2
npm run dev

# Start in background (detached)
nohup npm run dev > /tmp/vite.log 2>&1 &

# Check if running
ps aux | grep vite

# View logs
tail -f /tmp/vite.log

# Stop server
pkill -f "vite"
```

## ✅ Verification

After starting the server, verify it's accessible:

```bash
# From the server itself
curl http://localhost:5173

# From network
curl http://10.0.1.122:5173

# Check if port is listening
netstat -tulpn | grep 5173
```

---

**Last Updated**: November 15, 2025


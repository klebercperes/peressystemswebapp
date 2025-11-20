# Quick Start - Local Dev Server

## ✅ Current Status

The local development server is **running** and ready for troubleshooting!

## 🌐 Access URLs

- **Network Access**: http://10.0.1.122:5173
- **Localhost**: http://localhost:5173
- **Backend API**: http://10.0.1.122:8000
- **API Docs**: http://10.0.1.122:8000/docs

## 🔧 Quick Commands

### Check Server Status
```bash
ps aux | grep vite
```

### View Server Logs
The server is running in the background. To see logs, check the terminal where it was started, or:
```bash
# If you need to restart and see logs:
cd /tmp/PeresSystemWebAppNew2
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run dev
```

### Stop Server
```bash
pkill -f vite
```

### Restart Server
```bash
# Stop first
pkill -f vite

# Then start again
cd /tmp/PeresSystemWebAppNew2
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run dev
```

## 📝 Environment Setup

The server is configured with:
- **Node.js**: v20.19.5 (via nvm)
- **npm**: v10.8.2
- **Vite**: Configured to listen on `0.0.0.0:5173`
- **Environment**: `.env.local` with API URL and Google Client ID

## 🐛 Troubleshooting

### Server Not Accessible
1. Check if running: `ps aux | grep vite`
2. Check port: `netstat -tulpn | grep 5173`
3. Restart if needed (see commands above)

### Changes Not Reflecting
- Vite has hot module replacement (HMR) - changes should appear automatically
- Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`
- Check browser console for errors

### Port Already in Use
```bash
# Find process using port 5173
lsof -i :5173
# Kill it
kill -9 PID
```

## 📚 More Information

- **Full Setup Guide**: [START_DEV_SERVER.md](START_DEV_SERVER.md)
- **Development Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **Testing Links**: [TESTING_LINKS.md](TESTING_LINKS.md)

---

**Last Updated**: November 15, 2025


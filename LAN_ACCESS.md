# LAN Access Guide - Testing on Local Network

## 🌐 Quick Access

Once the application is running, you can access it from any device on your local network using:

- **Frontend**: `http://YOUR_SERVER_IP:80` or `http://YOUR_SERVER_IP`
- **Backend API**: `http://YOUR_SERVER_IP:8000`
- **API Docs**: `http://YOUR_SERVER_IP:8000/docs`

## 🔍 Find Your Server IP

```bash
# Method 1: Using hostname
hostname -I

# Method 2: Using ip command
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 3: Using ifconfig (if available)
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## ⚙️ Configuration for LAN Access

### Option 1: Current Setup (Works for LAN)

The current setup already allows LAN access! Just use your server's IP address.

**No changes needed** - The application listens on `0.0.0.0` which accepts connections from any interface.

### Option 2: Explicit LAN Configuration

If you want to configure specific LAN settings:

1. **Update CORS for LAN IPs** (if needed):

   Add to `.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://YOUR_SERVER_IP:80,http://YOUR_SERVER_IP:5173
   ```

2. **Update Frontend API URL** (if frontend needs to connect via LAN):

   Add to `.env`:
   ```env
   VITE_API_URL=http://YOUR_SERVER_IP:8000
   ```

   Then rebuild frontend:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

## 📱 Access from Different Devices

### From Another Computer on LAN

1. Find your server IP (see above)
2. Open browser and go to: `http://YOUR_SERVER_IP:80`
3. That's it!

### From Mobile Device on Same WiFi

1. Connect mobile device to same WiFi network
2. Find your server IP
3. Open mobile browser: `http://YOUR_SERVER_IP:80`

### From Same Computer (Localhost)

- Frontend: `http://localhost:80`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## 🔧 Troubleshooting

### Can't Access from Other Devices

1. **Check Firewall**:
   ```bash
   # Check if ports are open
   sudo ufw status
   
   # If firewall is active, allow ports:
   sudo ufw allow 80/tcp
   sudo ufw allow 8000/tcp
   ```

2. **Check Docker Ports**:
   ```bash
   # Verify ports are exposed
   docker-compose ps
   
   # Check if ports are listening
   sudo netstat -tuln | grep -E ':(80|8000)'
   ```

3. **Check Network**:
   ```bash
   # Ensure devices are on same network
   # Ping from another device:
   ping YOUR_SERVER_IP
   ```

### CORS Errors from LAN

If you see CORS errors when accessing from LAN:

1. **Update CORS_ORIGINS** in `.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://YOUR_SERVER_IP:80,http://YOUR_SERVER_IP:5173,http://frontend:5173
   ```

2. **Restart backend**:
   ```bash
   docker-compose restart backend
   ```

### Frontend Can't Connect to Backend

If frontend loads but can't reach the API:

1. **Check VITE_API_URL**:
   ```bash
   # Should match your access method
   # For LAN: http://YOUR_SERVER_IP:8000
   # For localhost: http://localhost:8000
   ```

2. **Rebuild frontend** after changing VITE_API_URL:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

## 🎯 Quick Test Commands

```bash
# Test from server itself
curl http://localhost:80/health
curl http://localhost:8000/health

# Test from another device (replace with your IP)
curl http://YOUR_SERVER_IP:80/health
curl http://YOUR_SERVER_IP:8000/health

# Check what's listening
sudo ss -tulpn | grep -E ':(80|8000)'
```

## 📋 Current Configuration

- **Frontend**: Listens on `0.0.0.0:80` (accessible from LAN)
- **Backend**: Listens on `0.0.0.0:8000` (accessible from LAN)
- **CORS**: Configured via `CORS_ORIGINS` environment variable
- **Default CORS**: Includes localhost, can add LAN IPs if needed

## 💡 Pro Tips

1. **Use mDNS (Bonjour)** for easier access:
   - Access via: `http://hostname.local:80` (if mDNS is enabled)
   - Works on macOS, Linux, and some Windows setups

2. **Set Static IP** for your server:
   - Makes it easier to remember the IP
   - Configure in your router or network settings

3. **Use Hostname**:
   - Add to `/etc/hosts` on client devices:
     ```
     YOUR_SERVER_IP  peres.local
     ```
   - Then access via: `http://peres.local:80`

---

**Status**: ✅ LAN access is enabled by default - just use your server IP!


# HTTPS Setup for LAN Access

## ⚠️ Why HTTPS Won't Work Yet

HTTPS is not currently enabled. The application is running on HTTP only.

**Current Status:**
- ✅ HTTP works: http://10.0.1.122:80
- ❌ HTTPS doesn't work: https://10.0.1.122 (not configured)

## 🚀 Quick Setup: Enable HTTPS for LAN

### Option 1: Use HTTP (Simplest for Testing)

For LAN testing, HTTP is perfectly fine:
- **Frontend**: http://10.0.1.122:80
- **Backend**: http://10.0.1.122:8000

**No setup needed** - this already works!

### Option 2: Enable HTTPS with Self-Signed Certificates

For HTTPS on LAN (browsers will show security warnings):

#### Step 1: Generate Self-Signed Certificate

```bash
# Generate certificate for LAN IP
./scripts/generate-self-signed-cert.sh
```

This creates:
- `./ssl/cert.pem` (certificate)
- `./ssl/key.pem` (private key)

#### Step 2: Enable HTTPS

**Recommended Method** (uses standalone compose file):
```bash
# Stop current services
docker-compose down

# Start with HTTPS (standalone file - no port conflicts)
docker-compose -f docker-compose.https.yml up -d
```

**Alternative Method** (using override file):
```bash
# Stop all services
docker-compose down

# Remove frontend container (it uses port 80)
docker stop msp_frontend 2>/dev/null || true
docker rm msp_frontend 2>/dev/null || true

# Start with HTTPS
docker-compose -f docker-compose.yml -f docker-compose.ssl-lan.yml up -d
```

**Or use the automated script:**
```bash
./scripts/enable-https-lan.sh
```

#### Step 3: Access via HTTPS

- **Frontend**: https://10.0.1.122
- **Backend**: https://10.0.1.122/api/
- **API Docs**: https://10.0.1.122/docs

**⚠️ Browser Warning**: Browsers will show a security warning because the certificate is self-signed. This is normal and safe for LAN testing.

**To bypass warning:**
- Chrome/Edge: Click "Advanced" → "Proceed to 10.0.1.122 (unsafe)"
- Firefox: Click "Advanced" → "Accept the Risk and Continue"
- Safari: Click "Show Details" → "visit this website"

## 🔄 Switch Back to HTTP

If you want to go back to HTTP only:

```bash
docker-compose down
docker-compose up -d
```

## 📋 Current Configuration

**HTTP Setup (Current):**
- Frontend: http://10.0.1.122:80
- Backend: http://10.0.1.122:8000
- No certificates needed

**HTTPS Setup (After enabling):**
- Frontend: https://10.0.1.122
- Backend: https://10.0.1.122/api/
- Uses self-signed certificates
- HTTP redirects to HTTPS

## 🧪 Test HTTPS

After enabling HTTPS:

```bash
# Test HTTPS endpoint
curl -k https://10.0.1.122/health

# Test redirect from HTTP to HTTPS
curl -I http://10.0.1.122/
# Should return: HTTP/1.1 301 Moved Permanently
```

## 🔍 Troubleshooting

### Certificate Errors

If you see certificate errors:
1. Make sure certificates exist: `ls -la ./ssl/`
2. Regenerate if needed: `./scripts/generate-self-signed-cert.sh`
3. Restart nginx: `docker-compose restart nginx-proxy`

### Port 443 Already in Use

```bash
# Check what's using port 443
sudo netstat -tuln | grep :443

# If needed, stop the conflicting service
```

### Can't Access HTTPS

1. **Check firewall**:
   ```bash
   sudo ufw allow 443/tcp
   ```

2. **Check nginx logs**:
   ```bash
   docker-compose logs nginx-proxy
   ```

3. **Test nginx config**:
   ```bash
   docker-compose exec nginx-proxy nginx -t
   ```

## 💡 Recommendations

**For LAN Testing:**
- ✅ Use HTTP (simpler, no warnings)
- ⚠️ Use HTTPS only if you need to test HTTPS-specific features

**For Production:**
- ✅ Use HTTPS with Let's Encrypt certificates
- ✅ See `DOMAIN_SETUP.md` for production HTTPS setup

---

**Quick Answer**: Use **http://10.0.1.122:80** for LAN testing (no setup needed)!


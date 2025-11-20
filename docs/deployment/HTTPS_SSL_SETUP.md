# HTTPS/SSL Setup Guide

## ✅ What Was Implemented

HTTPS/SSL configuration has been set up with nginx reverse proxy support.

### Files Created

1. **`nginx-ssl.conf`** - Nginx configuration with SSL/HTTPS
2. **`nginx-http.conf`** - Enhanced HTTP config with security headers
3. **`docker-compose.ssl.yml`** - Docker Compose override for SSL
4. **`scripts/generate-self-signed-cert.sh`** - Script to generate test certificates

### Security Headers Added

- ✅ **X-Frame-Options**: DENY (prevents clickjacking)
- ✅ **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- ✅ **X-XSS-Protection**: 1; mode=block (XSS protection)
- ✅ **Referrer-Policy**: strict-origin-when-cross-origin
- ✅ **Content-Security-Policy**: Configured for the application
- ✅ **HSTS**: Ready for HTTPS (commented until SSL is enabled)

## 🔧 Configuration Options

### Option 1: Development/Testing (Self-Signed Certificate)

1. **Generate self-signed certificate**:
   ```bash
   ./scripts/generate-self-signed-cert.sh
   ```

2. **Update nginx-ssl.conf**:
   - Uncomment self-signed certificate paths:
     ```nginx
     ssl_certificate /etc/nginx/ssl/cert.pem;
     ssl_certificate_key /etc/nginx/ssl/key.pem;
     ```

3. **Use SSL compose file**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
   ```

**Note**: Browsers will show a security warning for self-signed certificates. This is normal for testing.

### Option 2: Production (Let's Encrypt) - **CONFIGURED FOR peres.systems**

1. **Install Certbot** (if not already installed):
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   ```

2. **Generate Let's Encrypt certificate** (automated script):
   ```bash
   # Set your email (optional, defaults to admin@peres.systems)
   export LETSENCRYPT_EMAIL=your-email@example.com
   
   # Run the setup script
   ./scripts/setup-letsencrypt.sh
   ```
   
   Or manually:
   ```bash
   sudo certbot certonly --standalone -d peres.systems -d www.peres.systems
   sudo cp /etc/letsencrypt/live/peres.systems/fullchain.pem ./ssl/
   sudo cp /etc/letsencrypt/live/peres.systems/privkey.pem ./ssl/
   sudo chown $USER:$USER ./ssl/*.pem
   ```

3. **nginx-ssl.conf is already configured**:
   - Domain: `peres.systems` and `www.peres.systems`
   - Certificate paths: Already set to use Let's Encrypt certificates

4. **Start with SSL**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
   ```

### Option 3: Keep HTTP (Current Setup)

The current setup uses HTTP with security headers. This is fine for:
- Development
- Internal networks
- Testing

For production, HTTPS is strongly recommended.

## 🔒 Security Headers Configuration

### Backend Headers

All API responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy: ...` (configured for app)

### Frontend Headers (Nginx)

Nginx adds security headers to all responses:
- Same headers as backend
- `Strict-Transport-Security` (when HTTPS is enabled)

## 🧪 Testing

### Test Security Headers

```bash
# Check backend headers
curl -I http://localhost:8000/

# Check frontend headers
curl -I http://localhost:80/
```

### Test HTTPS (if configured)

```bash
# Test HTTPS endpoint
curl -k https://localhost:443/health

# Test redirect from HTTP to HTTPS
curl -I http://localhost:80/
# Should return: HTTP/1.1 301 Moved Permanently
```

## 📝 Content Security Policy

The CSP is configured for the application. If you need to adjust it:

**File**: `backend/app/security_headers.py`

```python
csp = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Adjust as needed
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: https:; "
    "font-src 'self' data:; "
    "connect-src 'self' http://localhost:8000 https://api.openai.com; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)
```

## 🔄 Certificate Renewal (Let's Encrypt)

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Add to crontab
sudo crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * certbot renew --quiet --deploy-hook "docker-compose -f /path/to/docker-compose.yml -f /path/to/docker-compose.ssl.yml restart nginx-proxy"
```

## 🚨 Production Checklist

Before enabling HTTPS in production:

- [x] Domain name configured: **peres.systems** ✅
- [ ] DNS records pointing to server (A record for peres.systems and www.peres.systems)
- [ ] Port 443 open in firewall
- [ ] Let's Encrypt certificates obtained (run `./scripts/setup-letsencrypt.sh`)
- [ ] Certificates copied to `./ssl/` directory
- [x] `nginx-ssl.conf` updated with domain name ✅
- [ ] Certificate renewal configured (see script output)
- [ ] HTTPS redirect tested
- [x] Security headers verified ✅
- [ ] Mixed content issues resolved (if any)

## 📊 Current Status

- ✅ Security headers implemented (backend and frontend)
- ✅ HTTPS configuration ready (nginx-ssl.conf)
- ✅ Self-signed certificate script available
- ⚠️ HTTPS not enabled by default (use docker-compose.ssl.yml to enable)
- ⚠️ Requires SSL certificates to enable HTTPS

---

**Status**: ✅ Security headers active, HTTPS configuration ready (requires certificates to enable)


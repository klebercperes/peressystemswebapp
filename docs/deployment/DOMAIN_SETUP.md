# Domain Setup Guide for peres.systems

## ✅ Configuration Complete

Your nginx configuration has been updated for **peres.systems** domain.

## 📋 Pre-Flight Checklist

Before enabling HTTPS, ensure:

1. **DNS Configuration**
   - A record for `peres.systems` → Your server IP
   - A record for `www.peres.systems` → Your server IP (or CNAME to peres.systems)
   
2. **Firewall**
   - Port 80 (HTTP) open
   - Port 443 (HTTPS) open

3. **Server Access**
   - You have SSH access to the server
   - You can run `sudo` commands

## 🚀 Quick Start: Enable HTTPS

### Step 1: Verify DNS

```bash
# Check if DNS is configured
dig peres.systems +short
dig www.peres.systems +short

# Should return your server IP address
```

### Step 2: Get SSL Certificates

**Option A: Automated Script (Recommended)**
```bash
# Set your email for Let's Encrypt notifications
export LETSENCRYPT_EMAIL=your-email@example.com

# Run the setup script
./scripts/setup-letsencrypt.sh
```

**Option B: Manual Setup**
```bash
# Install certbot if needed
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone \
    -d peres.systems \
    -d www.peres.systems \
    --email your-email@example.com \
    --agree-tos

# Copy certificates
sudo cp /etc/letsencrypt/live/peres.systems/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/peres.systems/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem
```

### Step 3: Enable HTTPS

```bash
# Start with SSL configuration
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### Step 4: Test

```bash
# Test HTTPS
curl -I https://peres.systems

# Test redirect from HTTP to HTTPS
curl -I http://peres.systems
# Should return: HTTP/1.1 301 Moved Permanently
```

## 🔄 Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * certbot renew --quiet --deploy-hook "cd /home/kleber/peres_systems && docker-compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx-proxy"
```

Or test renewal manually:
```bash
sudo certbot renew --dry-run
```

## 🧪 Testing with Self-Signed Certificates

For local testing (browsers will show warnings):

```bash
# Generate self-signed certificate
./scripts/generate-self-signed-cert.sh

# Update nginx-ssl.conf to use self-signed certs
# Comment out Let's Encrypt lines, uncomment self-signed lines

# Start with SSL
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

## 📝 Current Configuration

- **Domain**: peres.systems, www.peres.systems
- **HTTP**: Port 80 (redirects to HTTPS)
- **HTTPS**: Port 443
- **SSL Config**: nginx-ssl.conf
- **Certificate Path**: ./ssl/fullchain.pem, ./ssl/privkey.pem

## 🔍 Troubleshooting

### DNS Not Resolving
```bash
# Check DNS propagation
dig peres.systems
nslookup peres.systems

# Wait up to 48 hours for DNS propagation
```

### Certificate Generation Fails
- Ensure port 80 is not in use
- Check firewall allows port 80
- Verify DNS is pointing to your server
- Try: `sudo netstat -tuln | grep :80`

### HTTPS Not Working
```bash
# Check nginx logs
docker-compose logs nginx-proxy

# Verify certificates exist
ls -la ./ssl/

# Test nginx config
docker-compose exec nginx-proxy nginx -t
```

### Mixed Content Warnings
- Ensure all API calls use HTTPS
- Update `VITE_API_URL` to use `https://peres.systems:8000`
- Check browser console for HTTP resources

## 📚 Related Documentation

- `HTTPS_SSL_SETUP.md` - Detailed HTTPS setup guide
- `SENTRY_SETUP.md` - Error tracking setup
- `PRODUCTION_READINESS_ASSESSMENT.md` - Production checklist

---

**Status**: ✅ Domain configured, ready for SSL certificate setup


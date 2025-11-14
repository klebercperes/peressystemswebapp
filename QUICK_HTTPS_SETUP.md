# Quick HTTPS Setup for peres.systems

## Current Status

- ✅ Domain: `peres.systems` → `43.247.67.119` (DNS configured)
- ⏳ Domain: `www.peres.systems` → `43.247.67.119` (DNS will be updated)
- ❌ Certbot: Not installed yet
- ❌ Certificates: Need to be generated

## Quick Setup Steps

### Step 1: Install Certbot

```bash
sudo apt-get update
sudo apt-get install certbot
```

### Step 2: Stop nginx-proxy (certbot needs port 80)

```bash
docker-compose -f docker-compose.https.yml stop nginx-proxy
```

### Step 3: Generate Let's Encrypt Certificate

```bash
# Set your email
export LETSENCRYPT_EMAIL=your-email@example.com

# Run setup script
./scripts/setup-letsencrypt.sh
```

**Note**: The script will:
- Generate certificate for `peres.systems` (DNS is ready)
- Skip `www.peres.systems` if DNS not ready yet (you can add it later)

### Step 4: Start with Domain HTTPS

```bash
# Stop current setup
docker-compose -f docker-compose.https.yml down

# Start with domain configuration
docker-compose -f docker-compose.https-domain.yml up -d
```

### Step 5: Test

```bash
# Test HTTPS
curl -I https://peres.systems

# Should return HTTP/2 200 without certificate errors
```

### Step 6: Add www.peres.systems Later

Once DNS for `www.peres.systems` is updated:

```bash
# Stop nginx-proxy
docker-compose -f docker-compose.https-domain.yml stop nginx-proxy

# Regenerate certificate with both domains
sudo certbot certonly --standalone \
    -d peres.systems \
    -d www.peres.systems \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive

# Copy updated certificates
sudo cp /etc/letsencrypt/live/peres.systems/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/peres.systems/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem

# Restart nginx-proxy
docker-compose -f docker-compose.https-domain.yml start nginx-proxy
```

## Set Up Auto-Renewal

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * certbot renew --quiet --deploy-hook "cd /home/kleber/peres_systems && docker-compose -f docker-compose.https-domain.yml restart nginx-proxy"
```

## Troubleshooting

### Certificate Generation Fails

- Ensure port 80 is accessible from internet
- Check firewall: `sudo ufw allow 80/tcp`
- Verify DNS: `dig peres.systems +short` should return `43.247.67.119`

### Still Getting Certificate Error

- Clear browser cache
- Try incognito/private mode
- Wait a few minutes for certificate to propagate

---

**Current Server IP**: `43.247.67.119`  
**Domain**: `peres.systems` → `43.247.67.119` ✅  
**www Domain**: `www.peres.systems` → `43.247.67.119` (pending)


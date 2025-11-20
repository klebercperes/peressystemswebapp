# Certificate Generation Steps

## ✅ DNS is Configured

- `peres.systems` → `43.247.67.119` ✓
- `www.peres.systems` → `43.247.67.119` ✓

## Step-by-Step Instructions

### Step 1: Set Your Email Address

```bash
export LETSENCRYPT_EMAIL=your-real-email@domain.com
```

**Important**: Use a real email address (not a placeholder)

### Step 2: Stop nginx-proxy

Certbot needs port 80 for validation:

```bash
docker-compose -f docker-compose.https.yml stop nginx-proxy
```

### Step 3: Generate Certificates

```bash
./scripts/setup-letsencrypt.sh
```

The script will:
- ✅ Check DNS (should match 43.247.67.119)
- ✅ Generate certificate for `peres.systems`
- ✅ Generate certificate for `www.peres.systems`
- ✅ Copy certificates to `./ssl/`

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
curl -I https://www.peres.systems

# Both should return HTTP/2 200 without certificate errors
```

### Step 6: Set Up Auto-Renewal

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * certbot renew --quiet --deploy-hook "cd /home/kleber/peres_systems && docker-compose -f docker-compose.https-domain.yml restart nginx-proxy"
```

## Troubleshooting

### Certificate Generation Fails

- **Port 80 in use**: Ensure nginx-proxy is stopped
- **DNS not propagated**: Wait a few minutes and try again
- **Firewall**: Ensure port 80 is accessible from internet: `sudo ufw allow 80/tcp`

### Still Getting Certificate Error

- Clear browser cache
- Try incognito/private mode
- Wait a few minutes for certificate to propagate

## Current Status

- ✅ DNS: Configured correctly
- ✅ Script: Ready to use
- ⚠️  Email: Need to set real email address
- ⚠️  Certificates: Need to be generated

---

**Quick Command Summary:**
```bash
export LETSENCRYPT_EMAIL=your-email@domain.com
docker-compose -f docker-compose.https.yml stop nginx-proxy
./scripts/setup-letsencrypt.sh
docker-compose -f docker-compose.https.yml down
docker-compose -f docker-compose.https-domain.yml up -d
```

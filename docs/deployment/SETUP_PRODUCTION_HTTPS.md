# Setup Production HTTPS for peres.systems

## Current Issue

You're getting a certificate error because:
- The certificate is for `10.0.1.122` (LAN IP)
- You're accessing `peres.systems` (domain name)
- Browsers require the certificate to match the domain

## Solution: Let's Encrypt Certificates

### Step 1: Verify DNS

```bash
# Check if DNS is configured
dig peres.systems +short
# Should return your server IP (10.0.1.122)

dig www.peres.systems +short
# Should also return your server IP
```

**If DNS is not configured:**
1. Go to your domain registrar
2. Add A record: `peres.systems` → `YOUR_SERVER_IP`
3. Add A record: `www.peres.systems` → `YOUR_SERVER_IP`
4. Wait for DNS propagation (can take up to 48 hours)

### Step 2: Install Certbot

```bash
sudo apt-get update
sudo apt-get install certbot
```

### Step 3: Generate Let's Encrypt Certificates

**Option A: Automated Script**
```bash
# Set your email
export LETSENCRYPT_EMAIL=your-email@example.com

# Run setup script
./scripts/setup-letsencrypt.sh
```

**Option B: Manual Setup**
```bash
# Stop nginx-proxy temporarily (certbot needs port 80)
docker-compose -f docker-compose.https-domain.yml stop nginx-proxy

# Generate certificates
sudo certbot certonly --standalone \
    -d peres.systems \
    -d www.peres.systems \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/peres.systems/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/peres.systems/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem
sudo chmod 644 ./ssl/fullchain.pem
sudo chmod 600 ./ssl/privkey.pem
```

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

### Step 6: Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * certbot renew --quiet --deploy-hook "cd /home/kleber/peres_systems && docker-compose -f docker-compose.https-domain.yml restart nginx-proxy"
```

## Troubleshooting

### DNS Not Resolving
- Wait up to 48 hours for DNS propagation
- Check with: `dig peres.systems +short`

### Certificate Generation Fails
- Ensure port 80 is accessible from internet
- Check firewall: `sudo ufw allow 80/tcp`
- Verify DNS is pointing to your server

### Still Getting Certificate Error
- Clear browser cache
- Try incognito/private mode
- Check certificate: `openssl s_client -connect peres.systems:443 -servername peres.systems`

## Current Status

- ✅ Domain: peres.systems configured
- ✅ nginx-ssl.conf: Ready for domain
- ⚠️  Certificates: Need Let's Encrypt certificates
- ⚠️  DNS: Must point to your server IP

---

**Quick Fix for Testing**: Use `https://10.0.1.122` instead (works with self-signed cert)

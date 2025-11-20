# Fixing www.peres.systems DNS and SSL

## ✅ Current Status

- **DNS**: ✅ Both `peres.systems` and `www.peres.systems` point to `43.247.67.119`
- **Nginx Config**: ✅ Already configured for both domains
- **SSL Certificate**: ⚠️ Currently only includes `peres.systems` (needs update)

## 🔧 Quick Fix

### Option 1: Automated Script (Recommended)

```bash
./scripts/regenerate-cert-with-www.sh
```

This script will:
1. ✅ Verify DNS is configured correctly
2. ✅ Stop nginx-proxy to free port 80
3. ✅ Generate new Let's Encrypt certificate with both domains
4. ✅ Copy certificates to `ssl/` directory
5. ✅ Restart nginx-proxy

### Option 2: Manual Steps

```bash
# 1. Stop nginx-proxy
docker stop msp_nginx_proxy

# 2. Generate certificate with both domains
sudo certbot certonly --standalone \
    -d peres.systems \
    -d www.peres.systems \
    --email kleber@peres.systems \
    --agree-tos \
    --non-interactive \
    --force-renewal

# 3. Copy certificates
sudo cp /etc/letsencrypt/live/peres.systems/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/peres.systems/privkey.pem ssl/
sudo chown $USER:$USER ssl/*.pem
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem

# 4. Restart nginx-proxy
docker-compose -f docker-compose.https-domain.yml up -d nginx-proxy
```

## ✅ Verification

After running the fix, verify:

```bash
# Check certificate includes www
openssl x509 -in ssl/fullchain.pem -text -noout | grep -A2 "Subject Alternative Name"

# Should show:
# DNS:peres.systems
# DNS:www.peres.systems

# Test HTTPS
curl -I https://peres.systems
curl -I https://www.peres.systems
```

## 🌐 Testing

Once fixed, both URLs should work:
- ✅ https://peres.systems
- ✅ https://www.peres.systems

Both should:
- Show valid SSL certificate (no browser warnings)
- Redirect HTTP to HTTPS
- Serve your application correctly

## 🔄 If Using GitHub Frontend

If you're using the GitHub frontend, make sure your `.env` has:

```bash
GITHUB_REPO_URL=klebercperes/PeresSystemWebAppNew2
VITE_API_URL=https://peres.systems
```

Then use:
```bash
docker-compose -f docker-compose.https-domain.github.yml up -d --build
```

## 📝 Notes

- **DNS Propagation**: DNS is already configured correctly ✅
- **Certificate Renewal**: Let's Encrypt certificates expire every 90 days
- **Auto-Renewal**: Set up a cron job to auto-renew (see `setup-letsencrypt.sh`)

## 🛠️ Troubleshooting

### Certificate Still Shows Warning

1. Clear browser cache
2. Check certificate: `openssl x509 -in ssl/fullchain.pem -text -noout | grep DNS`
3. Verify nginx is using correct certificate: `docker exec msp_nginx_proxy nginx -t`

### www Redirects to Non-www (or vice versa)

The nginx config handles both. If you want to force redirect:
- Add redirect rule in `nginx-ssl.conf` to redirect www → non-www (or vice versa)

### Port 80 Already in Use

```bash
# Find what's using port 80
sudo lsof -i :80
# Or
docker ps --filter "publish=80"

# Stop it before running certbot
```

---

**Last Updated**: November 2024


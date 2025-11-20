# www.peres.systems Configuration Verification

## ✅ Status: Fully Configured and Working

Both `peres.systems` and `www.peres.systems` are properly configured and working with HTTPS.

## Configuration Checklist

### 1. SSL Certificate ✅
- **Location**: `/home/kleber/peres_systems/ssl/fullchain.pem`
- **Includes**: 
  - `peres.systems`
  - `www.peres.systems`
- **Verified**: Certificate includes both domains in Subject Alternative Name (SAN)

### 2. Nginx Configuration ✅
- **File**: `nginx-ssl.conf`
- **Server Names**: Both `peres.systems` and `www.peres.systems` are configured
- **HTTP Redirect**: Both domains redirect HTTP to HTTPS
- **HTTPS**: Both domains serve content over HTTPS on port 443

### 3. CORS Configuration ✅
- **Environment Variable**: `CORS_ORIGINS`
- **Includes**: 
  - `https://peres.systems`
  - `https://www.peres.systems`
  - Plus development URLs for local testing

### 4. DNS Configuration ✅
- **peres.systems**: `43.247.67.119`
- **www.peres.systems**: `43.247.67.119`
- Both A records point to the correct server IP

### 5. Docker Services ✅
- **nginx-proxy**: Running and serving both domains
- **frontend**: Running and accessible
- **backend**: Running and accessible
- **postgres**: Running and healthy

## Test Results

### HTTPS Access
```bash
# Test peres.systems
curl -I https://peres.systems
# Result: HTTP/2 200 ✅

# Test www.peres.systems
curl -I https://www.peres.systems
# Result: HTTP/2 200 ✅
```

### Certificate Verification
```bash
openssl x509 -in /home/kleber/peres_systems/ssl/fullchain.pem -text -noout | grep -A 1 "Subject Alternative Name"
# Result: DNS:peres.systems, DNS:www.peres.systems ✅
```

## Current Configuration Files

### nginx-ssl.conf
- Lines 7, 16: `server_name peres.systems www.peres.systems;`
- Both HTTP (port 80) and HTTPS (port 443) servers configured
- HTTP redirects to HTTPS for both domains

### docker-compose.https-domain.yml
- Line 40: `CORS_ORIGINS` includes both domains
- All services properly configured

### .env
- `CORS_ORIGINS=https://peres.systems,https://www.peres.systems,...`
- `VITE_API_URL=https://peres.systems`

## Browser Access

Both URLs work in browsers:
- ✅ https://peres.systems
- ✅ https://www.peres.systems

Both show:
- Valid SSL certificate (Let's Encrypt)
- No certificate warnings
- Proper HTTPS connection
- Security headers present

## Maintenance

### Certificate Renewal
Certificates auto-renew via Let's Encrypt. To manually renew:
```bash
./scripts/regenerate-cert-with-www.sh
```

### Verify Configuration
```bash
# Check certificate
openssl x509 -in ssl/fullchain.pem -text -noout | grep "Subject Alternative Name"

# Test both domains
curl -I https://peres.systems
curl -I https://www.peres.systems

# Check nginx config
grep "server_name" nginx-ssl.conf

# Check CORS
grep "CORS_ORIGINS" .env
```

## Notes

- Both domains share the same SSL certificate (multi-domain certificate)
- Both domains serve the same content (no redirect between them)
- CORS is configured to accept requests from both domains
- Frontend API URL uses `https://peres.systems` (works for both domains)

---

**Last Verified**: November 15, 2025
**Status**: ✅ All systems operational



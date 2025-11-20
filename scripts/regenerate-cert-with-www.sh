#!/bin/bash
# Regenerate Let's Encrypt certificate to include www.peres.systems
# Run this script on your server (not in Docker)

set -e

DOMAIN="peres.systems"
EMAIL="${LETSENCRYPT_EMAIL:-kleber@peres.systems}"
SSL_DIR="./ssl"
SERVER_IP="${SERVER_IP:-43.247.67.119}"

echo "=== 🔄 Regenerating SSL Certificate with www.peres.systems ==="
echo ""

# Check DNS
echo "Checking DNS configuration..."
DNS_IP=$(dig +short $DOMAIN | tail -1)
WWW_DNS_IP=$(dig +short www.$DOMAIN | tail -1)

if [ -z "$DNS_IP" ]; then
    echo "❌ ERROR: DNS not configured for $DOMAIN"
    exit 1
fi

if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo "⚠️  WARNING: $DOMAIN DNS points to $DNS_IP (expected $SERVER_IP)"
fi

if [ -z "$WWW_DNS_IP" ]; then
    echo "❌ ERROR: www.$DOMAIN DNS not configured"
    echo "   Please configure DNS A record: www.$DOMAIN → $SERVER_IP"
    exit 1
fi

if [ "$WWW_DNS_IP" != "$SERVER_IP" ]; then
    echo "⚠️  WARNING: www.$DOMAIN DNS points to $WWW_DNS_IP (expected $SERVER_IP)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ www.$DOMAIN DNS correctly points to $SERVER_IP"
fi

echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot is not installed"
    echo "Install it with: sudo apt-get update && sudo apt-get install certbot"
    exit 1
fi

# Validate email
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] || [[ "$EMAIL" == *"example.com"* ]] || [[ "$EMAIL" == *"your-email"* ]]; then
    echo "❌ ERROR: Invalid email address: $EMAIL"
    echo "   Please set: export LETSENCRYPT_EMAIL=your-email@domain.com"
    exit 1
fi

# Create ssl directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Stop nginx-proxy and any other services using port 80 (certbot needs port 80)
echo "⚠️  Stopping services using port 80..."
echo "   Stopping Docker containers..."
docker ps --filter "publish=80" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
docker stop msp_nginx_proxy 2>/dev/null || true
docker ps -a --filter "name=nginx" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true

echo "   Checking for system nginx..."
sudo systemctl stop nginx 2>/dev/null && echo "   ✅ System nginx stopped" || echo "   ℹ️  No system nginx running"

# Wait a moment for ports to be released
sleep 3

# Verify port 80 is free
if sudo lsof -i :80 2>/dev/null | grep -q LISTEN; then
    echo "   ⚠️  WARNING: Port 80 is still in use:"
    sudo lsof -i :80 2>/dev/null | head -3
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "   ✅ Port 80 is free"
fi
echo ""

# Revoke old certificate if it exists (optional, certbot will handle renewal)
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "📋 Existing certificate found. Will be replaced with new one including www."
fi

# Generate new certificate with both domains
echo ""
echo "Generating Let's Encrypt certificate for $DOMAIN and www.$DOMAIN..."
echo ""

sudo certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http \
    --force-renewal

# Copy certificates to ssl directory
echo ""
echo "Copying certificates to $SSL_DIR..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$SSL_DIR/"
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$SSL_DIR/"
sudo chown $USER:$USER "$SSL_DIR"/*.pem
sudo chmod 644 "$SSL_DIR"/fullchain.pem
sudo chmod 600 "$SSL_DIR"/privkey.pem

# Verify certificate includes www
echo ""
echo "Verifying certificate..."
if openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout 2>/dev/null | grep -q "www.$DOMAIN"; then
    echo "✅ Certificate includes www.$DOMAIN"
else
    echo "⚠️  WARNING: Certificate may not include www.$DOMAIN"
fi

echo ""
echo "✅ Certificates regenerated and copied to $SSL_DIR/"
echo ""
echo "🔄 Restarting nginx-proxy..."
docker start msp_nginx_proxy 2>/dev/null || docker-compose -f docker-compose.https-domain.yml up -d nginx-proxy

echo ""
echo "✅ Done! Both peres.systems and www.peres.systems should now work with HTTPS"
echo ""
echo "Test it:"
echo "  https://peres.systems"
echo "  https://www.peres.systems"


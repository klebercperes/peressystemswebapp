#!/bin/bash
# Regenerate Let's Encrypt certificate to include all domains:
# - peres.systems, www.peres.systems
# - peres.au, www.peres.au
# Run this script on your server (not in Docker)

set -e

DOMAIN_SYSTEMS="peres.systems"
DOMAIN_AU="peres.au"
EMAIL="${LETSENCRYPT_EMAIL:-kleber@peres.au}"
SSL_DIR="./ssl"
SERVER_IP="${SERVER_IP:-43.247.67.119}"

echo "=== 🔄 Regenerating SSL Certificate for All Domains ==="
echo "Domains: $DOMAIN_SYSTEMS, www.$DOMAIN_SYSTEMS, $DOMAIN_AU, www.$DOMAIN_AU"
echo ""

# Check DNS
echo "Checking DNS configuration..."
DNS_SYSTEMS=$(dig +short $DOMAIN_SYSTEMS | tail -1)
WWW_DNS_SYSTEMS=$(dig +short www.$DOMAIN_SYSTEMS | tail -1)
DNS_AU=$(dig +short $DOMAIN_AU | tail -1)
WWW_DNS_AU=$(dig +short www.$DOMAIN_AU | tail -1)

DOMAINS_TO_INCLUDE=()
DOMAINS_TO_SKIP=()

check_domain() {
    local domain=$1
    local dns_ip=$2
    
    if [ -z "$dns_ip" ]; then
        echo "⚠️  WARNING: $domain DNS not configured"
        DOMAINS_TO_SKIP+=("$domain")
        return 1
    elif [ "$dns_ip" != "$SERVER_IP" ]; then
        echo "⚠️  WARNING: $domain DNS points to $dns_ip (expected $SERVER_IP)"
        DOMAINS_TO_SKIP+=("$domain")
        return 1
    else
        echo "✅ $domain DNS correctly points to $SERVER_IP"
        DOMAINS_TO_INCLUDE+=("$domain")
        return 0
    fi
}

check_domain "$DOMAIN_SYSTEMS" "$DNS_SYSTEMS"
check_domain "www.$DOMAIN_SYSTEMS" "$WWW_DNS_SYSTEMS"
check_domain "$DOMAIN_AU" "$DNS_AU"
check_domain "www.$DOMAIN_AU" "$WWW_DNS_AU"

if [ ${#DOMAINS_TO_INCLUDE[@]} -eq 0 ]; then
    echo ""
    echo "❌ ERROR: No domains have DNS configured correctly"
    echo "   Please configure DNS A records for at least one domain"
    exit 1
fi

if [ ${#DOMAINS_TO_SKIP[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  The following domains will be skipped (DNS not ready):"
    for domain in "${DOMAINS_TO_SKIP[@]}"; do
        echo "   - $domain"
    done
    echo ""
    read -p "Continue with available domains? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "✅ Will generate certificate for ${#DOMAINS_TO_INCLUDE[@]} domain(s):"
for domain in "${DOMAINS_TO_INCLUDE[@]}"; do
    echo "   - $domain"
done
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

# Use the first domain as the certificate name (Let's Encrypt convention)
CERT_NAME="${DOMAINS_TO_INCLUDE[0]}"

# Revoke old certificate if it exists (optional, certbot will handle renewal)
if [ -f "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem" ]; then
    echo "📋 Existing certificate found. Will be replaced with new one."
fi

# Generate new certificate with all domains
echo ""
echo "Generating Let's Encrypt certificate for all configured domains..."
echo ""

CERT_DOMAINS=""
for domain in "${DOMAINS_TO_INCLUDE[@]}"; do
    CERT_DOMAINS="$CERT_DOMAINS -d $domain"
done

sudo certbot certonly --standalone \
    $CERT_DOMAINS \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http \
    --force-renewal

# Copy certificates to ssl directory
echo ""
echo "Copying certificates to $SSL_DIR..."
sudo cp /etc/letsencrypt/live/$CERT_NAME/fullchain.pem "$SSL_DIR/"
sudo cp /etc/letsencrypt/live/$CERT_NAME/privkey.pem "$SSL_DIR/"
sudo chown $USER:$USER "$SSL_DIR"/*.pem
sudo chmod 644 "$SSL_DIR"/fullchain.pem
sudo chmod 600 "$SSL_DIR"/privkey.pem

# Verify certificate includes all domains
echo ""
echo "Verifying certificate..."
for domain in "${DOMAINS_TO_INCLUDE[@]}"; do
    if openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout 2>/dev/null | grep -q "$domain"; then
        echo "✅ Certificate includes $domain"
    else
        echo "⚠️  WARNING: Certificate may not include $domain"
    fi
done

echo ""
echo "✅ Certificates regenerated and copied to $SSL_DIR/"
echo ""
echo "🔄 Restarting nginx-proxy..."
docker start msp_nginx_proxy 2>/dev/null || docker-compose -f docker-compose.https-domain.github.yml up -d nginx-proxy

echo ""
echo "✅ Done! All configured domains should now work with HTTPS"
echo ""
echo "Test it:"
for domain in "${DOMAINS_TO_INCLUDE[@]}"; do
    echo "  https://$domain"
done


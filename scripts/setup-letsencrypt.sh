#!/bin/bash
# Setup Let's Encrypt SSL certificates for peres.systems
# Run this script on your server (not in Docker)

set -e

DOMAIN="peres.systems"
EMAIL="${LETSENCRYPT_EMAIL:-admin@peres.systems}"  # Change this to your email
SSL_DIR="./ssl"
SERVER_IP="${SERVER_IP:-43.247.67.119}"  # Your server IP (public IP)

echo "Setting up Let's Encrypt SSL certificates for $DOMAIN"
echo ""

# Check DNS
echo "Checking DNS configuration..."
DNS_IP=$(dig +short $DOMAIN | tail -1)
WWW_DNS_IP=$(dig +short www.$DOMAIN | tail -1)

if [ -z "$DNS_IP" ]; then
    echo "❌ ERROR: DNS not configured for $DOMAIN"
    echo "   Please configure DNS A record: $DOMAIN → $SERVER_IP"
    exit 1
fi

if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo "⚠️  WARNING: DNS points to $DNS_IP, but server IP is $SERVER_IP"
    echo "   Let's Encrypt validation may fail if DNS doesn't match"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ $DOMAIN DNS correctly points to $SERVER_IP"
fi

# Check www subdomain
if [ -z "$WWW_DNS_IP" ]; then
    echo "⚠️  WARNING: www.$DOMAIN DNS not configured yet"
    echo "   Certificate will be generated for $DOMAIN only"
    echo "   You can add www.$DOMAIN later and regenerate"
    INCLUDE_WWW=false
elif [ "$WWW_DNS_IP" != "$SERVER_IP" ]; then
    echo "⚠️  WARNING: www.$DOMAIN points to $WWW_DNS_IP (not $SERVER_IP)"
    echo "   Certificate will be generated for $DOMAIN only"
    INCLUDE_WWW=false
else
    echo "✅ www.$DOMAIN DNS correctly points to $SERVER_IP"
    INCLUDE_WWW=true
fi

# Wait a moment for DNS propagation if needed
if [ "$DNS_IP" != "$SERVER_IP" ] && [ "$DNS_IP" != "" ]; then
    echo ""
    echo "⚠️  DNS propagation: peres.systems currently resolves to $DNS_IP"
    echo "   Expected: $SERVER_IP"
    echo "   This might be DNS propagation delay (can take up to 48 hours)"
    echo "   Let's Encrypt will check the actual DNS, not cached values"
    echo ""
fi
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot is not installed"
    echo "Install it with: sudo apt-get update && sudo apt-get install certbot"
    exit 1
fi

# Create ssl directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Validate email address
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] || [[ "$EMAIL" == *"example.com"* ]] || [[ "$EMAIL" == *"your-email"* ]]; then
    echo "❌ ERROR: Invalid email address: $EMAIL"
    echo "   Please set a valid email address:"
    echo "   export LETSENCRYPT_EMAIL=your-real-email@domain.com"
    exit 1
fi

# Stop nginx if running (certbot needs port 80)
echo "⚠️  Note: This script will temporarily use port 80 for certificate validation"
echo "   Make sure nginx is stopped or port 80 is available"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Generate certificates using standalone mode
echo "Generating Let's Encrypt certificates..."
if [ "$INCLUDE_WWW" = true ]; then
    echo "Including both $DOMAIN and www.$DOMAIN"
    CERT_DOMAINS="-d $DOMAIN -d www.$DOMAIN"
else
    echo "Including only $DOMAIN (www.$DOMAIN DNS not ready)"
    CERT_DOMAINS="-d $DOMAIN"
fi

sudo certbot certonly --standalone \
    $CERT_DOMAINS \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http

# Copy certificates to ssl directory
echo "Copying certificates to $SSL_DIR..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$SSL_DIR/"
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$SSL_DIR/"
sudo chown $USER:$USER "$SSL_DIR"/*.pem
sudo chmod 644 "$SSL_DIR"/fullchain.pem
sudo chmod 600 "$SSL_DIR"/privkey.pem

echo ""
echo "✅ Certificates generated and copied to $SSL_DIR/"
echo ""
echo "Next steps:"
echo "1. Update nginx-ssl.conf to use the certificates (already done)"
echo "2. Start with SSL: docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d"
echo ""
echo "⚠️  Important: Set up auto-renewal!"
echo "   Add to crontab: sudo crontab -e"
echo "   0 2 * * * certbot renew --quiet --deploy-hook 'docker-compose -f /path/to/docker-compose.yml -f /path/to/docker-compose.ssl.yml restart nginx-proxy'"


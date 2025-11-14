#!/bin/bash
# Setup Let's Encrypt SSL certificates using DNS validation
# Use this if your domain is behind a CDN/proxy (like Cloudflare)
# Run this script on your server (not in Docker)

set -e

DOMAIN="peres.systems"
EMAIL="${LETSENCRYPT_EMAIL:-admin@peres.systems}"
SSL_DIR="./ssl"

echo "Setting up Let's Encrypt SSL certificates for $DOMAIN using DNS validation"
echo ""

# Validate email address
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] || [[ "$EMAIL" == *"example.com"* ]] || [[ "$EMAIL" == *"your-email"* ]]; then
    echo "❌ ERROR: Invalid email address: $EMAIL"
    echo "   Please set a valid email address:"
    echo "   export LETSENCRYPT_EMAIL=your-real-email@domain.com"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot is not installed"
    echo "Install it with: sudo apt-get update && sudo apt-get install certbot"
    exit 1
fi

# Create ssl directory if it doesn't exist
mkdir -p "$SSL_DIR"

echo "⚠️  DNS Validation Method"
echo "   This method requires you to add a TXT record to your DNS"
echo "   Certbot will provide the TXT record value"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Generate certificates using DNS validation
echo "Generating Let's Encrypt certificates using DNS validation..."
echo ""
echo "📋 You will be prompted to add a TXT record to your DNS"
echo "   Follow the instructions provided by certbot"
echo ""

sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --manual-public-ip-logging-ok

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
echo "1. Start with domain HTTPS: docker-compose -f docker-compose.https-domain.yml up -d"
echo ""
echo "⚠️  Important: Set up auto-renewal!"
echo "   DNS validation requires manual intervention for renewal"
echo "   Consider using HTTP validation if possible, or automate DNS updates"


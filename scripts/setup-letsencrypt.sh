#!/bin/bash
# Setup Let's Encrypt SSL certificates for peres.systems
# Run this script on your server (not in Docker)

set -e

DOMAIN_SYSTEMS="peres.systems"
DOMAIN_AU="peres.au"
EMAIL="${LETSENCRYPT_EMAIL:-admin@peres.systems}"  # Change this to your email
SSL_DIR="./ssl"
SERVER_IP="${SERVER_IP:-43.247.67.119}"  # Your server IP (public IP)

echo "Setting up Let's Encrypt SSL certificates for multiple domains"
echo "Domains: $DOMAIN_SYSTEMS, www.$DOMAIN_SYSTEMS, $DOMAIN_AU, www.$DOMAIN_AU"
echo ""

# Check DNS
echo "Checking DNS configuration..."
DNS_SYSTEMS=$(dig +short $DOMAIN_SYSTEMS | tail -1)
WWW_DNS_SYSTEMS=$(dig +short www.$DOMAIN_SYSTEMS | tail -1)
DNS_AU=$(dig +short $DOMAIN_AU | tail -1)
WWW_DNS_AU=$(dig +short www.$DOMAIN_AU | tail -1)

# Check all domains
DOMAINS_TO_INCLUDE=()
DOMAINS_TO_SKIP=()

check_domain() {
    local domain=$1
    local dns_ip=$2
    
    if [ -z "$dns_ip" ]; then
        echo "⚠️  WARNING: $domain DNS not configured yet"
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
CERT_DOMAINS=""
for domain in "${DOMAINS_TO_INCLUDE[@]}"; do
    CERT_DOMAINS="$CERT_DOMAINS -d $domain"
done

# Use the first domain as the certificate name (Let's Encrypt convention)
CERT_NAME="${DOMAINS_TO_INCLUDE[0]}"

sudo certbot certonly --standalone \
    $CERT_DOMAINS \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http

# Copy certificates to ssl directory
echo "Copying certificates to $SSL_DIR..."
sudo cp /etc/letsencrypt/live/$CERT_NAME/fullchain.pem "$SSL_DIR/"
sudo cp /etc/letsencrypt/live/$CERT_NAME/privkey.pem "$SSL_DIR/"
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


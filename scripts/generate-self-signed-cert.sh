#!/bin/bash
# Generate self-signed SSL certificate for testing
# For production, use Let's Encrypt certificates

set -e

CERT_DIR="./ssl"
DOMAIN="${SSL_DOMAIN:-10.0.1.122}"  # Default to LAN IP, can override with SSL_DOMAIN env var

echo "Generating self-signed SSL certificate for testing..."

# Create ssl directory
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.csr" \
  -subj "/C=AU/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in "$CERT_DIR/cert.csr" -signkey "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -extensions v3_req \
  -extfile <(cat <<EOF
[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = 10.0.1.122
EOF
)

# Clean up CSR
rm "$CERT_DIR/cert.csr"

# Set permissions
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

echo "✅ Self-signed certificate generated:"
echo "   Certificate: $CERT_DIR/cert.pem"
echo "   Private Key: $CERT_DIR/key.pem"
echo ""
echo "⚠️  WARNING: This is a self-signed certificate for testing only!"
echo "   Browsers will show a security warning."
echo "   For production, use Let's Encrypt certificates."


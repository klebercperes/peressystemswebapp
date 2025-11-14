#!/bin/bash
# Enable HTTPS for LAN access
# This script properly stops all services and starts with HTTPS

set -e

echo "🔒 Enabling HTTPS for LAN access..."

# Stop all services
echo "Stopping all services..."
docker-compose down

# Remove any orphaned containers and clean up
docker rm -f $(docker ps -aq --filter "name=msp") 2>/dev/null || true
docker system prune -f > /dev/null 2>&1 || true

# Generate certificates if they don't exist
if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/key.pem" ]; then
    echo "Generating self-signed certificates..."
    ./scripts/generate-self-signed-cert.sh
fi

# Start with HTTPS configuration (use standalone file to avoid port conflicts)
echo "Starting services with HTTPS..."
docker-compose -f docker-compose.https.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 5

# Check status
echo ""
echo "Service status:"
docker-compose ps

echo ""
echo "✅ HTTPS enabled!"
echo ""
echo "🌐 Access URLs:"
echo "   HTTPS: https://10.0.1.122"
echo "   HTTP:  http://10.0.1.122 (redirects to HTTPS)"
echo ""
echo "⚠️  Browsers will show security warnings for self-signed certificates."
echo "   This is normal and safe for LAN testing."


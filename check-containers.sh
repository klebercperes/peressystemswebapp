#!/bin/bash
# Script to check Docker containers with proper permissions
# Run: bash check-containers.sh

newgrp docker << 'EOF'
cd /home/kleber/peres_systems
echo "=== Container Status ==="
docker-compose ps
echo ""
echo "=== Container Logs (last 30 lines) ==="
docker-compose logs --tail=30
EOF


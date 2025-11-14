#!/bin/bash
# Docker Installation Script for Ubuntu
# Run this script with: bash install-docker.sh

echo "Installing Docker and Docker Compose..."

# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

echo ""
echo "✅ Docker installation complete!"
echo ""
echo "⚠️  IMPORTANT: You need to log out and log back in (or run 'newgrp docker')"
echo "   for the docker group changes to take effect."
echo ""
echo "After logging back in, you can start the application with:"
echo "  cd /home/kleber/peres_systems"
echo "  docker-compose up -d --build"


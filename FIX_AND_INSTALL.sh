#!/bin/bash
# Fix dpkg and install Docker
# Run: bash FIX_AND_INSTALL.sh

echo "Step 1: Fixing interrupted dpkg process..."
sudo dpkg --configure -a

echo ""
echo "Step 2: Fixing any broken packages..."
sudo apt --fix-broken install -y

echo ""
echo "Step 3: Updating package list..."
sudo apt update

echo ""
echo "Step 4: Installing Docker..."
sudo apt install -y docker.io

echo ""
echo "Step 5: Installing Docker Compose..."
sudo apt install -y docker-compose

echo ""
echo "Step 6: Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

echo ""
echo "Step 7: Adding user to docker group..."
sudo usermod -aG docker $USER

echo ""
echo "✅ Installation complete!"
echo ""
echo "⚠️  IMPORTANT: Log out and log back in via SSH for docker group to take effect."
echo ""
echo "After logging back in, verify with:"
echo "  docker --version"
echo "  docker-compose --version"
echo ""
echo "Then start the application with:"
echo "  cd /home/kleber/peres_systems"
echo "  docker-compose up -d --build"


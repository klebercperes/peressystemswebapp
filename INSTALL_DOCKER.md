# Docker Installation Guide

## Quick Installation (Run these commands one by one)

```bash
# 1. Update package list
sudo apt update

# 2. Install Docker
sudo apt install -y docker.io

# 3. Install Docker Compose
sudo apt install -y docker-compose

# 4. Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# 5. Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# 6. Verify installation
docker --version
docker-compose --version
```

## After Installation

**IMPORTANT**: You need to log out and log back in via SSH for the docker group changes to take effect.

After logging back in, you can start the application:

```bash
cd /home/kleber/peres_systems
docker-compose up -d --build
```

## Alternative: Use Docker Compose V2 (if available)

If `docker-compose` doesn't work, try the newer syntax:

```bash
docker compose up -d --build
```


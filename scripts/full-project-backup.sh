#!/bin/bash
# Full Project Backup Script
# Creates a comprehensive backup of the entire project before major changes

set -e  # Exit on error

# Set timezone to Brisbane, Australia
export TZ="Australia/Brisbane"

# Configuration
BACKUP_DIR="/home/kleber/peres_systems/backups"
TIMESTAMP=$(TZ="Australia/Brisbane" date +%Y%m%d_%H%M%S)
BACKUP_NAME="full_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Full Project Backup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_PATH}"
echo -e "${GREEN}✓${NC} Created backup directory: ${BACKUP_PATH}"

# 1. Database Backup
echo ""
echo -e "${BLUE}[1/6] Backing up database...${NC}"
docker exec msp_postgres pg_dump -U msp_user msp_db | gzip > "${BACKUP_PATH}/database.sql.gz"
if [ $? -eq 0 ]; then
    DB_SIZE=$(du -h "${BACKUP_PATH}/database.sql.gz" | cut -f1)
    echo -e "${GREEN}✓${NC} Database backup created (${DB_SIZE})"
else
    echo -e "${YELLOW}⚠${NC} Database backup failed (container may not be running)"
fi

# 2. Environment Files
echo ""
echo -e "${BLUE}[2/6] Backing up environment files...${NC}"
mkdir -p "${BACKUP_PATH}/config"
if [ -f .env ]; then
    cp .env "${BACKUP_PATH}/config/.env"
    echo -e "${GREEN}✓${NC} .env file backed up"
fi
if [ -f docker-compose.https-domain.github.yml ]; then
    cp docker-compose.https-domain.github.yml "${BACKUP_PATH}/config/"
    echo -e "${GREEN}✓${NC} docker-compose files backed up"
fi
cp docker-compose*.yml "${BACKUP_PATH}/config/" 2>/dev/null || true

# 3. SSL Certificates (if they exist)
echo ""
echo -e "${BLUE}[3/6] Backing up SSL certificates...${NC}"
if [ -d ssl ]; then
    cp -r ssl "${BACKUP_PATH}/ssl"
    echo -e "${GREEN}✓${NC} SSL certificates backed up"
else
    echo -e "${YELLOW}⚠${NC} SSL directory not found (skipping)"
fi

# 4. Frontend Repository Snapshot
echo ""
echo -e "${BLUE}[4/6] Backing up frontend repository...${NC}"
if [ -d /tmp/PeresSystemWebAppNew2 ]; then
    cd /tmp/PeresSystemWebAppNew2
    git bundle create "${BACKUP_PATH}/frontend_repo.bundle" --all 2>/dev/null || {
        # If bundle fails, create a tar archive
        cd /tmp
        tar -czf "${BACKUP_PATH}/frontend_repo.tar.gz" PeresSystemWebAppNew2 --exclude='node_modules' --exclude='.git/objects' 2>/dev/null || true
    }
    echo -e "${GREEN}✓${NC} Frontend repository backed up"
    cd /home/kleber/peres_systems
else
    echo -e "${YELLOW}⚠${NC} Frontend repository not found at /tmp/PeresSystemWebAppNew2"
fi

# 5. Backend Code
echo ""
echo -e "${BLUE}[5/6] Backing up backend code...${NC}"
if [ -d backend ]; then
    tar -czf "${BACKUP_PATH}/backend.tar.gz" backend --exclude='backend/__pycache__' --exclude='backend/**/__pycache__' --exclude='backend/.pytest_cache' 2>/dev/null
    echo -e "${GREEN}✓${NC} Backend code backed up"
else
    echo -e "${YELLOW}⚠${NC} Backend directory not found"
fi

# 6. Documentation and Scripts
echo ""
echo -e "${BLUE}[6/6] Backing up documentation and scripts...${NC}"
mkdir -p "${BACKUP_PATH}/docs"
if [ -d docs ]; then
    cp -r docs "${BACKUP_PATH}/docs" 2>/dev/null || true
fi
if [ -d scripts ]; then
    cp -r scripts "${BACKUP_PATH}/scripts" 2>/dev/null || true
fi
echo -e "${GREEN}✓${NC} Documentation and scripts backed up"

# Create backup manifest
echo ""
echo -e "${BLUE}Creating backup manifest...${NC}"
cat > "${BACKUP_PATH}/BACKUP_MANIFEST.txt" << EOF
Full Project Backup
===================
Date: $(date)
Backup Name: ${BACKUP_NAME}
Backup Path: ${BACKUP_PATH}

Contents:
- database.sql.gz - PostgreSQL database dump
- config/ - Environment and configuration files
- ssl/ - SSL certificates (if present)
- frontend_repo.bundle or frontend_repo.tar.gz - Frontend repository snapshot
- backend.tar.gz - Backend code
- docs/ - Documentation
- scripts/ - Scripts

To restore:
1. Database: gunzip < database.sql.gz | docker exec -i msp_postgres psql -U msp_user msp_db
2. Config: Copy files from config/ back to project root
3. SSL: Copy ssl/ directory back to project root
4. Frontend: git clone from bundle or extract tar.gz
5. Backend: Extract backend.tar.gz

Git Status:
$(cd /home/kleber/peres_systems && git status --short 2>/dev/null || echo "Not a git repository")

Docker Containers:
$(docker ps --filter "name=msp_" --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "Docker not available")
EOF

echo -e "${GREEN}✓${NC} Backup manifest created"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup Location: ${BACKUP_PATH}"
echo "Total Size: ${TOTAL_SIZE}"
echo ""
echo "Backup includes:"
echo "  ✓ Database dump"
echo "  ✓ Environment files"
echo "  ✓ SSL certificates"
echo "  ✓ Frontend repository"
echo "  ✓ Backend code"
echo "  ✓ Documentation and scripts"
echo ""
echo -e "${YELLOW}Note:${NC} Keep this backup safe before making major changes!"
echo ""


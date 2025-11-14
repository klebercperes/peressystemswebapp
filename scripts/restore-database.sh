#!/bin/bash
# PostgreSQL Database Restore Script
# Restores database from backup file

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Database connection from environment or defaults
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-msp_db}"
DB_USER="${POSTGRES_USER:-msp_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-msp_password}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/msp_db_backup_*.sql* 2>/dev/null | tail -10 || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if PostgreSQL container is running
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "postgres|msp_postgres" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "ERROR: PostgreSQL container not found or not running"
    exit 1
fi

echo "Found PostgreSQL container: $POSTGRES_CONTAINER"
echo "Restoring from: $BACKUP_FILE"
echo ""
read -p "WARNING: This will replace all data in the database. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Determine if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
    CLEANUP_TEMP=true
else
    CLEANUP_TEMP=false
fi

# Restore database
echo "Restoring database..."
if docker exec -i "$POSTGRES_CONTAINER" psql \
    -h localhost \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    < "$BACKUP_FILE" 2>&1; then
    echo "Database restored successfully"
    
    if [ "$CLEANUP_TEMP" = true ]; then
        rm -f "$TEMP_FILE"
    fi
    exit 0
else
    echo "ERROR: Restore failed"
    if [ "$CLEANUP_TEMP" = true ]; then
        rm -f "$TEMP_FILE"
    fi
    exit 1
fi


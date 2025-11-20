#!/bin/bash
# Automated PostgreSQL Backup Script
# Creates timestamped backups with retention policy

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESSION="${COMPRESSION:-gzip}"

# Database connection from environment or defaults
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-msp_db}"
DB_USER="${POSTGRES_USER:-msp_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-msp_password}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Set timezone to Brisbane, Australia for timestamps
export TZ="Australia/Brisbane"

# Generate backup filename with timestamp
TIMESTAMP=$(TZ="Australia/Brisbane" date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/msp_db_backup_${TIMESTAMP}.sql"

# Log file
LOG_FILE="$BACKUP_DIR/backup.log"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting database backup..."

# Check if PostgreSQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "^msp_postgres\|.*postgres.*$"; then
    log "ERROR: PostgreSQL container not found or not running"
    exit 1
fi

# Find PostgreSQL container name
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "postgres|msp_postgres" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    log "ERROR: Could not find PostgreSQL container"
    exit 1
fi

log "Found PostgreSQL container: $POSTGRES_CONTAINER"

# Perform backup using pg_dump inside container
log "Creating backup: $BACKUP_FILE"
if docker exec "$POSTGRES_CONTAINER" pg_dump \
    -h localhost \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    > "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    log "Backup created successfully: $BACKUP_FILE"
    
    # Compress backup if requested
    if [ "$COMPRESSION" = "gzip" ]; then
        log "Compressing backup..."
        gzip -f "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        log "Backup compressed: $BACKUP_FILE"
    fi
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup size: $BACKUP_SIZE"
    
    # Clean up old backups (retention policy)
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "msp_db_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "msp_db_backup_*.sql*" -type f | wc -l)
    log "Retained $DELETED_COUNT backup(s)"
    
    log "Backup completed successfully"
    exit 0
else
    log "ERROR: Backup failed"
    exit 1
fi


# Database Backup and Restore Guide

## Overview

Automated backup system for PostgreSQL database with retention policy and restore capabilities.

## Features

- ✅ Automated daily backups
- ✅ Compressed backups (gzip)
- ✅ Retention policy (default: 30 days)
- ✅ Timestamped backup files
- ✅ Logging of all backup operations
- ✅ Easy restore procedure

## Quick Start

### Manual Backup

```bash
# Run backup script
./scripts/backup-database.sh

# Backup will be created in ./backups/ directory
# Format: msp_db_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Restore from Backup

```bash
# List available backups
ls -lh backups/

# Restore from backup
./scripts/restore-database.sh backups/msp_db_backup_20241114_120000.sql.gz
```

## Configuration

### Environment Variables

Set these in your `.env` file or export before running:

```bash
# Backup directory (default: ./backups)
BACKUP_DIR=./backups

# Retention days (default: 30)
RETENTION_DAYS=30

# Compression (default: gzip, set to "none" to disable)
COMPRESSION=gzip

# Database connection (uses docker-compose defaults if not set)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=msp_db
POSTGRES_USER=msp_user
POSTGRES_PASSWORD=msp_password
```

## Automated Backups

### Option 1: Cron Job (Recommended)

Add to crontab for daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed)
0 2 * * * cd /home/kleber/peres_systems && ./scripts/backup-database.sh >> /home/kleber/peres_systems/backups/cron.log 2>&1
```

### Option 2: Systemd Timer

Create `/etc/systemd/system/msp-backup.service`:

```ini
[Unit]
Description=MSP Database Backup
After=docker.service

[Service]
Type=oneshot
User=kleber
WorkingDirectory=/home/kleber/peres_systems
ExecStart=/home/kleber/peres_systems/scripts/backup-database.sh
Environment="BACKUP_DIR=/home/kleber/peres_systems/backups"
Environment="RETENTION_DAYS=30"
```

Create `/etc/systemd/system/msp-backup.timer`:

```ini
[Unit]
Description=Run MSP Database Backup Daily
Requires=msp-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl enable msp-backup.timer
sudo systemctl start msp-backup.timer
```

## Backup File Structure

```
backups/
├── backup.log                    # Backup operation log
├── msp_db_backup_20241114_120000.sql.gz
├── msp_db_backup_20241115_120000.sql.gz
└── msp_db_backup_20241116_120000.sql.gz
```

## Restore Procedure

### Step 1: List Available Backups

```bash
ls -lh backups/msp_db_backup_*.sql*
```

### Step 2: Stop Application (Optional but Recommended)

```bash
docker-compose stop backend
```

### Step 3: Restore Database

```bash
./scripts/restore-database.sh backups/msp_db_backup_20241114_120000.sql.gz
```

The script will:
1. Ask for confirmation
2. Decompress if needed
3. Restore database
4. Clean up temporary files

### Step 4: Restart Application

```bash
docker-compose start backend
```

## Backup Verification

### Check Backup Logs

```bash
tail -f backups/backup.log
```

### Verify Backup File

```bash
# Check backup file size
ls -lh backups/msp_db_backup_*.sql.gz

# Test decompression
gunzip -t backups/msp_db_backup_20241114_120000.sql.gz
```

### Test Restore (Dry Run)

```bash
# Create test database
docker-compose exec postgres psql -U msp_user -c "CREATE DATABASE msp_db_test;"

# Restore to test database
gunzip -c backups/msp_db_backup_20241114_120000.sql.gz | \
  docker-compose exec -T postgres psql -U msp_user -d msp_db_test

# Verify data
docker-compose exec postgres psql -U msp_user -d msp_db_test -c "SELECT COUNT(*) FROM users;"
```

## Retention Policy

- Default retention: **30 days**
- Old backups are automatically deleted
- Configure via `RETENTION_DAYS` environment variable

## Backup Storage

### Local Storage (Current)

Backups are stored in `./backups/` directory.

### Remote Storage (Recommended for Production)

For production, consider:

1. **S3/Cloud Storage**
   ```bash
   # After backup, upload to S3
   aws s3 cp backups/msp_db_backup_*.sql.gz s3://your-bucket/backups/
   ```

2. **SFTP/Remote Server**
   ```bash
   # Upload to remote server
   scp backups/msp_db_backup_*.sql.gz user@remote-server:/backups/
   ```

3. **Update backup script** to include upload step

## Monitoring

### Check Backup Status

```bash
# View recent backups
ls -lht backups/ | head -10

# Check backup log
tail -20 backups/backup.log

# Verify last backup time
stat backups/msp_db_backup_*.sql.gz | grep Modify | tail -1
```

### Alert on Backup Failure

Add to backup script or cron job:

```bash
# Email notification on failure
if [ $? -ne 0 ]; then
    echo "Backup failed!" | mail -s "MSP Backup Alert" admin@peres.systems
fi
```

## Troubleshooting

### Backup Fails: Container Not Found

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Start if needed
docker-compose up -d postgres
```

### Backup Fails: Permission Denied

```bash
# Make script executable
chmod +x scripts/backup-database.sh

# Check backup directory permissions
chmod 755 backups/
```

### Restore Fails: Database Connection Error

```bash
# Verify database is running
docker-compose ps postgres

# Check database credentials in .env
grep POSTGRES .env
```

### Backup File is Empty

```bash
# Check backup log for errors
tail -50 backups/backup.log

# Verify database has data
docker-compose exec postgres psql -U msp_user -d msp_db -c "SELECT COUNT(*) FROM users;"
```

## Best Practices

1. ✅ **Test restores regularly** - Verify backups are working
2. ✅ **Store backups off-site** - Protect against server failure
3. ✅ **Monitor backup logs** - Catch failures early
4. ✅ **Document restore procedures** - Know how to recover
5. ✅ **Keep multiple backup copies** - Redundancy is key
6. ✅ **Encrypt sensitive backups** - Protect data at rest

## Backup Schedule Recommendations

- **Production**: Daily backups, 30-day retention
- **Staging**: Weekly backups, 7-day retention
- **Development**: Manual backups as needed

---

**Last Updated**: November 2024


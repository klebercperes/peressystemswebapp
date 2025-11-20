# Backup Before Implementing Features

## Why Backup?

Before implementing new features or making major changes, it's essential to create a full backup of your project. This ensures you can:
- **Roll back** if something goes wrong
- **Restore** to a known good state
- **Compare** changes after implementation
- **Recover** from accidental data loss

## Quick Backup Command

Run this command to create a full backup:

```bash
cd /home/kleber/peres_systems
./scripts/full-project-backup.sh
```

This will create a backup in `/home/kleber/peres_systems/backups/full_backup_YYYYMMDD_HHMMSS/`

## What Gets Backed Up?

The backup script creates a comprehensive snapshot including:

1. **Database** - Full PostgreSQL dump (compressed)
2. **Environment Files** - `.env` and docker-compose files
3. **SSL Certificates** - All SSL/TLS certificates
4. **Frontend Repository** - Complete Git bundle or archive
5. **Backend Code** - All backend Python code
6. **Documentation** - All docs and scripts

## Backup Location

All backups are stored in:
```
/home/kleber/peres_systems/backups/
```

Each backup is in its own timestamped directory:
```
backups/
  ├── full_backup_20251116_120000/
  ├── full_backup_20251116_150000/
  └── ...
```

## When to Backup

**Always backup before:**
- ✅ Implementing new major features
- ✅ Updating dependencies
- ✅ Making database schema changes
- ✅ Deploying to production
- ✅ Testing experimental features
- ✅ Merging large changes

## Backup Workflow

### Before Starting New Features:

1. **Create Full Backup:**
   ```bash
   cd /home/kleber/peres_systems
   ./scripts/full-project-backup.sh
   ```

2. **Verify Backup:**
   ```bash
   ls -lh backups/ | tail -5
   ```

3. **Note the Backup Name:**
   - The script will output the backup location
   - Keep this name for reference

4. **Start Implementing Features:**
   - Now you can safely make changes
   - If something breaks, you can restore

### After Implementing Features:

1. **Test Everything:**
   - Test all new features
   - Verify existing features still work

2. **If Everything Works:**
   - Keep the backup for a few days
   - Then you can delete old backups if needed

3. **If Something Breaks:**
   - See "Restoring from Backup" below

## Restoring from Backup

### Restore Database:

```bash
# Find your backup
cd /home/kleber/peres_systems/backups/full_backup_YYYYMMDD_HHMMSS

# Restore database
gunzip < database.sql.gz | docker exec -i msp_postgres psql -U msp_user msp_db
```

### Restore Configuration:

```bash
# Copy environment files back
cp config/.env /home/kleber/peres_systems/.env
cp config/docker-compose*.yml /home/kleber/peres_systems/
```

### Restore SSL Certificates:

```bash
# Copy SSL certificates back
cp -r ssl /home/kleber/peres_systems/ssl
```

### Restore Frontend:

```bash
# If using Git bundle
cd /tmp
git clone frontend_repo.bundle PeresSystemWebAppNew2-restored

# Or if using tar.gz
tar -xzf frontend_repo.tar.gz
```

### Restore Backend:

```bash
# Extract backend code
cd /home/kleber/peres_systems
tar -xzf backups/full_backup_YYYYMMDD_HHMMSS/backend.tar.gz
```

## Automatic Backups

The database is automatically backed up daily via cron job (see `scripts/backup-database.sh`).

For full project backups, run manually before major changes.

## Backup Best Practices

1. **Regular Backups** - Create backups before major changes
2. **Test Restores** - Periodically test that you can restore from backups
3. **Keep Multiple Backups** - Don't delete backups immediately
4. **Off-Site Storage** - Consider copying important backups elsewhere
5. **Document Changes** - Note what you're changing in the backup manifest

## Backup Size

Typical backup sizes:
- **Database**: 1-10 MB (compressed)
- **Frontend**: 5-20 MB
- **Backend**: 2-5 MB
- **Total**: ~10-50 MB per backup

## Cleanup Old Backups

To free up space, you can remove old backups:

```bash
# List backups
ls -lh backups/

# Remove old backups (keep last 5)
cd backups
ls -t | tail -n +6 | xargs rm -rf
```

## Quick Reference

```bash
# Create backup
./scripts/full-project-backup.sh

# List backups
ls -lh backups/

# View backup manifest
cat backups/full_backup_YYYYMMDD_HHMMSS/BACKUP_MANIFEST.txt

# Restore database
gunzip < backups/full_backup_YYYYMMDD_HHMMSS/database.sql.gz | \
  docker exec -i msp_postgres psql -U msp_user msp_db
```

---

**Remember:** A good backup is your safety net. Always backup before major changes!


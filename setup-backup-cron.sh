#!/bin/bash
# Setup automated backup cron job

CRON_JOB="0 2 * * * cd /home/kleber/peres_systems && ./scripts/backup-database.sh >> /home/kleber/peres_systems/backups/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    echo "⚠️  Backup cron job already exists"
    echo "Current cron jobs:"
    crontab -l | grep backup
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Backup cron job added"
    echo "   Runs daily at 2:00 AM"
    echo ""
    echo "Current cron jobs:"
    crontab -l
fi

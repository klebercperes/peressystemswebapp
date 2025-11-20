# Timezone Setup for Brisbane, Australia

## Current Configuration

The backup scripts are configured to use **Australia/Brisbane** timezone for all timestamps.

## System Timezone (Optional)

To set the system timezone to Brisbane (requires sudo):

```bash
sudo timedatectl set-timezone Australia/Brisbane
```

Verify:
```bash
timedatectl status
date
```

## Backup Scripts

Both backup scripts now use Brisbane timezone:
- `scripts/full-project-backup.sh` - Uses `TZ="Australia/Brisbane"`
- `scripts/backup-database.sh` - Uses `TZ="Australia/Brisbane"`

This means all backup filenames will use Brisbane local time, regardless of system timezone.

## Timezone Information

**Brisbane, Australia:**
- **AEST** (Australian Eastern Standard Time): UTC+10 (winter)
- **AEDT** (Australian Eastern Daylight Time): UTC+11 (summer)
- Brisbane does NOT observe daylight saving time (stays on AEST year-round)

## Testing

Test the timezone in backup scripts:
```bash
TZ="Australia/Brisbane" date
TZ="Australia/Brisbane" date +"%Y%m%d_%H%M%S"
```

## Notes

- Backup timestamps will show Brisbane local time
- System timezone can remain UTC (common for servers)
- Only backup script timestamps are affected by this change


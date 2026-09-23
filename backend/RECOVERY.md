# PABMS Database Backup & Recovery

This document describes how hospital data in PABMS is backed up and how to restore it in case of data loss or corruption.

## 1. Backup

### What runs automatically
A daily automatic backup is scheduled via **Windows Task Scheduler** (task name: `PABMS Daily Backup`).

- **Script:** `backend/scripts/backup_db.py`
- **Trigger:** `backend/scripts/run_backup.bat`
- **Output location:** `backend/backups/pabms_backup_<YYYY-MM-DD_HHMMSS>.sql`
- **Retention:** backups older than 30 days are automatically deleted by the script (`RETENTION_DAYS = 30`).
- **Log file:** `backend/backups/backup_log.txt` (output of each run, for troubleshooting).

### Running a backup manually
From the `backend` folder, with the virtual environment activated:

python scripts/backup_db.py


This creates a new `.sql` dump file in `backend/backups/`.

### Checking the scheduled task
Open **Task Scheduler** → Task Scheduler Library → `PABMS Daily Backup`:
- Confirm the task is **Enabled**.
- Right-click → **Run** to trigger a backup immediately (used for testing).
- History/Last Run Result tab shows success/failure of past runs.

## 2. Recovery (Restore)

Use this procedure only when the live `pabms` database has been lost, corrupted, or needs to be rolled back.

### Step 1 — Identify the backup to restore
Go to `backend/backups/` and pick the most recent (or relevant) `pabms_backup_<timestamp>.sql` file.

### Step 2 — Restore into a NEW/empty database first (recommended safety check)
Never restore directly on top of the live database without first verifying the backup file works. Create a throwaway database and test-restore into it:

createdb -U postgres pabms_test_restore
psql -U postgres -d pabms_test_restore -f backend/backups/pabms_backup_<timestamp>.sql


Verify data landed correctly, e.g.:

psql -U postgres -d pabms_test_restore -c "SELECT COUNT(*) FROM patients;"

Once satisfied, this test database can be dropped:

dropdb -U postgres pabms_test_restore


### Step 3 — Restore into the real database (actual recovery)
Only do this when the live database genuinely needs to be replaced (e.g. after real data loss).

1. Stop the backend server so nothing is writing to the database.
2. Restore the backup into the live database:

psql -U postgres -d pabms -f backend/backups/pabms_backup_<timestamp>.sql


3. Restart the backend server and verify the application loads data correctly.

> **Note:** the `-U postgres` account is the PostgreSQL superuser (its password is set separately from the app's `devuser` password in `.env`). Use whichever admin-level account has permission to create/restore databases on this machine.

## 3. Notes
- Backup files contain real patient data and are **excluded from git** (`backups/` is in `.gitignore`) — they must never be committed or shared outside the team.
- This is a local, script + Task Scheduler based backup process (no cloud storage), matching current hosting (PostgreSQL running locally).
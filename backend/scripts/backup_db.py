import os
import sys
import subprocess
from datetime import datetime, timedelta
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables from .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')
RETENTION_DAYS = 30  # Delete backups older than this many days

def parse_database_url(url):
    parsed = urlparse(url)
    return {
        'user': parsed.username,
        'password': parsed.password,
        'host': parsed.hostname or 'localhost',
        'port': str(parsed.port or 5432),
        'dbname': parsed.path.lstrip('/'),
    }

def run_backup():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in .env file.")
        sys.exit(1)

    db = parse_database_url(DATABASE_URL)
    os.makedirs(BACKUP_DIR, exist_ok=True)

    timestamp = datetime.now().strftime('%Y-%m-%d_%H%M%S')
    backup_filename = f"pabms_backup_{timestamp}.sql"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    env = os.environ.copy()
    env['PGPASSWORD'] = db['password']

    command = [
        'pg_dump',
        '-h', db['host'],
        '-p', db['port'],
        '-U', db['user'],
        '-F', 'p',  # plain SQL format
        '-f', backup_path,
        db['dbname'],
    ]

    print(f"Starting backup: {backup_filename}")
    result = subprocess.run(command, env=env, capture_output=True, text=True)

    if result.returncode != 0:
        print("BACKUP FAILED:")
        print(result.stderr)
        sys.exit(1)

    size_kb = os.path.getsize(backup_path) / 1024
    print(f"Backup successful: {backup_path} ({size_kb:.1f} KB)")

    cleanup_old_backups()

def cleanup_old_backups():
    cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)
    removed = 0
    for filename in os.listdir(BACKUP_DIR):
        if filename.startswith('pabms_backup_') and filename.endswith('.sql'):
            filepath = os.path.join(BACKUP_DIR, filename)
            file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
            if file_time < cutoff:
                os.remove(filepath)
                removed += 1
    if removed:
        print(f"Cleaned up {removed} backup(s) older than {RETENTION_DAYS} days.")

if __name__ == '__main__':
    run_backup()
@echo off
cd /d "C:\Users\HP\OneDrive\Desktop\PABMS\backend"
".venv\Scripts\python.exe" -u "scripts\backup_db.py" >> "backups\backup_log.txt" 2>&1
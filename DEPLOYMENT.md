# Deployment Guide

This document describes how PABMS is deployed and how to redeploy if needed.

## Live URLs

- **Frontend (Vercel):** https://patient-admission-bed-management-sy.vercel.app
- **Backend (Render):** https://patient-admission-bed-management-system.onrender.com
- **API Docs:** https://patient-admission-bed-management-system.onrender.com/docs

## Architecture

| Component | Service | Plan |
|-----------|---------|------|
| Frontend  | Vercel  | Free (Hobby) |
| Backend   | Render  | Free |
| Database  | Neon (PostgreSQL) | Free |

## Environment Variables

### Backend (Render)
Set under Render -> Environment:
- DATABASE_URL - Neon connection string
- SECRET_KEY - JWT signing secret
- ALGORITHM - e.g. HS256
- ACCESS_TOKEN_EXPIRE_MINUTES
- PROJECT_NAME
- API_V1_STR
- PYTHON_VERSION - pinned to match local dev (3.12.4), avoids build issues with newer Python versions

### Frontend (Vercel)
Set under Vercel -> Settings -> Environment Variables:
- VITE_API_URL - the Render backend URL above

## Redeployment

- Backend: Push to main -> Render auto-deploys. If not, use "Manual Deploy" -> "Deploy latest commit" on the Render dashboard.
- Frontend: Push to main -> Vercel auto-deploys.

## Notes

- backend/requirements.txt must list every package actually imported by the app (not just what is in .venv locally) - missing entries cause ModuleNotFoundError on deploy.
- frontend/vercel.json configures SPA routing on Vercel - without it, refreshing any page other than the homepage returns a 404.
- Initial admin/test accounts are created by running backend/app/db_init.py once against the target database (see script for default credentials).

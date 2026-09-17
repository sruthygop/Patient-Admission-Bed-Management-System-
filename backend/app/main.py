from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1 import auth, patients, beds, admissions, dashboard, audit_logs, doctor_assignments, staff_assignments, analytics, prescriptions, hospitals

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for Patient Admission & Bed Management System",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Request Body Size Limit Middleware ---
MAX_BODY_SIZE = 2 * 1024 * 1024  # 2 MB

class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": f"Request body too large. Max allowed size is {MAX_BODY_SIZE // (1024*1024)}MB."}
            )
        return await call_next(request)

app.add_middleware(BodySizeLimitMiddleware)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(hospitals.router, prefix=f"{settings.API_V1_STR}/hospitals", tags=["Hospitals"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(beds.router, prefix=f"{settings.API_V1_STR}/beds", tags=["Beds"])
app.include_router(admissions.router, prefix=f"{settings.API_V1_STR}/admissions", tags=["Admissions"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(audit_logs.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["Audit Logs"])
app.include_router(doctor_assignments.router, prefix=f"{settings.API_V1_STR}/doctor-assignments", tags=["Doctor Assignments"])
app.include_router(staff_assignments.router, prefix=f"{settings.API_V1_STR}/staff-assignments", tags=["Staff Assignments"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(prescriptions.router, prefix=f"{settings.API_V1_STR}/prescriptions", tags=["Prescriptions"])

@app.get("/", tags=["Status"])
def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Status"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }
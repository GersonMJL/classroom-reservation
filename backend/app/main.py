from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db import models  # noqa: F401
from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.environments.router import router as environments_router
from app.modules.governance.router import router as governance_router
from app.modules.locations.router import router as locations_router
from app.modules.operations.router import router as operations_router
from app.modules.organizational_units.router import router as organizational_units_router
from app.modules.qualifications.router import router as qualifications_router
from app.modules.reservations.router import router as reservations_router
from app.modules.resources.router import router as resources_router
from app.modules.users.router import router as users_router

settings = get_settings()

app = FastAPI(title=settings.project_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(environments_router)
app.include_router(locations_router)
app.include_router(resources_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(organizational_units_router)
app.include_router(reservations_router)
app.include_router(qualifications_router)
app.include_router(operations_router)
app.include_router(governance_router)
app.include_router(audit_router)

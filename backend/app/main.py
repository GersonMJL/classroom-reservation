from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.modules.auth.router import router as auth_router
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


app.include_router(
    resources_router, prefix=f"{settings.api_v1_str}/resources", tags=["resources"]
)
app.include_router(users_router, prefix=f"{settings.api_v1_str}/users", tags=["users"])
app.include_router(auth_router, prefix=f"{settings.api_v1_str}/auth", tags=["auth"])

from fastapi import APIRouter
from app.api.endpoints import videos, properties, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])

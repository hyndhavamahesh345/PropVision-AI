"""
PropInspect AI — Application Configuration
All settings are loaded from environment variables with sensible defaults.
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BeforeValidator
from typing_extensions import Annotated


def validate_cors_origins(v: str | List[str]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )

    # ── API ──────────────────────────────────────────────────────────────────
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PropInspect AI Engine"
    VERSION: str = "1.0.0"

    # ── CORS ─────────────────────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(validate_cors_origins)
    ] = ["http://localhost:3000", "http://localhost:3001"]

    # ── Database & Cache ──────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/propinspect"
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = "SUPER_SECRET_KEY_KEEP_IT_SAFE_CHANGE_IN_PRODUCTION_1234567890abcdef"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Clerk Auth (optional — use JWT fallback if not set) ───────────────────
    CLERK_SECRET_KEY: Optional[str] = None
    CLERK_PUBLISHABLE_KEY: Optional[str] = None

    # ── Cloud Storage (S3 / Cloudflare R2) ───────────────────────────────────
    USE_LOCAL_STORAGE: bool = True  # Set False for S3/R2 in production
    S3_ENDPOINT_URL: Optional[str] = None  # For R2: https://<account>.r2.cloudflarestorage.com
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "propinspect-videos"
    S3_REGION_NAME: Optional[str] = "us-east-1"

    # ── YOLO Detection ────────────────────────────────────────────────────────
    YOLO_MODEL_PATH: str = "yolo11x.pt"  # or yolov8x.pt as fallback
    YOLO_CONFIDENCE_THRESHOLD: float = 0.35
    YOLO_IOU_THRESHOLD: float = 0.45
    YOLO_DEVICE: str = "auto"  # auto | cuda | cpu | mps

    # ── Grounding DINO (zero-shot, optional) ──────────────────────────────────
    GROUNDING_DINO_MODEL_PATH: Optional[str] = None
    GROUNDING_DINO_CONFIG_PATH: Optional[str] = None

    # ── SAM2 Segmentation (optional) ─────────────────────────────────────────
    SAM2_MODEL_PATH: Optional[str] = None  # e.g. sam2_hiera_large.pt

    # ── Qwen2.5-VL Reasoning ─────────────────────────────────────────────────
    QWEN_MODEL_PATH: str = "Qwen/Qwen2.5-VL-7B-Instruct"
    QWEN_API_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    QWEN_API_KEY: Optional[str] = None
    USE_QWEN_API: bool = True  # True = use API, False = local model

    # ── OpenAI (fallback for reasoning) ──────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"

    # ── Processing Settings ───────────────────────────────────────────────────
    FRAME_INTERVAL_SECONDS: float = 2.0  # Extract 1 frame every N seconds
    MAX_FRAMES_PER_VIDEO: int = 150
    BATCH_SIZE: int = 8  # YOLO inference batch size

    # ── Storage Directories ───────────────────────────────────────────────────
    UPLOAD_DIR: str = "temp_uploads"
    FRAMES_DIR: str = "temp_frames"
    REPORTS_DIR: str = "temp_reports"
    EVIDENCE_DIR: str = "temp_evidence"

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # ── Admin Seed ────────────────────────────────────────────────────────────
    FIRST_SUPERUSER_EMAIL: str = "admin@propinspect.com"
    FIRST_SUPERUSER_PASSWORD: str = "AdminPassword123!"


settings = Settings()

# Ensure all local directories exist on startup
for _dir in [
    settings.UPLOAD_DIR,
    settings.FRAMES_DIR,
    settings.REPORTS_DIR,
    settings.EVIDENCE_DIR,
]:
    os.makedirs(_dir, exist_ok=True)

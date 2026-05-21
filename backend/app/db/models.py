"""
PropInspect AI — SQLAlchemy ORM models.
All primary keys are string UUIDs for portability.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# Core user / property hierarchy
# ─────────────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    properties = relationship(
        "Property", back_populates="owner", cascade="all, delete-orphan"
    )


class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    property_type = Column(
        String, default="apartment"
    )  # apartment | house | office | commercial
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="properties")
    videos = relationship(
        "Video", back_populates="property", cascade="all, delete-orphan"
    )
    comparisons = relationship(
        "ComparisonLog", back_populates="property", cascade="all, delete-orphan"
    )
    analytics = relationship(
        "PropertyAnalytics",
        back_populates="property",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(
        String,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String, nullable=False)
    s3_key = Column(String, nullable=True)
    s3_url = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    status = Column(
        String, default="uploaded"
    )  # uploaded | processing | completed | failed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="videos")
    jobs = relationship(
        "InspectionJob", back_populates="video", cascade="all, delete-orphan"
    )


class InspectionJob(Base):
    __tablename__ = "inspection_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(
        String,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        String, default="pending"
    )  # pending | processing_frames | running_yolo | running_sam2 | running_qwen | aggregating | generating_report | completed | failed
    progress = Column(Integer, default=0)   # 0–100
    celery_task_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    video = relationship("Video", back_populates="jobs")
    inventory_items = relationship(
        "InventoryItem", back_populates="job", cascade="all, delete-orphan"
    )
    reports = relationship(
        "InspectionReport", back_populates="job", cascade="all, delete-orphan"
    )
    tracked_objects = relationship(
        "TrackedObject", back_populates="job", cascade="all, delete-orphan"
    )
    frame_analyses = relationship(
        "FrameAnalysis", back_populates="job", cascade="all, delete-orphan"
    )
    damage_detections = relationship(
        "DamageDetection", back_populates="job", cascade="all, delete-orphan"
    )


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    room = Column(String, nullable=False, default="unknown")
    object_class = Column(String, nullable=False)
    count = Column(Integer, default=1)
    confidence = Column(Float, default=1.0)
    track_ids = Column(JSON, nullable=True)  # List of ByteTrack IDs
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("InspectionJob", back_populates="inventory_items")


class InspectionReport(Base):
    __tablename__ = "inspection_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    json_report = Column(JSON, nullable=False)   # Full nested report
    pdf_url = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("InspectionJob", back_populates="reports")


class ComparisonLog(Base):
    __tablename__ = "comparison_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(
        String,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    before_job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    after_job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    comparison_type = Column(
        String, default="move_in_out"
    )  # move_in_out | routine_check
    diff_json = Column(JSON, nullable=False)  # {added: [], removed: [], damaged: []}
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="comparisons")
    before_job = relationship("InspectionJob", foreign_keys=[before_job_id])
    after_job = relationship("InspectionJob", foreign_keys=[after_job_id])


# ─────────────────────────────────────────────────────────────────────────────
# New models added for full pipeline support
# ─────────────────────────────────────────────────────────────────────────────

class TrackedObject(Base):
    """
    Stores the per-track ByteTrack result for an inspection job.
    Each row represents one unique object identity across frames.
    """
    __tablename__ = "tracked_objects"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    track_id = Column(Integer, nullable=False)         # ByteTrack's assigned ID
    object_class = Column(String, nullable=False)
    room = Column(String, nullable=True, default="unknown")
    confidence_avg = Column(Float, default=0.0)
    frames_seen = Column(Integer, default=1)
    first_frame = Column(Integer, default=0)
    last_frame = Column(Integer, default=0)
    bbox_history = Column(JSON, nullable=True)          # List of [x1, y1, x2, y2]
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("InspectionJob", back_populates="tracked_objects")


class FrameAnalysis(Base):
    """
    Per-frame detection results — used for timeline replay and analytics.
    """
    __tablename__ = "frame_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    frame_index = Column(Integer, nullable=False)
    frame_path = Column(String, nullable=True)          # Local or S3 path
    room_classification = Column(String, nullable=True)
    detections_count = Column(Integer, default=0)
    detections_json = Column(JSON, nullable=True)       # Raw YOLO + track output
    processing_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("InspectionJob", back_populates="frame_analyses")


class DamageDetection(Base):
    """
    Individual damage instance found during inspection.
    """
    __tablename__ = "damage_detections"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(
        String,
        ForeignKey("inspection_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    damage_type = Column(
        String, nullable=False
    )  # crack | stain | broken | missing_fixture | floor_damage | water_damage | mold | peeling
    severity = Column(
        String, default="low"
    )  # low | medium | high | critical
    confidence = Column(Float, default=0.5)
    room = Column(String, nullable=True)
    location_description = Column(Text, nullable=True)
    bounding_box = Column(JSON, nullable=True)          # [x1, y1, x2, y2]
    evidence_image_url = Column(String, nullable=True)  # Cropped evidence image
    frame_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("InspectionJob", back_populates="damage_detections")


class PropertyAnalytics(Base):
    """
    Aggregated analytics snapshot for a property — updated after each inspection.
    """
    __tablename__ = "property_analytics"

    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(
        String,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    total_inspections = Column(Integer, default=0)
    total_items_detected = Column(Integer, default=0)
    total_damages = Column(Integer, default=0)
    last_inspection_at = Column(DateTime, nullable=True)
    room_distribution = Column(JSON, nullable=True)    # {room: count}
    object_frequency = Column(JSON, nullable=True)     # {object_class: count}
    damage_trend = Column(JSON, nullable=True)         # [{date, count}]
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="analytics")

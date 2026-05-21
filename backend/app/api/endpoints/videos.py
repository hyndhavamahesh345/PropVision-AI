from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Any
import shutil
import os
from pathlib import Path

from app.db.session import get_db
from app.db.models import Video, InspectionJob, Property
from app.schemas.video import VideoResponse
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    property_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload a video for a property and start the inspection pipeline.
    """
    # Check if property exists
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Validate file type
    if not file.filename.lower().endswith(('.mp4', '.mov', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    # Create Video record
    video = Video(property_id=property_id, filename=file.filename, status="uploaded")
    db.add(video)
    db.commit()
    db.refresh(video)

    # Save file locally (In a real app, upload to S3 directly or via backend)
    file_path = Path(settings.UPLOAD_DIR) / f"{video.id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    video.s3_url = str(file_path) # Temp mock for local storage
    db.commit()

    # Create Inspection Job
    job = InspectionJob(video_id=video.id, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)

    # Dispatch Celery task
    from app.services.pipeline import run_inspection_pipeline
    run_inspection_pipeline.delay(job.id, str(file_path))

    return video

@router.get("/{video_id}", response_model=VideoResponse)
def get_video(video_id: str, db: Session = Depends(get_db)) -> Any:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

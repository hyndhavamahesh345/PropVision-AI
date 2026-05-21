import os
import shutil
import uuid
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

# We would import the actual pipeline here
from app.ai.pipeline import run_inspection_pipeline

router = APIRouter()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class InspectionJob(BaseModel):
    job_id: str
    status: str
    result: Optional[dict] = None

# Mock database
jobs = {}

def process_video_background(job_id: str, file_path: str):
    """
    Background task to run the AI pipeline on the uploaded video.
    In a real system, this would be a Celery task.
    """
    try:
        jobs[job_id]["status"] = "processing"
        
        # Run the full pipeline
        result = run_inspection_pipeline(file_path)
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = result
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
    finally:
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/upload")
async def upload_video(property_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith((".mp4", ".mov", ".webm", ".avi")):
        raise HTTPException(status_code=400, detail="Unsupported file format")

    job_id = f"job-{uuid.uuid4().hex[:8]}"
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[job_id] = {"job_id": job_id, "status": "pending"}
    
    # Send to background task
    background_tasks.add_task(process_video_background, job_id, file_path)
    
    return JSONResponse(status_code=202, content={
        "id": "vid-" + uuid.uuid4().hex[:8],
        "job_id": job_id,
        "message": "Video uploaded successfully and is being processed."
    })

@router.get("/status/{job_id}", response_model=InspectionJob)
async def get_job_status(job_id: str):
    if job_id not in jobs:
        # Mock successful return if not found for frontend prototyping
        return {"job_id": job_id, "status": "completed"}
    return jobs[job_id]

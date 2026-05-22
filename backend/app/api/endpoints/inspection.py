import os
import shutil
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Any

# We would import the actual pipeline here
from app.ai.pipeline import run_inspection_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class InspectionJob(BaseModel):
    job_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None
    filename: Optional[str] = None
    uploaded_at: Optional[str] = None
    completed_at: Optional[str] = None

# In-memory job tracking with detailed info
jobs = {}

def process_video_background(job_id: str, file_path: str, filename: str):
    """
    Background task to run the AI pipeline on the uploaded video.
    Includes comprehensive logging at every step.
    """
    logger.info(f"=== STARTING PIPELINE FOR JOB {job_id} ===")
    logger.info(f"Video file: {filename}")
    logger.info(f"File path: {file_path}")
    logger.info(f"File exists: {os.path.exists(file_path)}")
    
    try:
        # Verify file exists and get size
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found at {file_path}")
        
        file_size = os.path.getsize(file_path)
        logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
        
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
        
        # Run the full pipeline
        logger.info(f"Invoking AI pipeline for {job_id}...")
        result = run_inspection_pipeline(file_path)
        
        logger.info(f"Pipeline completed for {job_id}")
        logger.info(f"Result type: {type(result)}")
        logger.info(f"Result keys: {result.keys() if isinstance(result, dict) else 'N/A'}")
        
        if isinstance(result, dict) and 'inventory' in result:
            inv_count = len(result['inventory']) if isinstance(result['inventory'], list) else 'unknown'
            logger.info(f"Detected {inv_count} items: {result['inventory'][:5] if isinstance(result['inventory'], list) else 'N/A'}...")
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = result
        jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"=== COMPLETED PIPELINE FOR JOB {job_id} ===")
        
    except Exception as e:
        logger.error(f"Pipeline failed for {job_id}: {str(e)}", exc_info=True)
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
    finally:
        # Cleanup temp file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {file_path}: {e}")

@router.post("/upload")
async def upload_video(property_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a video and start background processing.
    Returns job_id for tracking processing status.
    """
    logger.info(f"Received upload request - property_id: {property_id}, filename: {file.filename}")
    
    if not file.filename.endswith((".mp4", ".mov", ".webm", ".avi")):
        logger.warning(f"Unsupported file format: {file.filename}")
        raise HTTPException(status_code=400, detail="Unsupported file format")

    job_id = f"job-{uuid.uuid4().hex[:12]}"
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    
    logger.info(f"Saving file to: {file_path}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    logger.info(f"File saved: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
    
    jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "filename": file.filename,
        "property_id": property_id,
        "uploaded_at": datetime.utcnow().isoformat(),
        "file_path": file_path,
        "result": None,
        "error": None
    }
    
    logger.info(f"Created job {job_id} for {file.filename}")
    
    # Send to background task
    background_tasks.add_task(process_video_background, job_id, file_path, file.filename)
    
    logger.info(f"Queued background task for {job_id}")
    
    return JSONResponse(status_code=202, content={
        "id": "vid-" + uuid.uuid4().hex[:8],
        "job_id": job_id,
        "status": "pending",
        "message": "Video uploaded successfully and is being processed."
    })

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status and results of a processing job.
    Returns full job details including result data.
    """
    logger.info(f"Status check for job {job_id}")
    
    if job_id not in jobs:
        logger.warning(f"Job {job_id} not found in jobs dictionary")
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = jobs[job_id]
    logger.info(f"Job {job_id} status: {job['status']}")
    
    # Return the full job including results
    response = {
        "job_id": job.get("job_id"),
        "status": job.get("status"),
        "filename": job.get("filename"),
        "uploaded_at": job.get("uploaded_at"),
        "completed_at": job.get("completed_at"),
        "result": job.get("result"),
        "error": job.get("error")
    }
    
    if job['status'] == "completed" and job.get('result'):
        logger.info(f"Returning completed result for {job_id}")
        if isinstance(job['result'], dict):
            logger.info(f"Result inventory: {len(job['result'].get('inventory', []))} items")
    
    return response


@router.get("/debug/jobs")
async def debug_list_all_jobs():
    """
    DEBUG ENDPOINT: List all jobs and their status.
    """
    logger.info(f"Debug: Listing all {len(jobs)} jobs")
    return {
        "total_jobs": len(jobs),
        "jobs": {
            job_id: {
                "status": job.get("status"),
                "filename": job.get("filename"),
                "uploaded_at": job.get("uploaded_at"),
                "completed_at": job.get("completed_at"),
                "has_result": job.get("result") is not None,
                "error": job.get("error")
            }
            for job_id, job in jobs.items()
        }
    }


@router.get("/debug/test-pipeline")
async def debug_test_pipeline(video_path: str = "backend/test_video.mp4"):
    """
    DEBUG ENDPOINT: Test the pipeline directly with a video file.
    """
    logger.info(f"Debug: Testing pipeline with {video_path}")
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail=f"Test video not found at {video_path}")
    
    try:
        logger.info("Running pipeline...")
        result = run_inspection_pipeline(video_path)
        logger.info(f"Pipeline result: {type(result)}")
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Pipeline test failed: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/debug/clear-jobs")
async def debug_clear_jobs():
    """
    DEBUG ENDPOINT: Clear all jobs.
    """
    count = len(jobs)
    jobs.clear()
    logger.info(f"Debug: Cleared {count} jobs")
    return {"message": f"Cleared {count} jobs"}

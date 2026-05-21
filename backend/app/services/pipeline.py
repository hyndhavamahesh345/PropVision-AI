import os
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "propinspect",
    broker=settings.DATABASE_URL.replace("postgresql://", "sqla+postgresql://") if not settings.REDIS_URL else settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task(name="run_inspection_pipeline")
def run_inspection_pipeline(job_id: str, video_path: str):
    """
    Background task to process the video.
    1. Extract frames (FFmpeg)
    2. Run YOLO + ByteTrack
    3. Run Qwen for scene understanding
    4. Aggregate and save report
    """
    from app.db.session import SessionLocal
    from app.db.models import InspectionJob, InspectionReport
    from app.ai.pipeline import PropertyInspectionPipeline
    from datetime import datetime
    
    db = SessionLocal()
    try:
        job = db.query(InspectionJob).filter(InspectionJob.id == job_id).first()
        if not job:
            return "Job not found"
            
        job.status = "processing_frames"
        db.commit()

        # Initialize AI Pipeline
        pipeline = PropertyInspectionPipeline(video_path)
        
        # Step 1: Process Video (Extract, Detect, Track)
        job.status = "running_yolo"
        db.commit()
        tracker_results, frame_paths = pipeline.process_video()

        # Step 2: Scene Understanding (Qwen)
        job.status = "running_qwen"
        db.commit()
        scene_contexts = pipeline.analyze_scenes(frame_paths)

        # Step 3: Aggregate
        job.status = "aggregating"
        db.commit()
        inventory_report = pipeline.aggregate_inventory(tracker_results, scene_contexts)

        # Save Report
        report = InspectionReport(job_id=job.id, json_report=inventory_report)
        db.add(report)
        
        job.status = "completed"
        job.progress = 100
        job.completed_at = datetime.utcnow()
        db.commit()
        
        return "Success"

    except Exception as e:
        db.rollback()
        job = db.query(InspectionJob).filter(InspectionJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
        raise e
    finally:
        db.close()

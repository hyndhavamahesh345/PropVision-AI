import os
import cv2
import logging
from typing import Dict, Any, List
from pathlib import Path

from app.ai.models.yolo_detector import YOLODetector
from app.ai.models.tracker import ObjectTracker
from app.ai.models.florence_vision import FlorenceVisionModel
from app.ai.models.local_llm import LocalLLMService

logger = logging.getLogger(__name__)

class PropertyInspectionPipeline:
    def __init__(self, 
                 yolo_model_path: str = "yolo11x.pt", 
                 florence_model_id: str = "microsoft/Florence-2-base",
                 ollama_url: str = "http://localhost:11434"):
        """
        Initializes the entire AI inspection pipeline.
        NOTE: In a production Celery environment, models might be loaded lazily or globally.
        """
        logger.info("Initializing Property Inspection Pipeline...")
        self.detector = YOLODetector(model_path=yolo_model_path)
        self.tracker = ObjectTracker()
        self.florence = FlorenceVisionModel(model_id=florence_model_id)
        self.llm_service = LocalLLMService(ollama_url=ollama_url)
        
    def process_video(self, video_path: str, extract_every_n_seconds: int = 2) -> Dict[str, Any]:
        """
        Runs the end-to-end inspection pipeline on a local video file.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        logger.info(f"Starting video processing: {video_path}")
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 30 # fallback
            
        frame_interval = int(fps * extract_every_n_seconds)
        
        frames_to_process = []
        frame_indices = []
        
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % frame_interval == 0:
                # Resize for optimization if needed
                # frame = cv2.resize(frame, (1280, 720))
                frames_to_process.append(frame)
                frame_indices.append(frame_idx)
                
            frame_idx += 1
            
        cap.release()
        logger.info(f"Extracted {len(frames_to_process)} frames for processing.")
        
        # 1 & 2. YOLO Detection & Tracking
        room_descriptions = []
        
        for i, frame in enumerate(frames_to_process):
            # Batch size of 1 for simplicity, can be batched for speed
            detections_batch = self.detector.detect_batch([frame], start_frame_idx=frame_indices[i])
            detections = detections_batch[0]
            
            # Tracking
            tracked_detections = self.tracker.update(detections, frame_shape=frame.shape[:2])
            
            # 3. Florence-2 Scene Understanding
            # Process every 5th extracted frame (or just the first few) to save time
            if i % 5 == 0:
                # convert BGR to RGB for Florence
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                scene_desc = self.florence.analyze_frame(frame_rgb, task_prompt="<MORE_DETAILED_CAPTION>")
                room_descriptions.append(scene_desc)
                logger.info(f"Scene understood: {scene_desc[:100]}...")
                
        # Get final track summary
        track_summary = self.tracker.get_track_summary()
        
        # 4. LLM Summarization
        logger.info("Generating LLM summary from tracked objects and scene descriptions...")
        final_inventory = self.llm_service.generate_inventory_summary(
            tracked_objects_summary=track_summary,
            room_descriptions=room_descriptions
        )
        
        # Add raw tracking data for debugging/dashboard
        final_inventory["raw_tracking"] = track_summary
        
        logger.info("Pipeline completed successfully.")
        return final_inventory

# Helper function to run the pipeline inside a Celery task
def run_inspection_pipeline(video_path: str) -> Dict[str, Any]:
    pipeline = PropertyInspectionPipeline()
    return pipeline.process_video(video_path)

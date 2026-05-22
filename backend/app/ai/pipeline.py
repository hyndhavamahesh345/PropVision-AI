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
                 yolo_model_path: str = "yolo11n.pt", 
                 florence_model_id: str = "microsoft/Florence-2-base",
                 ollama_url: str = "http://localhost:11434",
                 fast_mode: bool = True):
        """
        Initializes the entire AI inspection pipeline.
        NOTE: In a production Celery environment, models might be loaded lazily or globally.
        """
        logger.info(f"Initializing Property Inspection Pipeline (fast_mode={fast_mode})...")
        self.detector = YOLODetector(model_path=yolo_model_path, confidence=0.20)
        self.tracker = ObjectTracker()
        self.fast_mode = fast_mode
        if not fast_mode:
            self.florence = FlorenceVisionModel(model_id=florence_model_id)
            self.llm_service = LocalLLMService(ollama_url=ollama_url)
        
    def process_video(self, video_path: str, extract_every_n_seconds: int = 1) -> Dict[str, Any]:
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
                # Resize for optimization
                frame = cv2.resize(frame, (640, 640))
                frames_to_process.append(frame)
                frame_indices.append(frame_idx)
                
            frame_idx += 1
            
        cap.release()
        logger.info(f"Extracted {len(frames_to_process)} frames for processing.")
        
        # 1 & 2. YOLO Detection in Batches for 10x Speedup
        logger.info("Running batched YOLO object detection...")
        all_detections = []
        batch_size = 16
        for b in range(0, len(frames_to_process), batch_size):
            batch_frames = frames_to_process[b:b+batch_size]
            batch_start_idx = frame_indices[b]
            detections_batch = self.detector.detect_batch(batch_frames, start_frame_idx=batch_start_idx)
            all_detections.extend(detections_batch)
            
        # 3. Object Tracking & Aggregation
        room_descriptions = []
        class_stats = {} # name -> {max_count, frames_seen, max_confidence}
        
        for i, frame in enumerate(frames_to_process):
            detections = all_detections[i]
            
            # Run tracker (still useful for continuous video stats/debugging)
            self.tracker.update(detections, frame_shape=frame.shape[:2])
            
            # Count occurrences in the current frame
            frame_counts = {}
            for det in detections:
                name = det.class_name
                # Skip unwanted classes directly
                if name in ["person", "human", "people", "user"]:
                    continue
                frame_counts[name] = frame_counts.get(name, 0) + 1
                
                # Update class stats
                if name not in class_stats:
                    class_stats[name] = {
                        "max_count": 0,
                        "frames_seen": 0,
                        "max_confidence": 0.0
                    }
                class_stats[name]["max_confidence"] = max(class_stats[name]["max_confidence"], det.confidence)
            
            # Increment frames seen for classes detected in this frame
            for name, count in frame_counts.items():
                class_stats[name]["max_count"] = max(class_stats[name]["max_count"], count)
                class_stats[name]["frames_seen"] += 1
            
            # 4. Florence-2 Scene Understanding (Only in slow mode)
            if not self.fast_mode and i % 5 == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                scene_desc = self.florence.analyze_frame(frame_rgb, task_prompt="<MORE_DETAILED_CAPTION>")
                room_descriptions.append(scene_desc)
                logger.info(f"Scene understood: {scene_desc[:100]}...")

        # Get final track summary
        track_summary = self.tracker.get_track_summary()
        
        if self.fast_mode:
            logger.info("Fast mode enabled: Assembling inventory directly from tracked & aggregated objects...")
            inventory_items = []
            
            for name, stats in class_stats.items():
                # Filter out spurious false positives:
                # - Must be seen in at least 2 frames OR have a confidence > 0.35
                if stats["frames_seen"] >= 2 or stats["max_confidence"] >= 0.35:
                    inventory_items.append({
                        "item": name,
                        "quantity": stats["max_count"],
                        "condition_notes": f"Detected via high-speed YOLO detection (Max confidence: {stats['max_confidence']:.2f})."
                    })
            
            final_inventory = {
                "total_items": sum(item["quantity"] for item in inventory_items),
                "inventory": inventory_items,
                "overall_scene_description": "Inspection processed in ultra-fast mode using optimized batched YOLO object detection."
            }
        else:
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
    fast_mode = os.environ.get("FAST_MODE", "true").lower() == "true"
    pipeline = PropertyInspectionPipeline(fast_mode=fast_mode)
    return pipeline.process_video(video_path)

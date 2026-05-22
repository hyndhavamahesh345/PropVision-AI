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
                 fast_mode: bool = False):
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
        logger.info(f"=== PIPELINE PROCESSING START ===")
        logger.info(f"Video: {video_path}")
        
        if not os.path.exists(video_path):
            logger.error(f"Video file not found: {video_path}")
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        file_size = os.path.getsize(video_path)
        logger.info(f"Video file size: {file_size / (1024*1024):.2f} MB")
        
        logger.info("Opening video with OpenCV...")
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            logger.error("Failed to open video file")
            raise RuntimeError("Failed to open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        if fps == 0:
            fps = 30  # fallback
        
        logger.info(f"Video properties - FPS: {fps}, Total frames: {total_frames}, Resolution: {width}x{height}")
        
        frame_interval = int(fps * extract_every_n_seconds)
        logger.info(f"Frame extraction interval: {frame_interval} (every {extract_every_n_seconds}s)")
            
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
        
        logger.info(f"Frame extraction complete: {len(frames_to_process)} frames extracted from {frame_idx} total")
        logger.info(f"Frame indices: {frame_indices[:10]}{'...' if len(frame_indices) > 10 else ''}")
        
        if len(frames_to_process) == 0:
            logger.error("No frames extracted from video!")
            raise RuntimeError("No frames extracted from video")
        
        # 1 & 2. YOLO Detection in Batches for 10x Speedup
        logger.info("Running batched YOLO object detection...")
        all_detections = []
        batch_size = 16
        
        for b in range(0, len(frames_to_process), batch_size):
            batch_frames = frames_to_process[b:b+batch_size]
            batch_start_idx = frame_indices[b]
            batch_num = b // batch_size + 1
            total_batches = (len(frames_to_process) + batch_size - 1) // batch_size
            
            logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch_frames)} frames)...")
            detections_batch = self.detector.detect_batch(batch_frames, start_frame_idx=batch_start_idx)
            all_detections.extend(detections_batch)
            
            # Log detection summary for this batch
            batch_det_count = sum(len(d) for d in detections_batch)
            logger.info(f"Batch {batch_num} detected {batch_det_count} total objects")
        
        logger.info(f"YOLO detection complete: {sum(len(d) for d in all_detections)} total detections across all frames")
        
        # 3. Object Tracking & Aggregation
        logger.info("Aggregating detections and tracking objects...")
        room_descriptions = []
        class_stats = {} # name -> {max_count, frames_seen, max_confidence}
        
        for i, frame in enumerate(frames_to_process):
            detections = all_detections[i]
            
            # Run tracker (still useful for continuous video stats/debugging)
            self.tracker.update(detections, frame_shape=frame.shape[:2])
            
            # Count occurrences in the current frame
            frame_counts = {}
            for det in detections:
                name = det.class_name.lower()
                
                # Skip unwanted classes
                if name in ["person", "human", "people", "user", "dog", "cat", "animal", 
                           "bicycle", "car", "bus", "train", "motorcycle", "backpack", 
                           "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", 
                           "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
                           "skateboard", "surfboard", "tennis racket", "bottle", "wine glass",
                           "cup", "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich",
                           "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
                           "hair drier", "toothbrush", "scissors", "teddy bear", "book", "mouse",
                           "keyboard", "remote", "laptop"]:
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
            
            # 4. Florence-2 Scene Understanding (Only in slow/hybrid mode)
            # Calculate dynamic sample interval to analyze at most 5 frames to keep CPU inference super fast (~3-4s total)
            florence_sample_interval = max(1, len(frames_to_process) // 5)
            if not self.fast_mode and i % florence_sample_interval == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                scene_desc = self.florence.analyze_frame(frame_rgb, task_prompt="<MORE_DETAILED_CAPTION>")
                if scene_desc:
                    room_descriptions.append(scene_desc)
                    logger.info(f"Scene understood (frame {i}): {scene_desc[:100]}...")

        # Get final track summary
        track_summary = self.tracker.get_track_summary()
        logger.info(f"Tracking complete: {len(track_summary)} unique objects tracked")
        
        logger.info(f"Class statistics collected for {len(class_stats)} unique classes")
        
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
            
            logger.info(f"Fast mode inventory: {len(inventory_items)} items")
            
            final_inventory = {
                "total_items": sum(item["quantity"] for item in inventory_items),
                "inventory": inventory_items,
                "overall_scene_description": "Inspection processed in ultra-fast mode using optimized batched YOLO object detection."
            }
        else:
            # 4. LLM / Heuristic Summarization
            logger.info("Generating summary from tracked objects and scene descriptions...")
            logger.info(f"Input - Room descriptions: {len(room_descriptions)}, Tracked objects: {len(track_summary)}")
            final_inventory = self.llm_service.generate_inventory_summary(
                tracked_objects_summary=track_summary,
                room_descriptions=room_descriptions
            )
            logger.info(f"LLM summary complete: {len(final_inventory.get('inventory', []))} items")
        
        # Add raw tracking data for debugging/dashboard
        final_inventory["raw_tracking"] = track_summary
        
        logger.info("=== PIPELINE PROCESSING COMPLETE ===")
        logger.info(f"Final inventory: {len(final_inventory.get('inventory', []))} items detected")
        
        return final_inventory

# Helper function to run the pipeline inside a background task
def run_inspection_pipeline(video_path: str) -> Dict[str, Any]:
    # Always use full mode (fast_mode=False) for accurate property inspection
    # This enables Florence Vision and LLM for detailed scene understanding
    fast_mode = os.environ.get("FAST_MODE", "false").lower() == "true"
    if os.environ.get("FORCE_FULL_MODE", "true").lower() == "true":
        fast_mode = False
    yolo_model_path = os.environ.get("YOLO_MODEL_PATH", "yolo11x.pt")
    pipeline = PropertyInspectionPipeline(yolo_model_path=yolo_model_path, fast_mode=fast_mode)
    return pipeline.process_video(video_path)


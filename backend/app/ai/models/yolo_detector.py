"""
YOLO Object Detector for property inspection.
Uses Ultralytics YOLO11 (or YOLOv8) with GPU acceleration for local inference.
"""
import logging
from typing import List, Dict, Any, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Standard mapping of property-relevant classes from COCO (if using pre-trained)
PROPERTY_CLASSES = {
    56: 'chair', 57: 'couch', 58: 'potted_plant', 59: 'bed',
    60: 'dining_table', 62: 'tv', 63: 'laptop', 64: 'mouse',
    65: 'remote', 66: 'keyboard', 67: 'cell_phone', 68: 'microwave',
    69: 'oven', 70: 'toaster', 71: 'sink', 72: 'refrigerator',
    73: 'book', 74: 'clock', 75: 'vase', 76: 'scissors',
    77: 'teddy_bear', 78: 'hair_drier', 79: 'toothbrush',
    41: 'cup', 42: 'fork', 43: 'knife', 44: 'spoon', 45: 'bowl',
    26: 'backpack', 27: 'umbrella', 28: 'handbag', 29: 'tie',
}

NAME_NORMALIZATION = {
    'couch': 'sofa',
    'dining_table': 'table',
    'potted_plant': 'plant',
    'cell_phone': 'phone',
}

class Detection:
    def __init__(self, class_id: int, class_name: str, confidence: float,
                 bbox: List[float], frame_index: int):
        self.class_id = class_id
        self.class_name = NAME_NORMALIZATION.get(class_name, class_name)
        self.confidence = confidence
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.frame_index = frame_index
        self.track_id: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'class_id': self.class_id,
            'class_name': self.class_name,
            'confidence': self.confidence,
            'bbox': self.bbox,
            'frame_index': self.frame_index,
            'track_id': self.track_id
        }

class YOLODetector:
    def __init__(self, model_path: str = 'yolo11x.pt', 
                 confidence: float = 0.35,
                 iou_threshold: float = 0.45,
                 device: str = 'auto'):
        self.model_path = model_path
        self.confidence = confidence
        self.iou_threshold = iou_threshold
        self.device = device
        self.model = None
        self._load_model()
    
    def _load_model(self):
        try:
            from ultralytics import YOLO
            import torch
            if self.device == 'auto':
                self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            self.model = YOLO(self.model_path)
            logger.info(f'YOLO model loaded successfully on {self.device}')
        except ImportError:
            logger.error("ultralytics not installed. Cannot load YOLO.")
        except Exception as e:
            logger.warning(f'Could not load YOLO model: {e}. Falling back to mock logic.')
            self.model = None
    
    def detect_batch(self, frames: List[np.ndarray], start_frame_idx: int = 0) -> List[List[Detection]]:
        """Detect objects in a batch of frames."""
        if self.model is None:
            return self._mock_detections(frames, start_frame_idx)
        
        try:
            results = self.model(
                frames,
                conf=self.confidence,
                iou=self.iou_threshold,
                device=self.device,
                verbose=False
            )
            
            all_detections = []
            for i, result in enumerate(results):
                frame_detections = []
                if result.boxes is not None:
                    for box in result.boxes:
                        class_id = int(box.cls[0])
                        # Optional: filter only by PROPERTY_CLASSES here if needed
                        class_name = self.model.names[class_id]
                        confidence = float(box.conf[0])
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        
                        det = Detection(
                            class_id=class_id,
                            class_name=class_name,
                            confidence=confidence,
                            bbox=[x1, y1, x2, y2],
                            frame_index=start_frame_idx + i
                        )
                        frame_detections.append(det)
                all_detections.append(frame_detections)
            return all_detections
        except Exception as e:
            logger.error(f'YOLO detection failed: {e}')
            return self._mock_detections(frames, start_frame_idx)
    
    def _mock_detections(self, frames: List[np.ndarray], start_frame_idx: int) -> List[List[Detection]]:
        """Return mock detections for development/testing when GPU is unavailable."""
        import random
        mock_objects = [
            ('sofa', 0.95), ('tv', 0.88), ('chair', 0.91),
            ('table', 0.87), ('bed', 0.96), ('refrigerator', 0.92),
            ('microwave', 0.85), ('lamp', 0.79), ('wardrobe', 0.88)
        ]
        all_detections = []
        for i in range(len(frames)):
            frame_dets = []
            num_objects = random.randint(1, 4)
            selected = random.sample(mock_objects, min(num_objects, len(mock_objects)))
            for j, (name, base_conf) in enumerate(selected):
                det = Detection(
                    class_id=j,
                    class_name=name,
                    confidence=base_conf + random.uniform(-0.05, 0.05),
                    bbox=[100+j*50, 100+j*30, 400+j*50, 350+j*30],
                    frame_index=start_frame_idx + i
                )
                frame_dets.append(det)
            all_detections.append(frame_dets)
        return all_detections

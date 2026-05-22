"""
YOLO Object Detector for property inspection.
Uses Ultralytics YOLO11 (or YOLOv8) with GPU acceleration for local inference.
"""
import logging
from typing import List, Dict, Any, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Property/Real Estate relevant items WHITELIST - only these objects will be returned
PROPERTY_ITEMS_WHITELIST = {
    # Kitchen items
    'refrigerator', 'microwave', 'oven', 'toaster', 'sink', 'stove', 'gas stove',
    'dishwasher', 'kitchen cabinet', 'kitchen counter', 'range hood', 'exhaust hood',
    'blender', 'coffee maker', 'kettle', 'fridge', 'stove top', 'cooktop', 'range',
    
    # Bedroom items
    'bed', 'wardrobe', 'dresser', 'nightstand', 'bedside table', 'mirror',
    'closet', 'shelf', 'bookshelf', 'desk', 'cot', 'mattress', 'pillow',
    'headboard', 'bedframe', 'bed frame',
    
    # Bathroom items
    'bathtub', 'toilet', 'sink', 'shower', 'bathroom sink', 'towel rack', 'towel holder',
    'shower enclosure', 'vanity', 'bathroom cabinet', 'wash basin', 'basin',
    
    # Living/Dining room
    'sofa', 'couch', 'chair', 'dining table', 'table', 'coffee table', 'side table',
    'end table', 'dining chair', 'tv', 'television', 'screen', 'monitor', 'bookcase',
    'tv stand', 'entertainment center', 'console',
    
    # Furnishings & Fixtures
    'lamp', 'light', 'ceiling light', 'door', 'window', 'curtain', 'blinds', 'shade',
    'plant', 'potted plant', 'painting', 'picture', 'frame', 'wall clock', 'clock',
    'vase', 'pot', 'basket', 'rug', 'carpet', 'mat', 'throw', 'sofa', 'armchair',
    'recliner', 'ottoman', 'bench', 'stool', 'seat', 'cushion',
    
    # General appliances & electronics
    'air conditioner', 'ac unit', 'water purifier', 'fan', 'ceiling fan', 'standing fan',
    'heater', 'space heater', 'humidifier', 'dehumidifier',
    'laptop', 'computer', 'monitor', 'printer', 'speaker', 'stereo', 'sound system',
    'washing machine', 'dryer', 'washer', 'clothes dryer',
    
    # Storage & Organization
    'drawer', 'cabinet', 'storage', 'storage box', 'locker', 'storage unit', 'trunk',
    'cabinet', 'cupboard', 'pantry', 'shelving', 'shelves', 'closet',
    'wall switch', 'switch board', 'switchboard', 'outlet', 'power outlet',
    
    # Exterior/Balcony
    'balcony door', 'balcony', 'railing', 'rail', 'fence', 'patio door',
    'sliding door', 'french door', 'entryway', 'foyer',
    
    # Flooring & Walls
    'floor', 'wall', 'ceiling', 'tile', 'wood floor', 'hardwood floor', 'carpet floor',
    'vinyl floor', 'linoleum', 'grout', 'baseboard',
    
    # Misc
    'furniture', 'table lamp', 'floor lamp', 'desk lamp', 'nightlight', 'sconce',
    'chandelier', 'flush mount', 'pendant light', 'area rug', 'throw rug',
    'artwork', 'wall art', 'sculpture', 'statue', 'figurine'
}

# Mapping to normalize similar names
NAME_NORMALIZATION = {
    'couch': 'sofa',
    'television': 'tv',
    'dining_table': 'dining table',
    'coffee_table': 'coffee table',
    'potted_plant': 'plant',
    'cell_phone': 'phone',
    'wall_clock': 'wall clock',
    'kitchen_cabinet': 'kitchen cabinet',
    'bedside_table': 'bedside table',
    'nightstand': 'bedside table',
    'bathroom_sink': 'sink',
    'gas_stove': 'gas stove',
    'ceiling_light': 'ceiling light',
    'exhaust_hood': 'exhaust hood',
    'water_purifier': 'water purifier',
    'air_conditioner': 'air conditioner',
    'ac_unit': 'air conditioner',
    'switch_board': 'switch board',
    'wall_switch': 'wall switch',
    'range_hood': 'exhaust hood',
    'bathtub': 'bathtub',
    'toilet': 'toilet',
    'towel_rack': 'towel rack',
    'balcony_door': 'balcony door',
    'sliding_door': 'sliding door',
    'french_door': 'french door',
    'coffee_maker': 'coffee maker',
    'washing_machine': 'washing machine',
    'clothes_dryer': 'dryer',
    'space_heater': 'heater',
    'standing_fan': 'fan',
    'ceiling_fan': 'ceiling fan',
    'tv_stand': 'tv stand',
    'bookshelf': 'bookcase',
    'book_shelf': 'bookcase',
    'hardwood_floor': 'floor',
    'wood_floor': 'floor',
    'area_rug': 'rug',
    'throw_rug': 'rug',
    'wall_art': 'artwork',
    'end_table': 'side table',
    'side_table': 'side table',
    'dining_chair': 'chair',
    'office_chair': 'chair',
    'armchair': 'chair',
    'recliner': 'chair',
    'floor_lamp': 'lamp',
    'desk_lamp': 'lamp',
    'table_lamp': 'lamp',
    'pendant_light': 'light',
    'chandelier': 'light',
    'sconce': 'light',
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
                 confidence: float = 0.15,
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
            import os
            logger.info(f"Loading YOLO model from: {self.model_path}")
            logger.info(f"Model path exists: {os.path.exists(self.model_path)}")
            
            from ultralytics import YOLO
            import torch
            
            if self.device == 'auto':
                self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            
            logger.info(f"Using device: {self.device}")
            logger.info(f"Confidence threshold: {self.confidence}")
            logger.info(f"IOU threshold: {self.iou_threshold}")
            
            self.model = YOLO(self.model_path)
            
            logger.info(f"✓ YOLO model loaded successfully")
            logger.info(f"  Model classes: {len(self.model.names)}")
            logger.info(f"  Sample classes: {list(self.model.names.values())[:10]}")
            
        except ImportError as e:
            logger.error(f"✗ ultralytics not installed: {e}")
            self.model = None
        except FileNotFoundError as e:
            logger.error(f"✗ YOLO model file not found: {self.model_path}")
            self.model = None
        except Exception as e:
            logger.error(f"✗ Could not load YOLO model: {e}", exc_info=True)
            self.model = None
    
    def detect_batch(self, frames: List[np.ndarray], start_frame_idx: int = 0) -> List[List[Detection]]:
        """Detect objects in a batch of frames."""
        logger.info(f"detect_batch called: {len(frames)} frames, start_idx={start_frame_idx}")
        
        if self.model is None:
            logger.warning("Model is None - using mock detections")
            return self._mock_detections(frames, start_frame_idx)
        
        try:
            logger.debug(f"Running inference on {len(frames)} frames...")
            results = self.model(
                frames,
                conf=self.confidence,
                iou=self.iou_threshold,
                device=self.device,
                verbose=False
            )
            
            logger.debug(f"Inference complete, processing {len(results)} results...")
            
            all_detections = []
            total_raw_boxes = 0
            total_filtered = 0
            total_kept = 0
            
            for i, result in enumerate(results):
                frame_detections = []
                if result.boxes is not None:
                    total_raw_boxes += len(result.boxes)
                    
                    for box in result.boxes:
                        class_id = int(box.cls[0])
                        class_name = self.model.names[class_id]
                        raw_name = class_name
                        
                        # Normalize the class name
                        normalized_name = NAME_NORMALIZATION.get(class_name.lower(), class_name.lower())
                        
                        # FILTER: Skip people, animals, and non-property items
                        if normalized_name in ['person', 'people', 'human', 'dog', 'cat', 'bird', 'animal']:
                            logger.debug(f"  Filtered (person/animal): {raw_name} → {normalized_name}")
                            total_filtered += 1
                            continue
                        
                        # FILTER: Only keep property-relevant items (whitelist)
                        if normalized_name not in PROPERTY_ITEMS_WHITELIST:
                            logger.debug(f"  Filtered (not in whitelist): {raw_name} → {normalized_name}")
                            total_filtered += 1
                            continue
                        
                        confidence = float(box.conf[0])
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        
                        logger.debug(f"  ✓ Kept: {raw_name} ({confidence:.2f})")
                        total_kept += 1
                        
                        det = Detection(
                            class_id=class_id,
                            class_name=normalized_name,
                            confidence=confidence,
                            bbox=[x1, y1, x2, y2],
                            frame_index=start_frame_idx + i
                        )
                        frame_detections.append(det)
                
                all_detections.append(frame_detections)
            
            logger.info(f"Batch processing complete:")
            logger.info(f"  Raw detections: {total_raw_boxes}")
            logger.info(f"  Filtered out: {total_filtered}")
            logger.info(f"  Kept: {total_kept}")
            
            return all_detections
        except Exception as e:
            logger.error(f'✗ YOLO detection failed: {e}', exc_info=True)
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

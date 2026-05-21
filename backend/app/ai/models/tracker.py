"""
ByteTrack object tracker for persistent ID assignment.
Uses supervision library.
"""
import logging
from typing import List, Dict, Any, Tuple
import numpy as np
from app.ai.models.yolo_detector import Detection

logger = logging.getLogger(__name__)

class ObjectTracker:
    def __init__(self, track_thresh: float = 0.25, track_buffer: int = 30, match_thresh: float = 0.8, frame_rate: int = 30):
        self.track_thresh = track_thresh
        self.track_buffer = track_buffer
        self.match_thresh = match_thresh
        self.frame_rate = frame_rate
        self.tracker = None
        
        # Track history mapping: track_id -> dict of stats
        self.track_history: Dict[int, Dict[str, Any]] = {}
        
        self._init_tracker()

    def _init_tracker(self):
        try:
            import supervision as sv
            try:
                # Try new supervision signature (0.19.0+)
                self.tracker = sv.ByteTrack(
                    track_activation_threshold=self.track_thresh,
                    lost_track_buffer=self.track_buffer,
                    minimum_matching_threshold=self.match_thresh,
                    frame_rate=self.frame_rate
                )
                logger.info("Supervision ByteTrack initialized with standard signature.")
            except TypeError:
                # Fallback to older supervision signature if needed
                self.tracker = sv.ByteTrack(
                    track_thresh=self.track_thresh,
                    track_buffer=self.track_buffer,
                    match_thresh=self.match_thresh,
                    frame_rate=self.frame_rate
                )
                logger.info("Supervision ByteTrack initialized with fallback signature.")
        except ImportError:
            logger.error("supervision not installed. ByteTrack unavailable.")
            self.tracker = None
        except Exception as e:
            logger.error(f"Error initializing ByteTrack: {e}")
            self.tracker = None

    def update(self, detections: List[Detection], frame_shape: Tuple[int, int] = (1080, 1920)) -> List[Detection]:
        """
        Takes a list of Detection objects (from a single frame) and assigns track_ids.
        Returns the list of Detections updated with track_ids.
        """
        if self.tracker is None or not detections:
            # Fallback if no tracker: assign random or index-based ids, or just return as is
            for i, det in enumerate(detections):
                if det.track_id is None:
                    det.track_id = int(np.random.randint(1000, 9999))
            return detections

        try:
            import supervision as sv
            
            # Convert our detections to supervision Detections object
            xyxy = []
            confidence = []
            class_id = []
            
            for d in detections:
                xyxy.append(d.bbox)
                confidence.append(d.confidence)
                class_id.append(d.class_id)
                
            sv_detections = sv.Detections(
                xyxy=np.array(xyxy),
                confidence=np.array(confidence),
                class_id=np.array(class_id)
            )
            
            # Update tracker
            tracked_sv = self.tracker.update_with_detections(sv_detections)
            
            # Map back to our Detection objects based on bounding box matching 
            # (supervision filters out some detections and returns only tracked ones)
            tracked_results = []
            for i in range(len(tracked_sv.xyxy)):
                t_xyxy = tracked_sv.xyxy[i].tolist()
                t_conf = float(tracked_sv.confidence[i]) if tracked_sv.confidence is not None else 0.0
                t_cls = int(tracked_sv.class_id[i]) if tracked_sv.class_id is not None else 0
                t_id = int(tracked_sv.tracker_id[i])
                
                # Find the original detection it matched (by class and rough bbox overlap)
                best_match = None
                best_iou = 0.0
                for orig_d in detections:
                    if orig_d.class_id == t_cls:
                        iou = self._calculate_iou(orig_d.bbox, t_xyxy)
                        if iou > best_iou and iou > 0.5:
                            best_iou = iou
                            best_match = orig_d
                
                if best_match:
                    best_match.track_id = t_id
                    tracked_results.append(best_match)
                    self._update_track_history(best_match)
                else:
                    # If it somehow doesn't match an original one, create a new one
                    # (This shouldn't happen often)
                    new_det = Detection(t_cls, "unknown", t_conf, t_xyxy, -1)
                    new_det.track_id = t_id
                    tracked_results.append(new_det)
                    self._update_track_history(new_det)

            return tracked_results

        except Exception as e:
            logger.error(f"Tracking failed: {e}")
            return detections
            
    def _update_track_history(self, detection: Detection):
        t_id = detection.track_id
        if t_id not in self.track_history:
            self.track_history[t_id] = {
                'class_name': detection.class_name,
                'class_id': detection.class_id,
                'frames_seen': 1,
                'confidences': [detection.confidence],
                'avg_confidence': detection.confidence,
                'first_seen': detection.frame_index,
                'last_seen': detection.frame_index
            }
        else:
            hist = self.track_history[t_id]
            hist['frames_seen'] += 1
            hist['confidences'].append(detection.confidence)
            hist['avg_confidence'] = sum(hist['confidences']) / len(hist['confidences'])
            hist['last_seen'] = max(hist['last_seen'], detection.frame_index)
            
    def get_track_summary(self) -> Dict[int, Dict[str, Any]]:
        """Returns a summary of all unique tracked objects."""
        return self.track_history
        
    @staticmethod
    def _calculate_iou(boxA, boxB):
        # determine the (x, y)-coordinates of the intersection rectangle
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        # compute the area of intersection rectangle
        interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)

        # compute the area of both the prediction and ground-truth rectangles
        boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
        boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

        iou = interArea / float(boxAArea + boxBArea - interArea)
        return iou

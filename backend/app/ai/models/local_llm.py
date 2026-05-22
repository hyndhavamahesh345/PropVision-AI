"""
Local LLM integration via Ollama for NLP summarization.
Falls back to heuristic-based summaries if Ollama is unavailable.
"""
import logging
import json
from typing import Dict, Any, List
import requests

logger = logging.getLogger(__name__)


class LocalLLMService:
    def __init__(self, ollama_url: str = "http://localhost:11434", default_model: str = "qwen2:1.5b"):
        self.ollama_url = ollama_url
        self.default_model = default_model
        self._ollama_available = self._check_ollama()
        
    def _check_ollama(self) -> bool:
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            logger.warning("Ollama not available. Using fallback heuristic mode.")
            return False
            
    def generate_inventory_summary(self, 
                                   tracked_objects_summary: Dict[int, Dict[str, Any]], 
                                   room_descriptions: List[str]) -> Dict[str, Any]:
        """
        Takes raw tracking data and scene descriptions and generates a structured summary.
        If Ollama is not running, falls back to a smart heuristic parser.
        """
        if self._ollama_available:
            return self._summarize_with_llm(tracked_objects_summary, room_descriptions)
        else:
            return self._fallback_summary(tracked_objects_summary, room_descriptions)
    
    def _summarize_with_llm(self, tracked_objects_summary: Dict[int, Dict[str, Any]], room_descriptions: List[str]) -> Dict[str, Any]:
        """Use Ollama LLM to generate summary."""
        objects_list = []
        for obj in tracked_objects_summary.values():
            objects_list.append(f"- {obj['class_name']} (confidence: {obj.get('avg_confidence', 0):.2f})")
        
        objects_text = "\n".join(objects_list) if objects_list else "No objects detected."
        scenes_text = "\n".join([f"- {desc}" for desc in room_descriptions]) if room_descriptions else "No scene descriptions."
        
        prompt = f"""You are a property inspection AI. Generate a clean JSON inventory from this data:

Detected Objects:
{objects_text}

Scene Understanding:
{scenes_text}

Return only valid JSON with no markdown: {{"total_items": <int>, "inventory": [{{"item": "<name>", "quantity": <count>, "condition_notes": "<notes>"}}], "overall_scene_description": "<summary>"}}"""
        
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={"model": self.default_model, "prompt": prompt, "stream": False},
                timeout=30
            )
            if response.status_code == 200:
                result = response.json().get("response", "")
                try:
                    return json.loads(result)
                except:
                    logger.error(f"Failed to parse LLM response")
                    return None
        except Exception as e:
            logger.error(f"LLM error: {e}")
        
        return None
    
    def _fallback_summary(self, tracked_objects_summary: Dict[int, Dict[str, Any]], room_descriptions: List[str]) -> Dict[str, Any]:
        """Generate summary using heuristic rules when Ollama unavailable."""
        # Build inventory from YOLO detections
        inventory = []
        object_counts = {}
        
        for obj in tracked_objects_summary.values():
            class_name = obj.get('class_name', 'Unknown')
            if class_name.lower() not in ["person", "human", "people"]:
                object_counts[class_name] = object_counts.get(class_name, 0) + 1
        
        total_items = 0
        for item_name, count in sorted(object_counts.items()):
            total_items += count
            inventory.append({
                "item": item_name,
                "quantity": count,
                "condition_notes": "Detected via AI computer vision"
            })
        
        # Build scene description
        scene_desc = ""
        if room_descriptions:
            scene_desc = ". ".join(room_descriptions[:2])
        else:
            scene_desc = f"Property with {total_items} detected items"
        
        return {
            "total_items": total_items,
            "inventory": inventory,
            "overall_scene_description": scene_desc
        }

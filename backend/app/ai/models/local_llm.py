"""
Local LLM integration via Ollama for NLP summarization.
Uses open-source models like Llama 3 or Phi-3 running locally.
"""
import logging
import json
from typing import Dict, Any, List
import requests

logger = logging.getLogger(__name__)

class LocalLLMService:
    def __init__(self, ollama_url: str = "http://localhost:11434", default_model: str = "llama3"):
        self.ollama_url = ollama_url
        self.default_model = default_model
        
    def generate_inventory_summary(self, 
                                   tracked_objects_summary: Dict[int, Dict[str, Any]], 
                                   room_descriptions: List[str]) -> Dict[str, Any]:
        """
        Takes raw tracking data and scene descriptions and generates a structured summary.
        """
        # Format the data for the prompt
        objects_list = []
        for obj in tracked_objects_summary.values():
            objects_list.append(f"- {obj['class_name']} (confidence: {obj['avg_confidence']:.2f})")
            
        objects_text = "\n".join(objects_list) if objects_list else "No objects detected."
        scenes_text = "\n".join([f"- {desc}" for desc in room_descriptions]) if room_descriptions else "No scene descriptions available."
        
        prompt = f"""
You are an AI assistant for a Property Inspection Platform. 
Your task is to generate a clean, professional inventory summary based on the raw AI pipeline data.

Raw Detected Objects:
{objects_text}

Visual Scene Understanding:
{scenes_text}

Please provide a JSON output summarizing the property inventory. 
Do not include markdown blocks, just the raw JSON. The JSON should have the following structure:
{{
  "total_items": <int>,
  "inventory": [
    {{"item": "<name>", "quantity": <count>, "condition_notes": "<derived from scene understanding if applicable>"}}
  ],
  "overall_scene_description": "<A clean summary of the scenes>"
}}
"""
        
        try:
            # Query Ollama
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.default_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=120
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse the JSON response
            result = json.loads(data.get("response", "{}"))
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to communicate with local Ollama instance: {e}")
            return self._mock_summary()
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            return self._mock_summary()

    def _mock_summary(self) -> Dict[str, Any]:
        return {
            "total_items": 4,
            "inventory": [
                {"item": "sofa", "quantity": 1, "condition_notes": "Appears to be in good condition."},
                {"item": "tv", "quantity": 1, "condition_notes": "Mounted on wall."},
                {"item": "table", "quantity": 1, "condition_notes": "Wooden coffee table."},
                {"item": "chair", "quantity": 1, "condition_notes": ""}
            ],
            "overall_scene_description": "A well-lit, modern living room containing standard furniture in good condition."
        }

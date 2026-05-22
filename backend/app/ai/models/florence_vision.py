"""
Florence-2 Vision Reasoning Model for scene understanding.
Uses Microsoft's open-source Florence-2 via HuggingFace transformers.
"""
import logging
from typing import Dict, Any, Optional
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

class FlorenceVisionModel:
    def __init__(self, model_id: str = "microsoft/Florence-2-base", device: str = "auto"):
        self.model_id = model_id
        self.device = device
        self.model = None
        self.processor = None
        self._load_model()
        
    def _load_model(self):
        try:
            import torch
            from transformers import AutoProcessor, AutoModelForCausalLM, PretrainedConfig
            from transformers.tokenization_utils_base import PreTrainedTokenizerBase
            
            # Monkey patch to fix Florence-2 bug in transformers >= 4.45.0
            if not hasattr(PretrainedConfig, "forced_bos_token_id"):
                PretrainedConfig.forced_bos_token_id = None
                
            # Monkey patch to fix RobertaTokenizer/other tokenizers missing additional_special_tokens in newer transformers
            if not hasattr(PreTrainedTokenizerBase, "additional_special_tokens"):
                @property
                def additional_special_tokens_prop(self):
                    return self.special_tokens_map.get("additional_special_tokens", [])
                PreTrainedTokenizerBase.additional_special_tokens = additional_special_tokens_prop
                
            if self.device == 'auto':
                self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
                
            logger.info(f"Loading Florence-2 model ({self.model_id}) on {self.device}...")
            self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id, 
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == 'cuda' else torch.float32
            ).to(self.device)
            self.model.eval()
            logger.info("Florence-2 loaded successfully.")
        except ImportError:
            logger.error("transformers not installed. Cannot load Florence-2.")
        except Exception as e:
            logger.error(f"Error loading Florence-2: {e}")
            self.model = None
            self.processor = None

    def analyze_frame(self, frame: np.ndarray, task_prompt: str = "<MORE_DETAILED_CAPTION>") -> str:
        """
        Analyzes a single frame using Florence-2.
        Common tasks: 
        - <CAPTION>
        - <DETAILED_CAPTION>
        - <MORE_DETAILED_CAPTION>
        - <OD> (Object Detection)
        """
        if self.model is None or self.processor is None:
            return self._mock_analysis()
            
        try:
            import torch
            # Convert OpenCV frame (BGR) to PIL Image (RGB)
            # frame is assumed to be RGB if passed from certain pipelines, 
            # but standard cv2 is BGR. Let's assume it's RGB for safety or convert if needed.
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                image = Image.fromarray(frame)
            else:
                image = frame # fallback if it's already PIL
                
            inputs = self.processor(text=task_prompt, images=image, return_tensors="pt")
            
            # Move inputs to device
            inputs = {k: v.to(self.device, dtype=torch.float16 if self.device == 'cuda' and k == 'pixel_values' else None) if k == 'pixel_values' else v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                generated_ids = self.model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=1024,
                    num_beams=3
                )
                
            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed_answer = self.processor.post_process_generation(generated_text, task=task_prompt, image_size=(image.width, image.height))
            
            return parsed_answer.get(task_prompt, str(parsed_answer))
            
        except Exception as e:
            logger.error(f"Florence-2 analysis failed: {e}")
            return self._mock_analysis()
            
    def _mock_analysis(self) -> str:
        return ""

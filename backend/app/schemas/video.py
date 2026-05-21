from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VideoBase(BaseModel):
    filename: str
    property_id: str

class VideoCreate(VideoBase):
    s3_key: Optional[str] = None
    s3_url: Optional[str] = None

class VideoResponse(VideoBase):
    id: str
    s3_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

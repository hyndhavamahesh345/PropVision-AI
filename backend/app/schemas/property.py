from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PropertyBase(BaseModel):
    name: str
    address: Optional[str] = None
    property_type: Optional[str] = "apartment"  # apartment, house, office, commercial

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    property_type: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any

from app.db.session import get_db
from app.db.models import Property, InspectionJob, InventoryItem, InspectionReport

router = APIRouter()

@router.get("/{property_id}/inventory")
def get_property_inventory(property_id: str, db: Session = Depends(get_db)) -> Any:
    # Get latest successful job for this property
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    latest_job = db.query(InspectionJob).join(InspectionJob.video).filter(
        InspectionJob.status == "completed",
        InspectionJob.video.has(property_id=property_id)
    ).order_by(InspectionJob.completed_at.desc()).first()
    
    if not latest_job:
        return {"inventory": {}}
        
    report = db.query(InspectionReport).filter(InspectionReport.job_id == latest_job.id).first()
    if report:
        return {"inventory": report.json_report}
        
    return {"inventory": {}}

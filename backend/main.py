from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import inspection

app = FastAPI(title="PropInspect AI Backend", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inspection.router, prefix="/api/v1/inspections", tags=["inspections"])

@app.get("/")
def read_root():
    return {"message": "Welcome to PropInspect AI Backend API"}

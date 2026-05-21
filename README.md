# Property Inventory AI

**Property Inventory AI** is a state-of-the-art, 100% free and open-source platform designed for property managers, inspectors, and homeowners. By simply uploading or recording a video walkthrough of a property, the platform leverages local AI models to automatically extract a structured, deduplicated inventory of furniture, appliances, fixtures, and their conditions.

## 🌟 Key Features

- **Video Walkthrough Processing**: Upload `.mp4` videos or record directly from your browser using your device's camera.
- **Real-Time Object Detection**: Powered by **YOLOv11x** for high-speed, accurate bounding box detection of 80+ standard asset classes.
- **Smart Deduplication**: Utilizes **ByteTrack** to ensure that an object tracked across multiple frames is only counted once.
- **Open-Vocabulary Scene Reasoning**: Leverages **Microsoft Florence-2-Large** to "read" the room, describing complex features like flooring, lighting, and asset condition.
- **NLP Report Generation**: Uses **Meta Llama 3 (8B)** to synthesize raw detections into a clean, human-readable JSON inventory report.
- **100% Local & Private**: No expensive third-party APIs (like OpenAI). Your data never leaves your infrastructure.

## 🏗️ Architecture Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with React.
- **UI Design**: Modern, glassmorphic dark mode using Tailwind CSS.
- **Media**: Native HTML5 `MediaRecorder` API for cross-browser video capture.

### Backend
- **Server**: FastAPI (Python) for asynchronous, high-performance API routing.
- **Computer Vision Pipeline**: OpenCV (Frame extraction), Ultralytics (YOLO), Supervision (ByteTrack).
- **Vision-Language Model**: HuggingFace Transformers (Florence-2).
- **LLM Server**: Ollama (Llama 3).
- **Task Queue**: Scaffolding provided for Celery & Redis for asynchronous production processing.

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) (for running Llama 3 locally)
- *(Optional but Recommended)* NVIDIA GPU with CUDA for accelerated AI processing.

### 1. Start the AI Server (Ollama)
Install Ollama and pull the Llama 3 model:
```bash
ollama run llama3
```

### 2. Setup the Backend
Navigate to the backend directory, install the required Python packages, and start the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
# If using a GPU, install the CUDA version of PyTorch first!
uvicorn main:app --reload --port 8000
```
The interactive API documentation will be available at `http://localhost:8000/docs`.

### 3. Setup the Frontend
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```
The web application will be accessible at `http://localhost:3000`.

## 📦 Production Deployment Roadmap

To move this from a local environment to a production deployment, follow these steps:
1. **Background Queues**: Enable Celery + Redis to prevent server memory crashes during concurrent video uploads.
2. **Cloud GPU**: Host the FastAPI backend on a serverless GPU provider (e.g., RunPod, AWS EC2 g4dn).
3. **Cloud Storage**: Replace local video saving with AWS S3.
4. **Database**: Integrate PostgreSQL (via Supabase or AWS RDS) to store reports and user accounts persistently.

## 📄 License
This project is built entirely on open-source libraries. Please review the licenses of the respective models (YOLOv11, Florence-2, Llama 3) for commercial usage guidelines.

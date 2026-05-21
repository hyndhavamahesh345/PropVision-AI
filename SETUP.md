# 🚀 Setup Guide - Property Inventory AI

## Quick Setup Commands

### 1. Clone Repository
```bash
git clone https://github.com/hyndhavamahesh345/InventoryAI.git
cd InventoryAI
```

### 2. Start Infrastructure (Docker)
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download YOLO model (required)
# Download yolo11x.pt from: https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11x.pt
# Place it in the backend/ directory

# Create .env file
copy .env.example .env
# Edit .env with your configuration

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
copy .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Download Required Models

### YOLO11x Model (~220MB)
```bash
# Download from Ultralytics
wget https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11x.pt -O backend/yolo11x.pt

# Or use curl
curl -L https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11x.pt -o backend/yolo11x.pt
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/propinspect
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-min-32-characters
YOLO_MODEL_PATH=yolo11x.pt
USE_QWEN_API=true
QWEN_API_KEY=your-api-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Restart Docker containers
docker-compose restart

# Check container status
docker-compose ps
```

### YOLO Model Not Found
- Ensure `yolo11x.pt` is in the `backend/` directory
- Check file size (~220MB)
- Re-download if corrupted

## Production Deployment

### Backend
1. Set production environment variables
2. Use PostgreSQL and Redis cloud services
3. Deploy to Railway, Render, or AWS
4. Upload YOLO model to cloud storage

### Frontend
1. Update `NEXT_PUBLIC_API_URL` to production backend
2. Deploy to Vercel or Netlify
3. Configure environment variables in platform

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Open an issue on GitHub
- Contact: [GitHub Issues](https://github.com/hyndhavamahesh345/InventoryAI/issues)

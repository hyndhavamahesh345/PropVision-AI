# 🚀 PropVision-AI Deployment Guide

## Overview
This guide will help you deploy both the backend (FastAPI) and frontend (Next.js) of PropVision-AI.

---

## 📦 Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `hyndhavamahesh345/PropVision-AI`
3. Configure the service:

#### Basic Settings:
- **Name:** `propvision-ai-backend`
- **Region:** Oregon (US West) or closest to you
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`

#### Build & Start Commands:
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Instance Type:
- **Free** (for testing) or **Starter** ($7/month for better performance)

### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

#### Required Variables:
```
SECRET_KEY=your-super-secret-key-min-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
BACKEND_CORS_ORIGINS=https://your-frontend-url.vercel.app
USE_LOCAL_STORAGE=true
UPLOAD_DIR=/tmp/uploads
FRAMES_DIR=/tmp/frames
REPORTS_DIR=/tmp/reports
EVIDENCE_DIR=/tmp/evidence
YOLO_DEVICE=cpu
USE_QWEN_API=false
```

#### Optional (for production):
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379/0
QWEN_API_KEY=your-qwen-api-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://propvision-ai-backend.onrender.com`

### Step 5: Test Backend
Visit: `https://your-backend-url.onrender.com`

You should see:
```json
{"message": "Welcome to PropInspect AI Backend API"}
```

---

## 🌐 Part 2: Update Frontend with Backend URL

### Step 1: Add Backend URL to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **PropVision-AI** project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:

```
Name: NEXT_PUBLIC_API_URL
Value: https://your-backend-url.onrender.com
Environments: ✅ Production ✅ Preview ✅ Development
```

### Step 2: Update Clerk Allowed Origins

1. Go to [clerk.com/dashboard](https://clerk.com/dashboard)
2. Select your application
3. Go to **Configure** → **Domains** (or **Settings** → **Domains**)
4. Add these domains:
   - `https://your-frontend.vercel.app`
   - `https://your-backend.onrender.com`
   - `*.vercel.app` (for preview deployments)

### Step 3: Update Backend CORS

1. Go back to Render dashboard
2. Select your backend service
3. Go to **Environment**
4. Update `BACKEND_CORS_ORIGINS`:
   ```
   https://your-frontend.vercel.app,https://your-frontend-preview.vercel.app
   ```
5. Click **"Save Changes"**
6. Service will automatically redeploy

### Step 4: Redeploy Frontend

1. Go to Vercel dashboard
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Wait 2-3 minutes

---

## ✅ Part 3: Verify Everything Works

### Test Checklist:

1. **Backend Health Check:**
   - Visit: `https://your-backend.onrender.com`
   - Should see welcome message

2. **Frontend Loads:**
   - Visit: `https://your-frontend.vercel.app`
   - Should redirect to sign-in page (not Internal Server Error)

3. **Authentication Works:**
   - Sign up with test account
   - Should redirect to dashboard

4. **API Connection:**
   - Try uploading a video (if backend is fully configured)
   - Check browser console for API errors

---

## 🐛 Troubleshooting

### Frontend Still Shows "Internal Server Error"

**Check:**
1. Did you add `NEXT_PUBLIC_API_URL` to Vercel?
2. Did you redeploy frontend after adding the variable?
3. Check Vercel Runtime Logs for actual error

**Fix:**
- Go to Vercel → Deployments → Click deployment → Check "Function Logs"

### Backend Shows 502 Bad Gateway

**Cause:** Backend is starting up (Render free tier sleeps after inactivity)

**Fix:** Wait 30-60 seconds and refresh

### CORS Errors in Browser Console

**Cause:** Backend CORS not configured for frontend domain

**Fix:**
1. Update `BACKEND_CORS_ORIGINS` in Render
2. Add your Vercel URL
3. Redeploy backend

### Authentication Fails

**Cause:** Clerk domain not configured

**Fix:**
1. Add both frontend and backend URLs to Clerk dashboard
2. Verify environment variables in both Vercel and Render

---

## 📝 Environment Variables Summary

### Vercel (Frontend):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Render (Backend):
```
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
BACKEND_CORS_ORIGINS=https://your-frontend.vercel.app
USE_LOCAL_STORAGE=true
UPLOAD_DIR=/tmp/uploads
FRAMES_DIR=/tmp/frames
REPORTS_DIR=/tmp/reports
EVIDENCE_DIR=/tmp/evidence
YOLO_DEVICE=cpu
USE_QWEN_API=false
```

---

## 🎯 Quick Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL obtained
- [ ] `NEXT_PUBLIC_API_URL` added to Vercel
- [ ] Frontend redeployed
- [ ] Clerk domains configured
- [ ] Backend CORS updated
- [ ] Tested sign-in
- [ ] Tested API connection

---

## 💡 Tips

1. **Free Tier Limitations:**
   - Render free tier sleeps after 15 min inactivity
   - First request after sleep takes 30-60 seconds
   - Consider upgrading to Starter plan for production

2. **AI Models:**
   - YOLO models are large (100MB+)
   - First run downloads the model
   - Use `YOLO_DEVICE=cpu` on free tier
   - For GPU, upgrade to paid plan

3. **Storage:**
   - Render free tier has ephemeral storage
   - Files are deleted on restart
   - For production, use S3/R2 storage

4. **Database:**
   - For production, add PostgreSQL database
   - Render offers free PostgreSQL (90 days)
   - Update `DATABASE_URL` environment variable

---

## 🆘 Need Help?

If you're still having issues:
1. Check Vercel Function Logs
2. Check Render Service Logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

**Your app should now be fully deployed and working!** 🎉

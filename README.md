# TrendAI - AI-Powered Business Intelligence

TrendAI is a state-of-the-art market research and business planning tool designed for modern entrepreneurs.

## 🚀 Deployment Guide

### **Frontend (Vercel)**
1. Go to [Vercel.com](https://vercel.com/new).
2. Click **Import Project**.
3. Select this GitHub repository: `Ashish6312/TrendAI`.
4. Set the **Root Directory** to `frontend`.
5. Add your Environment Variables (from your local `.env.local`).
6. Click **Deploy**.

### **Backend (PostgreSQL + FastAPI)**
Since Vercel is optimized for frontend, we recommend deploying the `backend` folder to a platform like **Railway** or **Render**.
1. Connect your GitHub.
2. Select the `backend` folder.
3. Use the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

## 🛠 Features
- Responsive Navigation with dynamic scaling.
- Professional Invoice Generation.
- Multi-step Payment Success Protocol.
- Secure Team User Authentication.

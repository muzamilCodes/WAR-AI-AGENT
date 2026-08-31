# WAR AI — Development & Deployment Guide

## Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Windows OS**: Windows 10 or Windows 11 (for local Windows Agent execution)
- **PowerShell**: 5.1+ or PowerShell 7+

---

## Getting Started

### 1. Install Monorepo Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Everything in Development Mode
To launch the Backend, Windows Agent, and Next.js Frontend simultaneously:
```bash
npm run dev
```

Or run individual services:
- **Backend Hub**: `npm run dev:backend` (port 4000)
- **Windows Agent**: `npm run dev:agent` (connects to backend WS)
- **Next.js Frontend**: `npm run dev:frontend` (port 3000)

---

## Production Deployment Architecture

```
Frontend Web App ───> Vercel / Netlify
Backend API & WS ───> Render / Railway / AWS EC2
Windows Agent   ───> Local Windows PC (Daemon)
```

- **Frontend**: Deploy `frontend/` to Vercel. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.
- **Backend**: Deploy `backend/` to Render/Railway.
- **Local Windows Agent**: Run `npm run start:agent` on the target Windows PC with `AGENT_WS_URL` pointing to the cloud backend.

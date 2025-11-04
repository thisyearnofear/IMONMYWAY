# Deployment Configuration

This directory contains all deployment-related configurations for the IMONMYWAY application.

## 📁 Structure

```
deployment/
├── README.md                 # This file
├── frontend/                 # Netlify frontend deployment
│   ├── netlify.toml
│   └── next.config.*.js
├── backend/                  # Hetzner backend deployment
│   ├── ecosystem.config.js   # PM2 configuration
│   ├── nginx.conf            # Nginx reverse proxy
│   ├── deploy.sh             # Deployment script
│   └── .env.production       # Production environment variables
├── docker/                   # Docker configurations (optional)
└── docs/
    └── DEPLOYMENT_GUIDE.md   # Complete deployment guide
```

## 🚀 Quick Start

### Deploy Backend to Hetzner
```bash
cd deployment/backend
./deploy.sh
```

### Deploy Frontend to Netlify
```bash
# Netlify auto-deploys from Git
# Configuration is in deployment/frontend/netlify.toml
```

## 🏗️ Architecture

```
Netlify (Frontend)  ←→  Hetzner VPS (Backend)  ←→  Blockchain (Somnia)
```

- **Frontend**: Static Next.js build on Netlify CDN
- **Backend**: Node.js + Socket.IO on Hetzner VPS
- **Database**: PostgreSQL on Hetzner VPS
- **Blockchain**: Smart contracts on Somnia

## 📋 Environment Variables

### Frontend (.env.production)
```
NEXT_PUBLIC_SOCKET_URL=https://imonmywayapi.persidian.com:3001
NEXT_PUBLIC_BASE_URL=https://imonmyway.netlify.app
```

### Backend (.env.production)
```
PORT=3001
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://imonmyway.netlify.app
```

## 🔗 Useful Links

- [Netlify Deployment Guide](./docs/DEPLOYMENT_GUIDE.md#netlify)
- [Hetzner Deployment Guide](./docs/DEPLOYMENT_GUIDE.md#hetzner)
- [Environment Setup](./docs/DEPLOYMENT_GUIDE.md#environment)

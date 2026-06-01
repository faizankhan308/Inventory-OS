# Production-Ready Containerized Inventory & Order Management System

Welcome to the **Inventory & Sales Management Engine**—a secure, fully containerized full-stack solution built utilizing a modern decoupled monorepo architecture. 

This repository is engineered to be fully production-ready, featuring:
1. **Frontend (/frontend)**: A reactive, modern **React SPA** served via a production-grade, reverse-proxy-enabled **Nginx-Alpine** server.
2. **Backend (/backend)**: A high-performance **Python FastAPI** REST API powered by **SQLAlchemy ORM** communicating with an active **PostgreSQL** database.
3. **Orchestration**: Fully containerized and orchestrated locally via **Docker Compose** with persistent database volumes.

---

## 🏗️ System Architecture

Our target production deployment decouples services to guarantee speed, atomicity, and persistent storage boundaries:

```
                  ┌───────────────────────────────┐
                  │      React SPA Frontend       │
                  │   (Nginx Lightweight Alpine)  │
                  └───────────────┬───────────────┘
                                  │
                          /:api Reverse Proxy (or direct URL)
                                  v
                  ┌───────────────────────────────┐
                  │     Python FastAPI Backend    │
                  │        (Py3.11-Slim)          │
                  └───────────────┬───────────────┘
                                  │
                            SQLAlchemy ORM
                                  v
                  ┌───────────────────────────────┐
                  │      PostgreSQL Database      │
                  │     (Persistent Volume)       │
                  └───────────────────────────────┘
```

---

## 📋 Technology Stack & Standards

- **Backend Web Services**: Python 3.11 with FastAPI (automatic OpenAPI/Swagger docs at `/docs`).
- **Frontend SPA**: React 19, JavaScript, Tailwind CSS, Lucide Icons, and Recharts.
- **Database Engine**: PostgreSQL with SQLAlchemy ORM.
- **Service Orchestration**: Docker, Docker Compose.
- **Reverse Proxy**: Nginx (fully integrated inside Frontend Docker container for `/api` proxying locally).

---

## ⚙️ Implemented Business Logic & Rules
- **SKU Uniqueness**: Every product's unique SKU is validated and enforced (case-insensitive) on the database model.
- **Customer Email Uniqueness**: Registered customer credentials block duplication securely.
- **Safe Inventory Quantities**: Quantities cannot fall below `0`. Checks are performed natively on order dispatch.
- **Atomic Checkout Disbursements**: Creating an order atomically validates available stock of *all* requested items, subtracts stock from inventory, and calculates grand totals automatically on the backend. It performs complete rolled-back state refunds if any subitem fails validation.
- **Automatic Price Recording**: Every order item records its unit price *at the moment of transaction* to insulate orders history from future catalog changes.
- **Cancellations with Stock Replenishment**: Deleting or cancelling an order automatically refunds the exact product quantities back to live merchandise.

---

## 🚀 Local Development (Docker Compose)

To spin up the complete interconnected FastAPI, React, and PostgreSQL clusters locally:

### Prerequisite
Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and active on your system.

### Execution Command
Run the following orchestrating script from the root repository directory:
```bash
docker-compose up --build
```

- **Frontend Application Portal**: Access via `http://localhost:3000`
- **FastAPI Core Gateway**: Access via `http://localhost:8000`
- **FastAPI Interactive Documentation (Swagger)**: Access via `http://localhost:8000/docs`
- **PostgreSQL Database**: Port `5432` mapped locally

---

## 🌐 Cloud Deployment Guide

Our architecture is optimized for lightweight, free-tier hosting networks:

### 1. Backend Deployment (Render / Railway / Fly.io)
1. Register a connection on **Render** or **Railway**.
2. Deploy a managed **PostgreSQL** instance on the target platform and grab its connection string.
3. Link your Git repository and set the Root Directory to **`backend/`**.
4. Configure the environment variables:
   - `DATABASE_URL`: Set this to your live PostgreSQL connection string (e.g., `postgresql://user:password@hostname:5432/dbname`).
5. Set the Start Command to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Deployment (Vercel / Netlify)
1. Link your Git repository on **Vercel** or **Netlify**.
2. Configure the Build Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Enter Environment Variables:
   - `VITE_API_URL`: Set this to your deployed Python Backend base string (e.g., `https://your-backend-url.onrender.com`).
4. Redeploy. Your SPA will serve statically with lightning speed!

---

## 📁 Repository Directory Breakdown

- `/frontend` - React Frontend Application
  - `/frontend/src` - Component structure and app code
  - `/frontend/index.html` - Vite SPA entry point
  - `/frontend/package.json` - Frontend dependencies
  - `/frontend/vite.config.js` - Vite compiler configurations
  - `/frontend/nginx.conf` - Nginx server configuration for local proxy routing
  - `/frontend/Dockerfile` - Frontend multi-stage Nginx-Alpine server Docker setup
- `/backend` - Python FastAPI Backend Application
  - `/backend/main.py` - FastAPI gateway endpoints and transactional order operations
  - `/backend/database.py` - SQLAlchemy PostgreSQL models and schema wrappers
  - `/backend/requirements.txt` - Python backend dependencies
  - `/backend/Dockerfile` - Docker packaging configuration
- `/docker-compose.yml` - Multi-tier clustered compose network orchestration
- `.dockerignore` - Specifies files ignored in Docker builds
- `.gitignore` - Specifies files ignored in version control

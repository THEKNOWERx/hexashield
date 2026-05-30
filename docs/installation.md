# Installation Guide

## Prerequisites

- Docker Engine 24+ and Docker Compose v2+
- `openssl` for generating secrets

## Steps

### 1. Clone the repository

```bash
git clone https://github.com/Theknower22/hexashield.git
cd hexashield
```

### 2. Create environment file

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
POSTGRES_PASSWORD=<strong-random-password>
SECRET_KEY=<output of: openssl rand -hex 32>
ADMIN_PASSWORD=<your-admin-password>
```

Optionally set `GOOGLE_API_KEY` if you want AI assistant features.

### 3. Provision ML models (optional)

Place `risk_model.pkl` and `anomaly_model.pkl` in the `backend/` directory. Without these files the platform operates in rules-based mode.

### 4. Build and start

```bash
docker-compose up --build -d
```

### 5. Verify

```bash
curl http://localhost:8000/api/health
```

Open `http://localhost:5173` in your browser and log in with `admin` / your `ADMIN_PASSWORD`.

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # configure .env
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # set VITE_API_BASE_URL if needed
npm run dev
```

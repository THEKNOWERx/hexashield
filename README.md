# HexaShield

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232a?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

**HexaShield** is an enterprise-grade cybersecurity platform for AI-assisted vulnerability assessment, port scanning, attack-path visualization, and professional report generation.

## Features

- AI-driven vulnerability intelligence with OWASP Top 10, NIST CSF, and MITRE ATT&CK mapping
- Real-time port scanning and service/version detection via the HexaScan engine
- Interactive attack-path visualization and threat graph
- Role-Based Access Control (Admin / Analyst / Student)
- On-demand report generation (HTML, JSON, PDF)
- Full-stack PostgreSQL persistence with JWT authentication

## Tech Stack

- **Frontend**: React 19 (Vite), TailwindCSS 4, Chart.js, Lucide-React
- **Backend**: FastAPI (Python 3.12+), SQLAlchemy, Passlib/bcrypt, python-jose
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker Compose, Nginx

## Quick Start

### Prerequisites

- Docker and Docker Compose
- `openssl` (for generating secrets)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set strong values for every variable:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `SECRET_KEY` | JWT signing key — generate with `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Initial admin account password |
| `GOOGLE_API_KEY` | Google Generative AI key (optional) |

### 2. Build and run

```bash
docker-compose up --build
```

### 3. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

Log in with `admin` and the password you set in `ADMIN_PASSWORD`.

## ML Models

The AI risk-scoring and anomaly-detection models (`risk_model.pkl`, `anomaly_model.pkl`) are **not committed** to the repository. Place them in the `backend/` directory before starting the service, or configure the backend to operate in rules-based fallback mode when they are absent.

See [docs/installation.md](docs/installation.md) for provisioning instructions.

## Documentation

- [Installation Guide](docs/installation.md)
- [API Reference](docs/api_documentation.md)
- [Operations Runbook](docs/operations.md)

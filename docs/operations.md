# HexaShield Operations Runbook

## Starting the stack

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, SECRET_KEY, ADMIN_PASSWORD
docker-compose up --build
```

## Stopping the stack

```bash
docker-compose down
```

To also remove database volumes:

```bash
docker-compose down -v
```

## Checking service health

```bash
curl http://localhost:8000/api/health
```

## Viewing logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_DB` | No (default: `hexa_db`) | PostgreSQL database name |
| `POSTGRES_USER` | No (default: `hexa_user`) | PostgreSQL username |
| `POSTGRES_PASSWORD` | **Yes** | PostgreSQL password |
| `SECRET_KEY` | **Yes** | JWT signing key — generate with `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | **Yes** | Initial admin account password (set once on first boot) |
| `ADMIN_EMAIL` | No (default: `admin@hexa.io`) | Admin account email |
| `GOOGLE_API_KEY` | No | Google Generative AI key for AI assistant features |
| `ALLOWED_ORIGINS` | No (default: `http://localhost:5173`) | Comma-separated list of allowed CORS origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No (default: `30`) | JWT access token lifetime in minutes |

## ML Models

Place `risk_model.pkl` and `anomaly_model.pkl` in the `backend/` directory before starting the backend service. The service operates in rules-based fallback mode when these files are absent, but AI-risk scoring features will be limited.

Training scripts and model reproducibility instructions are provided separately.

## Database Migrations

Schema changes are applied automatically at startup via SQLAlchemy `create_all`. For production deployments with existing data, introduce Alembic migrations:

```bash
cd backend
alembic upgrade head
```

## Updating credentials

To change the admin password after initial deployment:

1. Set `ADMIN_PASSWORD` to the new value in `.env`.
2. Restart the backend: `docker-compose restart backend`.
   The seed function will update the admin password hash on startup.

## Security Notes

- Never commit `.env` to version control.
- Rotate `SECRET_KEY` by stopping the stack, updating the value, and restarting — all existing JWT tokens will be invalidated.
- Set `ALLOWED_ORIGINS` to the exact frontend origin in production (e.g., `https://app.example.com`).

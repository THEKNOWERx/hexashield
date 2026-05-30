# HexaShield Frontend

React 19 + Vite + TailwindCSS 4 single-page application for the HexaShield security platform.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

## Production Build

```bash
npm run build
```

The output is placed in `dist/` and served via Nginx in the Docker image.

## Lint

```bash
npm run lint
```

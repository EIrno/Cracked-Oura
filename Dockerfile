# Stage 1: Build React frontend
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/index.html frontend/vite.config.ts ./
COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json ./
COPY frontend/tailwind.config.js frontend/postcss.config.cjs frontend/components.json ./
COPY frontend/icon.png ./
COPY frontend/public ./public
COPY frontend/src ./src

RUN npm run build:web

# Stage 2: Python/FastAPI backend + Playwright Chromium runtime
FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    CRACKED_OURA_DATA_DIR=/data \
    FRONTEND_DIST_DIR=/app/frontend/dist \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    CRACKED_OURA_NO_SANDBOX=1 \
    CRACKED_OURA_FORCE_HEADLESS=1 \
    HOME=/tmp \
    XDG_CONFIG_HOME=/tmp/.config \
    XDG_CACHE_HOME=/tmp/.cache

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libatomic1 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

RUN playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/* \
    && chmod -R a+rX /ms-playwright

COPY backend/__init__.py ./backend/__init__.py
COPY backend/src ./backend/src
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /data && chmod -R a+rX /app && chmod 0777 /data

VOLUME ["/data"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/settings > /dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["uvicorn", "backend.src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

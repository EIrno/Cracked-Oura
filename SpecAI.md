# Cracked Oura - Technical Specifications & Project Status

## Project Overview
Cracked Oura is an open-source application designed to give users complete local access to and ownership of their Oura ring health data without paying for a subscription. It can run either as a standalone desktop app (Electron) or inside a cross-distro Docker container serving the web dashboard and FastAPI backend on port `8000`.

### Architecture
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (`frontend/`), optionally wrapped by Electron (`frontend/electron/main.ts`).
- **Backend**: FastAPI on Python 3.12 (`backend/src/`) with SQLite local storage, Playwright Chromium automation for Oura data export, and optional LangChain + Ollama AI advisor (`backend/src/llm.py`).
- **Desktop Packaging**: PyInstaller (`backend/build.spec`) + `electron-builder` creating Linux AppImage and `.deb` packages (plus macOS / Windows targets).
- **Containerized Deployment**: Multi-stage `Dockerfile` (`node:22-slim` frontend builder + `python:3.12-slim-bookworm` runtime with pre-installed Chromium) orchestrated from the repository root (`docker-compose.yml`, `start.sh`, `stop.sh`, `Makefile`).

---

## Integrated Upstream Pull Requests (`EIrno/Cracked-Oura`)
- **PR #10 (`Fix Oura login and Electron activation crash`)**:
  - Applied Electron changes in `frontend/electron/main.ts` and recompiled `frontend/dist-electron/main.js`: initialized `mainWindow = null` and introduced `showOrCreateWindow()` for macOS `activate` and tray actions.
  - Note: PR #10's `backend/src/automation.py` change was superseded by PR #18's broader language-independent fix.
- **PR #17 (`fix(frontend): upgrade react-day-picker to v9 for React 19 support`)**:
  - Upgraded `react-day-picker` in `frontend/package.json` to `^9.14.0`, migrated `frontend/src/components/ui/calendar.tsx` `classNames` and `components.Chevron` to the v9 API, regenerated `frontend/package-lock.json`, added `"build:web": "tsc -b && vite build"`, and removed the temporary `frontend/.npmrc` (`legacy-peer-deps`) workaround.
  - Note: PR #17 supersedes PR #21 (`react-day-picker@^10.0.1` in `package.json` alone), which lacked `calendar.tsx` API updates and lockfile regeneration.
- **PR #18 (`fix(automation): repair Oura login and export download`)**:
  - Updated `backend/src/automation.py` with language-independent verification-method selection (`_find_verification_method_button`, excluding passkey options and preferring e-mail/code labels), non-null dict return from `login()`, `_download_button()` selector fallbacks, `_wait_for_processing()` polling for the download control instead of the request button, and a 600s download timeout in `_download_file()`.
  - Updated `backend/src/api/routes.py` `download_export()` to handle dict responses cleanly (including HTTP `401` on `otp_required`).

---

## Containerization & Persistence Improvements
- **`backend/src/paths.py`**: `get_user_data_dir()` checks `CRACKED_OURA_DATA_DIR` first before falling back to OS-specific user directories.
- **`backend/src/automation.py`**:
  - Persists `oura_session.json` inside `get_user_data_dir()` (with automatic migration copy from legacy `os.getcwd()` if present).
  - Respects pre-configured `PLAYWRIGHT_BROWSERS_PATH` (e.g., `/ms-playwright` in Docker).
  - Supports `CRACKED_OURA_FORCE_HEADLESS=1` and adds `--disable-dev-shm-usage` plus `--no-sandbox` / `--disable-setuid-sandbox` when `/.dockerenv` exists or `CRACKED_OURA_NO_SANDBOX=1`.
- **`backend/src/llm.py` & `backend/src/config.py`**: Fixed `DataAnalyst` to read `DB_PATH` from `backend.src.database` (instead of an uninitialized module path) and honor `OLLAMA_HOST` for container-to-host Ollama access.
- **`backend/src/database.py`**: Guarded the emergency crash log writer so missing `~/Documents` directories do not mask startup diagnostics.
- **`backend/src/api/main.py`**: Added `FRONTEND_DIST_DIR` environment override for mounting compiled React static files.
- **`frontend/src/lib/api.ts` & `frontend/src/components/widgets/JSONWidget.tsx`**: Derived `BASE_URL` dynamically (`VITE_API_BASE_URL` or `http://localhost:8000` only for Electron `file://` origin, otherwise same-origin `""`).

---

## Root Docker & Orchestration Files
All orchestration files reside in the project root (`/home/gelma/dev/prg/Cracked-Oura/`):
- `Dockerfile`: Multi-stage build compiling the React bundle (`npm ci && npm run build:web`) and installing Python dependencies + Playwright Chromium (including `libatomic1` for Playwright's bundled Node driver) + `docker-entrypoint.sh`.
- `docker-entrypoint.sh`: Ensures `$CRACKED_OURA_DATA_DIR` (`/data`) ownership matches `${PUID}:${PGID}` and drops root privileges via `setpriv` before starting `uvicorn`.
- `docker-compose.yml`: Exposes port `${CRACKED_OURA_PORT:-8000}:8000`, mounts `${CRACKED_OURA_DATA_PATH:-./data}:/data`, sets `shm_size: "1gb"` for Chromium, and maps `host.docker.internal:host-gateway` for local Ollama.
- `.dockerignore` & `.env.example`: Build context exclusions and environment template (`CRACKED_OURA_PORT`, `CRACKED_OURA_DATA_PATH`, `PUID`, `PGID`, `TZ`, `OLLAMA_HOST`).
- `start.sh` & `stop.sh`: Strict-mode (`set -euo pipefail`) scripts supporting both `docker compose` v2 and `docker-compose` v1, automatically preparing `./data` with host UID/GID ownership.
- `Makefile`: Root entrypoints (`install`, `dev`, `build-docker`, `start`, `stop`, `restart`, `status`, `logs`, `build-frontend`, `build-backend`, `build-desktop`).
- `.gitignore`: Ignores `/data/`.
- `README.md`: Added "Run with Docker" documentation.

---

## Verification Results
1. **Frontend & Backend Local Checks**:
   - `npm install` (without `.npmrc` / `--legacy-peer-deps`) and `npm run build:web` (`tsc -b && vite build`) exited `0`.
   - `npx tsc -p electron/tsconfig.json` and `backend/venv/bin/python -m compileall backend/src` exited `0`.
   - Previous desktop packaging check (`npm run build`) produced `cracked-oura_0.0.0_amd64.deb` and `Cracked Oura-0.0.0.AppImage` in `frontend/dist/`.
2. **Docker Build & End-to-End Runtime Verification**:
   - `docker compose build` succeeded cleanly (`Image cracked-oura:latest Built`).
   - Direct `docker compose up -d` (without pre-creating `./data`) started healthy on port `8000` in 4s, running `uvicorn` as UID/GID `1000:1000` (verified via `/proc/1/status`).
   - `GET /` returned the React SPA (`<title>Cracked Oura</title>`), `GET /api/settings` returned valid JSON, and `GET /api/schema` returned all 13 database model schemas.
   - `automator.initialize(headless=True)` and `automator.cleanup()` succeeded as non-root UID/GID with `PLAYWRIGHT_OK /ms-playwright /data/oura_session.json`.
   - `POST /api/settings` persisted `./data/oura_config.json`, `./data/oura_dashboard.json`, `./data/oura_database.db`, and `./data/backend_debug.log` owned by the host user across `./stop.sh` -> `./start.sh`. Synthetic test `./data` was cleaned up afterward.

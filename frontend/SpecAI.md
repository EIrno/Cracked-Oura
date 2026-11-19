# Cracked Oura - Technical Specifications & Project Status

## Project Overview
Cracked Oura is an open-source desktop application designed to give users complete local access to and ownership of their Oura ring health data without paying for a subscription.

### Architecture
- **Frontend**: Electron desktop wrapper with React 19, TypeScript, Vite, and Tailwind CSS.
- **Backend**: FastAPI running on Python 3.12 with SQLite local storage, PyInstaller packaging into a standalone executable.
- **Packaging**: `electron-builder` creating Linux AppImage and deb packages (as well as macOS / Windows configurations).

## Build Pipeline & Scripts
- `npm run build:backend`: Packages the FastAPI backend using `PyInstaller` using `build.spec` in `../backend`. Result is placed in `../backend/dist/backend`.
- `npm run build`:
  1. Cleans `dist` directory.
  2. Executes `npm run build:backend`.
  3. Executes `tsc -b` (TypeScript frontend compilation).
  4. Runs `vite build` (bundle frontend assets).
  5. Runs `tsc -p electron/tsconfig.json` (Electron main/preload script compilation).
  6. Configures `dist-electron/package.json`.
  7. Runs `electron-builder` to bundle the Electron application, embedded backend binaries, and installer assets into `dist/`.

## Issues Encountered & Resolved
1. **Missing PyInstaller in backend virtual environment**:
   - `build:backend` failed with `No module named PyInstaller`.
   - Fixed by installing `pyinstaller` in `backend/venv` and adding `pyinstaller` to `backend/requirements.txt`.
2. **Missing frontend node_modules and peer dependency resolution**:
   - `tsc` was missing initially because `npm install` had not been executed.
   - `npm install` was blocked by peer dependency conflict between `react-day-picker@8.10.1` and `react@19.x`.
   - Fixed by adding `.npmrc` configured with `legacy-peer-deps=true` and installing dependencies.
3. **Missing package metadata for Debian (.deb) package packaging in electron-builder**:
   - `electron-builder` failed while constructing `.deb` target due to missing `author.email`, `homepage`, and repository info.
   - Updated `frontend/package.json` with author name & email, homepage, and git repository fields.
4. **Verification**:
   - Ran `npm run build` to completion.
   - Generated artifacts in `frontend/dist/`:
     - `cracked-oura_0.0.0_amd64.deb`
     - `Cracked Oura-0.0.0.AppImage`

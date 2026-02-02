# Cracked Oura

Use Oura ring without subscription.

**Project Structure**:
- **frontend/**: Electron + React + TypeScript
- **backend/**: Python + FastAPI + SQLite

## Features

- **Local Database**: All your data is stored locally in an SQLite database (`backend/oura_database.db`).
- **Data Ingestion**: Automation to request data from Oura.
- **Dashboard**: Visualize your data like in the Oura app.
- **AI Analyst**: Ask questions about your health data.
- **Cross-Platform**: Runs on macOS and Windows.

---

## Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 1. Setup Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```

### 3. Run in Development Mode
This will start both the Python backend (with hot-reload) and the Electron app.

```bash
cd frontend
npm run dev
```

---

### Standalone Application

To create a standalone application (`.dmg` for Mac or `.exe` for Windows):

1. **Build the Project**:
   ```bash
   cd frontend
   npm run build
   ```
   *This command automatically compiles the Python backend into a standalone executable using PyInstaller, then builds the Electron app including the backend.*

2. **Output**:
   - The **final application installer** (DMG/EXE) will be in `frontend/dist/` (or `dist` folder).


---

### 2. Windows Support
**Windows Build is Untested**: While the app is designed to be cross-platform, the Windows build (`.exe`) has not been verified on a real Windows machine yet. The windows release will be tested as soon as possible.

---

## Architecture details

When running in **Production** (bundled app), Electron automatically launches the bundled Python executable from `resources/backend`.
When running in **Development** (`npm run dev`), Electron looks for your local `backend/venv` and runs `uvicorn` dynamically.

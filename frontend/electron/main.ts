import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null;
let pythonProcess: ChildProcess | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development';

function createTray() {
    // We are in shell/electron/main.ts (compiled to dist-electron/main.js)
    // So __dirname is shell/dist-electron
    // We need to go up to shell/public
    const iconPath = isDev
        ? path.join(__dirname, '../public/icon.png')
        : path.join(__dirname, '../dist/icon.png');

    console.log("Attempting to load Tray icon from:", iconPath);

    // Use a simple icon or fallback
    let icon = nativeImage.createFromPath(iconPath);

    if (icon.isEmpty()) {
        console.error("Tray icon is EMPTY/MISSING at", iconPath);
        // Try to resize it if it's an SVG? Or maybe it just failed to load.
    } else {
        console.log("Tray icon loaded successfully. Size:", icon.getSize());
        // Resize for macOS tray (usually 16x16 or 22x22)
        icon = icon.resize({ width: 22, height: 22 });
    }

    tray = new Tray(icon);
    tray.setToolTip('Cracked Oura');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Dashboard',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple IPC now, can harden later
        },
        backgroundColor: '#0f1115', // Match our dark theme
        show: false, // Don't show until ready
        title: 'Cracked Oura',
    });

    const devUrl = 'http://localhost:5173';
    const prodPath = path.join(__dirname, '../dist/index.html');

    if (isDev) {
        logToDesktop(`Loading DEV URL: ${devUrl}`);
        mainWindow.loadURL(devUrl);
        // mainWindow.webContents.openDevTools();
    } else {
        logToDesktop(`Loading PROD File: ${prodPath}`);
        mainWindow.loadFile(prodPath).catch(err => {
            logToDesktop(`FAILED to load file: ${err.message}`);
        });
    }

    mainWindow.once('ready-to-show', () => {
        logToDesktop("Window ready to show");
        mainWindow?.show();
    });

    // Debug Renderer Crashes
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        logToDesktop(`PAGE LOAD FAILED: ${errorCode} - ${errorDescription}`);
    });

    mainWindow.webContents.on('render-process-gone', (event, details) => {
        logToDesktop(`Renderer Process GONE. Reason: ${details.reason}`);
    });

    // HIDE instead of close
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function getPythonPath(): string {
    if (!isDev) {
        // Production: Backend is bundled inside the app
        // In macOS .app: Contents/Resources/backend/backend
        // In Windows/Linux: resources/backend/backend(.exe)
        const possiblePath = path.join(process.resourcesPath, 'backend', 'backend');
        // On Windows it might have .exe extension, but child_process.spawn handles it if we don't specify extension? 
        // Best to check specific platform or try specific paths.
        if (process.platform === 'win32') {
            return path.join(process.resourcesPath, 'backend', 'backend.exe');
        }
        return possiblePath;
    }

    // Development: Use local venv
    // Check standard locations
    const venvRoot = path.join(__dirname, '../../backend/venv');
    const binPath = path.join(venvRoot, 'bin', 'python'); // Mac/Linux
    const scriptsPath = path.join(venvRoot, 'Scripts', 'python.exe'); // Windows

    // We can't easily check file existence synchronously in specific setups without 'fs', 
    // but we can try to rely on platform.
    if (process.platform === 'win32') {
        return scriptsPath;
    }
    return binPath;
}

// Debug logging helper
function logToDesktop(message: string) {
    try {
        const logPath = path.join(app.getPath('documents'), 'cracked_oura_electron_debug.log');
        const timestamp = new Date().toISOString();
        require('fs').appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
}

function startPythonBackend() {
    const exePath = getPythonPath();
    console.log('Starting Backend from:', exePath);
    logToDesktop(`Attempting to start backend from: ${exePath}`);

    if (isDev) {
        logToDesktop("Running in DEV mode");
        // Run with uvicorn via python -m
        pythonProcess = spawn(exePath, [
            '-m', 'uvicorn',
            'backend.src.api.main:app',
            '--host', '127.0.0.1',
            '--port', '8000',
            '--reload'
        ], {
            cwd: path.join(__dirname, '../../'),
            stdio: 'inherit'
        });
    } else {
        logToDesktop("Running in PROD mode");
        // Production: Run the compiled executable directly

        if (!require('fs').existsSync(exePath)) {
            logToDesktop(`CRITICAL ERROR: Backend executable NOT FOUND at ${exePath}`);
        } else {
            logToDesktop(`Backend executable confirmed at ${exePath}`);
        }

        try {
            // It starts uvicorn internally (if main.py calls uvicorn.run)
            pythonProcess = spawn(exePath, [], {
                cwd: path.dirname(exePath), // Run from its own directory to find dependencies/relative files
                stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout/stderr
                env: { ...process.env, PORT: '8000' } // Pass port if needed
            });
            logToDesktop(`Backend process spawned with PID: ${pythonProcess ? pythonProcess.pid : 'NULL'}`);
        } catch (spawnError: any) {
            logToDesktop(`CRITICAL SPAWN ERROR: ${spawnError.message}`);
        }
    }

    if (pythonProcess) {
        // Capture Standard Output
        if (pythonProcess.stdout) {
            pythonProcess.stdout.on('data', (data) => {
                logToDesktop(`[STDOUT] ${data.toString().trim()}`);
            });
        }

        // Capture Standard Error (Critical for startup crashes)
        if (pythonProcess.stderr) {
            pythonProcess.stderr.on('data', (data) => {
                logToDesktop(`[STDERR] ${data.toString().trim()}`);
            });
        }

        pythonProcess.on('error', (err) => {
            console.error('Failed to start Python backend:', err);
            logToDesktop(`Backend Process ERROR: ${err.message}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python backend exited with code ${code}`);
            logToDesktop(`Backend Process EXITED with code: ${code}`);
        });
    } else {
        logToDesktop("pythonProcess is undefined after attempt!");
    }
}

app.on('ready', () => {
    startPythonBackend();
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    // Do NOT quit. We want to stay alive in the tray.
    if (process.platform !== 'darwin') {
        // On Windows/Linux we might want to quit if tray is not used, 
        // but here we ARE using tray, so we stay alive.
        // app.quit(); 
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

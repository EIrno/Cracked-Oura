import os
import sys
import logging
from pathlib import Path

logger = logging.getLogger("Paths")

def get_user_data_dir() -> Path:
    """
    Returns the platform-specific user data directory for the application.
    - Windows: %APPDATA%/CrackedOura
    - macOS: ~/Library/Application Support/CrackedOura
    - Linux: ~/.local/share/CrackedOura
    """
    app_name = "CrackedOura"
    
    if sys.platform == "win32":
        path = Path(os.getenv("APPDATA")) / app_name
    elif sys.platform == "darwin":
        path = Path.home() / "Library" / "Application Support" / app_name
    else:
        # Linux / Fallback
        path = Path.home() / ".local" / "share" / app_name

    # Ensure the directory exists
    try:
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        # Fallback to home/cracked_oura just in case
        fallback = Path.home() / ".cracked_oura"
        logger.warning(f"Failed to create user data dir at {path}. Falling back to {fallback}. Error: {e}")
        path = fallback
        try:
             path.mkdir(parents=True, exist_ok=True)
        except:
             pass # Last resort
        
    return path

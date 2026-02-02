import json
import os
import threading
import logging
from typing import Dict, Any, Optional

from .paths import get_user_data_dir

CONFIG_FILE = "oura_config.json"
DASHBOARD_FILE = "oura_dashboard.json"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ConfigManager")

class ConfigManager:
    """
    Manages application configuration and dashboard state.
    Handles reading/writing to JSON files with thread safety.
    """
    def __init__(self):
        self.data_dir = get_user_data_dir()
        self.config_path = os.path.join(self.data_dir, CONFIG_FILE)
        self.dashboard_path = os.path.join(self.data_dir, DASHBOARD_FILE)
        self._lock = threading.Lock()
        self._ensure_config()

    def _ensure_config(self):
        """Ensures configuration files exist, creating defaults if necessary."""
        # 1. Ensure main config exists
        if not os.path.exists(self.config_path):
            default_config = {
                "email": "",
                "schedule_time": "11:00", # Default 11 AM
                "last_run": None,
                "next_run": None,
                "status": "Idle",
                "is_active": True,
                "headless": True,
                "llm_model": "llama3.1:latest",
                "llm_host": "http://localhost:11434"
            }
            self._save_file(self.config_path, default_config)

        # 2. Ensure dashboard config exists (or migrate)
        main_conf = self._load_file(self.config_path)
        
        # 2. Ensure dashboard config exists
        if not os.path.exists(self.dashboard_path):
             # Create empty default if doesn't exist
             self._save_file(self.dashboard_path, {"dashboard": {"dashboards": [], "activeDashboardId": None}})

    def _load_file(self, path: str) -> Dict[str, Any]:
        """Loads JSON content from a file safely."""
        try:
            if not os.path.exists(path):
                return {}
            with open(path, 'r') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except Exception as e:
            logger.error(f"Error loading config from {path}: {e}")
            return {}

    def _save_file(self, path: str, data: Dict[str, Any]):
        """Saves data to a JSON file atomically."""
        import uuid
        tmp_path = f"{path}.{uuid.uuid4()}.tmp"
        try:
            with open(tmp_path, 'w') as f:
                json.dump(data, f, indent=4)
                f.flush()
                # Ensure write to disk
                os.fsync(f.fileno())
            # Atomic rename
            os.replace(tmp_path, path)
        except Exception as e:
            logger.error(f"Error saving config to {path}: {e}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def get_config(self) -> Dict[str, Any]:
        """Returns merged configuration from both config and dashboard files."""
        with self._lock:
            main_conf = self._load_file(self.config_path)
            dash_conf = self._load_file(self.dashboard_path)
            
            # Merge: dashboard config overrides main if keys collide
            return {**main_conf, **dash_conf}

    def update_config(self, **kwargs):
        """Updates configuration, routing keys to the appropriate file based on context."""
        with self._lock:
            main_conf = self._load_file(self.config_path)
            dash_conf = self._load_file(self.dashboard_path)
            
            main_changed = False
            dash_changed = False
            
            for key, value in kwargs.items():
                if value is None: continue
                
                if key == "dashboard":
                    # Dashboard update
                    dash_conf["dashboard"] = value
                    dash_changed = True
                else:
                    # General config update
                    main_conf[key] = value
                    main_changed = True
            
            if main_changed:
                self._save_file(self.config_path, main_conf)
            if dash_changed:
                self._save_file(self.dashboard_path, dash_conf)

    def update_status(self, status: str, **kwargs):
        """
        Helper to update status specific fields in the main config.
        Accepts flexible kwargs like 'message', 'last_run', 'next_run'.
        """
        self.update_config(status=status, **kwargs)

config_manager = ConfigManager()

import asyncio
import os
import logging
from playwright.async_api import async_playwright, expect, Page, BrowserContext, Browser
from typing import Optional, Dict, Any, Union

from .config import config_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OuraAutomator")

class OuraAutomator:
    """
    Automates Oura Web Dashboard interactions using Playwright.
    Handles Login, OTP verification, Data Export request, and File Download.
    """
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self._is_initialized = False
        self.storage_state_path = os.path.join(os.getcwd(), "oura_session.json")
        self.email: Optional[str] = None
        self.password: Optional[str] = None
        self.base_url = "https://membership.ouraring.com"
        self.export_url = f"{self.base_url}/data-export"

        # Configure Playwright Browser Path
        from .paths import get_user_data_dir
        
        # Use a writable directory for browsers
        self.browser_dir = os.path.join(get_user_data_dir(), "browsers")
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = self.browser_dir

    async def initialize(self, headless: Optional[bool] = None):
        """Initializes the Playwright browser session."""
        if self._is_initialized:
            return

        # Ensure browser is installed
        await self._ensure_browser_installed()

        # If headless not provided, read from config
        if headless is None:
            config = config_manager.get_config()
            headless = config.get("headless", True)
        
        # Load credentials from config if not already set
        if not self.email:
            config = config_manager.get_config()
            self.email = config.get("email")
            self.password = config.get("password")

        logger.info(f"Initializing Playwright (Headless: {headless})")
        self.playwright = await async_playwright().start()
        
        try:
            self.browser = await self.playwright.chromium.launch(headless=headless, args=["--start-maximized"])
        except Exception as e:
            logger.error(f"Failed to launch browser: {e}")
            logger.info("Retrying installation...")
            await self._ensure_browser_installed(force=True)
            self.browser = await self.playwright.chromium.launch(headless=headless, args=["--start-maximized"])
        
        # Load session if exists
        state = self.storage_state_path if os.path.exists(self.storage_state_path) else None
        if state:
            logger.info(f"Loading session from {state}")
            
        self.context = await self.browser.new_context(
            viewport={"width": 1920, "height": 1080},
            storage_state=state
        )
            
        self.page = await self.context.new_page()
        self._is_initialized = True

    async def _ensure_browser_installed(self, force=False):
        """Checks if Chromium is installed and installs it if missing."""
        import sys
        
        # Check if we suspect it's missing (simple check: is the dir empty?)
        if not force and os.path.exists(self.browser_dir) and os.listdir(self.browser_dir):
            return

        logger.info("Installing Playwright Chromium browser...")
        config_manager.update_status("Installing dependency (Chromium)...")
        
        try:
            # Import internal driver helpers to find the bundled Node.js
            from playwright._impl._driver import compute_driver_executable, get_driver_env
            
            driver_executable, driver_cli = compute_driver_executable()
            env = get_driver_env()
            
            # Use the bundled Node.js to run the install command directly
            # This avoids recursive app launching
            
            logger.info(f"Using driver: {driver_executable} {driver_cli}")
            
            process = await asyncio.create_subprocess_exec(
                driver_executable, driver_cli, "install", "chromium",
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"Browser install failed: {stderr.decode()}")
                raise Exception(f"Failed to install browser: {stderr.decode()}")
            
            logger.info("Browser installed successfully.")
            
        except Exception as e:
            logger.error(f"Browser installation error: {e}")
            raise e

    async def start_login(self, email: str):
        """Initiates the login process with the provided email."""
        if not self._is_initialized:
            await self.initialize()
        self.email = email
        return await self.login()

    async def cleanup(self):
        """Closes browser resources and stops Playwright."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        self._is_initialized = False
        logger.info("OuraAutomator cleaned up.")

    async def clear_session(self) -> bool:
        """Clears stored session file and closes browser resources."""
        await self.cleanup()
        if os.path.exists(self.storage_state_path):
            os.remove(self.storage_state_path)
            logger.info("Session file removed.")
            return True
        return False

    async def save_context(self):
        """Saves current browser context (cookies/local storage) to disk."""
        if self.context:
            await self.context.storage_state(path=self.storage_state_path)
            logger.info(f"Session saved to {self.storage_state_path}")

    # --- Login Logic ---

    async def login(self) -> Union[None, Dict[str, str]]:
        """
        Executes the login flow.
        Returns None if already logged in, or a status dictionary if further action (like OTP) is needed.
        """
        if not self.page:
            raise Exception("Page not initialized")

        logger.info("Checking login status...")
        try:
            # Check if already on the correct domain or redirect to it
            if self.base_url in self.page.url:
                 pass
            else:
                 await self.page.goto(self.base_url, timeout=60000)
            
            await self.page.wait_for_load_state("networkidle", timeout=10000)
            
            if self._is_logged_in():
                logger.info("Already logged in.")
                await self.save_context()
                return

            logger.info("Not logged in. Attempting login...")
            if not self.email:
                raise Exception("Login required but no email configured.")

            return await self._perform_login_actions()

        except Exception as e:
            logger.error(f"Login error: {e}")
            raise e

    def _is_logged_in(self) -> bool:
        """Determines if user is logged in based on current URL."""
        if not self.page: return False
        url = self.page.url.rstrip('/')
        return (url == self.base_url) and ("login" not in url) and ("authn" not in url)

    async def _perform_login_actions(self) -> Dict[str, str]:
        """Interacts with the login form, handling email submission and checking for OTP requirements."""
        if "login" not in self.page.url and "authn" not in self.page.url:
             await self.page.goto(f"{self.base_url}/login", timeout=30000)

        # Fill Email
        logger.info(f"Filling email: {self.email}")
        email_input = self.page.locator("input[name='username']")
        if not await email_input.is_visible():
             email_input = self.page.locator("input[type='email']")
        
        if not await email_input.is_visible():
            raise Exception("Could not find email input.")

        await email_input.fill(self.email)
        await self.page.dispatch_event("input[name='username']", 'input') 
        
        await self._click_submit()
        
        # Check for OTP or Password requirements
        otp_status = await self._check_otp_screen()
        if otp_status:
            return otp_status

        # Password fallback (unlikely for Oura's current flow but retained for robustness)
        password_input = self.page.locator("input[type='password']")
        if await password_input.is_visible():
             if not self.password:
                 raise Exception("Password required but not configured.")
             await password_input.fill(self.password)
             await self.page.keyboard.press("Enter")
        
        # Final Verification
        await self.page.wait_for_load_state("networkidle")
        if not self._is_logged_in():
             # Re-check OTP in case of network lag
             if await self._check_otp_screen():
                 return {"status": "otp_required", "message": "OTP required"}
             raise Exception("Login failed or incomplete.")
        
        logger.info("Login process completed successfully.")
        await self.save_context()
        return {"status": "success", "message": "Login successful"}

    async def _click_submit(self):
        """Clicks the submit button, handling various potential selectors."""
        submit_btn = self.page.locator("button[type='submit']")
        if not await submit_btn.is_visible():
            submit_btn = self.page.locator("#submit-button")
        
        if await submit_btn.is_visible():
            await submit_btn.click()
        else:
            await self.page.keyboard.press("Enter")
        
        await self.page.wait_for_timeout(3000)

    async def _check_otp_screen(self):
        """Checks if OTP screen is active and handles the 'Send Code' intermediate step if present."""
        # Check for "Send code" intermediate page
        intermediate_btn = self.page.locator("button[name='selectedId']")
        otp_input_name = self.page.locator("input[name='otp']")
        otp_input_id = self.page.locator("#otp-code")

        if await intermediate_btn.is_visible() and \
           not await otp_input_name.is_visible() and \
           not await otp_input_id.is_visible():
            logger.info("Found intermediate 'Send Code' button. Clicking...")
            await intermediate_btn.click()
            await self.page.wait_for_timeout(3000)

        # Check for OTP input visibility
        if await otp_input_name.is_visible() or await otp_input_id.is_visible():
            logger.info("OTP Login required.")
            return {"status": "otp_required", "message": "OTP required"}
        return None

    async def submit_otp(self, otp: str):
        """Submits the provided OTP code to the active session."""
        if not self.page:
            return {"status": "error", "message": "Page not initialized"}

        logger.info(f"Submitting OTP: {otp}")
        try:
            # Locate OTP Input
            otp_selector = "input[name='otp']"
            if not await self.page.locator(otp_selector).is_visible():
                if await self.page.locator("#otp-code").is_visible():
                    otp_selector = "#otp-code"
                elif await self.page.locator("input[name='verification_code']").is_visible():
                    otp_selector = "input[name='verification_code']"
                else:
                    raise Exception("Could not find OTP input field")
            
            await self.page.fill(otp_selector, otp)
            await self.page.dispatch_event(otp_selector, 'input')
            
            await self._click_submit()
            await self.page.wait_for_load_state("networkidle")
            
            # Verify success
            if self._is_logged_in():
                logger.info("OTP Accepted. Login successful.")
                await self.save_context()
                return {"status": "success", "message": "Login successful!"}
            else:
                 if await self.page.get_by_text("Virheellinen koodi").is_visible() or \
                    await self.page.get_by_text("Invalid code").is_visible():
                     return {"status": "error", "message": "Invalid OTP code."}
                 return {"status": "error", "message": "Login failed (Unknown state)."}

        except Exception as e:
            logger.error(f"OTP submission error: {e}")
            return {"status": "error", "message": str(e)}

    # --- Data Export Logic ---

    async def request_new_export_and_download(self, save_dir: str) -> Optional[str]:
        """
        Orchestrates the entire data export flow:
        1. Navigate to export page.
        2. Request a new export (if not already processing).
        3. Wait for Oura to generate the export (polling).
        4. Download the file.
        """
        logger.info("Starting Data Request Flow...")
        if not self._is_initialized:
            await self.initialize()

        if not self.page:
            self.page = await self.context.new_page()

        try:
            # 1. Navigate
            if not await self._navigate_to_export_page():
                # Check if stuck on Login/OTP
                if "login" in self.page.url or "authn" in self.page.url:
                     return {"status": "otp_required"}
                return None

            # 2. Click Request Button (if available)
            if await self._click_request_export_button():
                logger.info("Export requested. Waiting for processing...")
            else:
                logger.info("Export might already be requested or button not found.")

            # 3. Wait for Processing
            is_ready = await self._wait_for_processing()
            if not is_ready:
                logger.warning("Timed out waiting for export processing.")
                return None

            # 4. Download
            return await self._download_file(save_dir)

        except Exception as e:
            logger.error(f"Request automation failed: {e}")
            return None

    async def download_existing_export(self, save_dir: str) -> Optional[str]:
        """
        Attempts to download an existing export without requesting a new one.
        Useful for quick checks or retrying a download.
        """
        logger.info("Starting Download Only Flow...")
        if not self._is_initialized:
            await self.initialize()

        if not self.page:
            self.page = await self.context.new_page()

        try:
            if not await self._navigate_to_export_page():
                return {"status": "otp_required"}

            return await self._download_file(save_dir)

        except Exception as e:
            logger.error(f"Download automation failed: {e}")
            return {"status": "error", "message": str(e)}

    async def _navigate_to_export_page(self) -> bool:
        """Navigates to the export page, handling potential login redirects and re-tries."""
        logger.info(f"Navigating to {self.export_url}")
        await self.page.goto(self.export_url, timeout=60000)
        
        # Poll for URL correctness (handling redirects)
        for _ in range(10): # 10s timeout
            try:
                await self.page.wait_for_load_state("networkidle", timeout=2000)
            except: 
                pass
                
            current_url = self.page.url
            if "/data-export" in current_url:
                logger.info("Successfully arrived at data-export page.")
                return True
            
            # Handle Login Redirect
            if "login" in current_url or "authn" in current_url:
                logger.info("Redirected to login. Logging in...")
                login_result = await self.login()
                if login_result and login_result.get("status") == "otp_required":
                     return False
                # Retry nav after login
                await self.page.goto(self.export_url, timeout=30000)
            
            # Handle Home Page redirect (sometimes happens on first load)
            elif current_url.rstrip('/') == self.base_url:
                logger.info("Landed on Home Page. Retrying navigation to Export...")
                await self.page.goto(self.export_url, timeout=30000)
                
            await self.page.wait_for_timeout(1000)

        # Final check
        if "/data-export" not in self.page.url:
             logger.warning(f"Failed to reach export page. Current URL: {self.page.url}")
             return False
             
        return True

    async def _click_request_export_button(self) -> bool:
        """Finds and clicks the 'Request data export' button, handling various states (disabled, aria attributes)."""
        # Find Request Button (Try likely selectors)
        target_btn = self.page.locator('[data-testid="pageSubtitle"] + button').first
        try:
             await target_btn.wait_for(state="visible", timeout=5000)
        except:
             pass

        if not await target_btn.is_visible():
            target_btn = self.page.locator('main button').first
            try:
                 await target_btn.wait_for(state="visible", timeout=5000)
            except:
                 pass

        if not await target_btn.is_visible():
            return False

        # Wait briefly for hydration
        await self.page.wait_for_timeout(5000)

        # Check if explicitly disabled in DOM
        is_disabled = await target_btn.get_attribute("disabled") is not None
        aria_disabled = await target_btn.get_attribute("aria-disabled") == "true"

        if is_disabled or aria_disabled:
             return False

        # Attempt Click 
        try:
            # We try to wait for enabled state, but don't strictly block on it in case of UI quirks
            try:
                 await target_btn.wait_for(state="enabled", timeout=3000)
            except:
                 pass 
            
            logger.info("Found Request button. Clicking...")
            await target_btn.click(timeout=5000)
            
            # Wait for state change confirmation
            await self.page.wait_for_timeout(2000)
            return True
        except Exception as e:
            logger.error(f"Click failed: {e}")
            return False

    async def _wait_for_processing(self) -> bool:
        """Polls until the request button is re-enabled, indicating report generation is complete."""
        max_retries = 30 # Approx 2.5 hours total wait time
        poll_interval = 300 # 5 minutes between checks
        
        for i in range(max_retries):
            # Check if Request button is enabled again (indicating download is ready)
            request_btn = self.page.locator('[data-testid="pageSubtitle"] + button').first
            if not await request_btn.is_visible():
                request_btn = self.page.locator('main button').first
            
            if await request_btn.is_visible() and await request_btn.is_enabled():
                return True # Export is ready
            
            logger.info(f"Processing... (Attempt {i+1}/{max_retries}) - Next check in {poll_interval}s")
            await self.page.wait_for_timeout(poll_interval * 1000)
            await self.page.reload()
            await self.page.wait_for_load_state("networkidle")
            
        return False

    async def _download_file(self, save_dir: str) -> Optional[str]:
        """Finds the download button and handles the file save dialog."""
        download_btn = self.page.locator("button[aria-label='Download data']").first
        try:
            await download_btn.wait_for(state="visible", timeout=10000)
        except:
            pass 
            
        if await download_btn.is_visible():
            logger.info("Download button found. Clicking...")
            async with self.page.expect_download() as download_info:
                await download_btn.click()
            
            download = await download_info.value
            filename = download.suggested_filename
            save_path = os.path.join(save_dir, filename)
            await download.save_as(save_path)
            logger.info(f"Downloaded to {save_path}")
            return save_path
        
        logger.warning("Download button not found.")
        return None

automator = OuraAutomator()

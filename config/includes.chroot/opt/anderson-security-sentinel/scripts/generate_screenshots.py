import os
import sys
import time
import subprocess
import cv2
import numpy as np
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = REPO_DIR / "assets" / "screenshots"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)
INTRUDERS_DIR = Path.home() / ".config" / "anderson_security" / "intruders"
INTRUDERS_DIR.mkdir(parents=True, exist_ok=True)

# Generate dummy intruder snapshot if none exist
def ensure_sample_intruder_photos():
    for i in range(1, 4):
        p = INTRUDERS_DIR / f"intruder_20261004_215{i}43_{30+i}pct.jpg"
        if not p.exists():
            img = np.zeros((240, 320, 3), dtype=np.uint8)
            cv2.rectangle(img, (20, 20), (300, 220), (20, 25, 35), -1)
            cv2.circle(img, (160, 100), 45, (80, 90, 110), -1)
            cv2.ellipse(img, (160, 190), (70, 45), 0, 0, 180, (80, 90, 110), -1)
            cv2.rectangle(img, (90, 40), (230, 200), (0, 0, 255), 2)
            cv2.putText(img, f"BREACH #{i}", (100, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            cv2.imwrite(str(p), img)

def main():
    ensure_sample_intruder_photos()
    
    port = 7895
    print(f"[ScreenshotEngine] Starting Anderson Sentinel server on port {port}...")
    server_process = subprocess.Popen(
        ["/opt/zothos-ai-env/bin/python3", str(REPO_DIR / "run.py"), "--port", str(port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for server to bind
    time.sleep(3)
    
    url = f"http://localhost:{port}"
    print(f"[ScreenshotEngine] Capturing high-DPI screenshots from {url}...")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/usr/bin/google-chrome",
                headless=True,
                args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
            )
            
            # 1. Desktop Dashboard View (Retina 2x, 1560x1000)
            context = browser.new_context(
                viewport={"width": 1560, "height": 1000},
                device_scale_factor=2
            )
            page = context.new_page()
            page.goto(url, wait_until="networkidle")
            time.sleep(2)
            
            desktop_shot = ASSETS_DIR / "01_dashboard_desktop.png"
            page.screenshot(path=str(desktop_shot), full_page=False)
            print(f"[ScreenshotEngine] Saved Desktop HUD: {desktop_shot}")
            
            # 2. Breach Alert Mode Simulation (activate alert banner)
            page.evaluate("""() => {
                const banner = document.getElementById('intruderAlertBanner');
                if (banner) {
                    banner.classList.add('active');
                    banner.style.display = 'flex';
                }
            }""")
            time.sleep(1)
            breach_shot = ASSETS_DIR / "02_breach_alert_mode.png"
            page.screenshot(path=str(breach_shot), full_page=False)
            print(f"[ScreenshotEngine] Saved Breach Alert Shot: {breach_shot}")
            
            # 3. WiFi X-Ray Spatial Radar Focused View
            xray_card = page.locator('.wifi-xray-card')
            if xray_card.count() > 0:
                time.sleep(1)
                xray_shot = ASSETS_DIR / "03_wifi_xray_spatial_radar.png"
                xray_card.screenshot(path=str(xray_shot))
                print(f"[ScreenshotEngine] Saved WiFi X-Ray Radar HUD: {xray_shot}")

            # 4. Thermal FLIR Vision Optics Mode
            btn_thermal = page.locator('#btnOpticsThermal')
            if btn_thermal.count() > 0:
                btn_thermal.click()
                time.sleep(2)
                video_card = page.locator('.video-card')
                if video_card.count() > 0:
                    thermal_shot = ASSETS_DIR / "04_thermal_flir_vision.png"
                    video_card.screenshot(path=str(thermal_shot))
                    print(f"[ScreenshotEngine] Saved Thermal FLIR Vision: {thermal_shot}")

            # 5. Mobile View (iPhone 15 Pro resolution: 430x932, 2x scale)
            context_mobile = browser.new_context(
                viewport={"width": 430, "height": 932},
                device_scale_factor=2
            )
            page_mobile = context_mobile.new_page()
            page_mobile.goto(url, wait_until="networkidle")
            time.sleep(2)
            mobile_shot = ASSETS_DIR / "05_mobile_responsive_view.png"
            page_mobile.screenshot(path=str(mobile_shot), full_page=True)
            print(f"[ScreenshotEngine] Saved Mobile Responsive: {mobile_shot}")
            
            # 6. OpenGraph Social Card (1200x630)
            context_og = browser.new_context(
                viewport={"width": 1200, "height": 630},
                device_scale_factor=1
            )
            page_og = context_og.new_page()
            page_og.goto(url, wait_until="networkidle")
            time.sleep(1.5)
            og_shot = ASSETS_DIR / "06_opengraph_preview.png"
            page_og.screenshot(path=str(og_shot), full_page=False)
            print(f"[ScreenshotEngine] Saved OpenGraph Banner: {og_shot}")
            
            browser.close()
            
    finally:
        print("[ScreenshotEngine] Terminating temporary server process...")
        server_process.terminate()
        server_process.wait()
        print("[ScreenshotEngine] Done!")

if __name__ == "__main__":
    main()

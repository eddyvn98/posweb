import subprocess
import os
import re
import time
import requests
import sys


def update_file(filepath, pattern, replacement):
    if not os.path.exists(filepath):
        print(f"⚠️ Warning: {filepath} not found")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(pattern, replacement, content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"✅ Updated {filepath}")


def extract_url_from_log(log_path, timeout=60):
    """Wait until cloudflared writes a trycloudflare.com URL to the log file."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        if os.path.exists(log_path):
            try:
                with open(log_path, "rb") as f:
                    content = f.read()
                for enc in ['utf-16le', 'utf-8', 'latin-1']:
                    try:
                        text = content.decode(enc)
                        # Check for rate limit error
                        if "429" in text or "Too Many Requests" in text:
                            print(f"⛔ Rate limit hit (429). Will retry in 30s...")
                            return None, True  # (url, rate_limited)
                        match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", text)
                        if match:
                            return match.group(0), False
                    except:
                        pass
            except Exception:
                pass
        time.sleep(2)
    return None, False


def start_single_tunnel(cf_path, port, log_path, label):
    """Start one cloudflared tunnel and return (process, url)."""
    print(f"🚀 Starting {label} tunnel (port {port})...")

    log_out = open(log_path, "w")
    process = subprocess.Popen(
        [cf_path, "tunnel", "--url", f"http://localhost:{port}"],
        stdout=log_out, stderr=subprocess.STDOUT
    )

    url, rate_limited = extract_url_from_log(log_path, timeout=60)

    if rate_limited:
        process.terminate()
        log_out.close()
        return None, None

    if url:
        print(f"🔗 {label} Tunnel: {url}")
    else:
        print(f"❌ Could not get {label} URL within timeout")
        process.terminate()

    return process, url


def notify_backend_with_retry(fe_url, max_retries=10, delay=3):
    """Retry POST to backend until it's ready."""
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(
                "http://localhost:3001/api/admin/config/webapp-url",
                json={"url": fe_url},
                timeout=5
            )
            if resp.status_code == 200:
                print(f"✅ Telegram Bot URL updated! → {fe_url}")
                return True
            print(f"⚠️ Backend responded {resp.status_code}, retry {attempt}/{max_retries}...")
        except Exception as e:
            print(f"⏳ Backend not ready ({attempt}/{max_retries}): {e}")
        time.sleep(delay)
    print("❌ Could not notify backend after all retries.")
    return False


def start_tunnels():
    cf_path = r"d:\CinemaProject\cloudflared.exe"

    # --- Start BACKEND tunnel first ---
    be_process, be_url = start_single_tunnel(cf_path, 3001, "be_tunnel.log", "Backend")
    if not be_url:
        print("\n⏳ Waiting 35s before trying frontend tunnel (avoid rate limit)...")
        time.sleep(35)

    # --- Delay before frontend tunnel to avoid 429 ---
    print("\n⏳ Waiting 15s before starting frontend tunnel (avoid rate limit)...")
    time.sleep(15)

    # --- Start FRONTEND tunnel ---
    fe_process, fe_url = start_single_tunnel(cf_path, 5173, "fe_tunnel.log", "Frontend")

    if not fe_url:
        print("❌ Frontend tunnel failed. Try running the script again in 1-2 minutes.")
        sys.exit(1)

    if be_url and fe_url:
        # Update config files
        update_file("bot_backend/.env", r"WEB_APP_URL=.*", f"WEB_APP_URL={fe_url}")
        update_file(".env.local", r"VITE_API_URL=.*", f"VITE_API_URL={be_url}/api")

        print("\n✨ ALL TUNNELS READY!")
        print(f"  Frontend: {fe_url}")
        print(f"  Backend:  {be_url}")

        # Update bot URL
        notify_backend_with_retry(fe_url)
    elif fe_url and not be_url:
        # Only frontend tunnel succeeded - direct frontend to call backend via tunnel's own URL
        print(f"\n⚠️ Only frontend tunnel available: {fe_url}")
        print("Backend tunnel failed - check if cloudflared rate limit persists.")

    print("\n🟢 Keep this window open to maintain tunnels. Press Ctrl+C to stop.")
    while True:
        time.sleep(10)


if __name__ == "__main__":
    try:
        start_tunnels()
    except KeyboardInterrupt:
        print("\n👋 Stopping tunnels...")
        sys.exit(0)

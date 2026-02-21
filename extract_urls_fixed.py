import re
import os

def extract_url(filepath):
    if not os.path.exists(filepath):
        return f"File {filepath} not found"
    with open(filepath, 'rb') as f:
        content = f.read()
        # Decode as utf-16le and ignore errors, or just search in raw bytes
        try:
            text = content.decode('utf-16le')
        except:
            text = content.decode('utf-8', errors='ignore')
        
        match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', text)
        if match:
            return match.group(0)
    return "URL not found"

print(f"FE_URL: {extract_url('fe_tunnel.log')}")
print(f"BE_URL: {extract_url('be_tunnel.log')}")

import re
import os

def extract_url(file_path):
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', content)
        if match:
            return match.group(0)
    return "URL not found"

fe_url = extract_url(r'd:\posweb\fe_tunnel_new.log')
be_url = extract_url(r'd:\posweb\be_tunnel_new.log')

print(f"FE_URL: {fe_url}")
print(f"BE_URL: {be_url}")

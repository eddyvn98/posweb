import re
import os

def extract_url(file_path):
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
    with open(file_path, 'rb') as f:
        content = f.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', content)
        if matches:
            return matches[-1] # Get the latest one
    return "URL not found"

fe_url = extract_url(r'd:\posweb\fe_final.log')
be_url = extract_url(r'd:\posweb\be_final.log')

print(f"FE_URL: {fe_url}")
print(f"BE_URL: {be_url}")

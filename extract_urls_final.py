import re
import os

def extract_url(filepaths):
    for filepath in filepaths:
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'rb') as f:
            content = f.read()
            # Try multiple decodings
            for enc in ['utf-16le', 'utf-8', 'latin-1']:
                try:
                    text = content.decode(enc)
                    match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', text)
                    if match:
                        return match.group(0)
                except:
                    continue
    return "URL not found"

print(f"BE_URL: {extract_url(['be.log', 'be_err.log'])}")
print(f"FE_URL: {extract_url(['fe.log', 'fe_err.log'])}")

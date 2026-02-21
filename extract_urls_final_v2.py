import re
import os

def extract_url(filepaths):
    urls = []
    for filepath in filepaths:
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'rb') as f:
            content = f.read()
            for enc in ['utf-16le', 'utf-8', 'latin-1']:
                try:
                    text = content.decode(enc)
                    matches = re.findall(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', text)
                    urls.extend(matches)
                except:
                    continue
    return list(set(urls))

print("BE_URLS:", extract_url(['be.log', 'be_err.log']))
print("FE_URLS:", extract_url(['fe.log', 'fe_err.log']))

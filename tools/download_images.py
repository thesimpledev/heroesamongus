"""Download selected photographs from Wikimedia Commons into assets/.
Requires: python -m pip install requests
Run from project root: python tools/download_images.py
Each image's author, license and source are recorded in data/heroes.json.
"""
import json
from pathlib import Path
from urllib.parse import quote
import requests

root = Path(__file__).resolve().parents[1]
heroes = json.loads((root / 'data/heroes.json').read_text())
session = requests.Session()
session.headers['User-Agent'] = 'GoodPeopleSiteStarter/0.1 (educational static website; image download)'
for hero in heroes:
    filename = hero['imageCredit']['source'].split('/wiki/File:', 1)[1]
    url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + quote(filename, safe='')
    path = root / hero['image'].lstrip('/')
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        res = session.get(url, timeout=30)
        res.raise_for_status()
        if not res.headers.get('Content-Type','').startswith('image/'):
            raise ValueError(f'Not an image: {res.headers.get("Content-Type")}')
        path.write_bytes(res.content)
        print(f'✓ {hero["name"]}: {path.name} ({len(res.content):,} bytes)')
    except Exception as exc:
        print(f'✗ {hero["name"]}: {exc} | Source: {hero["imageCredit"]["source"]}')

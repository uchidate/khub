#!/usr/bin/env python3
"""
Find a cover image from multiple sources and optionally upload it to the site.
Sources: TMDb (backdrops/landscapes), Pexels, Pixabay, Wikimedia Commons

Usage:
  python3 scripts/find-cover-image.py "Park Bo-young"
  python3 scripts/find-cover-image.py "Jennie BLACKPINK" --upload
  python3 scripts/find-cover-image.py "Crash Landing on You" --type backdrop
  python3 scripts/find-cover-image.py "IVE kpop" --upload --base-url https://staging.hallyuhub.com.br

Env vars (optional, read from .env automatically):
  TMDB_API_KEY
  PEXELS_API_KEY
  PIXABAY_API_KEY
  UNSPLASH_ACCESS_KEY
  SESSION_TOKEN  (next-auth session token for --upload)
"""

import sys
import os
import json
import argparse
import tempfile
import urllib.request
import urllib.parse

USER_AGENT = "HallyuHub/1.0 (+https://hallyuhub.com.br)"

# ---------------------------------------------------------------------------
# Env loader
# ---------------------------------------------------------------------------

def load_env():
    """Load .env from project root into os.environ (only if not already set)."""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    env_path = os.path.normpath(env_path)
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

# ---------------------------------------------------------------------------
# TMDb
# ---------------------------------------------------------------------------

def tmdb_search(query, image_type='backdrop'):
    """
    Search TMDb for images. image_type: 'backdrop' (landscape) or 'poster'.
    Returns list of full image URLs.
    """
    api_key = os.environ.get('TMDB_API_KEY', '')
    if not api_key:
        return []

    # Try person search first (for artists)
    urls = []

    # Search movies + TV shows for backdrops/posters
    for media in ('tv', 'movie', 'person'):
        encoded = urllib.parse.quote(query)
        search_url = (
            f"https://api.themoviedb.org/3/search/{media}"
            f"?api_key={api_key}&query={encoded}&language=en-US&page=1"
        )
        req = urllib.request.Request(search_url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())
        except Exception:
            continue

        results = data.get('results', [])
        if not results:
            continue

        top = results[0]
        tmdb_id = top.get('id')

        if media == 'person':
            # For people, get their images
            img_url = (
                f"https://api.themoviedb.org/3/person/{tmdb_id}/images"
                f"?api_key={api_key}"
            )
            req = urllib.request.Request(img_url, headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    img_data = json.loads(r.read())
                profiles = img_data.get('profiles', [])
                for p in profiles[:3]:
                    path = p.get('file_path')
                    if path:
                        urls.append(f"https://image.tmdb.org/t/p/original{path}")
            except Exception:
                pass
        else:
            # TV/Movie: get backdrops or posters
            img_url = (
                f"https://api.themoviedb.org/3/{media}/{tmdb_id}/images"
                f"?api_key={api_key}"
            )
            req = urllib.request.Request(img_url, headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    img_data = json.loads(r.read())

                key = 'backdrops' if image_type == 'backdrop' else 'posters'
                images = img_data.get(key, [])
                # Sort by vote_average descending
                images.sort(key=lambda x: x.get('vote_average', 0), reverse=True)
                for img in images[:5]:
                    path = img.get('file_path')
                    if path:
                        urls.append(f"https://image.tmdb.org/t/p/original{path}")
            except Exception:
                pass

        if urls:
            break

    return urls

# ---------------------------------------------------------------------------
# Pexels
# ---------------------------------------------------------------------------

def pexels_search(query):
    api_key = os.environ.get('PEXELS_API_KEY', '')
    if not api_key:
        return []

    encoded = urllib.parse.quote(query)
    url = f"https://api.pexels.com/v1/search?query={encoded}&per_page=5&orientation=landscape"
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Authorization": api_key,
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        photos = data.get('photos', [])
        return [p['src']['original'] for p in photos if p.get('src', {}).get('original')]
    except Exception:
        return []

# ---------------------------------------------------------------------------
# Pixabay
# ---------------------------------------------------------------------------

def pixabay_search(query):
    api_key = os.environ.get('PIXABAY_API_KEY', '')
    if not api_key:
        return []

    encoded = urllib.parse.quote(query)
    url = (
        f"https://pixabay.com/api/?key={api_key}&q={encoded}"
        f"&image_type=photo&orientation=horizontal&per_page=5&safesearch=true"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        hits = data.get('hits', [])
        return [h['largeImageURL'] for h in hits if h.get('largeImageURL')]
    except Exception:
        return []

# ---------------------------------------------------------------------------
# Unsplash
# ---------------------------------------------------------------------------

def unsplash_search(query):
    api_key = os.environ.get('UNSPLASH_ACCESS_KEY', '')
    if not api_key:
        return []

    encoded = urllib.parse.quote(query)
    url = (
        f"https://api.unsplash.com/search/photos"
        f"?query={encoded}&per_page=5&orientation=landscape"
    )
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Authorization": f"Client-ID {api_key}",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        results = data.get('results', [])
        return [r['urls']['full'] for r in results if r.get('urls', {}).get('full')]
    except Exception:
        return []

# ---------------------------------------------------------------------------
# Wikimedia Commons
# ---------------------------------------------------------------------------

def wikimedia_search(query):
    encoded = urllib.parse.quote(query)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&list=search&srsearch={encoded}&srnamespace=6"
        f"&srlimit=10&format=json&srprop=snippet"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        results = data.get("query", {}).get("search", [])
    except Exception:
        return []

    urls = []
    for result in results:
        title = result.get("title", "")
        if not title.startswith("File:"):
            continue
        lower = title.lower()
        if any(ext in lower for ext in [".svg", ".gif", ".pdf", ".ogg", ".webm", ".mp4"]):
            continue
        url = _wikimedia_image_url(title)
        if url:
            urls.append(url)
        if len(urls) >= 5:
            break
    return urls

def _wikimedia_image_url(title):
    encoded = urllib.parse.quote(title)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&titles={encoded}&prop=imageinfo&iiprop=url&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            imageinfo = page.get("imageinfo", [])
            if imageinfo:
                return imageinfo[0].get("url")
    except Exception:
        pass
    return None

# ---------------------------------------------------------------------------
# HTTP check
# ---------------------------------------------------------------------------

def check_url(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

def download_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        content_type = r.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
        data = r.read()
    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    tmp.write(data)
    tmp.close()
    return tmp.name, content_type

def upload_to_site(image_path, content_type, base_url, session_token):
    boundary = "----HallyuHubBoundary"
    filename = os.path.basename(image_path)

    with open(image_path, "rb") as f:
        file_data = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()

    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }
    if session_token:
        headers["Cookie"] = f"next-auth.session-token={session_token}"

    req = urllib.request.Request(
        f"{base_url}/api/admin/upload",
        data=body,
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    return result.get("url")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

SOURCES = [
    ("TMDb (backdrops/landscape)", lambda q, t: tmdb_search(q, t)),
    ("Pexels",                     lambda q, t: pexels_search(q)),
    ("Pixabay",                    lambda q, t: pixabay_search(q)),
    ("Unsplash",                   lambda q, t: unsplash_search(q)),
    ("Wikimedia Commons",          lambda q, t: wikimedia_search(q)),
]

def main():
    load_env()

    parser = argparse.ArgumentParser()
    parser.add_argument("query", nargs="+", help="Artist, drama, or topic name")
    parser.add_argument("--type", choices=["backdrop", "poster"], default="backdrop",
                        help="Image type: backdrop (landscape, default) or poster")
    parser.add_argument("--upload", action="store_true", help="Download and upload to site")
    parser.add_argument("--base-url", default="https://www.hallyuhub.com.br")
    parser.add_argument("--session-token", default=os.environ.get("SESSION_TOKEN", ""))
    args = parser.parse_args()

    query = " ".join(args.query)
    print(f"Buscando imagem para: \"{query}\" (tipo: {args.type})\n")

    found_url = None
    found_source = None

    for source_name, search_fn in SOURCES:
        print(f"  [{source_name}]", end=" ", flush=True)
        try:
            urls = search_fn(query, args.type)
        except Exception as e:
            print(f"erro: {e}")
            continue

        if not urls:
            print("nenhum resultado")
            continue

        for url in urls:
            if check_url(url):
                print(f"✓")
                found_url = url
                found_source = source_name
                break
        else:
            print("URLs inválidas")

        if found_url:
            break

    if not found_url:
        print("\nNenhuma imagem encontrada em nenhuma fonte.")
        sys.exit(1)

    print(f"\nFonte: {found_source}")
    print(f"URL:   {found_url}")

    if args.upload:
        print(f"\nBaixando e fazendo upload para {args.base_url}...")
        tmp_path, content_type = download_image(found_url)
        try:
            local_url = upload_to_site(tmp_path, content_type, args.base_url, args.session_token)
            if local_url:
                full_url = f"{args.base_url}{local_url}"
                print(f"\nCOVER IMAGE URL:\n{full_url}")
            else:
                print("Upload falhou — usando URL original")
                print(f"\nCOVER IMAGE URL:\n{found_url}")
        finally:
            os.unlink(tmp_path)
    else:
        print(f"\nCOVER IMAGE URL:\n{found_url}")
        print("\nDica: use --upload para salvar no próprio site")

if __name__ == "__main__":
    main()

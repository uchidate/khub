#!/usr/bin/env python3
"""
Find a cover image from Wikimedia Commons and optionally upload it to the site.

Usage:
  python3 scripts/find-cover-image.py "Park Bo-young"
  python3 scripts/find-cover-image.py "Jennie BLACKPINK" --upload
  python3 scripts/find-cover-image.py "Jennie BLACKPINK" --upload --base-url https://staging.hallyuhub.com.br
"""

import sys
import urllib.request
import urllib.parse
import json
import argparse
import os
import tempfile

USER_AGENT = "HallyuHub/1.0 (+https://hallyuhub.com.br)"

def search_wikimedia(query):
    encoded = urllib.parse.quote(query)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&list=search&srsearch={encoded}&srnamespace=6"
        f"&srlimit=10&format=json&srprop=snippet"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    return data.get("query", {}).get("search", [])

def get_image_url(title):
    encoded = urllib.parse.quote(title)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&titles={encoded}&prop=imageinfo"
        f"&iiprop=url&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        imageinfo = page.get("imageinfo", [])
        if imageinfo:
            return imageinfo[0].get("url")
    return None

def check_url(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

def download_image(url):
    """Download image to a temp file, return (path, content_type)."""
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
    """Upload image to /api/admin/upload. Returns the /uploads/... URL."""
    import urllib.request
    import mimetypes

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
        "Cookie": f"next-auth.session-token={session_token}" if session_token else "",
    }

    req = urllib.request.Request(
        f"{base_url}/api/admin/upload",
        data=body,
        headers=headers,
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    return result.get("url")

def find_best_image(query):
    results = search_wikimedia(query)
    if not results:
        return None, None

    for result in results:
        title = result["title"]
        if not title.startswith("File:"):
            continue
        lower = title.lower()
        if any(ext in lower for ext in [".svg", ".gif", ".pdf", ".ogg", ".webm", ".mp4"]):
            continue
        url = get_image_url(title)
        if url and check_url(url):
            return title, url

    return None, None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("query", nargs="+", help="Artist or topic name")
    parser.add_argument("--upload", action="store_true", help="Download and upload to site")
    parser.add_argument("--base-url", default="https://www.hallyuhub.com.br", help="Site base URL")
    parser.add_argument("--session-token", default=os.environ.get("SESSION_TOKEN", ""), help="next-auth session token")
    args = parser.parse_args()

    query = " ".join(args.query)
    print(f"Searching Wikimedia Commons for: {query}")

    title, url = find_best_image(query)

    if not url:
        print("No valid image found.")
        sys.exit(1)

    print(f"\n✓ {title}")
    print(f"  Wikimedia URL: {url}")

    if args.upload:
        print("\nDownloading image...")
        tmp_path, content_type = download_image(url)
        try:
            print(f"Uploading to {args.base_url}...")
            local_url = upload_to_site(tmp_path, content_type, args.base_url, args.session_token)
            if local_url:
                full_url = f"{args.base_url}{local_url}"
                print(f"\nCOVER IMAGE URL:\n{full_url}")
            else:
                print("Upload failed — using Wikimedia URL instead")
                print(f"\nCOVER IMAGE URL:\n{url}")
        finally:
            os.unlink(tmp_path)
    else:
        print(f"\nCOVER IMAGE URL:\n{url}")
        print("\nDica: use --upload para salvar no próprio site")

if __name__ == "__main__":
    main()

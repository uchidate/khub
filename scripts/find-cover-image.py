#!/usr/bin/env python3
"""
Find a valid cover image URL from Wikimedia Commons for a given name.

Usage:
  python3 scripts/find-cover-image.py "Park Bo-young"
  python3 scripts/find-cover-image.py "Jennie BLACKPINK"
"""

import sys
import urllib.request
import urllib.parse
import json

def search_wikimedia(query):
    """Search Wikimedia Commons for images matching the query."""
    encoded = urllib.parse.quote(query)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&list=search&srsearch={encoded}&srnamespace=6"
        f"&srlimit=10&format=json&srprop=snippet"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    return data.get("query", {}).get("search", [])

def get_image_url(title):
    """Get the direct URL for a Wikimedia file."""
    encoded = urllib.parse.quote(title)
    url = (
        f"https://commons.wikimedia.org/w/api.php"
        f"?action=query&titles={encoded}&prop=imageinfo"
        f"&iiprop=url&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        imageinfo = page.get("imageinfo", [])
        if imageinfo:
            return imageinfo[0].get("url")
    return None

def check_url(url):
    """Verify URL returns 200."""
    try:
        req = urllib.request.Request(url, method="HEAD",
            headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/find-cover-image.py \"Artist Name\"")
        sys.exit(1)

    query = " ".join(sys.argv[1:])
    print(f"Searching Wikimedia Commons for: {query}")

    results = search_wikimedia(query)
    if not results:
        print("No results found.")
        sys.exit(1)

    print(f"Found {len(results)} results. Checking URLs...\n")

    for result in results:
        title = result["title"]  # e.g. "File:Park Bo-young 2024.jpg"
        if not title.startswith("File:"):
            continue

        # Filter out SVG, non-photo files
        lower = title.lower()
        if any(ext in lower for ext in [".svg", ".gif", ".pdf", ".ogg", ".webm", ".mp4"]):
            continue

        url = get_image_url(title)
        if not url:
            continue

        status = "✓" if check_url(url) else "✗"
        print(f"  {status} {title}")
        print(f"    {url}\n")

        if check_url(url):
            print(f"BEST MATCH:\n{url}")
            return

    print("No valid image found.")

if __name__ == "__main__":
    main()

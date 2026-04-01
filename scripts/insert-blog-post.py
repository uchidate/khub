#!/usr/bin/env python3
"""
Insert a blog post JSON into production DB.

Usage:
  python3 scripts/insert-blog-post.py /tmp/artigo.json

The JSON must have:
  title, slug, excerpt, category (slug), tags (array), blocks (array)

Optional:
  coverImageUrl, artistIds, productionIds, readingTimeMin

Author ID defaults to Fabio Uchidate.
"""

import json
import sys
import subprocess
import secrets
import string
from datetime import datetime, timezone

CATEGORIES = {
    "artistas":     "9d530e53-0570-48ec-9fb8-6844aeaaf213",
    "cultura":      "cff5f488-c7c4-4505-85e9-ea232cc317a0",
    "grupos":       "09ce30d4-3005-4691-9d75-bec30aea954a",
    "k-beauty":     "554df076-a799-4d68-ab79-86e2021d7822",
    "k-drama":      "cmn1xy00v00013umxo7l3obvm",
    "k-film":       "478d063d-5113-49cd-975c-bb720dc39bf7",
    "k-pop":        "cmn1xy00i00003umx9zj98z0i",
    "reality-shows":"9acbfbbd-7bfd-472e-a2ba-2122167ea2c6",
    "webtoons":     "6fa8e0d8-49d0-4770-bd66-3e95073bef2a",
}

AUTHOR_ID = "f6c14838-660b-4c77-9d06-32c30e4de7d5"
PG_CONTAINER = "nv2l757xetlkuyg65k7zib9h"

def gen_id():
    chars = string.ascii_lowercase + string.digits
    return "cm" + "".join(secrets.choice(chars) for _ in range(22))

def psql(sql):
    result = subprocess.run(
        ["docker", "exec", "-i", PG_CONTAINER,
         "psql", "-U", "hallyuhub", "-d", "hallyuhub_production"],
        input=sql, capture_output=True, text=True
    )
    if result.returncode != 0:
        print("ERROR:", result.stderr)
        sys.exit(1)
    return result.stdout

def validate(d):
    errors = []
    if len(d.get("title", "")) > 60:
        errors.append(f"title too long: {len(d['title'])} chars (max 60)")
    if len(d.get("excerpt", "")) > 130:
        errors.append(f"excerpt too long: {len(d['excerpt'])} chars (max 130)")
    if len(d.get("tags", [])) != 4:
        errors.append(f"tags must be exactly 4 (got {len(d.get('tags', []))})")
    if d.get("category") not in CATEGORIES:
        errors.append(f"unknown category '{d.get('category')}'. Valid: {list(CATEGORIES.keys())}")
    words = sum(len(b.get("text","").split()) for b in d.get("blocks",[]) if b["type"] == "blog_paragraph")
    if words < 1300:
        errors.append(f"too few words in blog_paragraph blocks: {words} (min 1300)")
    if errors:
        print("VALIDATION ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print(f"Validation OK — {words} words, {len(d['tags'])} tags, title {len(d['title'])} chars")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/insert-blog-post.py <article.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        d = json.load(f)

    validate(d)

    post_id = gen_id()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    category_id = CATEGORIES[d["category"]]
    tags_array = "{" + ",".join(d["tags"]) + "}"
    blocks_json = json.dumps(d["blocks"], ensure_ascii=False)
    cover = d.get("coverImageUrl", "")
    reading_time = d.get("readingTimeMin", 7)

    cover_col = ', "coverImageUrl"' if cover else ""
    cover_val = f", $${cover}$$" if cover else ""

    sql = (
        f'INSERT INTO "BlogPost" (id, title, slug, excerpt, "contentMd", "authorId", "categoryId",'
        f' tags, blocks, status, "readingTimeMin"{cover_col}, "publishedAt", "createdAt", "updatedAt")'
        f" VALUES ("
        f"  $${post_id}$$,"
        f"  $${d['title']}$$,"
        f"  $${d['slug']}$$,"
        f"  $${d['excerpt']}$$,"
        f"  '',"
        f"  $${AUTHOR_ID}$$,"
        f"  $${category_id}$$,"
        f"  $${tags_array}$$::text[],"
        f"  $${blocks_json}$$::jsonb,"
        f"  'PUBLISHED',"
        f"  {reading_time}"
        f"  {cover_val}"
        f", $${now}$$, $${now}$$, $${now}$$"
        f") RETURNING id, slug;"
    )

    print(f"Inserting post {post_id}...")
    out = psql(sql)
    print(out)

    # Link artists
    for artist_id in d.get("artistIds", []):
        psql(f'INSERT INTO "BlogPostArtist" ("blogPostId", "artistId") VALUES ($${post_id}$$, $${artist_id}$$);')
        print(f"  Linked artist: {artist_id}")

    # Link productions
    for prod_id in d.get("productionIds", []):
        psql(f'INSERT INTO "BlogPostProduction" ("blogPostId", "productionId") VALUES ($${post_id}$$, $${prod_id}$$);')
        print(f"  Linked production: {prod_id}")

    print(f"\nDone! https://www.hallyuhub.com.br/blog/{d['slug']}")

if __name__ == "__main__":
    main()

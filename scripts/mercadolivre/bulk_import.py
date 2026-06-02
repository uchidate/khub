#!/usr/bin/env python3
"""
Bulk import de produtos K-Pop do Mercado Livre.

Estratégia:
  1. /products/search — busca catálogos (funciona com token)
  2. /products/{id}  — detalhes: imagem, preço estimado
  3. URL de catálogo — https://www.mercadolivre.com.br/p/{id}?affId=...

Uso:
    python3 scripts/mercadolivre/bulk_import.py
    python3 scripts/mercadolivre/bulk_import.py --dry-run
    python3 scripts/mercadolivre/bulk_import.py --limit 50 --max 400
    python3 scripts/mercadolivre/bulk_import.py --category kpop_album

Env:
    ML_AFFILIATE_ID — ID de afiliado (padrão: 20379928)
"""

import argparse
import json
import os
import re
import subprocess
import time
from pathlib import Path

import requests
from auth import get_token

ML_API       = 'https://api.mercadolibre.com'
ML_SITE_URL  = 'https://www.mercadolivre.com.br'
AFFILIATE_ID = os.getenv('ML_AFFILIATE_ID', '20379928')

BULK_QUERIES = [
    # ── Álbuns ────────────────────────────────────────────────────────────────
    ('album kpop blackpink',       'kpop_album'),
    ('album kpop bts',             'kpop_album'),
    ('album kpop stray kids',      'kpop_album'),
    ('album kpop twice',           'kpop_album'),
    ('album kpop aespa',           'kpop_album'),
    ('album kpop ive',             'kpop_album'),
    ('album kpop newjeans',        'kpop_album'),
    ('album kpop seventeen',       'kpop_album'),
    ('album kpop le sserafim',     'kpop_album'),
    ('album kpop enhypen',         'kpop_album'),
    ('album kpop txt',             'kpop_album'),
    ('album kpop nct',             'kpop_album'),
    ('album kpop ateez',           'kpop_album'),
    ('album kpop monsta x',        'kpop_album'),
    ('album kpop exo',             'kpop_album'),
    ('album kpop shinee',          'kpop_album'),
    ('album kpop got7',            'kpop_album'),
    ('album kpop red velvet',      'kpop_album'),
    ('album kpop mamamoo',         'kpop_album'),
    ('album kpop itzy',            'kpop_album'),
    ('album kpop nmixx',           'kpop_album'),
    ('album kpop babymonster',     'kpop_album'),
    ('album kpop zerobaseone',     'kpop_album'),
    ('album kpop iu',              'kpop_album'),
    ('album kpop bigbang',         'kpop_album'),
    ('album kpop super junior',    'kpop_album'),
    ('album kpop the boyz',        'kpop_album'),
    ('album kpop sf9',             'kpop_album'),
    # ── Photocards ────────────────────────────────────────────────────────────
    ('photocard kpop blackpink',   'photocard'),
    ('photocard kpop bts',         'photocard'),
    ('photocard kpop stray kids',  'photocard'),
    ('photocard kpop twice',       'photocard'),
    ('photocard kpop aespa',       'photocard'),
    ('photocard kpop newjeans',    'photocard'),
    ('photocard kpop ive',         'photocard'),
    ('photocard kpop seventeen',   'photocard'),
    ('photocard kpop enhypen',     'photocard'),
    ('photocard kpop le sserafim', 'photocard'),
    # ── Lightsticks ───────────────────────────────────────────────────────────
    ('lightstick kpop blackpink',  'lightstick'),
    ('lightstick kpop bts',        'lightstick'),
    ('lightstick kpop twice',      'lightstick'),
    ('lightstick kpop aespa',      'lightstick'),
    ('lightstick kpop seventeen',  'lightstick'),
    ('lightstick kpop ive',        'lightstick'),
    ('lightstick kpop newjeans',   'lightstick'),
    # ── K-Beauty ──────────────────────────────────────────────────────────────
    ('skincare coreano',           'kbeauty'),
    ('protetor solar coreano',     'kbeauty'),
    ('cosmetico coreano',          'kbeauty'),
    ('toner coreano',              'kbeauty'),
    ('snail mucin coreano',        'kbeauty'),
    # ── Roupas / Acessórios ───────────────────────────────────────────────────
    ('camiseta kpop',              'clothing'),
    ('moletom kpop',               'clothing'),
    ('poster kpop',                'outros'),
    ('keychain kpop',              'acessorios'),
    ('mochila kpop',               'acessorios'),
]

GROUP_TAGS = [
    'blackpink', 'bts', 'twice', 'stray kids', 'aespa', 'ive',
    'newjeans', 'seventeen', 'le sserafim', 'enhypen', 'txt',
    'nct', 'ateez', 'exo', 'shinee', 'got7', 'red velvet',
    'mamamoo', 'itzy', 'nmixx', 'babymonster', 'zerobaseone',
    'bigbang', 'super junior', 'the boyz', 'sf9', 'monsta x',
    'iu', 'g-dragon', 'lisa', 'jennie',
]

def make_affiliate_url(pid: str) -> str:
    return f"{ML_SITE_URL}/p/{pid}?affId={AFFILIATE_ID}"

def detect_category(title: str, default: str) -> str:
    t = title.lower()
    if any(w in t for w in ['album', 'mini album', 'single album', 'full album']): return 'kpop_album'
    if 'lightstick' in t:     return 'lightstick'
    if 'photocard' in t:      return 'photocard'
    if any(w in t for w in ['skincare', 'protetor solar', 'toner', 'essence', 'cosmetico', 'snail', 'creme facial']): return 'kbeauty'
    if any(w in t for w in ['camiseta', 'moletom', 'blusa', 'hoodie']): return 'clothing'
    if any(w in t for w in ['mochila', 'keychain', 'chaveiro', 'acessorio']): return 'acessorios'
    return default

def extract_tags(title: str, category: str) -> list[str]:
    t = title.lower()
    tags = ['mercado livre', 'kpop', category.replace('_', ' ')]
    for g in GROUP_TAGS:
        if g in t:
            tags.append(g)
    return list(set(tags))

def fmt_price(price) -> str | None:
    if not price:
        return None
    return f"R$ {float(price):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def fetch_product_detail(pid: str, headers: dict) -> dict | None:
    """Busca detalhes do catálogo: imagem e preço."""
    try:
        r = requests.get(f'{ML_API}/products/{pid}', headers=headers, timeout=10)
        if r.ok:
            return r.json()
    except Exception:
        pass
    return None

def search_catalog(query: str, headers: dict, limit: int) -> list[dict]:
    try:
        r = requests.get(f'{ML_API}/products/search',
            params={'site_id': 'MLB', 'q': query, 'limit': limit},
            headers=headers, timeout=15)
        if not r.ok:
            print(f"   ⚠ {r.status_code}")
            return []
        return r.json().get('results', [])
    except Exception as e:
        print(f"   ⚠ {e}")
        return []

def import_to_db(products: list[dict], dry_run: bool = False):
    if dry_run:
        print(f"\n[DRY RUN] {len(products)} produto(s):")
        for p in products:
            print(f"  [{p['category']}] {p['name'][:55]}  {p['price'] or '—'}")
        return True

    script = f"""
import prisma from '../lib/prisma'
const products = {json.dumps(products, ensure_ascii=False)}
async function main() {{
  let created = 0, updated = 0
  for (const p of products) {{
    const existing = await prisma.storeProduct.findFirst({{
      where: {{ externalId: p.externalId }}
    }})
    if (existing) {{
      await prisma.storeProduct.update({{ where: {{ id: existing.id }}, data: {{
        name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
        price: p.price, category: p.category, tags: p.tags,
        isActive: true, isHidden: false,
      }} }})
      updated++
      continue
    }}
    await prisma.storeProduct.create({{ data: {{
      name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
      price: p.price, store: 'mercadolivre', category: p.category,
      externalId: p.externalId, isActive: true, isHidden: false,
      featured: false, position: p.position, tags: p.tags,
    }} }})
    created++
    console.log('✅', p.name.slice(0,55))
  }}
  console.log(`\\n📦 ${{created}} criado(s) · ${{updated}} atualizado(s)`)
}}
main().catch(console.error).finally(() => process.exit())
"""
    project_root = Path(__file__).parent.parent.parent
    f = project_root / 'scripts' / '_bulk_import_run.ts'
    f.write_text(script)
    result = subprocess.run(['npx', 'tsx', str(f)], cwd=project_root)
    f.unlink(missing_ok=True)
    return result.returncode == 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit',    type=int, default=30)
    parser.add_argument('--max',      type=int, default=500)
    parser.add_argument('--dry-run',  action='store_true')
    parser.add_argument('--category', help='Filtrar categoria')
    args = parser.parse_args()

    token_data = get_token()
    headers = {'Authorization': f'Bearer {token_data["access_token"]}'}

    queries = [(q, c) for q, c in BULK_QUERIES if not args.category or c == args.category]
    print(f"🛒 Bulk Import ML · {len(queries)} queries · {args.limit}/query · máx {args.max}")
    print(f"   Afiliado: {AFFILIATE_ID}\n")

    seen_ids: set[str] = set()
    products = []
    pos = 200

    for query, default_cat in queries:
        if len(products) >= args.max:
            break

        print(f"🔍 «{query}»")
        results = search_catalog(query, headers, args.limit)
        found = 0

        for res in results:
            if len(products) >= args.max:
                break

            pid = res.get('catalog_product_id') or res.get('id', '')
            if not pid or pid in seen_ids:
                continue

            title = res.get('name', '')
            if not title:
                continue

            seen_ids.add(pid)

            # Busca detalhes: imagem e preço
            detail = fetch_product_detail(pid, headers)
            img = ''
            price = None

            if detail:
                pictures = detail.get('pictures') or []
                if pictures:
                    raw = pictures[0].get('url', '')
                    # Converte para imagem de alta qualidade (-O)
                    img = re.sub(r'-[A-Z]\.jpg', '-O.jpg', raw).replace('http://', 'https://')
                price = detail.get('price_from')

            # Fallback imagem do thumbnail da busca
            if not img:
                thumb = res.get('thumbnail', '')
                if thumb:
                    img = re.sub(r'-[A-Z]\.jpg', '-O.jpg', thumb).replace('http://', 'https://')

            if not img:
                continue  # sem imagem, pula

            category      = detect_category(title, default_cat)
            affiliate_url = make_affiliate_url(pid)
            tags          = extract_tags(title, category)

            products.append({
                'name':         title,
                'imageUrl':     img,
                'affiliateUrl': affiliate_url,
                'externalId':   pid,
                'price':        fmt_price(price),
                'store':        'mercadolivre',
                'category':     category,
                'position':     pos,
                'tags':         tags,
            })
            pos += 1
            found += 1
            print(f"   ✓ [{category}] {title[:52]}  {fmt_price(price) or '—'}")

            time.sleep(0.2)  # throttle chamadas ao /products/{id}

        print(f"   → {found} válido(s)\n")
        time.sleep(0.5)

    print(f"{'─'*60}")
    print(f"Total: {len(products)} produto(s)")

    if not products:
        print("Nenhum produto encontrado.")
        return

    import_to_db(products, dry_run=args.dry_run)

    if not args.dry_run:
        print(f"\n✅ Acesse /admin/loja para revisar")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Bulk import de produtos K-Pop do Mercado Livre.
Busca dezenas de queries em modo automático, sem interação.

Uso:
    python3 scripts/mercadolivre/bulk_import.py
    python3 scripts/mercadolivre/bulk_import.py --dry-run      # só mostra o que encontraria
    python3 scripts/mercadolivre/bulk_import.py --limit 50     # resultados por query
    python3 scripts/mercadolivre/bulk_import.py --max 300      # máx total de produtos

Env vars:
    ML_AFFILIATE_ID   — ID de afiliado (ex: 20379928)
    ML_AFFILIATE_PARAM — parâmetro de afiliado (padrão: affId)
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import requests
from auth import get_token

BASE_DIR = Path(__file__).parent
ML_API = 'https://api.mercadolibre.com'
AFFILIATE_ID = os.getenv('ML_AFFILIATE_ID', '20379928')

BULK_QUERIES = [
    # ── Grupos top ──────────────────────────────────────────────────────
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
    ('album kpop gidle',           'kpop_album'),
    ('album kpop babymonster',     'kpop_album'),
    ('album kpop zerobaseone',     'kpop_album'),
    ('album kpop iu',              'kpop_album'),
    ('album kpop bigbang',         'kpop_album'),
    ('album kpop super junior',    'kpop_album'),
    ('album kpop apink',           'kpop_album'),
    ('album kpop the boyz',        'kpop_album'),
    ('album kpop sf9',             'kpop_album'),
    # ── Photocards ──────────────────────────────────────────────────────
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
    # ── Lightsticks ─────────────────────────────────────────────────────
    ('lightstick kpop blackpink',  'lightstick'),
    ('lightstick kpop bts',        'lightstick'),
    ('lightstick kpop twice',      'lightstick'),
    ('lightstick kpop aespa',      'lightstick'),
    ('lightstick kpop stray kids', 'lightstick'),
    ('lightstick kpop seventeen',  'lightstick'),
    ('lightstick kpop ive',        'lightstick'),
    ('lightstick kpop newjeans',   'lightstick'),
    # ── K-Beauty ────────────────────────────────────────────────────────
    ('skincare coreano',           'kbeauty'),
    ('protetor solar coreano',     'kbeauty'),
    ('essence coreana',            'kbeauty'),
    ('toner coreano',              'kbeauty'),
    ('mascaras faciais coreana',   'kbeauty'),
    ('cosmetico coreano',          'kbeauty'),
    ('snail mucin coreano',        'kbeauty'),
    ('collagen coreano skin',      'kbeauty'),
    # ── Roupas / Acessórios ─────────────────────────────────────────────
    ('camiseta kpop blackpink',    'clothing'),
    ('camiseta kpop bts',          'clothing'),
    ('moletom kpop',               'clothing'),
    ('blusa kpop',                 'clothing'),
    ('boné kpop',                  'acessorios'),
    ('mochila kpop',               'acessorios'),
    ('pulseira kpop',              'acessorios'),
    # ── Outros ──────────────────────────────────────────────────────────
    ('poster kpop',                'outros'),
    ('plush kpop',                 'outros'),
    ('keychain kpop',              'acessorios'),
]

def make_affiliate_url(permalink: str, product_id: str = '', item_id: str = '') -> str:
    param = os.getenv('ML_AFFILIATE_PARAM', 'affId')
    sep = '&' if '?' in permalink else '?'
    return f"{permalink}{sep}{param}={AFFILIATE_ID}"


def detect_category(title: str, default: str) -> str:
    t = title.lower()
    if any(w in t for w in ['album', 'mini album', 'single album', 'full album']): return 'kpop_album'
    if 'lightstick' in t:       return 'lightstick'
    if 'photocard' in t:        return 'photocard'
    if any(w in t for w in ['beauty', 'skin', 'essence', 'toner', 'creme', 'mask', 'cosmetico', 'snail', 'protetor']): return 'kbeauty'
    if any(w in t for w in ['camiseta', 'moletom', 'blusa', 'hoodie', 'roupa']): return 'clothing'
    if any(w in t for w in ['boné', 'mochila', 'pulseira', 'keychain', 'acessorio']): return 'acessorios'
    return default


def fetch_best_item(product_id: str, result: dict, headers: dict) -> dict | None:
    """Busca o melhor anúncio ativo para o produto. Mais permissivo que o script original."""
    item_ids = []

    buy_box = result.get('buy_box_winner') or {}
    bb_id = buy_box.get('item_id') or buy_box.get('id')
    if bb_id:
        item_ids.append(bb_id)

    items_r = requests.get(f'{ML_API}/products/{product_id}/items',
                           params={'limit': 10}, headers=headers, timeout=15)
    if items_r.ok:
        for item in items_r.json().get('results', []):
            iid = item if isinstance(item, str) else (item.get('item_id') or item.get('id'))
            if iid and iid not in item_ids:
                item_ids.append(iid)

    for item_id in item_ids:
        r = requests.get(f'{ML_API}/items/{item_id}', headers=headers, timeout=15)
        if not r.ok:
            continue
        item = r.json()
        if item.get('status') != 'active':
            continue
        qty = item.get('available_quantity')
        if qty is not None and qty <= 0:
            continue
        if not item.get('permalink'):
            continue
        return item  # aceita qualquer buying_mode (buy_it_now OU auction) enquanto ativo

    return None


def import_to_db(products: list[dict], dry_run: bool = False):
    if dry_run:
        print(f"\n[DRY RUN] {len(products)} produto(s) seriam importados.")
        for p in products:
            print(f"  [{p['category']}] {p['name'][:60]}  {p['price'] or '—'}")
        return True

    script = f"""
import 'dotenv/config'
import prisma from './lib/prisma'
const products = {json.dumps(products, ensure_ascii=False)}
async function main() {{
  let created = 0, updated = 0
  for (const p of products) {{
    const where = p.externalId ? {{ externalId: p.externalId }} : {{ affiliateUrl: p.affiliateUrl }}
    const existing = await prisma.storeProduct.findFirst({{ where }})
    if (existing) {{
      await prisma.storeProduct.update({{ where: {{ id: existing.id }}, data: {{
        name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
        price: p.price, store: p.store, category: p.category, externalId: p.externalId,
        isActive: p.isActive, isHidden: false, tags: p.tags,
      }} }})
      updated++
      continue
    }}
    await prisma.storeProduct.create({{ data: {{
      name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
      price: p.price, store: p.store, category: p.category, externalId: p.externalId,
      isActive: p.isActive, isHidden: false, featured: false, position: p.position, tags: p.tags,
    }} }})
    created++
    console.log('✅', p.name.slice(0,55))
  }}
  console.log(`\\n📦 ${{created}} criado(s) · ${{updated}} atualizado(s)`)
}}
main().catch(console.error).finally(() => process.exit())
"""
    script_file = Path('/tmp/ml_bulk_import.ts')
    script_file.write_text(script)
    result = subprocess.run(['npx', 'tsx', str(script_file)],
                            cwd=Path(__file__).parent.parent.parent)
    script_file.unlink(missing_ok=True)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description='Bulk import ML K-Pop')
    parser.add_argument('--limit', type=int, default=20, help='Resultados por query (padrão: 20)')
    parser.add_argument('--max',   type=int, default=500, help='Total máx de produtos (padrão: 500)')
    parser.add_argument('--dry-run', action='store_true', help='Só mostra, não importa')
    parser.add_argument('--category', help='Filtrar por categoria (ex: kpop_album)')
    args = parser.parse_args()

    token_data = get_token()
    token   = token_data['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    queries = [(q, c) for q, c in BULK_QUERIES if not args.category or c == args.category]
    print(f"🛒 Bulk Import ML · {len(queries)} queries · até {args.limit}/query · máx {args.max} total")
    print(f"   Afiliado: {AFFILIATE_ID}\n")

    seen_ids: set[str] = set()
    products = []
    pos = 200  # posição inicial (deixa espaço para produtos destacados)

    for query, default_category in queries:
        if len(products) >= args.max:
            break

        print(f"🔍 «{query}»")
        r = requests.get(f'{ML_API}/products/search',
                         params={'site_id': 'MLB', 'q': query, 'limit': args.limit},
                         headers=headers)
        if not r.ok:
            print(f"   ⚠ {r.status_code}")
            continue

        results = r.json().get('results', [])
        found = 0

        for result in results:
            if len(products) >= args.max:
                break

            pid = result.get('catalog_product_id') or result.get('id', '')
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)

            title = result.get('name', '')
            if not title:
                continue

            offer = fetch_best_item(pid, result, headers)
            if not offer:
                continue

            category = detect_category(title, default_category)
            permalink = offer.get('permalink', '')
            if not permalink:
                continue

            affiliate_url = make_affiliate_url(permalink, pid, offer.get('id', ''))

            img = result.get('thumbnail', '')
            pictures = offer.get('pictures') or []
            if pictures:
                img = pictures[0].get('secure_url') or pictures[0].get('url') or img
            if img:
                img = re.sub(r'-[A-Z]\.jpg', '-O.jpg', img).replace('http://', 'https://')

            price = offer.get('price')
            price_str = (f"R$ {price:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.') if price else None)

            # Tags para auto-linking
            tags = ['mercado livre', 'kpop', category.replace('_', ' ')]
            tl = title.lower()
            for group in ['blackpink', 'bts', 'twice', 'stray kids', 'aespa', 'ive',
                          'newjeans', 'seventeen', 'le sserafim', 'enhypen', 'txt',
                          'nct', 'ateez', 'exo', 'shinee', 'got7', 'red velvet',
                          'mamamoo', 'itzy', 'nmixx', 'gidle', 'babymonster',
                          'zerobaseone', 'bigbang', 'super junior', 'apink',
                          'the boyz', 'sf9', 'monsta x', 'iu', 'g-dragon']:
                if group in tl:
                    tags.append(group)

            products.append({
                'name': title,
                'imageUrl': img,
                'affiliateUrl': affiliate_url,
                'externalId': pid,
                'price': price_str,
                'store': 'mercadolivre',
                'category': category,
                'isActive': True,
                'position': pos,
                'tags': list(set(tags)),
            })
            pos += 1
            found += 1
            print(f"   ✓ [{category}] {title[:55]}  {price_str or '—'}")

        print(f"   → {found} produto(s) válidos\n")

    print(f"{'─'*60}")
    print(f"Total: {len(products)} produto(s) para importar")

    if not products:
        print("Nenhum produto encontrado.")
        return

    if not args.dry_run:
        print("Importando...\n")

    import_to_db(products, dry_run=args.dry_run)

    if not args.dry_run:
        print(f"\n✅ Acesse /admin/loja para revisar")


if __name__ == '__main__':
    main()

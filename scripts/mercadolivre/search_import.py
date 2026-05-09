#!/usr/bin/env python3
"""
Busca e importa produtos K-Pop do Mercado Livre via /products/search.

Uso:
    python3 scripts/mercadolivre/search_import.py
    python3 scripts/mercadolivre/search_import.py --query "album kpop bts" --limit 20
    python3 scripts/mercadolivre/search_import.py --auto
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import requests
from auth import get_token

BASE_DIR = Path(__file__).parent
ML_API   = 'https://api.mercadolibre.com'

CATEGORY_LABELS = {
    'kpop_album': 'Álbuns K-Pop', 'lightstick': 'Lightsticks',
    'kbeauty': 'K-Beauty', 'kdrama': 'K-Drama', 'clothing': 'Roupas',
    'acessorios': 'Acessórios', 'photocard': 'Photocards',
    'alimenta': 'Alimentação', 'outros': 'Outros',
}

DEFAULT_QUERIES = [
    'album kpop bts',
    'album kpop blackpink',
    'album kpop twice',
    'album kpop stray kids',
    'album kpop aespa',
    'lightstick kpop',
    'photocard kpop',
    'kpop merch',
]

KPOP_KEYWORDS = [
    'kpop', 'k-pop', 'album', 'lightstick', 'photocard',
    'bts', 'blackpink', 'twice', 'exo', 'nct', 'stray kids',
    'aespa', 'itzy', 'txt', 'seventeen', 'got7', 'ive',
    'newjeans', 'le sserafim', 'enhypen', 'ateez', 'monsta x',
    'super junior', 'shinee', 'bigbang', 'red velvet', 'mamamoo',
    'wanna one', 'weeekly', 'fromis', 'nmixx', 'kard',
]


def search_products(query: str, headers: dict, limit: int = 50) -> list[dict]:
    r = requests.get(f'{ML_API}/products/search',
                     params={'site_id': 'MLB', 'q': query, 'limit': limit},
                     headers=headers)
    if not r.ok:
        print(f"   ⚠ Busca falhou ({r.status_code}): {r.text[:100]}")
        return []
    return r.json().get('results', [])


def detect_category(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ['album', 'mini album', 'single album', 'full album']): return 'kpop_album'
    if 'lightstick' in t:       return 'lightstick'
    if any(w in t for w in ['beauty', 'skin', 'essence', 'toner', 'creme', 'mask']): return 'kbeauty'
    if any(w in t for w in ['drama', 'série', 'serie', 'bluray', 'dorama']): return 'kdrama'
    if 'photocard' in t:        return 'photocard'
    if any(w in t for w in ['camiseta', 'moletom', 'roupa', 'hoodie']): return 'clothing'
    return 'outros'


def choose_category(suggested: str, title: str) -> str:
    print(f"\n   📦 {title[:65]}")
    print(f"   Categoria: {CATEGORY_LABELS[suggested]} [{suggested}]")
    print("   " + " | ".join(CATEGORY_LABELS.keys()))
    raw = input("   [Enter=confirmar / 's'=pular]: ").strip()
    if raw.lower() in ('s', 'skip', 'pular'):
        return ''
    return raw if raw in CATEGORY_LABELS else suggested


def make_affiliate_url(product_id: str, user_id: str) -> str:
    return f"https://www.mercadolivre.com.br/p/{product_id}?affId={user_id}"


def import_to_db(products: list[dict]):
    script = f"""
import 'dotenv/config'
import prisma from './lib/prisma'
const products = {json.dumps(products, ensure_ascii=False)}
async function main() {{
  let created = 0
  for (const p of products) {{
    const existing = await prisma.storeProduct.findFirst({{ where: {{ affiliateUrl: p.affiliateUrl }} }})
    if (existing) {{ console.log('⏭  Já existe:', p.name.slice(0,50)); continue }}
    await prisma.storeProduct.create({{ data: {{
      name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
      store: p.store, category: p.category, isActive: p.isActive,
      featured: p.featured, position: p.position, tags: p.tags,
    }} }})
    console.log('✅ Importado:', p.name.slice(0,50))
    created++
  }}
  console.log(`\\n📦 ${{created}} produto(s) importado(s).`)
}}
main().catch(console.error).finally(() => process.exit())
"""
    script_file = Path('/tmp/ml_search_import.ts')
    script_file.write_text(script)
    result = subprocess.run(['npx', 'tsx', str(script_file)],
                            cwd=Path(__file__).parent.parent.parent)
    script_file.unlink(missing_ok=True)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description='Buscar e importar produtos K-Pop do ML')
    parser.add_argument('--query', '-q', nargs='+', help='Termos de busca')
    parser.add_argument('--limit', type=int, default=30, help='Resultados por busca (padrão: 30)')
    parser.add_argument('--auto', action='store_true', help='Detecta categoria automaticamente')
    parser.add_argument('--position', type=int, default=100)
    args = parser.parse_args()

    token_data = get_token()
    token   = token_data['access_token']
    user_id = str(token_data['user_id'])
    headers = {'Authorization': f'Bearer {token}'}

    queries = args.query if args.query else DEFAULT_QUERIES
    print(f"🛒 Importador ML — {len(queries)} busca(s) · até {args.limit} por busca")

    seen_ids: set[str] = set()
    products = []
    pos = args.position

    for query in queries:
        print(f"\n🔍 «{query}»")
        results = search_products(query, headers, limit=args.limit)
        print(f"   {len(results)} resultados")

        for r in results:
            pid = r.get('catalog_product_id') or r.get('id', '')
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)

            title = r.get('name', '')
            if not title:
                continue

            # Filtro K-Pop
            tl = title.lower()
            if not any(k in tl for k in KPOP_KEYWORDS):
                continue

            category = detect_category(title)
            if not args.auto:
                category = choose_category(category, title)
                if not category:
                    continue

            # Imagem de maior qualidade
            img = r.get('thumbnail', '')
            if img:
                img = re.sub(r'-[A-Z]\.jpg', '-O.jpg', img).replace('http://', 'https://')

            products.append({
                'name':         title,
                'imageUrl':     img,
                'affiliateUrl': make_affiliate_url(pid, user_id),
                'store':        'mercadolivre',
                'category':     category,
                'isActive':     True,
                'featured':     False,
                'position':     pos,
                'tags':         ['mercado livre', 'kpop', category.replace('_', ' ')],
            })
            pos += 1
            print(f"   ✓ [{category}] {title[:55]}")

    if not products:
        print("\nNenhum produto K-Pop encontrado.")
        return

    print(f"\n{'─'*50}")
    print(f"Importar {len(products)} produto(s)?  [Enter = sim / Ctrl+C = cancelar]")
    input()

    if import_to_db(products):
        print(f"\n🏪 Revise em /admin/loja")


if __name__ == '__main__':
    main()

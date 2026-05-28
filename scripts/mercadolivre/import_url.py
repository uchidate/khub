#!/usr/bin/env python3
"""
Importa produto do ML a partir de uma URL de produto.

Uso:
    python3 scripts/mercadolivre/import_url.py "https://www.mercadolivre.com.br/..."
    python3 scripts/mercadolivre/import_url.py urls.txt        # arquivo com uma URL por linha
    python3 scripts/mercadolivre/import_url.py --interactive   # modo interativo

O script:
  1. Extrai o ID do produto da URL
  2. Busca detalhes via API do ML (título, imagem, preço)
  3. Gera link de afiliado com seu user_id
  4. Importa no banco de dados
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
ML_API   = 'https://api.mercadolibre.com'

CATEGORY_LABELS = {
    'kpop_album': 'Álbuns K-Pop', 'lightstick': 'Lightsticks',
    'kbeauty': 'K-Beauty', 'kdrama': 'K-Drama', 'clothing': 'Roupas',
    'acessorios': 'Acessórios', 'photocard': 'Photocards',
    'alimenta': 'Alimentação', 'outros': 'Outros',
}


def extract_item_id(url: str) -> tuple[str, str]:
    """Retorna (item_id, tipo) onde tipo é 'item' ou 'product'."""
    # Catalog URL: /p/MLBxxxxxx
    m = re.search(r'/p/(MLB\w+)', url)
    if m:
        return m.group(1), 'product'
    # Item URL: MLBxxxxxxx no path ou query
    m = re.search(r'(MLB\d+)', url)
    if m:
        return m.group(1), 'item'
    raise ValueError(f"Não foi possível extrair ID do ML da URL: {url}")


def fetch_active_item(item_id: str, headers: dict) -> dict | None:
    r = requests.get(f'{ML_API}/items/{item_id}', headers=headers, timeout=15)
    if not r.ok:
        return None
    item = r.json()
    if item.get('status') != 'active':
        return None
    if item.get('buying_mode') != 'buy_it_now':
        return None
    qty = item.get('available_quantity')
    if qty is not None and qty <= 0:
        return None
    if not item.get('permalink'):
        return None
    return item


def fetch_item(item_id: str, tipo: str, headers: dict) -> dict | None:
    if tipo == 'product':
        r = requests.get(f'{ML_API}/products/{item_id}', headers=headers)
        if r.ok:
            d = r.json()
            pics = d.get('pictures', [])
            img = pics[0].get('url', '').replace('-O.jpg', '-O.jpg') if pics else ''
            active_item = None
            items_r = requests.get(f'{ML_API}/products/{item_id}/items', headers=headers)
            if items_r.ok:
                for raw in items_r.json().get('results', []):
                    raw_id = raw if isinstance(raw, str) else (raw.get('item_id') or raw.get('id'))
                    if not raw_id:
                        continue
                    active_item = fetch_active_item(raw_id, headers)
                    if active_item:
                        break
            if not active_item:
                return None

            item_pics = active_item.get('pictures') or []
            item_img = (item_pics[0].get('secure_url') or item_pics[0].get('url')) if item_pics else img
            return {
                'title':     d.get('name', ''),
                'image':     item_img,
                'permalink': active_item.get('permalink'),
                'price':     active_item.get('price'),
                'externalId': item_id,
                'itemId':    active_item.get('id'),
            }
    else:
        d = fetch_active_item(item_id, headers)
        if d:
            pics = d.get('pictures', [])
            img = pics[0].get('url', '') if pics else d.get('thumbnail', '')
            return {
                'title':     d.get('title', ''),
                'image':     img.replace('-I.jpg', '-O.jpg').replace('http://', 'https://'),
                'permalink': d.get('permalink', ''),
                'price':     d.get('price'),
                'externalId': item_id,
                'itemId':    item_id,
            }
    return None


def make_affiliate_url(permalink: str, user_id: str, product_id: str = '', item_id: str = '') -> str:
    affiliate_id = os.getenv('ML_AFFILIATE_ID') or os.getenv('ML_AFFILIATE_CID') or user_id
    template = os.getenv('ML_AFFILIATE_URL_TEMPLATE')
    if template:
        return (template
                .replace('{url}', requests.utils.quote(permalink, safe=''))
                .replace('{permalink}', permalink)
                .replace('{productId}', product_id)
                .replace('{itemId}', item_id)
                .replace('{affiliateId}', affiliate_id))
    param = os.getenv('ML_AFFILIATE_PARAM', 'affId')
    sep = '&' if '?' in permalink else '?'
    return f"{permalink}{sep}{param}={affiliate_id}"


def detect_category(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ['álbum', 'album', 'cd kpop', 'kpop cd']): return 'kpop_album'
    if 'lightstick' in t:       return 'lightstick'
    if any(w in t for w in ['beauty', 'skin', 'essence', 'toner']): return 'kbeauty'
    if any(w in t for w in ['drama', 'série', 'serie', 'bluray']): return 'kdrama'
    if 'photocard' in t:        return 'photocard'
    if any(w in t for w in ['camiseta', 'moletom', 'roupa']): return 'clothing'
    return 'outros'


def choose_category(suggested: str) -> str:
    print(f"\nCategoria detectada: {CATEGORY_LABELS[suggested]} [{suggested}]")
    print("Categorias: " + " | ".join(f"{k}" for k in CATEGORY_LABELS))
    raw = input("Confirme ou digite outra [Enter para confirmar]: ").strip()
    return raw if raw in CATEGORY_LABELS else suggested


def import_to_db(products: list[dict]):
    script = f"""
import 'dotenv/config'
import prisma from './lib/prisma'
const products = {json.dumps(products, ensure_ascii=False)}
async function main() {{
  let created = 0
  for (const p of products) {{
    const where = p.externalId ? {{ externalId: p.externalId }} : {{ affiliateUrl: p.affiliateUrl }}
    const existing = await prisma.storeProduct.findFirst({{ where }})
    if (existing) {{
      await prisma.storeProduct.update({{ where: {{ id: existing.id }}, data: {{
        name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
        price: p.price, store: p.store, category: p.category, externalId: p.externalId,
        isActive: p.isActive, isHidden: false, featured: p.featured, position: p.position, tags: p.tags,
      }} }})
      console.log('🔄 Atualizado:', p.name.slice(0,50))
      continue
    }}
    await prisma.storeProduct.create({{ data: {{
      name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl,
      price: p.price, store: p.store, category: p.category, externalId: p.externalId,
      isActive: p.isActive, isHidden: false,
      featured: p.featured, position: p.position, tags: p.tags,
    }} }})
    console.log('✅ Importado:', p.name.slice(0,50))
    created++
  }}
  console.log(`\\n📦 ${{created}} produto(s) importado(s).`)
}}
main().catch(console.error).finally(() => process.exit())
"""
    script_file = Path('/tmp/ml_url_import.ts')
    script_file.write_text(script)
    result = subprocess.run(['npx', 'tsx', str(script_file)],
                            cwd=Path(__file__).parent.parent.parent)
    script_file.unlink(missing_ok=True)
    return result.returncode == 0


def process_url(url: str, token: str, user_id: str, auto_category: bool, position: int) -> dict | None:
    url = url.strip()
    if not url or url.startswith('#'):
        return None
    try:
        item_id, tipo = extract_item_id(url)
    except ValueError as e:
        print(f"❌ {e}")
        return None

    headers = {'Authorization': f'Bearer {token}'}
    item = fetch_item(item_id, tipo, headers)
    if not item or not item['title']:
        print(f"❌ Não foi possível buscar anúncio ativo com estoque para {item_id}")
        return None

    print(f"\n📦 {item['title'][:65]}")
    if item['price']:
        print(f"   💰 R${item['price']:.2f}")
    print(f"   🖼  {item['image'][:60]}...")

    category = detect_category(item['title'])
    if not auto_category:
        category = choose_category(category)

    return {
        'name':         item['title'],
        'imageUrl':     item['image'],
        'affiliateUrl': make_affiliate_url(item['permalink'], user_id, item.get('externalId', ''), item.get('itemId', '')),
        'externalId':   item.get('externalId') or item_id,
        'price':        f"R$ {item['price']:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.') if item.get('price') else None,
        'store':        'mercadolivre',
        'category':     category,
        'isActive':     True,
        'featured':     False,
        'position':     position,
        'tags':         ['mercado livre', 'kpop', category.replace('_', ' ')],
    }


def main():
    parser = argparse.ArgumentParser(description='Importar produto ML por URL')
    parser.add_argument('input', nargs='?', help='URL do produto ou arquivo .txt com URLs')
    parser.add_argument('--auto', action='store_true', help='Detecta categoria automaticamente sem perguntar')
    parser.add_argument('--position', type=int, default=100)
    parser.add_argument('--interactive', action='store_true', help='Modo interativo — cole URLs uma a uma')
    args = parser.parse_args()

    token_data = get_token()
    token   = token_data['access_token']
    user_id = str(token_data['user_id'])

    urls = []

    if args.interactive or not args.input:
        print("📋 Cole as URLs do ML (uma por linha). Digite 'fim' quando terminar:\n")
        while True:
            line = input('URL > ').strip()
            if line.lower() in ('fim', 'exit', 'q', ''):
                if not line:
                    confirm = input("Pressione Enter novamente para finalizar: ")
                    if not confirm:
                        break
                else:
                    break
            if line:
                urls.append(line)
    elif args.input.endswith('.txt'):
        urls = Path(args.input).read_text().splitlines()
    else:
        urls = [args.input]

    products = []
    for i, url in enumerate(urls):
        p = process_url(url, token, user_id, args.auto, args.position + i)
        if p:
            products.append(p)

    if not products:
        print("Nenhum produto para importar.")
        return

    print(f"\n{'─'*50}")
    print(f"Importar {len(products)} produto(s)?  [Enter = sim / Ctrl+C = cancelar]")
    input()

    ok = import_to_db(products)
    if ok:
        print(f"\n🏪 Revise em /admin/loja")


if __name__ == '__main__':
    main()

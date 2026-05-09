#!/usr/bin/env python3
"""
Busca produtos no Mercado Livre e importa para a loja do HallyuHub.

Uso:
    python3 scripts/mercadolivre/search_import.py "album kpop blackpink"
    python3 scripts/mercadolivre/search_import.py "lightstick kpop" --limit 20
    python3 scripts/mercadolivre/search_import.py "photocard kpop" --category kpop_album
    python3 scripts/mercadolivre/search_import.py "coreano" --auto   # importa top 5 sem perguntar
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import requests
from auth import get_token

ML_SEARCH   = 'https://api.mercadolibre.com/sites/MLB/search'
ML_ITEM     = 'https://api.mercadolibre.com/items'
AFFILIATE_ID = None  # preenchido do token

CATEGORY_MAP = {
    'kpop_album': 'kpop_album',
    'lightstick':  'lightstick',
    'kbeauty':     'kbeauty',
    'kdrama':      'kdrama',
    'clothing':    'clothing',
    'acessorios':  'acessorios',
    'photocard':   'photocard',
    'alimenta':    'alimenta',
    'outros':      'outros',
}

CATEGORY_LABELS = {
    'kpop_album':  'Álbuns K-Pop',
    'lightstick':  'Lightsticks',
    'kbeauty':     'K-Beauty',
    'kdrama':      'K-Drama',
    'clothing':    'Roupas',
    'acessorios':  'Acessórios',
    'photocard':   'Photocards',
    'alimenta':    'Alimentação',
    'outros':      'Outros',
}


def make_affiliate_url(permalink: str, user_id: str) -> str:
    """Gera URL de afiliado do ML adicionando o tracking parameter."""
    sep = '&' if '?' in permalink else '?'
    return f"{permalink}{sep}affId={user_id}"


def search_products(query: str, token: str, limit: int = 10) -> list[dict]:
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.get(ML_SEARCH, params={
        'q':      query,
        'limit':  limit,
        'site_id': 'MLB',
        'condition': 'new',
    }, headers=headers)
    resp.raise_for_status()
    results = resp.json().get('results', [])
    return results


def get_image_url(item: dict) -> str:
    """Pega a melhor imagem disponível."""
    # thumbnail tem qualidade baixa, tentar pictures se disponível
    thumb = item.get('thumbnail', '')
    # ML thumbnails: substituir tamanho para pegar versão maior
    if thumb:
        return thumb.replace('-I.jpg', '-O.jpg').replace('http://', 'https://')
    return ''


def display_results(results: list[dict], user_id: str):
    print(f"\n{'─'*65}")
    print(f"{'#':<3} {'Produto':<40} {'Preço':>8}  {'Frete':<8}")
    print(f"{'─'*65}")
    for i, item in enumerate(results):
        title = item.get('title', '')[:38]
        price = f"R${item.get('price', 0):.0f}"
        free  = '✅ grátis' if item.get('shipping', {}).get('free_shipping') else ''
        print(f"{i+1:<3} {title:<40} {price:>8}  {free}")
    print(f"{'─'*65}")


def build_product_payload(item: dict, category: str, user_id: str, position: int) -> dict:
    return {
        'name':         item['title'],
        'imageUrl':     get_image_url(item),
        'affiliateUrl': make_affiliate_url(item['permalink'], user_id),
        'store':        'mercadolivre',
        'category':     category,
        'rating':       item.get('seller_reputation', {}).get('level_id') and 4.5 or None,
        'soldCount':    str(item.get('sold_quantity', '')) if item.get('sold_quantity') else None,
        'featured':     False,
        'isActive':     True,
        'position':     position,
        'tags':         ['mercado livre', 'kpop', category.replace('_', ' ')],
    }


def import_to_db(products: list[dict]):
    """Importa produtos via npx tsx inline."""
    script = f"""
import 'dotenv/config'
import prisma from './lib/prisma'

const products = {json.dumps(products, ensure_ascii=False)}

async function main() {{
  let created = 0
  for (const p of products) {{
    // Pular se URL já existe
    const existing = await prisma.storeProduct.findFirst({{
      where: {{ affiliateUrl: p.affiliateUrl }}
    }})
    if (existing) {{
      console.log('⏭  Já existe:', p.name.slice(0, 50))
      continue
    }}
    await prisma.storeProduct.create({{
      data: {{
        name:         p.name,
        imageUrl:     p.imageUrl,
        affiliateUrl: p.affiliateUrl,
        store:        p.store,
        category:     p.category,
        rating:       p.rating,
        soldCount:    p.soldCount,
        featured:     p.featured,
        isActive:     p.isActive,
        position:     p.position,
        tags:         p.tags,
      }}
    }})
    console.log('✅ Importado:', p.name.slice(0, 50))
    created++
  }}
  console.log(`\\n📦 ${{created}} produto(s) importado(s) de ${{products.length}} selecionado(s).`)
}}

main().catch(console.error).finally(() => process.exit())
"""

    script_file = Path('/tmp/ml_import.ts')
    script_file.write_text(script)

    print("\n⏳ Importando para o banco de dados...")
    result = subprocess.run(
        ['npx', 'tsx', str(script_file)],
        cwd=Path(__file__).parent.parent.parent,
        capture_output=False,
    )
    script_file.unlink(missing_ok=True)
    return result.returncode == 0


def detect_category(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ['album', 'álbum', 'cd', 'vinyl']): return 'kpop_album'
    if any(w in q for w in ['lightstick', 'light stick']):       return 'lightstick'
    if any(w in q for w in ['beauty', 'skin', 'mascara', 'lip']): return 'kbeauty'
    if any(w in q for w in ['drama', 'serie', 'série']):          return 'kdrama'
    if any(w in q for w in ['photocard', 'photo card']):          return 'photocard'
    if any(w in q for w in ['roupa', 'camiseta', 'moletom']):     return 'clothing'
    return 'outros'


def main():
    parser = argparse.ArgumentParser(description='Importar produtos do ML para a loja')
    parser.add_argument('query',              help='Termo de busca, ex: "album kpop blackpink"')
    parser.add_argument('--limit',  type=int, default=10, help='Número de resultados (padrão: 10)')
    parser.add_argument('--category',         default=None, help='Categoria: kpop_album, lightstick, kbeauty, kdrama, photocard, clothing, acessorios, outros')
    parser.add_argument('--auto',   action='store_true',   help='Importa top 5 sem perguntar')
    parser.add_argument('--position', type=int, default=100, help='Posição inicial na vitrine (padrão: 100)')
    args = parser.parse_args()

    token_data = get_token()
    token      = token_data['access_token']
    user_id    = str(token_data.get('user_id', ''))

    category = args.category or detect_category(args.query)
    print(f"\n🔍 Buscando: \"{args.query}\" | Categoria: {CATEGORY_LABELS.get(category, category)}")

    results = search_products(args.query, token, args.limit)
    if not results:
        print("❌ Nenhum resultado encontrado.")
        return

    display_results(results, user_id)

    # Seleção
    if args.auto:
        selected = results[:5]
        print(f"\n✅ Modo automático — importando top {len(selected)} produtos.")
    else:
        print(f"\nDigite os números para importar (ex: 1 3 5), 'all' para todos, ou Enter para cancelar:")
        raw = input('> ').strip()
        if not raw:
            print("Cancelado.")
            return
        if raw.lower() == 'all':
            selected = results
        else:
            try:
                indices = [int(x) - 1 for x in raw.split()]
                selected = [results[i] for i in indices if 0 <= i < len(results)]
            except ValueError:
                print("❌ Entrada inválida.")
                return

    if not selected:
        print("Nenhum produto selecionado.")
        return

    products = [
        build_product_payload(item, category, user_id, args.position + i)
        for i, item in enumerate(selected)
    ]

    ok = import_to_db(products)
    if ok:
        print(f"\n🏪 Acesse /admin/loja para revisar e ajustar os produtos importados.")


if __name__ == '__main__':
    main()

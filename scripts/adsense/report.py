#!/usr/bin/env python3
"""
Relatório de desempenho do AdSense.

Uso:
    python3 scripts/adsense/report.py                    # últimos 7 dias
    python3 scripts/adsense/report.py --days 30          # últimos 30 dias
    python3 scripts/adsense/report.py --by-unit          # por unidade de anúncio
    python3 scripts/adsense/report.py --by-page          # por URL da página
    python3 scripts/adsense/report.py --by-country       # por país
"""

import argparse
from datetime import date, timedelta
from googleapiclient.discovery import build
from auth import get_credentials

ACCOUNT_ID = None  # Preenchido automaticamente na primeira execução


def get_account_id(service) -> str:
    resp = service.accounts().list().execute()
    accounts = resp.get('accounts', [])
    if not accounts:
        raise RuntimeError("Nenhuma conta AdSense encontrada.")
    account = accounts[0]
    print(f"📋 Conta: {account['displayName']} ({account['name']})")
    return account['name']


def run_report(service, account_id: str, start: str, end: str, dimensions: list[str], label: str):
    metrics = [
        'ESTIMATED_EARNINGS',
        'PAGE_VIEWS',
        'AD_REQUESTS',
        'IMPRESSIONS',
        'CLICKS',
        'PAGE_VIEWS_RPM',
        'IMPRESSIONS_RPM',
        'ACTIVE_VIEW_VIEWABILITY',
    ]

    report = service.accounts().reports().generate(
        account=account_id,
        dateRange='CUSTOM',
        startDate_year=int(start[:4]),
        startDate_month=int(start[5:7]),
        startDate_day=int(start[8:10]),
        endDate_year=int(end[:4]),
        endDate_month=int(end[5:7]),
        endDate_day=int(end[8:10]),
        dimensions=dimensions,
        metrics=metrics,
        orderBy=['-ESTIMATED_EARNINGS'],
    ).execute()

    headers = [h['name'] for h in report.get('headers', [])]
    rows = report.get('rows', [])
    totals = report.get('totals', {})

    print(f"\n{'─'*60}")
    print(f"📊 {label} | {start} → {end}")
    print(f"{'─'*60}")

    if not rows:
        print("Nenhum dado encontrado para o período.")
        return

    # Encontra índices das métricas-chave
    def idx(name):
        try: return headers.index(name)
        except ValueError: return None

    earn_i = idx('ESTIMATED_EARNINGS')
    pv_i   = idx('PAGE_VIEWS')
    rpm_i  = idx('PAGE_VIEWS_RPM')
    clk_i  = idx('CLICKS')
    imp_i  = idx('IMPRESSIONS')

    dim_count = len(dimensions)

    for row in rows[:20]:
        cells = row.get('cells', [])
        dim_vals = ' | '.join(c.get('value', '') for c in cells[:dim_count])
        earn  = cells[earn_i].get('value', '0') if earn_i is not None else '?'
        pv    = cells[pv_i].get('value', '0')   if pv_i   is not None else '?'
        rpm   = cells[rpm_i].get('value', '0')  if rpm_i  is not None else '?'
        clk   = cells[clk_i].get('value', '0')  if clk_i  is not None else '?'

        print(f"  {dim_vals}")
        print(f"    💰 R${float(earn):.4f}  |  👁 {pv} views  |  RPM R${float(rpm):.2f}  |  🖱 {clk} cliques")

    # Totais — mesma estrutura das rows (inclui cells vazias para dimensões)
    if totals:
        t_cells = totals.get('cells', [])
        def t_val(i):
            if i is None or i >= len(t_cells): return '0'
            return t_cells[i].get('value', '0')
        t_earn = t_val(earn_i)
        t_pv   = t_val(pv_i)
        t_rpm  = t_val(rpm_i)
        t_clk  = t_val(clk_i)
        t_imp  = t_val(imp_i)
        print(f"\n{'─'*60}")
        print(f"  TOTAL: 💰 R${float(t_earn):.4f}  |  👁 {t_pv} views  |  RPM R${float(t_rpm):.2f}  |  🖱 {t_clk} cliques  |  📢 {t_imp} impressões")


def main():
    parser = argparse.ArgumentParser(description='Relatório AdSense')
    parser.add_argument('--days',       type=int, default=7, help='Número de dias (padrão: 7)')
    parser.add_argument('--by-unit',    action='store_true', help='Agrupar por unidade de anúncio')
    parser.add_argument('--by-page',    action='store_true', help='Agrupar por URL da página')
    parser.add_argument('--by-country', action='store_true', help='Agrupar por país')
    parser.add_argument('--by-day',     action='store_true', help='Agrupar por dia')
    args = parser.parse_args()

    end   = date.today()
    start = end - timedelta(days=args.days - 1)
    start_str = start.strftime('%Y-%m-%d')
    end_str   = end.strftime('%Y-%m-%d')

    creds   = get_credentials()
    service = build('adsense', 'v2', credentials=creds)
    account = get_account_id(service)

    if args.by_unit:
        run_report(service, account, start_str, end_str,
                   ['AD_UNIT_NAME', 'AD_CLIENT_ID'], f"Por Unidade de Anúncio (últimos {args.days} dias)")
    elif args.by_page:
        run_report(service, account, start_str, end_str,
                   ['URL_CHANNEL_NAME'], f"Por Página (últimos {args.days} dias)")
    elif args.by_country:
        run_report(service, account, start_str, end_str,
                   ['COUNTRY_NAME'], f"Por País (últimos {args.days} dias)")
    elif args.by_day:
        run_report(service, account, start_str, end_str,
                   ['DATE'], f"Por Dia (últimos {args.days} dias)")
    else:
        # Resumo geral (sem dimensão = totais do período)
        run_report(service, account, start_str, end_str,
                   ['DATE'], f"Resumo Diário (últimos {args.days} dias)")


if __name__ == '__main__':
    main()

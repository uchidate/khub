#!/usr/bin/env python3
"""
Diagnóstico completo do AdSense — identifica problemas e oportunidades.

Uso:
    python3 scripts/adsense/diagnose.py
"""

from datetime import date, timedelta
from googleapiclient.discovery import build
from auth import get_credentials

PYTHON = '~/Antigravity/adsense-env/bin/python3'


def get_service():
    return build('adsense', 'v2', credentials=get_credentials())


def get_account(service):
    return service.accounts().list().execute()['accounts'][0]


def report(service, account_id, days, dimensions, metrics):
    end   = date.today()
    start = end - timedelta(days=days - 1)
    return service.accounts().reports().generate(
        account=account_id,
        dateRange='CUSTOM',
        startDate_year=start.year, startDate_month=start.month, startDate_day=start.day,
        endDate_year=end.year,   endDate_month=end.month,   endDate_day=end.day,
        dimensions=dimensions,
        metrics=metrics,
        orderBy=['-ESTIMATED_EARNINGS'],
    ).execute()


def row_val(row, headers, name):
    try:
        i = headers.index(name)
        return row['cells'][i].get('value', '0')
    except (ValueError, IndexError, KeyError):
        return '0'


def main():
    service    = get_service()
    account    = get_account(service)
    account_id = account['name']

    print(f"\n{'═'*60}")
    print(f"  DIAGNÓSTICO ADSENSE — HallyuHub")
    print(f"  Conta: {account['displayName']}")
    print(f"  Data: {date.today()}")
    print(f"{'═'*60}")

    metrics_base = ['ESTIMATED_EARNINGS', 'PAGE_VIEWS', 'IMPRESSIONS', 'CLICKS',
                    'PAGE_VIEWS_RPM', 'AD_REQUESTS', 'AD_REQUESTS_COVERAGE']

    # ── 1. Resumo últimos 30 dias ─────────────────────────────────
    r30 = report(service, account_id, 30, ['DATE'], metrics_base)
    h = [h['name'] for h in r30.get('headers', [])]
    t = r30.get('totals', {}).get('cells', [])

    def tv(name):
        try:
            i = h.index(name)
            return float(t[i].get('value', 0)) if i < len(t) else 0.0
        except (ValueError, IndexError): return 0.0

    earn   = tv('ESTIMATED_EARNINGS')
    pv     = tv('PAGE_VIEWS')
    imps   = tv('IMPRESSIONS')
    clicks = tv('CLICKS')
    rpm    = tv('PAGE_VIEWS_RPM')
    reqs   = tv('AD_REQUESTS')
    cov    = tv('AD_REQUESTS_COVERAGE')
    ctr    = (clicks / pv * 100) if pv > 0 else 0

    print(f"\n📊 ÚLTIMOS 30 DIAS")
    print(f"  💰 Ganhos:       R${earn:.2f}")
    print(f"  👁  Page Views:   {int(pv):,}")
    print(f"  📢 Impressões:   {int(imps):,}")
    print(f"  🖱  Cliques:      {int(clicks)}")
    print(f"  📈 RPM:          R${rpm:.2f}  {'🔴 muito baixo (<R$0,50)' if rpm < 0.5 else '🟡 ok' if rpm < 1.5 else '🟢 bom'}")
    print(f"  🎯 CTR:          {ctr:.2f}%  {'🔴 baixo (<0.5%)' if ctr < 0.5 else '🟢 ok'}")
    print(f"  📡 Fill rate:    {cov:.1f}%  {'🔴 baixo (<80%)' if cov < 80 else '🟢 ok'}")

    # ── 2. Por país ───────────────────────────────────────────────
    r_country = report(service, account_id, 30, ['COUNTRY_NAME'], metrics_base)
    h2 = [h['name'] for h in r_country.get('headers', [])]
    rows2 = r_country.get('rows', [])

    print(f"\n🌎 TOP PAÍSES (últimos 30 dias)")
    for row in rows2[:8]:
        country = row['cells'][0].get('value', '?')
        e = float(row_val(row, h2, 'ESTIMATED_EARNINGS'))
        p = float(row_val(row, h2, 'PAGE_VIEWS'))
        rpm_c = float(row_val(row, h2, 'PAGE_VIEWS_RPM'))
        imps_c = float(row_val(row, h2, 'IMPRESSIONS'))
        flag = '🔴' if p > 500 and rpm_c < 0.1 else '🟡' if rpm_c < 0.5 else '🟢'
        print(f"  {flag} {country:<20} R${e:.2f}  |  {int(p):,} views  |  RPM R${rpm_c:.2f}  |  {int(imps_c):,} impressões")

    # ── 3. Por unidade ────────────────────────────────────────────
    r_unit = report(service, account_id, 30, ['AD_UNIT_NAME'], metrics_base)
    h3 = [h['name'] for h in r_unit.get('headers', [])]
    rows3 = r_unit.get('rows', [])

    print(f"\n📢 UNIDADES DE ANÚNCIO (últimas 30 dias)")
    for row in rows3:
        unit = row['cells'][0].get('value', '?')
        e    = float(row_val(row, h3, 'ESTIMATED_EARNINGS'))
        p    = float(row_val(row, h3, 'PAGE_VIEWS'))
        imps_u = float(row_val(row, h3, 'IMPRESSIONS'))
        rpm_u  = float(row_val(row, h3, 'PAGE_VIEWS_RPM'))
        status = '🟢' if e > 0.05 else '🔴' if imps_u == 0 else '🟡'
        print(f"  {status} {unit:<35} R${e:.4f}  |  {int(imps_u):,} impressões")

    # ── 4. Recomendações ──────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"💡 RECOMENDAÇÕES")

    recs = []

    if rpm < 0.5:
        recs.append("RPM muito baixo — ative 'Auto ads' do AdSense (Settings → Auto ads)")

    us_views = next((float(row_val(r, h2, 'PAGE_VIEWS')) for r in rows2
                     if r['cells'][0].get('value') == 'United States'), 0)
    us_rpm   = next((float(row_val(r, h2, 'PAGE_VIEWS_RPM')) for r in rows2
                     if r['cells'][0].get('value') == 'United States'), 0)
    if us_views > 100 and us_rpm < 0.5:
        recs.append(f"EUA: {int(us_views):,} views com RPM R${us_rpm:.2f} — verifique se ads estão carregando para tráfego US (pode ser bloqueador ou consent)")

    zero_units = [r['cells'][0].get('value','?') for r in rows3
                  if float(row_val(r, h3, 'IMPRESSIONS')) == 0]
    if zero_units:
        recs.append(f"{len(zero_units)} unidades com 0 impressões — considere remover ou revisar: {', '.join(zero_units[:3])}")

    if ctr < 0.3:
        recs.append("CTR baixo — posicione anúncios mais próximos do conteúdo principal")

    if cov < 70:
        recs.append(f"Fill rate de {cov:.0f}% — ative 'Allow & block ads' para mais categorias de anunciantes")

    if not recs:
        recs.append("Nenhum problema crítico detectado")

    for i, rec in enumerate(recs, 1):
        print(f"  {i}. {rec}")

    print(f"\n{'═'*60}\n")


if __name__ == '__main__':
    main()

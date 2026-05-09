#!/usr/bin/env python3
"""
Lista e inspeciona unidades de anúncio do AdSense.

Uso:
    python3 scripts/adsense/ad_units.py
"""

from googleapiclient.discovery import build
from auth import get_credentials


def main():
    creds   = get_credentials()
    service = build('adsense', 'v2', credentials=creds)

    accounts = service.accounts().list().execute().get('accounts', [])
    if not accounts:
        print("Nenhuma conta encontrada.")
        return

    account = accounts[0]
    account_id = account['name']
    print(f"📋 Conta: {account['displayName']}\n")

    # Listar ad clients (domínios)
    clients = service.accounts().adclients().list(parent=account_id).execute()
    for client in clients.get('adClients', []):
        client_id = client['name']
        domain = client.get('reportingDimensionId', client_id)
        print(f"🌐 Ad Client: {domain}")

        # Listar unidades do cliente
        units = service.accounts().adclients().adunits().list(parent=client_id).execute()
        for unit in units.get('adUnits', []):
            uid = unit['name'].split('/')[-1]
            uname = unit.get('displayName', 'sem nome')
            utype = unit.get('contentAdsSettings', {}).get('type', '?')
            state = unit.get('state', '?')
            print(f"  📢 [{state}] {uname}")
            print(f"       ID: {uid}  |  Tipo: {utype}")
            print(f"       data-ad-slot=\"{uid}\"")
        print()


if __name__ == '__main__':
    main()

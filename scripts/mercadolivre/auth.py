#!/usr/bin/env python3
"""
Autenticação OAuth2 com a API do Mercado Livre.

O fluxo usa o endpoint /api/ml/callback do HallyuHub em produção.
Após autorizar no browser, copie o token.json exibido na tela.

Uso:
    python3 scripts/mercadolivre/auth.py          # abre browser para autorizar
    python3 scripts/mercadolivre/auth.py --check  # verifica se token é válido
"""

import argparse
import json
import time
import webbrowser
import requests
from pathlib import Path

BASE_DIR   = Path(__file__).parent
CREDS_FILE = BASE_DIR / 'credentials.json'
TOKEN_FILE = BASE_DIR / 'token.json'
ML_TOKEN   = 'https://api.mercadolibre.com/oauth/token'


def load_credentials() -> dict:
    if not CREDS_FILE.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {CREDS_FILE}")
    return json.loads(CREDS_FILE.read_text())


def get_token() -> dict:
    """Retorna token válido, renovando via refresh_token se necessário."""
    if TOKEN_FILE.exists():
        token = json.loads(TOKEN_FILE.read_text())
        if token.get('expires_at', 0) > time.time() + 300:
            return token
        if token.get('refresh_token'):
            creds = load_credentials()
            resp = requests.post(ML_TOKEN, data={
                'grant_type':    'refresh_token',
                'client_id':     creds['app_id'],
                'client_secret': creds['secret_key'],
                'refresh_token': token['refresh_token'],
            })
            if resp.ok:
                new_token = resp.json()
                new_token['expires_at'] = time.time() + new_token.get('expires_in', 21600)
                TOKEN_FILE.write_text(json.dumps(new_token, indent=2))
                print('🔄 Token renovado automaticamente.')
                return new_token
            else:
                print('⚠️  Refresh falhou, re-autenticando...')

    # Fluxo completo
    creds = load_credentials()
    auth_url = (
        'https://auth.mercadolivre.com.br/authorization'
        f'?response_type=code'
        f'&client_id={creds["app_id"]}'
        f'&redirect_uri={creds["redirect_uri"]}'
    )
    print(f'\n🌐 Abrindo browser para autorização...')
    print(f'   URL: {auth_url}\n')
    webbrowser.open(auth_url)

    print('Após autorizar no browser, o token aparecerá em:')
    print('  https://www.hallyuhub.com.br/api/ml/callback\n')
    print('Cole o JSON do token abaixo (ou pressione Enter se já salvou o token.json):')
    raw = input('> ').strip()
    if raw:
        try:
            token = json.loads(raw)
            token['expires_at'] = time.time() + token.get('expires_in', 21600)
            TOKEN_FILE.write_text(json.dumps(token, indent=2))
            print(f'✅ Token salvo em {TOKEN_FILE}')
            return token
        except json.JSONDecodeError:
            raise ValueError('JSON inválido. Cole o conteúdo completo do JSON.')
    elif TOKEN_FILE.exists():
        return json.loads(TOKEN_FILE.read_text())
    else:
        raise RuntimeError('Token não encontrado. Complete a autorização no browser.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Verificar se token é válido')
    args = parser.parse_args()

    if args.check:
        if not TOKEN_FILE.exists():
            print('❌ token.json não encontrado. Rode sem --check para autenticar.')
        else:
            token = json.loads(TOKEN_FILE.read_text())
            expires = token.get('expires_at', 0)
            remaining = int(expires - time.time())
            if remaining > 0:
                print(f'✅ Token válido | user_id: {token.get("user_id")} | expira em {remaining//3600}h{(remaining%3600)//60}m')
            else:
                print('⚠️  Token expirado — rode sem --check para renovar.')
    else:
        token = get_token()
        print(f'✅ Autenticado | user_id: {token.get("user_id")}')

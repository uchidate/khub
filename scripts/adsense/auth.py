#!/usr/bin/env python3
"""
AdSense OAuth2 authentication.

Pré-requisitos:
1. Acesse https://console.cloud.google.com/
2. Crie ou selecione um projeto
3. Ative a AdSense Management API
4. Vá em APIs & Services > Credentials > Create Credentials > OAuth client ID
5. Tipo: Desktop app
6. Baixe o JSON e salve como scripts/adsense/credentials.json

Uso:
    python3 scripts/adsense/auth.py
    (Abre o browser para autorizar — salva token em scripts/adsense/token.json)
"""

import os
import json
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/adsense.readonly']
BASE_DIR = Path(__file__).parent
CREDENTIALS_FILE = BASE_DIR / 'credentials.json'
TOKEN_FILE = BASE_DIR / 'token.json'


def get_credentials() -> Credentials:
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDENTIALS_FILE.exists():
                raise FileNotFoundError(
                    f"Arquivo não encontrado: {CREDENTIALS_FILE}\n"
                    "Baixe suas credenciais OAuth2 do Google Cloud Console e salve como credentials.json"
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)

        TOKEN_FILE.write_text(creds.to_json())
        print(f"✅ Token salvo em {TOKEN_FILE}")

    return creds


if __name__ == '__main__':
    creds = get_credentials()
    print("✅ Autenticação concluída com sucesso.")
    info = json.loads(creds.to_json())
    print(f"   Expira em: {info.get('expiry', 'N/A')}")

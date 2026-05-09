# AdSense Management API — Scripts Python

## Setup (1x)

### 1. Ativar a API no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/)
2. Selecione ou crie um projeto
3. Vá em **APIs & Services → Library**
4. Busque **"AdSense Management API"** e ative
5. Vá em **APIs & Services → Credentials → Create Credentials → OAuth client ID**
6. Tipo: **Desktop app** | Nome: `hallyuhub-adsense`
7. Baixe o JSON → salve como `scripts/adsense/credentials.json`

### 2. Instalar dependências (venv isolado)

```bash
python3 -m venv ~/Antigravity/adsense-env
~/Antigravity/adsense-env/bin/pip install \
  google-api-python-client \
  google-auth-oauthlib \
  google-auth-httplib2
```

### 3. Autenticar (1x — abre browser)

```bash
cd scripts/adsense
~/Antigravity/adsense-env/bin/python3 auth.py
```

Autorize no browser → token salvo em `token.json` (renovação automática).

---

## Uso

```bash
# Atalho (use sempre o python do venv)
PYTHON=~/Antigravity/adsense-env/bin/python3
cd scripts/adsense

# Relatório últimos 7 dias (por dia)
$PYTHON report.py

# Últimos 30 dias
$PYTHON report.py --days 30

# Por unidade de anúncio
$PYTHON report.py --by-unit

# Por página (URL channel)
$PYTHON report.py --by-page

# Por país
$PYTHON report.py --by-country

# Listar unidades de anúncio com IDs/slots
$PYTHON ad_units.py
```

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `auth.py` | Gerencia OAuth2 — chame 1x para autenticar |
| `report.py` | Relatório de performance (ganhos, RPM, cliques) |
| `ad_units.py` | Lista unidades de anúncio com `data-ad-slot` |
| `credentials.json` | ⚠️ NÃO commitar — credencial OAuth2 |
| `token.json` | ⚠️ NÃO commitar — token de acesso |

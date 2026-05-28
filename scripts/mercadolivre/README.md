# Mercado Livre — Importador de Produtos Afiliados

## Setup (1x)

### 1. Criar aplicação no ML Developers

1. Acesse [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br/)
2. Clique em **"Criar aplicação"**
3. Preencha:
   - **Nome:** HallyuHub Loja
   - **Modelo de negócio:** Marketplace
   - **URL de redirect:** `http://localhost:8765/callback`
4. Anote o **App ID** e **Secret Key**

### 2. Criar credentials.json

```bash
cat > scripts/mercadolivre/credentials.json << 'EOF'
{
  "app_id": "SEU_APP_ID",
  "secret_key": "SUA_SECRET_KEY",
  "redirect_uri": "http://localhost:8765/callback"
}
EOF
```

### 3. Autenticar (abre browser 1x)

```bash
cd scripts/mercadolivre
~/Antigravity/adsense-env/bin/python3 auth.py
```

---

## Uso

```bash
PYTHON=~/Antigravity/adsense-env/bin/python3
cd scripts/mercadolivre

# Busca interativa — você escolhe quais importar
$PYTHON search_import.py "album kpop blackpink"

# Importar top 5 automaticamente
$PYTHON search_import.py "lightstick kpop" --auto

# Especificar categoria
$PYTHON search_import.py "photocard twice" --category photocard

# Mais resultados
$PYTHON search_import.py "kpop album" --limit 20

# Controlar posição na vitrine
$PYTHON search_import.py "kpop" --auto --position 50
```

## Categorias disponíveis

| Valor | Label |
|-------|-------|
| `kpop_album` | Álbuns K-Pop |
| `lightstick` | Lightsticks |
| `kbeauty` | K-Beauty |
| `kdrama` | K-Drama |
| `clothing` | Roupas |
| `acessorios` | Acessórios |
| `photocard` | Photocards |
| `alimenta` | Alimentação |
| `outros` | Outros |

## Como funciona o link de afiliado

O Mercado Livre recomenda gerar o link pela Central de Afiliados e Criadores ou pela barra de afiliados. Para automacao, configure o identificador do seu perfil de afiliado:

```bash
ML_AFFILIATE_ID="SEU_ID_DE_AFILIADO"
```

Por padrao, o importador adiciona `?affId={ML_AFFILIATE_ID}` ao permalink ativo do item. Se o seu link oficial usar outro parametro, ajuste:

```bash
ML_AFFILIATE_PARAM="affId"
```

Se o Mercado Livre te entregar um formato completo de URL, use um template:

```bash
ML_AFFILIATE_URL_TEMPLATE="https://exemplo.com/redirect?url={url}&cid={affiliateId}"
```

Placeholders aceitos: `{url}`, `{permalink}`, `{productId}`, `{itemId}` e `{affiliateId}`.

Importante: o script agora valida o anuncio ativo antes de importar. Ele busca um item `active`, com compra imediata, permalink e estoque disponivel; catalogos sem oferta ativa sao pulados.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `auth.py` | OAuth2 — rode 1x para autenticar |
| `search_import.py` | Busca e importa produtos |
| `credentials.json` | ⚠️ NÃO commitar |
| `token.json` | ⚠️ NÃO commitar |

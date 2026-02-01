# Configuração Avançada de Busca

Para que o sistema encontre fotos de alta qualidade de qualquer artista (K-Pop ou Atores), precisamos de duas chaves de API.

## 1. TMDB (The Movie Database) 🎬
Ideal para atores e atrizes de K-Drama.

1.  Crie uma conta em [themoviedb.org](https://www.themoviedb.org/signup).
2.  Vá em **Settings** > **API**.
3.  Clique em **Request API Key** (pode selecionar "Developer").
4.  Preencha os dados (pode colocar URL do site ou localhost).
5.  Copie a **"API Key (v3 auth)"**.

## 2. Google Custom Search (Geral) 🔍
Busca no Google Imagens (fallback final).

### Parte A: Chave de API
1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  Crie um novo projeto (ex: "KHub Search").
3.  Vá em **Library** e ative a **"Custom Search API"**.
4.  Vá em **Credentials** > **Create Credentials** > **API Key**.
5.  Copie a chave (começa com `AIza...`).

### Parte B: Search Engine ID (CX)
1.  Acesse o [Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all).
2.  Clique em **Add**.
3.  **Name**: "KPop Search".
4.  **What to search**: Escolha "Search specific sites or pages".
    - Coloque `www.google.com` só pra desbloquear.
5.  Clique em **Create**.
6.  **IMPORTANTE**: Agora clique em **Control Panel** (ícone de editar).
    - Em **Search features**, ative **"Image search"**.
    - Em **"Sites to search"** (ou Configurações Gerais), procure a opção **"Search the entire web"** e ATIVE-A. (Se não achar, pode precisar apagar o site que colocou antes).
7.  Copie o **Search engine ID** (o código "CX").

---

## Onde Colocar
No arquivo `.env` do servidor (ou me mande no chat):

```
TMDB_API_KEY=sua_chave_tmdb
GOOGLE_CUSTOM_SEARCH_KEY=sua_chave_google
GOOGLE_CX=seu_cx_google
```

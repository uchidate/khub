# Image Search Service - Setup Guide

Este guia mostra como obter as chaves de API gratuitas para buscar fotos reais de artistas.

## APIs Necessárias

### 1. Unsplash (Recomendado)

**Limite**: 50 requisições/hora (grátis)  
**Qualidade**: Alta

**Como obter**:
1. Acesse: https://unsplash.com/developers
2. Clique em "Register as a developer"
3. Crie uma aplicação (New Application)
4. Copie o "Access Key"
5. Adicione ao `.env`:
   ```bash
   UNSPLASH_ACCESS_KEY=your_access_key_here
   ```

### 2. Pexels (Opcional)

**Limite**: 200 requisições/hora (grátis)  
**Qualidade**: Alta

**Como obter**:
1. Acesse: https://www.pexels.com/api/
2. Clique em "Get Started"
3. Crie uma conta
4. Copie a "API Key"
5. Adicione ao `.env`:
   ```bash
   PEXELS_API_KEY=your_api_key_here
   ```

### 3. Wikipedia (Sempre Ativo)

**Limite**: Ilimitado (grátis)  
**Qualidade**: Autêntica (fotos oficiais)

Não precisa de chave de API! Funciona automaticamente.

## Como Funciona

O sistema busca fotos na seguinte ordem:

1. **Wikipedia** (grátis, ilimitado)
   - Busca a página do artista
   - Extrai a foto de perfil oficial
   - Mais autêntico

2. **Unsplash** (grátis, 50 req/hora)
   - Se Wikipedia não encontrar
   - Fotos profissionais de alta qualidade

3. **Pexels** (grátis, 200 req/hora)
   - Se Unsplash não encontrar
   - Ainda mais generoso

4. **Placeholder** (fallback)
   - Se nenhum encontrar
   - Usa foto genérica de K-pop

## Testando

Depois de configurar as chaves, teste com:

```bash
npm run atualize:ai -- --artists=1 --news=0 --productions=0
```

Você verá logs como:
```
🔍 Searching image for: Kim Taehyung
✅ Found on Wikipedia: Kim Taehyung
```

## Custos

| Serviço | Limite Grátis | Custo Após Limite |
|---------|---------------|-------------------|
| Wikipedia | Ilimitado | Sempre grátis |
| Unsplash | 50/hora | N/A (não tem plano pago para mais) |
| Pexels | 200/hora | N/A (não tem plano pago para mais) |

**Total**: $0/mês 🎉

## Troubleshooting

### "No image found, using placeholder"
- Verifique se as chaves de API estão corretas no `.env`
- Verifique se não excedeu o limite de requisições
- Tente com um artista mais conhecido (ex: "BTS", "BLACKPINK")

### "Wikipedia search failed"
- Normal para artistas menos conhecidos
- O sistema vai tentar Unsplash/Pexels automaticamente

### "Rate limit exceeded"
- Unsplash: Aguarde 1 hora
- Pexels: Aguarde 1 hora
- Wikipedia: Nunca tem limite!

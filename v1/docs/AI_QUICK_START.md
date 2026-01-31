# 🚀 Guia Rápido: Testando o Sistema de IA

## Passo 1: Obter API Key do Gemini (GRATUITO)

1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

## Passo 2: Configurar a Chave

Abra o arquivo `.env` e adicione sua chave:

```env
GEMINI_API_KEY=cole_sua_chave_aqui
```

## Passo 3: Testar (Modo Dry-Run)

Execute o comando abaixo para testar sem salvar no banco:

```bash
npm run atualize:ai -- --news=2 --artists=1 --productions=1 --dry-run
```

Você verá:
- ✅ Conexão com a IA funcionando
- 📰 2 notícias geradas
- 🎤 1 artista gerado
- 🎬 1 produção gerada
- 📊 Estatísticas de uso

## Passo 4: Gerar Dados Reais

Se o teste funcionou, gere dados reais:

```bash
npm run atualize:ai -- --news=5 --artists=3 --productions=2
```

Os dados serão salvos no banco de dados!

## Passo 5: Verificar no Frontend

Acesse http://localhost:3040 e veja:
- `/news` - Notícias geradas
- `/artists` - Artistas gerados
- `/productions` - Produções geradas

## Passo 6: Ver Estatísticas

```bash
npm run ai:stats
```

## 🎯 Comandos Úteis

```bash
# Gerar apenas notícias
npm run atualize:ai -- --news=10 --artists=0 --productions=0

# Gerar apenas artistas
npm run atualize:ai -- --artists=5 --news=0 --productions=0

# Usar provider específico (se tiver múltiplos configurados)
npm run atualize:ai -- --provider=gemini --news=5
```

## ❓ Problemas?

Veja a documentação completa em: `docs/AI_ORCHESTRATION.md`

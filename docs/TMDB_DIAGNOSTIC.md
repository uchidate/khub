# 🔍 Diagnóstico: Sistema TMDB + Cron

## 📋 Comandos de Verificação Rápida

### 1. Verificar Configuração

```bash
# SSH no servidor
ssh usuario@seu-servidor
cd /var/www/hallyuhub

echo "=========================================="
echo "  VERIFICAÇÃO TMDB + CRON"
echo "=========================================="
echo ""

echo "📝 VARIÁVEIS DE AMBIENTE:"
echo "TMDB_API_KEY: $([ -n "$TMDB_API_KEY" ] && echo '✅ Configurado' || echo '❌ NÃO configurado')"
echo "DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo '✅ Configurado' || echo '❌ NÃO configurado')"
echo "OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-http://localhost:11434} (default)"
echo "GEMINI_API_KEY: $([ -n "$GEMINI_API_KEY" ] && echo '✅ Configurado (fallback)' || echo '⚠️  Não configurado')"
echo ""

echo "🤖 OLLAMA STATUS:"
curl -s http://localhost:11434/api/tags 2>/dev/null | grep -q "models" \
  && echo "✅ Ollama respondendo" \
  || echo "❌ Ollama NÃO está respondendo"
ollama list 2>/dev/null | head -5
echo ""

echo "🎬 TMDB API STATUS:"
if [ -n "$TMDB_API_KEY" ]; then
  curl -s "https://api.themoviedb.org/3/configuration?api_key=$TMDB_API_KEY" | grep -q "images" \
    && echo "✅ TMDB API respondendo" \
    || echo "❌ TMDB API falhou (chave inválida?)"
else
  echo "❌ TMDB_API_KEY não configurado"
fi
echo ""

echo "⏰ CRON STATUS:"
crontab -l 2>/dev/null | grep hallyuhub || echo "❌ Nenhum cron configurado"
echo ""

echo "📊 ARTISTAS NO BANCO:"
psql $DATABASE_URL -c "
  SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN \"tmdbId\" IS NOT NULL THEN 1 END) as com_tmdb,
    COUNT(CASE WHEN \"tmdbId\" IS NULL THEN 1 END) as sem_tmdb
  FROM \"Artist\";
" 2>/dev/null || echo "❌ Erro ao conectar no banco"
echo ""

echo "📈 ÚLTIMOS ARTISTAS CRIADOS:"
psql $DATABASE_URL -c "
  SELECT
    \"nameRomanized\",
    CASE
      WHEN \"tmdbId\" IS NOT NULL THEN '(TMDB)'
      ELSE '(AI)'
    END as fonte,
    \"createdAt\"
  FROM \"Artist\"
  ORDER BY \"createdAt\" DESC
  LIMIT 5;
" 2>/dev/null || echo "❌ Erro ao consultar banco"
echo ""

echo "=========================================="
echo "✅ VERIFICAÇÃO CONCLUÍDA"
echo "=========================================="
```

---

## 🧪 Teste Manual do Sistema

### Teste 1: Verificar TMDB API

```bash
# Testar busca de artista no TMDB
curl -s "https://api.themoviedb.org/3/search/person?api_key=$TMDB_API_KEY&query=IU&language=pt-BR" | \
  grep -o '"name":"[^"]*"' | head -3

# Deve retornar algo como:
# "name":"IU"
# "name":"Ahn Hyo-seop"
# ...
```

### Teste 2: Gerar 1 Artista Manualmente

```bash
# No servidor
cd /var/www/hallyuhub

# Teste com 1 artista
npm run atualize:ai -- --provider=ollama --artists=1 --news=0 --productions=0

# Observe o output:
# ✅ "🎯 Strategy: Searching TMDB for real artist..."
# ✅ "✅ Found real artist from TMDB: Nome do Artista"
# ✅ "✅ Saved: Nome do Artista (TMDB)"

# Se ver "(AI)" em vez de "(TMDB)", o TMDB falhou e usou fallback
```

### Teste 3: Verificar Duplicatas

```bash
# Tentar gerar o mesmo artista 2x
npm run atualize:ai -- --provider=ollama --artists=2 --news=0 --productions=0

# Deve ver:
# "⚠️  Skipped duplicate (TMDB ID 123456): Nome do Artista"
# ou
# "⚠️  Already exists in database: Nome do Artista"
```

---

## 🐛 Troubleshooting

### Problema: TMDB API não responde

**Sintomas:**
- `❌ TMDB API falhou`
- `⚠️  TMDB search failed, falling back to AI generation`

**Soluções:**

1. **Verificar chave API:**
```bash
echo $TMDB_API_KEY
# Deve ter 32 caracteres

# Testar diretamente:
curl "https://api.themoviedb.org/3/configuration?api_key=$TMDB_API_KEY"
# Deve retornar JSON com configurações
```

2. **Obter nova chave:**
- Acesse: https://www.themoviedb.org/settings/api
- Gere nova chave se necessário
- Atualize `.env`: `TMDB_API_KEY=nova-chave`

3. **Verificar rate limit:**
```bash
# TMDB permite 40 req/10s
# Se passar disso, aguarde 10 segundos

# Verificar quantas requests estão sendo feitas:
tail -100 /var/log/hallyuhub-cron.log | grep TMDB | wc -l
```

---

### Problema: Ollama não responde

**Sintomas:**
- `❌ Ollama NÃO está respondendo`
- `⚠️  Ollama bio generation failed`

**Soluções:**

1. **Verificar se está rodando:**
```bash
ps aux | grep ollama
# Deve mostrar processo ativo

# Se não estiver:
ollama serve &
```

2. **Testar diretamente:**
```bash
ollama list
# Deve mostrar modelos instalados (llama2, mistral, etc)

curl http://localhost:11434/api/tags
# Deve retornar JSON com lista de modelos
```

3. **Instalar modelo se necessário:**
```bash
ollama pull llama2
# Aguarde download (pode demorar ~5min)
```

---

### Problema: Artistas duplicados no banco

**Sintomas:**
- Mesmo artista aparece múltiplas vezes
- Cron não detecta duplicatas

**Soluções:**

1. **Verificar duplicatas:**
```bash
psql $DATABASE_URL -c "
  SELECT
    \"nameRomanized\",
    \"tmdbId\",
    COUNT(*) as vezes
  FROM \"Artist\"
  GROUP BY \"nameRomanized\", \"tmdbId\"
  HAVING COUNT(*) > 1;
"
```

2. **Limpar duplicatas (CUIDADO!):**
```bash
# Backup primeiro
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Remover duplicatas mantendo o mais antigo
psql $DATABASE_URL -c "
  DELETE FROM \"Artist\" a
  USING \"Artist\" b
  WHERE a.id > b.id
    AND a.\"nameRomanized\" = b.\"nameRomanized\";
"
```

---

### Problema: Cron não gera artistas

**Sintomas:**
- Log não mostra execuções
- Nenhum artista novo no banco

**Soluções:**

1. **Verificar cron:**
```bash
crontab -l | grep hallyuhub
# Deve mostrar linha com */15

# Verificar se serviço está rodando:
sudo systemctl status cron
# ou
sudo systemctl status crond
```

2. **Verificar logs:**
```bash
tail -50 /var/log/hallyuhub-cron.log
# Deve ter timestamp recente (<15 min)

# Se vazio ou antigo:
ls -la /var/log/hallyuhub-cron.log
# Verificar permissões (deve ter escrita)
```

3. **Executar manualmente:**
```bash
cd /var/www/hallyuhub && \
npm run atualize:ai -- --provider=ollama --artists=2 --news=2

# Se funcionar manual mas não no cron:
# - Problema de PATH (use caminho absoluto do npm)
# - Problema de .env (cron não carrega .env automaticamente)
```

---

## 📊 Métricas de Saúde

### ✅ Sistema Saudável

```
✅ TMDB API respondendo
✅ Ollama respondendo com modelo carregado
✅ Cron executando a cada 15 min
✅ Artistas com (TMDB) nos logs
✅ Sem duplicatas (tmdbId único)
✅ Novos artistas nas últimas 24h
```

### ⚠️ Atenção Necessária

```
⚠️  Artistas com (AI) nos logs (TMDB não encontra)
⚠️  Ollama lento (>30s por bio)
⚠️  Poucas execuções do cron (<90/dia)
⚠️  Alguns artistas duplicados
```

### 🚨 Problema Crítico

```
❌ TMDB API não responde
❌ Ollama não instalado ou parado
❌ Cron não executa (0 execuções)
❌ Muitos artistas duplicados (>5%)
❌ Nenhum artista novo em 24h
```

---

## 🎯 Checklist de Implementação

Antes de considerar o sistema funcional:

- [ ] TMDB_API_KEY configurado e válido
- [ ] DATABASE_URL configurado
- [ ] Ollama instalado e rodando
- [ ] Modelo Ollama baixado (llama2, mistral, ou llama3)
- [ ] Teste manual gera artista com "(TMDB)" no log
- [ ] Crontab configurado (`crontab -l`)
- [ ] Arquivo de log criado e com permissões
- [ ] Aguardou 15 minutos e viu execução no log
- [ ] Confirmou novos artistas no banco
- [ ] Verificou que não há duplicatas
- [ ] (Opcional) Configurou systemd para Ollama iniciar automaticamente

---

## 📞 Comandos Úteis Diários

```bash
# Status geral
echo "=== TMDB STATUS ==="
curl -s "https://api.themoviedb.org/3/configuration?api_key=$TMDB_API_KEY" | grep -q images && echo "✅ OK" || echo "❌ FALHA"

echo "=== OLLAMA STATUS ==="
curl -s http://localhost:11434/api/tags | grep -q models && echo "✅ OK" || echo "❌ FALHA"

echo "=== CRON ÚLTIMA EXECUÇÃO ==="
tail -1 /var/log/hallyuhub-cron.log

echo "=== ARTISTAS HOJE ==="
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Artist\" WHERE \"createdAt\"::date = CURRENT_DATE;"

echo "=== ARTISTAS COM TMDB ==="
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Artist\" WHERE \"tmdbId\" IS NOT NULL;"
```

---

**💡 Dica:** Salve esses comandos em um script para executar diariamente:

```bash
# Criar script de monitoramento
cat > /usr/local/bin/hallyuhub-status << 'EOF'
#!/bin/bash
cd /var/www/hallyuhub
source .env 2>/dev/null

echo "🔍 HallyuHub Status - $(date)"
echo "=================================="
# Cole os comandos acima aqui
EOF

chmod +x /usr/local/bin/hallyuhub-status

# Executar:
hallyuhub-status
```

# 🔍 Comandos de Diagnóstico Imediato

Execute esses comandos via SSH para diagnosticar o problema AGORA:

## 1. Conectar ao Servidor

```bash
ssh user@seu-servidor
cd /var/www/hallyuhub
```

## 2. Diagnóstico Rápido (copie e cole tudo de uma vez)

```bash
echo "=========================================="
echo "  DIAGNÓSTICO HALLYUHUB"
echo "=========================================="
echo ""

echo "📊 ESPAÇO EM DISCO GERAL:"
df -h | grep -E '(Filesystem|/$|/var)'
echo ""

echo "📁 TAMANHO DO PROJETO:"
du -sh /var/www/hallyuhub
echo ""

echo "🔝 TOP 10 PASTAS POR TAMANHO:"
du -sh /var/www/hallyuhub/* 2>/dev/null | sort -hr | head -10
echo ""

echo "🐳 IMAGENS DOCKER:"
docker images | head -20
echo ""
echo "Total de imagens Docker:"
docker images | wc -l
echo ""

echo "📦 IMAGENS HALLYUHUB (PRINCIPAL SUSPEITO!):"
docker images ghcr.io/uchidate/khub
echo ""

echo "🐋 ESPAÇO USADO PELO DOCKER:"
docker system df
echo ""

echo "📋 CONTAINERS:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" | head -15
echo ""

echo "💾 VOLUMES:"
docker volume ls | grep hallyuhub
echo ""

echo "📝 LOGS GRANDES (>10MB):"
find /var/www/hallyuhub -name "*.log" -size +10M -exec du -sh {} \; 2>/dev/null || echo "Nenhum log grande encontrado"
echo ""

echo "=========================================="
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
```

## 3. Limpeza Rápida (SE CONFIRMAR PROBLEMA)

### Opção A: Limpeza Segura de Imagens (RECOMENDADO)

```bash
# Remove imagens antigas, mantém últimas 3
docker images ghcr.io/uchidate/khub --format "{{.ID}} {{.CreatedAt}}" | \
  tail -n +4 | awk '{print $1}' | xargs -r docker rmi -f

# Remove containers parados
docker container prune -f

# Remove imagens dangling
docker image prune -f

# Remove volumes órfãos
docker volume prune -f

echo "✅ Limpeza concluída! Verificando espaço:"
df -h | grep -E '(/$|/var)'
docker images | grep hallyuhub
```

### Opção B: Limpeza Agressiva (APENAS EM EMERGÊNCIA!)

```bash
# ⚠️ CUIDADO: Isso para os containers!
# Só use se disco estiver >90% cheio

docker stop $(docker ps -q --filter "name=hallyuhub") 2>/dev/null
docker rm $(docker ps -aq --filter "name=hallyuhub") 2>/dev/null
docker rmi $(docker images -q ghcr.io/uchidate/khub) -f 2>/dev/null
docker system prune -af --volumes

echo "⚠️ IMPORTANTE: Você precisa fazer um redeploy agora!"
```

## 4. Verificar Resultado

```bash
echo "📊 APÓS LIMPEZA:"
df -h | grep -E '(/$|/var)'
du -sh /var/www/hallyuhub
docker images | grep hallyuhub | wc -l
```

## 5. Salvar Resultado (opcional)

```bash
# Salvar diagnóstico em arquivo para análise
{
  date
  echo "=== DISK USAGE ==="
  df -h
  echo ""
  echo "=== PROJECT SIZE ==="
  du -sh /var/www/hallyuhub
  echo ""
  echo "=== DOCKER IMAGES ==="
  docker images
  echo ""
  echo "=== DOCKER SYSTEM ==="
  docker system df
} > /tmp/hallyuhub-diagnostic-$(date +%Y%m%d-%H%M%S).txt

echo "Diagnóstico salvo em: /tmp/hallyuhub-diagnostic-*.txt"
```

---

## 🎯 O QUE PROCURAR:

### ✅ NORMAL:
- Disco usado: <80%
- Projeto: 2-4GB
- Docker images: 2-3 imagens hallyuhub
- Cada imagem: ~500MB-1GB

### ⚠️ PROBLEMA:
- Disco usado: >80%
- Projeto: >10GB
- Docker images: >5 imagens hallyuhub
- Total de imagens: >20

### 🚨 CRÍTICO:
- Disco usado: >90%
- Projeto: >20GB
- Docker images: >10 imagens hallyuhub
- Necessita limpeza IMEDIATA

---

## 💡 APÓS DIAGNÓSTICO:

**Se encontrar problema:**
1. Execute "Opção A: Limpeza Segura"
2. Aguarde próximo deploy (vai incluir limpeza automática)
3. Monitore por alguns dias

**Se crítico:**
1. Execute "Opção B: Limpeza Agressiva"
2. Faça redeploy imediatamente
3. Configure monitoramento

---

**Cole o resultado aqui para eu analisar!** 📊

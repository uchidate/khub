# 🚀 Diagnóstico Rápido - HallyuHub

## Copie e cole este comando no servidor via SSH:

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ DIAGNÓSTICO RÁPIDO - HALLYUHUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 Espaço em Disco:"
df -h / | tail -1 | awk '{print "   Usado: "$3" / "$2" ("$5")"}'
echo ""
echo "📁 Projeto HallyuHub:"
du -sh /var/www/hallyuhub 2>/dev/null | awk '{print "   Tamanho: "$1}'
echo ""
echo "🐳 Imagens Docker do HallyuHub:"
IMAGES=$(docker images ghcr.io/uchidate/khub --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | wc -l)
TOTAL_SIZE=$(docker images ghcr.io/uchidate/khub --format "{{.Size}}" | awk '{sum+=$1}END{print sum/1024"GB"}' 2>/dev/null || echo "0")
echo "   Total: $IMAGES imagens"
docker images ghcr.io/uchidate/khub --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | head -5
echo ""
echo "📊 Docker System:"
docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{Size}}\t{{.Reclaimable}}" | grep -E "(TYPE|Images)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 DECISÃO RÁPIDA:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $IMAGES -gt 5 ]; then
  echo "🔴 CRÍTICO: $IMAGES imagens acumuladas!"
  echo "   Recomendação: LIMPEZA IMEDIATA"
  echo ""
  echo "   Opção A - Limpeza Segura (recomendado):"
  echo "   cd /var/www/hallyuhub && bash scripts/cleanup-server.sh clean"
  echo ""
  echo "   Opção B - Limpeza Agressiva (se A não resolver):"
  echo "   cd /var/www/hallyuhub && bash scripts/cleanup-server.sh deep-clean"
elif [ $IMAGES -gt 3 ]; then
  echo "🟡 ATENÇÃO: $IMAGES imagens (ideal: 2-3)"
  echo "   Recomendação: Limpeza opcional ou aguardar próximo deploy"
  echo ""
  echo "   Opção A - Limpeza Agora:"
  echo "   cd /var/www/hallyuhub && bash scripts/cleanup-server.sh clean"
  echo ""
  echo "   Opção B - Aguardar próximo deploy (limpeza automática)"
else
  echo "✅ OK: $IMAGES imagens (normal)"
  echo "   Nenhuma ação necessária"
fi
echo ""
```

---

## 📋 Como Usar:

1. **SSH no servidor:**
   ```bash
   ssh root@SEU_SERVIDOR
   ```

2. **Cole o comando acima** (todo o bloco entre as crases)

3. **Veja o resultado** - vai mostrar:
   - ✅ OK → Nada a fazer
   - 🟡 ATENÇÃO → Escolha Opção A ou B
   - 🔴 CRÍTICO → Execute Opção A imediatamente

---

## 🎯 Opções de Ação:

### Opção A - Limpeza Segura (Recomendada)
Remove imagens antigas mas mantém últimas 3:
```bash
cd /var/www/hallyuhub && bash scripts/cleanup-server.sh clean
```
**Esperado:** Libera 2-10GB, zero downtime

### Opção B - Limpeza Agressiva (Emergência)
Remove tudo exceto container ativo:
```bash
cd /var/www/hallyuhub && bash scripts/cleanup-server.sh deep-clean
```
**Esperado:** Libera 10-20GB, 2-3 segundos de downtime

### Opção C - Apenas Diagnóstico Completo
Ver todos os detalhes:
```bash
cd /var/www/hallyuhub && bash scripts/cleanup-server.sh diagnose
```

---

## 🚨 Se o script não existir no servidor:

Significa que o servidor ainda não tem a última versão do `develop`. Neste caso:

1. **Limpeza manual imediata:**
   ```bash
   # Remove imagens antigas (mantém últimas 3)
   docker images ghcr.io/uchidate/khub --format "{{.ID}}" | tail -n +4 | xargs -r docker rmi -f

   # Limpa containers e volumes órfãos
   docker container prune -f
   docker image prune -f
   docker volume prune -f
   ```

2. **Depois fazer deploy do develop** para ter o script e limpeza automática

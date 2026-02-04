# 🧹 Limpeza Interativa via SSH

## Copie e cole este BLOCO COMPLETO no SSH:

```bash
#!/bin/bash
# Script de limpeza interativo - copie e cole tudo no SSH

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DIAGNÓSTICO PRÉ-LIMPEZA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Estado atual
echo "📊 Estado Atual:"
echo ""
echo "💾 Espaço em Disco:"
df -h / | tail -1 | awk '{print "   Usado: "$3" / "$2" ("$5")"}'
echo ""

echo "📁 Tamanho do Projeto:"
du -sh /var/www/hallyuhub 2>/dev/null | awk '{print "   Total: "$1}'
echo ""

echo "🐳 Docker System Atual:"
docker system df
echo ""

# 2. Imagens que serão mantidas
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ IMAGENS QUE SERÃO MANTIDAS (últimas 3):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker images ghcr.io/uchidate/khub --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -4
echo ""

# 3. Imagens que serão deletadas
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  IMAGENS QUE SERÃO DELETADAS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OLD_IMAGES=$(docker images ghcr.io/uchidate/khub --format "{{.ID}}" | tail -n +4)
OLD_COUNT=$(echo "$OLD_IMAGES" | grep -v '^$' | wc -l | tr -d ' ')

if [ "$OLD_COUNT" -eq 0 ]; then
    echo "✅ Nenhuma imagem antiga para deletar (máximo 3 imagens)"
    echo ""
    echo "💡 Sistema já está otimizado!"
    exit 0
fi

echo "Total: $OLD_COUNT imagens antigas"
echo ""
docker images ghcr.io/uchidate/khub --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | tail -n +4
echo ""

# 4. Containers órfãos
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 CONTAINERS ÓRFÃOS QUE SERÃO DELETADOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STOPPED=$(docker ps -a -q -f status=exited | wc -l | tr -d ' ')
if [ "$STOPPED" -eq 0 ]; then
    echo "✅ Nenhum container órfão"
else
    echo "Total: $STOPPED containers parados"
    docker ps -a -f status=exited --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" 2>/dev/null || echo "(lista não disponível)"
fi
echo ""

# 5. Volumes órfãos
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 VOLUMES ÓRFÃOS QUE SERÃO DELETADOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DANGLING_VOLUMES=$(docker volume ls -qf dangling=true 2>/dev/null | wc -l | tr -d ' ')
if [ "$DANGLING_VOLUMES" -eq 0 ]; then
    echo "✅ Nenhum volume órfão"
else
    echo "Total: $DANGLING_VOLUMES volumes não utilizados"
    docker volume ls -f dangling=true 2>/dev/null
fi
echo ""

# 6. Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  Imagens antigas: $OLD_COUNT"
echo "📦 Containers órfãos: $STOPPED"
echo "💾 Volumes órfãos: $DANGLING_VOLUMES"
echo ""
echo "💰 Espaço estimado a liberar: ~$(docker system df --format '{{.Reclaimable}}' 2>/dev/null | tail -1 || echo 'calculando...')"
echo ""

# 7. Confirmação
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  CONFIRMAÇÃO NECESSÁRIA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Esta operação irá:"
echo "  ✅ Manter as últimas 3 imagens do projeto"
echo "  ✅ Manter o container ativo (zero downtime)"
echo "  ✅ Manter volumes ativos"
echo "  🗑️  Deletar $OLD_COUNT imagens antigas"
echo "  🗑️  Deletar $STOPPED containers órfãos"
echo "  🗑️  Deletar $DANGLING_VOLUMES volumes órfãos"
echo ""
read -p "🤔 Confirma a limpeza? (digite 'sim' para confirmar): " CONFIRM
echo ""

if [ "$CONFIRM" != "sim" ]; then
    echo "❌ Operação cancelada pelo usuário."
    exit 0
fi

# 8. Executar limpeza
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 EXECUTANDO LIMPEZA..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ Removendo imagens antigas (mantendo últimas 3)..."
docker images ghcr.io/uchidate/khub --format "{{.ID}}" | tail -n +4 | xargs -r docker rmi -f 2>/dev/null && echo "   ✅ Imagens antigas removidas" || echo "   ⚠️  Algumas imagens podem estar em uso (ignorando)"
echo ""

echo "2️⃣ Limpando containers órfãos..."
docker container prune -f
echo "   ✅ Containers órfãos removidos"
echo ""

echo "3️⃣ Limpando imagens órfãs sem tag..."
docker image prune -f
echo "   ✅ Imagens órfãs removidas"
echo ""

echo "4️⃣ Limpando volumes órfãos..."
docker volume prune -f
echo "   ✅ Volumes órfãos removidos"
echo ""

# 9. Resultado final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ LIMPEZA CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 Estado Após Limpeza:"
echo ""
echo "🐳 Imagens Restantes:"
docker images ghcr.io/uchidate/khub --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

echo "💾 Espaço em Disco:"
df -h / | tail -1 | awk '{print "   Usado: "$3" / "$2" ("$5")"}'
echo ""

echo "📦 Docker System:"
docker system df
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Pronto! Sistema otimizado."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## 📋 Instruções:

### 1. Conecte no servidor via SSH:
```bash
ssh root@SEU_SERVIDOR  # produção ou staging
```

### 2. Cole o script completo acima
- Selecione TODO o conteúdo entre as crases (```bash ... ```)
- Cole no terminal SSH
- Aperte Enter

### 3. Veja o diagnóstico e confirme
- O script vai mostrar tudo que será deletado
- Vai pausar e pedir: **"🤔 Confirma a limpeza? (digite 'sim' para confirmar):"**
- Digite `sim` para confirmar ou qualquer outra coisa para cancelar

---

## 🎯 O que acontece:

**ANTES de deletar qualquer coisa:**
- ✅ Mostra disco atual
- ✅ Lista imagens mantidas (últimas 3)
- ✅ Lista imagens que serão deletadas
- ✅ Lista containers órfãos
- ✅ Estima espaço a liberar

**SÓ deleta se você digitar `sim`**

**Depois mostra:**
- ✅ Estado final do disco
- ✅ Imagens restantes
- ✅ Espaço liberado

---

**Cole aqui o resultado completo** quando executar! 📊

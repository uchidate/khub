# 🔧 Ollama Troubleshooting - HallyuHub

Guia completo para diagnosticar e resolver problemas com Ollama.

---

## 🚨 Problema Comum: Timeouts de 5 Minutos

### Sintomas

- Geração de conteúdo trava e não completa
- Logs mostram múltiplas execuções sem "✅ Geração concluída"
- Logs do Ollama mostram `500 | 4m59s` ou `500 | 5m0s`
- `ollama ps` mostra modelo com status "Stopping..."
- Failures altos no relatório (ex: "Failures: 10")

### Diagnóstico

```bash
# 1. Verificar logs do Ollama
ssh root@31.97.255.107 "docker logs hallyuhub-ollama-production --tail 50"

# Procurar por linhas como:
# [GIN] 2026/02/10 - 01:06:39 | 500 | 4m59s | POST "/api/generate"

# 2. Verificar status do modelo
ssh root@31.97.255.107 "docker exec hallyuhub-ollama-production ollama ps"

# Se mostrar "Stopping..." → Problema confirmado
```

### Causa Raiz

**Modelo muito pesado para CPU:**
- `phi3:mini` (3.7GB carregado) é lento demais em CPU
- Sem GPU, processamento leva >5 minutos
- Timeout da aplicação: 5 minutos
- Resultado: Erro 500 e falha na geração

### Solução

**Trocar para modelo mais leve (gemma:2b):**

```bash
# 1. Instalar gemma:2b
ssh root@31.97.255.107
cd /var/www/hallyuhub
./scripts/install-gemma-production.sh

# 2. Atualizar .env.production (via Git, não SSH!)
# Adicionar linha:
# OLLAMA_MODEL="gemma:2b"

# 3. Deploy via Git (NÃO reiniciar via SSH!)
# Local:
git add .env.production.example
git commit -m "fix(ollama): trocar para gemma:2b (mais leve e rápido)"
git push origin staging
# Criar PR para main → Deploy automático
```

---

## 📊 Diagnóstico Completo

### 1. Verificar se Ollama está rodando

```bash
ssh root@31.97.255.107 "docker ps | grep ollama"

# Deve mostrar:
# hallyuhub-ollama-production   Up X hours   (healthy)
```

### 2. Verificar modelos instalados

```bash
ssh root@31.97.255.107 "docker exec hallyuhub-ollama-production ollama list"

# Deve mostrar:
# NAME           ID              SIZE      MODIFIED
# gemma:2b       ...             1.7 GB    ...
```

### 3. Verificar modelo em execução

```bash
ssh root@31.97.255.107 "docker exec hallyuhub-ollama-production ollama ps"

# STATUS deve ser diferente de "Stopping..."
# SIZE deve ser compatível (gemma:2b ~2-3GB, phi3 ~3-4GB)
```

### 4. Verificar logs de geração

```bash
ssh root@31.97.255.107 "tail -100 /var/www/hallyuhub/logs/cron-direct.log"

# Deve mostrar:
# ✅ Geração concluída com sucesso
# (Não deve travar em "Executando via Docker container")
```

### 5. Verificar logs detalhados

```bash
ssh root@31.97.255.107 "tail -200 /var/www/hallyuhub/logs/auto-generate-2026-02.log | grep -i 'fail\|error\|success'"

# Deve mostrar baixo número de Failures:
# Failures: 0-2 (OK)
# Failures: 10+ (PROBLEMA!)
```

---

## 🔄 Comparação de Modelos

| Modelo | Tamanho Disco | RAM Usada | Tempo Médio | Qualidade | Recomendado |
|--------|---------------|-----------|-------------|-----------|-------------|
| **gemma:2b** | 1.7GB | 2-3GB | 10-30s | Boa | ✅ Production |
| phi3:mini | 2.2GB | 3-4GB | 5+ min | Excelente | ❌ Muito lento |
| tinyllama | 637MB | 1-2GB | 5-15s | Regular | ✅ Staging/Testes |

---

## ⚙️ Configuração de Modelo

### Via Variável de Ambiente

```bash
# .env.production
OLLAMA_BASE_URL="http://ollama-production:11434"
OLLAMA_MODEL="gemma:2b"  # ← Definir modelo aqui
```

### Modelos Disponíveis

```typescript
// lib/ai/ai-config.ts
models: {
  default: process.env.OLLAMA_MODEL || 'phi3',
  alternatives: ['mistral', 'llama3:8b', 'tinyllama'],
}
```

---

## 🛠️ Comandos Úteis

### Gerenciar Modelos

```bash
# Listar modelos instalados
docker exec hallyuhub-ollama-production ollama list

# Baixar novo modelo
docker exec hallyuhub-ollama-production ollama pull gemma:2b

# Remover modelo antigo (liberar espaço)
docker exec hallyuhub-ollama-production ollama rm phi3:mini

# Ver modelo em execução
docker exec hallyuhub-ollama-production ollama ps
```

### Testar Modelo

```bash
# Testar geração (deve responder em < 1 minuto)
docker exec hallyuhub-ollama-production ollama run gemma:2b "Olá, como você está?"

# Se demorar >1 min → modelo muito pesado
```

### Monitorar Recursos

```bash
# Ver uso de RAM
free -h

# Ver uso de CPU (top 10 processos)
ps aux --sort=-%cpu | head -11

# Ver uso de disco
df -h
```

---

## 🚀 Processo de Troca de Modelo

### Passo a Passo Completo

1. **Identificar problema:**
   ```bash
   # Ver logs do Ollama
   ssh root@31.97.255.107 "docker logs hallyuhub-ollama-production --tail 30"
   ```

2. **Instalar novo modelo:**
   ```bash
   ssh root@31.97.255.107
   cd /var/www/hallyuhub
   ./scripts/install-gemma-production.sh
   ```

3. **Atualizar configuração (via Git):**
   ```bash
   # Local
   # Editar .env.production.example
   OLLAMA_MODEL="gemma:2b"

   git add .env.production.example docs/
   git commit -m "fix(ollama): trocar para gemma:2b"
   git push origin staging
   ```

4. **Atualizar .env.production no servidor:**
   ```bash
   # Via GitHub Actions ou manualmente (emergência):
   ssh root@31.97.255.107
   cd /var/www/hallyuhub
   nano .env.production
   # Adicionar: OLLAMA_MODEL="gemma:2b"
   ```

5. **Reiniciar aplicação (via deploy):**
   ```bash
   # Via Git (recomendado)
   git push origin main  # → GitHub Actions faz deploy

   # OU via SSH (emergência)
   ssh root@31.97.255.107
   cd /var/www/hallyuhub
   docker-compose -f docker-compose.prod.yml restart hallyuhub
   ```

6. **Verificar funcionamento:**
   ```bash
   # Ver logs em tempo real
   ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/cron-direct.log"

   # Aguardar próxima execução do cron (a cada 15min)
   # Deve mostrar: ✅ Geração concluída com sucesso
   ```

---

## 🔍 Problemas Adicionais

### Ollama não responde

```bash
# Reiniciar Ollama
docker restart hallyuhub-ollama-production

# Verificar saúde
docker ps | grep ollama
# Deve mostrar "(healthy)"
```

### Modelo corrompido

```bash
# Remover e reinstalar
docker exec hallyuhub-ollama-production ollama rm gemma:2b
docker exec hallyuhub-ollama-production ollama pull gemma:2b
```

### Memória insuficiente

```bash
# Ver uso de RAM
free -h

# Se <2GB disponível → problema!
# Solução: Usar modelo menor (tinyllama) ou aumentar RAM
```

---

## 📚 Referências

- [Ollama Models](https://ollama.com/library)
- [Gemma 2B](https://ollama.com/library/gemma:2b) - Modelo leve e rápido
- [Staging Ollama Optimization](./STAGING_OLLAMA_OPTIMIZATION.md)
- [Cron Management](./CRON_MANAGEMENT.md)

---

**Última atualização:** 2026-02-10
**Versão:** 1.0.0

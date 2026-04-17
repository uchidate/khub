# 📅 Gerenciamento de Cron Jobs - HallyuHub

Documentação completa e robusta para gerenciamento de tarefas agendadas (cron jobs).

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Cron Jobs Configurados](#cron-jobs-configurados)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Comandos Úteis](#comandos-úteis)
- [Troubleshooting](#troubleshooting)
- [Manutenção](#manutenção)
- [Logs](#logs)

---

## 🎯 Visão Geral

O HallyuHub usa cron jobs para automatizar tarefas recorrentes:
- 🤖 Geração automática de conteúdo
- ❤️ Monitoramento de saúde dos serviços
- 🧹 Limpeza automática do servidor
- 😴 Gerenciamento de recursos (auto-sleep)

**⚠️ IMPORTANTE:**
- Cron jobs são configurados **no host**, não no container Docker
- Modificações devem ser feitas via scripts versionados no repositório
- **NUNCA** editar crontab manualmente via SSH em produção

---

## 📊 Cron Jobs Configurados

### Production

| Nome | Schedule | Descrição | Log |
|------|----------|-----------|-----|
| **Auto-generate Content** | `*/15 * * * *` | Gera notícias, artistas e produções automaticamente | `logs/cron-direct.log` |
| **Health Monitor** | `*/30 * * * *` | Monitora saúde dos containers e serviços | `logs/health-monitor.log` |
| **Server Cleanup** | `0 3 * * *` | Limpeza automática (logs, Docker, cache) | `logs/cleanup-cron.log` |

### Staging

| Nome | Schedule | Descrição | Log |
|------|----------|-----------|-----|
| **Staging Content Gen** | `*/15 * * * *` | Gera 2 notícias para testes | `logs/staging-cron.log` |
| **Health Monitor** | `*/30 * * * *` | Monitora saúde dos serviços | `logs/health-monitor.log` |
| **Server Cleanup** | `0 3 * * *` | Limpeza automática diária | `logs/cleanup-cron.log` |
| **Ollama Sleep** | `0 0 * * *` | Para Ollama à meia-noite para economizar CPU | `logs/staging-management.log` |

### Legenda de Schedules

- `*/15 * * * *` = A cada 15 minutos
- `*/30 * * * *` = A cada 30 minutos
- `0 3 * * *` = Diariamente às 3h da manhã
- `0 0 * * *` = Diariamente à meia-noite

---

## 🛠️ Scripts Disponíveis

### 1. `setup-auto-generation.sh`

**Propósito:** Configurar cron jobs inicialmente (primeira instalação).

```bash
# Production
cd /var/www/hallyuhub
NODE_ENV=production ./scripts/setup-auto-generation.sh -f --no-test

# Staging
NODE_ENV=staging ./scripts/setup-auto-generation.sh -f --no-test
```

**Flags:**
- `-f` ou `--force`: Força substituição sem confirmação
- `--no-test`: Pula teste de execução manual

**⚠️ Quando usar:**
- Primeira instalação do servidor
- Após deploy que adiciona novos cron jobs
- **NÃO usar** se crontab já está funcionando (use `fix-crontab.sh`)

---

### 2. `fix-crontab.sh` ⭐ **RECOMENDADO**

**Propósito:** Limpar duplicatas e reconfigurar crontab do zero.

```bash
# Via SSH (apenas em emergência)
ssh root@31.97.255.107
cd /var/www/hallyuhub
./scripts/fix-crontab.sh
# Digite "yes" para confirmar
```

**O que faz:**
1. ✅ Remove **todas** as entradas duplicadas
2. ✅ Limpa crontab completamente
3. ✅ Reconfigura com entradas corretas
4. ✅ Detecta ambiente automaticamente (production/staging)

**Quando usar:**
- ✅ Crontab com entradas duplicadas
- ✅ Cron jobs não estão executando corretamente
- ✅ Após múltiplas execuções acidentais do `setup-auto-generation.sh`
- ✅ Para reorganizar e limpar o crontab

---

### 3. `export-cron-info.sh`

**Propósito:** Exportar informações dos cron jobs para JSON (usado pelo painel admin).

```bash
# Executado automaticamente durante deploy
./scripts/export-cron-info.sh production
./scripts/export-cron-info.sh staging
```

**Output:** `/var/www/hallyuhub/cron-config-{env}.json`

---

### 4. `cleanup-cron.sh`

**Propósito:** Limpeza automática do servidor (executado diariamente às 3h).

```bash
# Teste manual (não recomendado em produção)
./scripts/cleanup-cron.sh
```

**O que limpa:**
- 📝 Logs antigos (>7 dias)
- 🐳 Imagens Docker não usadas (mantém últimas 3)
- 📦 Containers parados (mantém últimos 2)
- 💾 Volumes órfãos
- 🗂️ Cache e arquivos temporários
- 📰 Journal do sistema (>7 dias)
- ✂️ Logs gigantes (>100MB truncados)

**Alertas:**
- ⚠️ Slack notification se disco >75%
- 🔴 Exit code 1 se disco >90%

---

## 💻 Comandos Úteis

### Visualizar Crontab Atual

```bash
# No servidor
ssh root@31.97.255.107 "crontab -l"
```

### Verificar Status dos Cron Jobs

```bash
# Ver últimas execuções no log do sistema
ssh root@31.97.255.107 "grep CRON /var/log/syslog | tail -20"

# Ou verificar logs específicos
ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/cron-direct.log"
```

### Ver Logs em Tempo Real

```bash
# Production - Auto-generate
ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/cron-direct.log"

# Health Monitor
ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/health-monitor.log"

# Cleanup
ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/cleanup-cron.log"
```

### Testar Cron Manualmente

```bash
# Testar geração de conteúdo
ssh root@31.97.255.107 "/var/www/hallyuhub/scripts/auto-generate-content.sh"

# Testar health check
ssh root@31.97.255.107 "/var/www/hallyuhub/scripts/monitor-health.sh"

# Testar cleanup (cuidado!)
ssh root@31.97.255.107 "/var/www/hallyuhub/scripts/cleanup-cron.sh"
```

---

## 🔧 Troubleshooting

### Problema: Cron não está executando

**Sintomas:**
- Logs não atualizam há muito tempo
- `crontab -l` está vazio

**Solução:**
```bash
ssh root@31.97.255.107
cd /var/www/hallyuhub
./scripts/fix-crontab.sh
```

---

### Problema: Entradas duplicadas no crontab

**Sintomas:**
- `crontab -l` mostra múltiplas entradas idênticas
- Cron executa múltiplas vezes ao mesmo tempo

**Solução:**
```bash
ssh root@31.97.255.107
cd /var/www/hallyuhub
./scripts/fix-crontab.sh
# Digite "yes" para confirmar limpeza
```

---

### Problema: Logs gigantescos (>100MB)

**Sintomas:**
- `du -h logs/` mostra arquivos enormes
- Disco ficando cheio

**Solução 1 - Automática (aguardar cleanup às 3h):**
O `cleanup-cron.sh` vai truncar automaticamente.

**Solução 2 - Manual (emergência):**
```bash
ssh root@31.97.255.107
cd /var/www/hallyuhub/logs

# Truncar mantendo últimas 10000 linhas
tail -10000 auto-generate-2026-02.log > auto-generate-2026-02.log.tmp
mv auto-generate-2026-02.log.tmp auto-generate-2026-02.log
```

---

### Problema: Script não tem permissão de execução

**Sintomas:**
- Erro: `Permission denied`
- Cron falha ao executar script

**Solução:**
```bash
ssh root@31.97.255.107
cd /var/www/hallyuhub
chmod +x scripts/*.sh
```

---

### Problema: Variáveis de ambiente não carregam

**Sintomas:**
- Script executa mas falha ao conectar no banco
- Erro: `DATABASE_URL is not defined`

**Causa:**
Cron não carrega `.env` automaticamente.

**Solução:**
Scripts devem carregar `.env` explicitamente:
```bash
# Dentro do script
if [ -f /var/www/hallyuhub/.env.production ]; then
    set -a
    source /var/www/hallyuhub/.env.production
    set +a
fi
```

---

## 🧹 Manutenção

### Checklist Semanal

- [ ] Verificar tamanho dos logs: `du -h /var/www/hallyuhub/logs/`
- [ ] Confirmar que crons estão executando: `tail logs/cron-direct.log`
- [ ] Verificar se há erros: `grep -i error logs/*.log`
- [ ] Revisar uso de disco: `df -h`

### Checklist Mensal

- [ ] Revisar crontab: `crontab -l`
- [ ] Limpar logs antigos manualmente se necessário
- [ ] Verificar performance dos scripts
- [ ] Atualizar documentação se houve mudanças

### Rotação de Logs

**Automática:**
O `cleanup-cron.sh` remove logs >7 dias automaticamente.

**Manual (se necessário):**
```bash
ssh root@31.97.255.107
cd /var/www/hallyuhub/logs

# Arquivar logs antigos
tar -czf logs-backup-$(date +%Y-%m-%d).tar.gz *.log
mv logs-backup-*.tar.gz /var/backups/

# Limpar logs atuais
> auto-generate-2026-02.log
> health-monitor.log
```

---

## 📝 Logs

### Localização

Todos os logs ficam em: `/var/www/hallyuhub/logs/`

### Estrutura de Logs

```
logs/
├── cron-direct.log              # Geração automática (production)
├── staging-cron.log             # Geração staging
├── health-monitor.log           # Health checks
├── cleanup-cron.log             # Limpeza automática (às 3h)
├── cleanup-2026-02.log          # Histórico mensal de cleanup
├── staging-management.log       # Auto-sleep Ollama
├── auto-generate-2026-02.log    # Histórico mensal de geração
└── health-monitor-2026-02.log   # Histórico mensal de health
```

### Formato de Log

```
[2026-02-10 03:00:15] 🧹 Iniciando limpeza automática do servidor
[2026-02-10 03:00:15] 📊 Espaço em disco ANTES: 45%
[2026-02-10 03:00:30] ✅ 12 imagens Docker removidas
[2026-02-10 03:00:45] 📊 Espaço em disco DEPOIS: 38%
```

### Alertas no Slack

Se `SLACK_WEBHOOK_ALERTS` estiver configurado:
- ✅ Cleanup concluído com sucesso (disco <75%)
- ⚠️ Aviso de disco (75-85%)
- 🔴 Alerta crítico (>85%)

---

## 🚀 Processo de Deploy com Crons

### 1. Modificar Script de Cron

```bash
# Local
vim scripts/auto-generate-content.sh
git add scripts/auto-generate-content.sh
git commit -m "feat(cron): melhorar geração de conteúdo"
```

### 2. Push para Staging

```bash
git push origin staging
# GitHub Actions faz deploy automático
```

### 3. Testar em Staging

```bash
# Ver logs
ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/staging-cron.log"

# Testar manualmente
ssh root@31.97.255.107 "/var/www/hallyuhub/scripts/staging-cron.sh"
```

### 4. Merge para Main (Production)

```bash
# Criar PR
gh pr create --base main --head staging --title "Update cron scripts"

# Ou merge direto (se aprovado)
git checkout main
git merge staging
git push origin main
# GitHub Actions faz deploy para production
```

### 5. Verificar em Production

```bash
# Ver crontab
ssh root@31.97.255.107 "crontab -l"

# Ver logs
ssh root@31.97.255.107 "tail -f /var/www/hallyuhub/logs/cron-direct.log"
```

---

## 🔐 Segurança e Boas Práticas

### ✅ Fazer

- ✅ Versionar todos os scripts no Git
- ✅ Testar scripts localmente antes de deploy
- ✅ Usar `fix-crontab.sh` para reconfigurar
- ✅ Monitorar logs regularmente
- ✅ Configurar alertas Slack
- ✅ Documentar mudanças neste arquivo

### ❌ Não Fazer

- ❌ Editar crontab manualmente via `crontab -e` em produção
- ❌ Modificar scripts via SSH (usar Git!)
- ❌ Rodar múltiplas vezes `setup-auto-generation.sh` (causa duplicatas)
- ❌ Ignorar logs gigantescos
- ❌ Desabilitar cleanup automático
- ❌ Hardcoded secrets nos scripts

---

## 📚 Referências

- [Crontab Guru](https://crontab.guru/) - Testar expressões cron
- [Cron Best Practices](https://www.cyberciti.biz/tips/linux-unix-cron-jobs.html)
- [Docker + Cron](https://docs.docker.com/config/containers/resource_constraints/)

---

## 📞 Suporte

**Problemas com crons?**

1. Verificar logs: `tail -f /var/www/hallyuhub/logs/*.log`
2. Rodar `fix-crontab.sh` para limpar e reconfigurar
3. Testar script manualmente
4. Verificar permissões: `chmod +x scripts/*.sh`
5. Se persistir, abrir issue no GitHub

---

**Última atualização:** 2026-02-10
**Versão:** 1.0.0

# 👋 Bem-vindo ao Sistema de Gerenciamento de Versões

## 🎯 Você está em: HallyuHub - Sistema de Verificação de Versões

Este projeto agora possui um **sistema robusto** para gerenciar e verificar versões entre:
- 💻 **Local** (sua máquina)
- 🧪 **Staging** (homologação)
- 🚀 **Production** (produção)

---

## ⚡ INÍCIO RÁPIDO (30 segundos)

### Opção 1: Menu Interativo (Mais Fácil)
```bash
./scripts/menu.sh
```
Interface amigável - escolha o número da operação desejada.

### Opção 2: Verificação Rápida
```bash
make check
```
Verifica tudo em 5 segundos.

### Opção 3: Menu de Comandos
```bash
make help
```
Veja todos os comandos disponíveis.

---

## 📚 DOCUMENTAÇÃO

### Para Iniciantes
➡️ **Comece aqui:** [INICIO-RAPIDO.md](INICIO-RAPIDO.md)
- Exemplos práticos
- Workflows comuns
- 3 formas de usar o sistema

### Para Desenvolvedores
➡️ **Referência completa:** [VERIFICACAO-VERSOES.md](VERIFICACAO-VERSOES.md)
- Todos os scripts detalhados
- Troubleshooting
- Configurações avançadas

### Para Deploys
➡️ **Checklist:** [CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md)
- Passo-a-passo de deploy
- Checklists de verificação
- Procedimentos de emergência

### Para Gestão
➡️ **Resumo executivo:** [RESUMO-EXECUTIVO.md](RESUMO-EXECUTIVO.md)
- Overview do sistema
- Benefícios
- Métricas

### Navegação Completa
➡️ **Índice:** [INDICE-COMPLETO.md](INDICE-COMPLETO.md)
- Mapa completo de tudo
- Onde encontrar cada coisa
- Fluxo de trabalho visual

---

## 🛠️ COMANDOS ESSENCIAIS

```bash
# Verificações
make check          # Rápida (5s)
make check-all      # Completa (10s)
make validate       # Pré-deploy (30s)
make health         # Health check (10s)

# Operações
make bump-version   # Atualizar versão
make monitor        # Monitorar continuamente
make rollback       # Reverter deploy

# Desenvolvimento
make dev            # Servidor dev
make build          # Build projeto
make setup          # Setup inicial
```

---

## 🚀 WORKFLOW TÍPICO

```bash
# 1. Começar o dia
make check

# 2. Desenvolver
# ... suas mudanças ...

# 3. Antes de deploy
make validate

# 4. Deploy para staging
git checkout develop
git merge sua-branch
git push origin develop

# 5. Verificar staging
make health

# 6. Deploy para production
git checkout main
git merge develop
git push origin main

# 7. Monitorar production
make monitor
```

---

## 📊 AMBIENTES

| Ambiente | URL | Branch | Deploy |
|----------|-----|--------|--------|
| Local | http://localhost:3000 | (qualquer) | Manual |
| Staging | http://31.97.255.107:3001 | develop | Automático |
| Production | http://31.97.255.107:3000 | main | Automático |

---

## 🎓 APRENDER MAIS

1. **Primeira vez?**
   - Leia: [INICIO-RAPIDO.md](INICIO-RAPIDO.md)
   - Execute: `./scripts/menu.sh`

2. **Precisa de detalhes?**
   - Leia: [VERIFICACAO-VERSOES.md](VERIFICACAO-VERSOES.md)
   - Execute: `make help`

3. **Vai fazer deploy?**
   - Leia: [CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md)
   - Execute: `make validate`

---

## ✨ O QUE VOCÊ GANHOU

### Antes (Sem Sistema)
❌ Verificação manual de versões
❌ Deploys sem validação
❌ Sem rollback rápido
❌ Dificuldade para identificar problemas

### Agora (Com Sistema)
✅ Verificação automática em segundos
✅ Validação completa pré-deploy
✅ Rollback em 1 minuto
✅ Monitoramento contínuo
✅ Processos padronizados

---

## 🆘 AJUDA

```bash
make help                    # Comandos Make
./scripts/menu.sh           # Menu interativo
cat INDICE-COMPLETO.md      # Índice completo
cat INICIO-RAPIDO.md        # Guia rápido
```

---

## 🎯 PRÓXIMO PASSO

**Execute agora:**
```bash
./scripts/menu.sh
```

ou

```bash
make check
```

---

**Sistema criado em:** 02/02/2026
**Versão:** 1.0.0
**Status:** ✅ Pronto para uso!

🚀 **Comece a usar agora mesmo!**

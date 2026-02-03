# ✅ Checklist de Deploy - Quick Reference

## 🚀 Deploy Completo (Local → Staging → Produção)

### Fase 1: Local
```bash
- [ ] npm run build passou
- [ ] Sem secrets expostos
- [ ] git commit -m "..."
- [ ] git push origin develop
```

### Fase 2: Staging
```bash
- [ ] GitHub Actions completou (4-5 min)
- [ ] ssh root@31.97.255.107 "docker ps --filter 'name=hallyuhub-staging'"
      → Mostra: (healthy)
- [ ] curl http://31.97.255.107:3001/api/health
      → Retorna: "deploy_env":"staging"
- [ ] Testar funcionalidades no browser
- [ ] SEM ERROS
```

**✋ PARE AQUI se staging tiver qualquer erro!**

### Fase 3: Produção
```bash
- [ ] git checkout main
- [ ] git merge develop
- [ ] git push origin main
- [ ] Aguardar 5-6 minutos
- [ ] ssh root@31.97.255.107 "docker ps --filter 'name=hallyuhub'"
      → Mostra: (healthy)
- [ ] curl http://31.97.255.107:3000/api/health
      → Retorna: "deploy_env":"production"
- [ ] Testar features críticas
- [ ] Monitorar logs (2 min): docker logs -f hallyuhub --tail 50
```

---

## 🔥 Validação Rápida de Ambiente

### Staging
```bash
curl -s http://31.97.255.107:3001/api/health | grep "staging"
```
**Esperado:** `"deploy_env":"staging"`

### Produção
```bash
curl -s http://31.97.255.107:3000/api/health | grep "production"
```
**Esperado:** `"deploy_env":"production"`

---

## 🆘 Troubleshooting Rápido

### Build falhou?
```bash
1. Ver logs no GitHub Actions
2. Testar local: npm run build
3. Corrigir → commit → push develop
```

### Container unhealthy?
```bash
ssh root@31.97.255.107
docker logs hallyuhub-staging --tail 50
```

### Rollback Produção
```bash
git checkout main
git revert HEAD
git push origin main
```

---

## 📊 Status Atual

**Última atualização:** 2026-02-03

| Ambiente | Status | Deploy_Env | Última Validação |
|----------|--------|------------|------------------|
| Staging | ✅ Healthy | staging | 2026-02-03 01:26 |
| Produção | ✅ Healthy | production | 2026-02-03 01:24 |

---

## 💡 Lembrete

**SEMPRE:** Local → Staging (validar!) → Produção

**NUNCA:** Pular staging ou ignorar erros!

# Guia Completo de Setup de Produção - HallyuHub

Este guia consolida todos os passos necessários para configurar o ambiente de produção do zero.

## 📋 Pré-requisitos

- Servidor VPS rodando (31.97.255.107)
- DNS configurado (www.hallyuhub.com.br → 31.97.255.107)
- Docker e Docker Compose instalados
- Acesso SSH ao servidor
- Código já clonado em `/var/www/hallyuhub`

## 🚀 Setup Completo - Ordem de Execução

### 1️⃣ Conectar no Servidor

```bash
ssh usuario@31.97.255.107
cd /var/www/hallyuhub
```

### 2️⃣ Atualizar Código

```bash
git pull origin main
```

### 3️⃣ Criar Volumes Docker

```bash
# Volume para Ollama (modelos de IA)
docker volume create ollama-production-data

# Volume para PostgreSQL (se ainda não existe)
docker volume create postgres-production-data

# Volume para dados da aplicação (se ainda não existe)
docker volume create hallyuhub-data
```

Verificar:
```bash
docker volume ls | grep -E 'ollama|postgres|hallyuhub'
```

### 4️⃣ Configurar Variáveis de Ambiente

```bash
nano .env.production
```

**Configurações essenciais:**

```bash
# PostgreSQL
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
DATABASE_URL="postgresql://hallyuhub:SUA_SENHA_SEGURA_AQUI@postgres-production:5432/hallyuhub_production"

# App (será atualizado para HTTPS depois)
NEXT_PUBLIC_SITE_URL="http://31.97.255.107:3000"
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production

# AI Providers
OLLAMA_BASE_URL="http://ollama-production:11434"
GEMINI_API_KEY="sua_key_aqui"
OPENAI_API_KEY="sua_key_aqui"
ANTHROPIC_API_KEY="sua_key_aqui"

# Slack Notifications
SLACK_WEBHOOK_CONTENT="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_DEPLOYS="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/..."
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5️⃣ Subir Containers

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Verificar:
```bash
docker ps
```

Deve ver:
- `hallyuhub` (aplicação)
- `hallyuhub-postgres-production` (banco de dados)
- `hallyuhub-ollama-production` (IA local)

### 6️⃣ Configurar Ollama

#### 6.1 Baixar modelo phi3 (~2.2GB)

```bash
./scripts/setup-ollama-docker.sh production
```

Aguarde o download (alguns minutos).

#### 6.2 Testar Ollama

```bash
./scripts/test-ollama.sh production
```

Deve passar todos os 7 testes.

### 7️⃣ Verificar Aplicação (HTTP)

```bash
# Testar localmente
curl http://localhost:3000

# Testar externamente
curl http://31.97.255.107:3000
```

Se retornar HTML, a aplicação está funcionando! ✅

### 8️⃣ Configurar HTTPS com Nginx

#### 8.1 Executar script de setup

```bash
sudo ./scripts/setup-nginx-https.sh
```

#### 8.2 Responder às perguntas:

```
Domínio principal (ex: hallyuhub.com): hallyuhub.com.br
Incluir subdomínio www? (y/N): y
Porta da aplicação (padrão: 3000): 3000
Email para Let's Encrypt: seu@email.com
```

#### 8.3 Aguardar conclusão

O script vai:
- ✅ Instalar Nginx
- ✅ Configurar reverse proxy
- ✅ Instalar Certbot
- ✅ Obter certificado SSL
- ✅ Configurar HTTPS
- ✅ Configurar renovação automática

#### 8.4 Testar HTTPS

```bash
# Deve redirecionar para HTTPS
curl -I http://www.hallyuhub.com.br

# Deve retornar 200 OK com HTTPS
curl -I https://www.hallyuhub.com.br
```

### 9️⃣ Atualizar URL para HTTPS

```bash
nano .env.production
```

Mudar:
```bash
NEXT_PUBLIC_SITE_URL=https://www.hallyuhub.com.br
```

Salvar e reiniciar:
```bash
docker-compose -f docker-compose.prod.yml restart hallyuhub
```

### 🔟 Configurar Auto-geração de Conteúdo

```bash
./scripts/setup-auto-generation.sh
```

Isso configura um cron job que:
- Roda a cada 15 minutos
- Gera 1 notícia + 1 artista por execução
- Envia notificações no Slack

Verificar:
```bash
crontab -l
```

Deve ver:
```
*/15 * * * * /var/www/hallyuhub/scripts/auto-generate-content.sh
```

### 1️⃣1️⃣ Verificações Finais

#### Containers rodando:
```bash
docker ps
```

Deve ter 3 containers:
- ✅ hallyuhub
- ✅ hallyuhub-postgres-production
- ✅ hallyuhub-ollama-production

#### Site acessível:
```bash
curl https://www.hallyuhub.com.br
```

#### Endpoint de health:
```bash
curl https://www.hallyuhub.com.br/api/health | jq .
```

Deve retornar:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": {
    "status": "connected"
  },
  "aiProviders": {
    "ollama": {
      "available": true,
      "url": "http://ollama-production:11434"
    },
    "gemini": {
      "available": true
    }
  }
}
```

#### Certificado SSL:
```bash
sudo certbot certificates
```

Deve mostrar certificado válido para hallyuhub.com.br e www.hallyuhub.com.br

#### Logs da aplicação:
```bash
docker logs hallyuhub -f --tail 50
```

Não deve ter erros críticos.

#### Nginx funcionando:
```bash
sudo systemctl status nginx
```

Deve estar `active (running)`

## ✅ Checklist Completo

- [ ] Servidor acessível via SSH
- [ ] Código atualizado (git pull)
- [ ] Volumes Docker criados
- [ ] .env.production configurado
- [ ] Containers rodando (docker ps)
- [ ] Ollama configurado e testado
- [ ] Aplicação respondendo em HTTP
- [ ] Nginx instalado e configurado
- [ ] Certificado SSL obtido
- [ ] HTTPS funcionando
- [ ] NEXT_PUBLIC_SITE_URL atualizado para HTTPS
- [ ] Auto-geração configurada (cron)
- [ ] Endpoint /api/health retorna OK
- [ ] Slack notificações funcionando
- [ ] Site acessível em https://www.hallyuhub.com.br

## 🔧 Comandos Úteis

### Ver logs em tempo real:
```bash
# Aplicação
docker logs hallyuhub -f --tail 50

# Ollama
docker logs hallyuhub-ollama-production -f --tail 50

# PostgreSQL
docker logs hallyuhub-postgres-production -f --tail 50

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Reiniciar serviços:
```bash
# Aplicação
docker-compose -f docker-compose.prod.yml restart hallyuhub

# Todos os containers
docker-compose -f docker-compose.prod.yml restart

# Nginx
sudo systemctl restart nginx
```

### Verificar recursos:
```bash
# Uso de CPU/RAM dos containers
docker stats

# Espaço em disco
df -h

# Volumes Docker
docker volume ls
docker system df -v
```

### Backup manual:
```bash
./scripts/backup-db.sh
```

### Testar geração de conteúdo:
```bash
npm run atualize:ai -- --news 1 --artists 1
```

## 🆘 Troubleshooting

### Site não carrega
1. Verificar containers: `docker ps`
2. Verificar logs: `docker logs hallyuhub --tail 50`
3. Testar localmente: `curl http://localhost:3000`
4. Verificar Nginx: `sudo nginx -t`

### HTTPS não funciona
1. Verificar certificado: `sudo certbot certificates`
2. Testar configuração: `sudo nginx -t`
3. Ver logs: `sudo tail -f /var/log/nginx/error.log`
4. Renovar certificado: `sudo certbot renew --dry-run`

### Ollama não funciona
1. Verificar container: `docker ps | grep ollama`
2. Ver modelos: `docker exec hallyuhub-ollama-production ollama list`
3. Testar: `./scripts/test-ollama.sh production`
4. Ver logs: `docker logs hallyuhub-ollama-production --tail 50`

### Auto-geração não roda
1. Verificar cron: `crontab -l`
2. Ver logs: `cat logs/auto-generate-$(date +%Y-%m).log`
3. Testar manualmente: `./scripts/auto-generate-content.sh`
4. Verificar permissões: `ls -la scripts/auto-generate-content.sh`

## 📚 Documentação Adicional

- [HTTPS_SETUP.md](HTTPS_SETUP.md) - Detalhes sobre configuração HTTPS
- [OLLAMA_SETUP.md](OLLAMA_SETUP.md) - Detalhes sobre Ollama
- [AUTO_GENERATION.md](AUTO_GENERATION.md) - Detalhes sobre auto-geração
- [SLACK_NOTIFICATIONS.md](SLACK_NOTIFICATIONS.md) - Detalhes sobre Slack

## 🎯 Resultado Final

Após completar todos os passos, você terá:

✅ **Site em produção**: https://www.hallyuhub.com.br
✅ **HTTPS com certificado válido**
✅ **Ollama rodando** (IA local)
✅ **PostgreSQL** (banco de dados)
✅ **Auto-geração** (1 notícia + 1 artista a cada 15min)
✅ **Notificações Slack** (deploys, conteúdo, alertas)
✅ **Renovação automática** de SSL
✅ **Backups** configurados

**Sistema totalmente operacional!** 🎉

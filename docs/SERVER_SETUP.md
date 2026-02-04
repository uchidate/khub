# Configuração do Servidor de Produção

Este documento descreve TODAS as configurações manuais necessárias no servidor de produção.

## ⚠️ IMPORTANTE

Este setup deve ser feito UMA VEZ no servidor. Deploys subsequentes NÃO precisam refazer estas etapas.

---

## 📋 Pré-requisitos

- Ubuntu Server 24.04+
- Docker e Docker Compose instalados
- Acesso root ao servidor
- Domínio DNS configurado (hallyuhub.com.br → IP do servidor)

---

## 🔧 Configuração Inicial (Uma Vez)

### 1. Criar Estrutura de Diretórios

```bash
mkdir -p /var/www/hallyuhub
cd /var/www/hallyuhub
```

### 2. Clonar Repositório

```bash
git clone https://github.com/uchidate/khub.git .
git checkout main
```

### 3. Criar Volumes Docker

```bash
docker volume create hallyuhub-data
docker volume create postgres-production-data
docker volume create ollama-production-data
```

Verificar:
```bash
docker volume ls | grep -E 'hallyuhub|postgres-production|ollama-production'
```

### 4. Criar Rede Docker

```bash
docker network create web 2>/dev/null || echo "Network already exists"
```

### 5. Configurar .env.production

**CRÍTICO**: Este arquivo NÃO está no git e deve ser criado manualmente:

```bash
cat > /var/www/hallyuhub/.env.production << 'EOF'
# PostgreSQL Configuration
POSTGRES_PASSWORD=SENHA_SEGURA_AQUI
DATABASE_URL="postgresql://hallyuhub:SENHA_SEGURA_AQUI@postgres-production:5432/hallyuhub_production"

# App Configuration
NEXT_PUBLIC_SITE_URL="https://www.hallyuhub.com.br"
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production

# AI Providers
OLLAMA_BASE_URL="http://ollama-production:11434"
GEMINI_API_KEY="SUA_KEY_AQUI"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Slack Notifications
SLACK_WEBHOOK_CONTENT="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_DEPLOYS="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/..."
EOF
```

**Substituir:**
- `SENHA_SEGURA_AQUI` por uma senha forte
- `SUA_KEY_AQUI` pelas API keys reais
- URLs dos webhooks do Slack

### 6. Instalar Nginx e Certbot

```bash
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
```

### 7. Parar Traefik (se existir)

```bash
docker stop root-traefik-1 2>/dev/null || true
docker update --restart=no root-traefik-1 2>/dev/null || true
```

### 8. Configurar Nginx

```bash
cat > /etc/nginx/sites-available/hallyuhub << 'NGINXEOF'
upstream hallyuhub_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    server_name hallyuhub.com.br www.hallyuhub.com.br;

    location / {
        proxy_pass http://hallyuhub_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    listen 80;
    listen [::]:80;
}
NGINXEOF

# Ativar site
ln -sf /etc/nginx/sites-available/hallyuhub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e iniciar
nginx -t
systemctl enable nginx
systemctl start nginx
```

### 9. Obter Certificado SSL

```bash
certbot --nginx \
  -d hallyuhub.com.br \
  -d www.hallyuhub.com.br \
  --non-interactive \
  --agree-tos \
  --email seu@email.com \
  --redirect
```

**IMPORTANTE**: Substituir `seu@email.com` por um email válido.

### 10. Subir Containers Inicialmente

```bash
cd /var/www/hallyuhub
docker-compose -f docker-compose.prod.yml up -d
```

### 11. Configurar Senha do PostgreSQL

```bash
docker exec hallyuhub-postgres-production psql -U hallyuhub -d postgres \
  -c "ALTER USER hallyuhub WITH PASSWORD 'SENHA_SEGURA_AQUI';"
```

**IMPORTANTE**: Usar a MESMA senha do .env.production

### 12. Configurar Ollama

```bash
./scripts/setup-ollama-docker.sh production
```

Isso vai baixar o modelo phi3 (~2.2GB). Aguarde a conclusão.

### 13. Configurar Auto-geração (Cron)

```bash
./scripts/setup-auto-generation.sh
```

---

## 🧪 Ambiente de Staging (Opcional)

O ambiente de staging permite testar mudanças antes de ir para produção. Roda na porta 3001.

### 1. Criar .env.staging

```bash
cat > /var/www/hallyuhub/.env.staging << 'EOF'
# PostgreSQL Configuration
POSTGRES_PASSWORD=SENHA_SEGURA_AQUI
DATABASE_URL="postgresql://hallyuhub:SENHA_SEGURA_AQUI@postgres-staging:5432/hallyuhub_staging"

# App Configuration
NEXT_PUBLIC_SITE_URL="http://IP_DO_SERVIDOR:3001"
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=staging

# AI Providers
OLLAMA_BASE_URL="http://ollama-staging:11434"
GEMINI_API_KEY="SUA_KEY_AQUI"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Slack Notifications
SLACK_WEBHOOK_CONTENT="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_DEPLOYS="https://hooks.slack.com/services/..."
SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/..."
EOF
```

**Substituir:**
- `SENHA_SEGURA_AQUI` por uma senha forte
- `IP_DO_SERVIDOR` pelo IP do servidor (ex: 31.97.255.107)
- API keys e webhooks conforme necessário

### 2. Criar Volumes Staging

```bash
docker volume create postgres-staging-data
docker volume create ollama-staging-data
```

### 3. Subir Containers Staging

```bash
cd /var/www/hallyuhub
docker-compose -f docker-compose.staging.yml up -d
```

### 4. Configurar Senha PostgreSQL Staging

```bash
docker exec hallyuhub-postgres-staging psql -U hallyuhub -d postgres \
  -c "ALTER USER hallyuhub WITH PASSWORD 'SENHA_SEGURA_AQUI';"
```

**IMPORTANTE**: Usar a MESMA senha do .env.staging

### 5. Configurar Ollama Staging

```bash
./scripts/setup-ollama-docker.sh staging
```

### 6. Verificar Staging

```bash
# Containers rodando
docker ps | grep staging

# Health endpoint
curl http://localhost:3001/api/health | jq .

# Teste externo
curl http://IP_DO_SERVIDOR:3001/api/health | jq .
```

**Staging estará disponível em**: `http://IP_DO_SERVIDOR:3001`

---

## ✅ Verificação Pós-Setup

Execute este script para verificar se tudo está OK:

```bash
./scripts/verify-production.sh
```

Ou manualmente:

```bash
# 1. Containers rodando
docker ps | grep -E 'hallyuhub|postgres-production|ollama-production'

# 2. Site acessível
curl -I https://www.hallyuhub.com.br

# 3. Health endpoint
curl https://www.hallyuhub.com.br/api/health | jq .

# 4. Certificado SSL válido
certbot certificates | grep hallyuhub

# 5. Nginx ativo
systemctl is-active nginx

# 6. Cron configurado
crontab -l | grep auto-generate
```

---

## 🔄 Deploys Subsequentes

**IMPORTANTE**: Depois do setup inicial, deploys são AUTOMÁTICOS via GitHub Actions!

Quando você faz merge para `main`:
1. GitHub Actions builda a imagem Docker
2. Faz push para GHCR
3. SSH no servidor
4. Faz `docker-compose pull`
5. Faz `docker-compose up -d`
6. Envia notificação no Slack

**Nenhuma configuração manual é necessária** após o setup inicial.

### Deploy Manual (se necessário)

```bash
cd /var/www/hallyuhub
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Troubleshooting

### Site não carrega

```bash
# Verificar containers
docker ps

# Ver logs
docker logs hallyuhub --tail 50
docker logs hallyuhub-postgres-production --tail 50

# Verificar Nginx
systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Erro de DATABASE_URL

```bash
# Verificar se a senha está correta
docker exec hallyuhub env | grep DATABASE_URL

# Testar conexão PostgreSQL
docker exec hallyuhub-postgres-production psql -U hallyuhub -d hallyuhub_production -c "SELECT 1"
```

### Certificado SSL expirado

```bash
# Renovar manualmente
certbot renew

# Verificar renovação automática
systemctl status certbot.timer
```

### Ollama não funciona

```bash
# Ver status
./scripts/test-ollama.sh production

# Ver logs
docker logs hallyuhub-ollama-production --tail 50

# Reiniciar
docker-compose -f docker-compose.prod.yml restart ollama-production
```

---

## 📚 Arquivos Importantes no Servidor

### NÃO estão no Git (criados manualmente):
- `/var/www/hallyuhub/.env.production` - **CRÍTICO**
- `/etc/nginx/sites-available/hallyuhub` - Configuração Nginx
- `/etc/letsencrypt/live/hallyuhub.com.br/` - Certificados SSL

### Gerenciados pelo Git:
- `/var/www/hallyuhub/*` - Código da aplicação
- `docker-compose.prod.yml` - Configuração Docker

### Volumes Docker (persistidos):
- `hallyuhub-data` - Dados da aplicação
- `postgres-production-data` - Database PostgreSQL
- `ollama-production-data` - Modelos do Ollama

---

## 🔒 Segurança

### Backups Recomendados

```bash
# PostgreSQL (automático via cron)
./scripts/backup-db.sh

# .env.production
cp /var/www/hallyuhub/.env.production /root/backups/.env.production.backup

# Certificados SSL (renovam automaticamente)
# Backup em: /etc/letsencrypt/archive/hallyuhub.com.br/
```

### Firewall

```bash
# Permitir apenas HTTP, HTTPS e SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# Aplicação
docker logs hallyuhub -f

# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL
docker logs hallyuhub-postgres-production -f
```

### Uso de Recursos

```bash
# Docker
docker stats

# Sistema
htop
df -h
free -h
```

---

## 🆘 Contatos de Emergência

- **Slack**: Canal #deploys
- **Logs**: Todos os deploys enviam notificação no Slack
- **Documentação**: Ver `/var/www/hallyuhub/docs/`

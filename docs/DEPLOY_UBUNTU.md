# 🚀 Guia de Deploy - HallyuHub no Ubuntu 24.04 (Hostinger)

Este guia mostra como fazer deploy do HallyuHub no seu servidor Ubuntu com Docker, convivendo com o n8n.

## 📋 Pré-requisitos

- ✅ Servidor Ubuntu 24.04 na Hostinger
- ✅ Docker e Docker Compose instalados
- ✅ n8n já rodando em Docker
- ✅ Domínio apontado para o servidor (ex: `hallyuhub.com`)

## 🏗️ Arquitetura

```
Internet
    ↓
Nginx Reverse Proxy (porta 80/443)
    ↓
    ├─→ n8n.seudominio.com → n8n container (porta 5678)
    └─→ hallyuhub.com → HallyuHub container (porta 3000)
```

## 📦 Passo 1: Preparar o Servidor

### 1.1 Conectar ao servidor via SSH

```bash
ssh root@seu-servidor-hostinger
```

### 1.2 Criar diretório do projeto

```bash
mkdir -p /var/www/hallyuhub
cd /var/www/hallyuhub
```

### 1.3 Clonar ou enviar o código

**Opção A: Via Git (recomendado)**
```bash
# Se você tiver o código no GitHub
git clone https://github.com/seu-usuario/hallyuhub.git .
```

**Opção B: Via SCP (do seu Mac)**
```bash
# No seu Mac, execute:
cd /Users/fabiouchidate/Antigravity/khub/v1
tar -czf hallyuhub.tar.gz .
scp hallyuhub.tar.gz root@seu-servidor:/var/www/hallyuhub/

# No servidor:
cd /var/www/hallyuhub
tar -xzf hallyuhub.tar.gz
rm hallyuhub.tar.gz
```

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar arquivo `.env.production`

```bash
nano .env.production
```

Cole o seguinte conteúdo:

```env
# Database
DATABASE_URL="file:./prod.db"

# Site
NEXT_PUBLIC_SITE_URL="https://hallyuhub.com"

# AI Providers
GEMINI_API_KEY=AIzaSyBrIIHZVv36uAaXSoYL2xl0bJRJG1KMP-E
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Node
NODE_ENV=production
```

Salve com `Ctrl+X`, depois `Y`, depois `Enter`.

## 🐳 Passo 3: Docker Compose

### 3.1 Criar `docker-compose.yml`

```bash
nano docker-compose.yml
```

Cole:

```yaml
version: '3.8'

services:
  hallyuhub:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hallyuhub
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    volumes:
      - ./prisma:/app/prisma
      - hallyuhub-data:/app/data
    networks:
      - web
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  hallyuhub-data:

networks:
  web:
    external: true
```

### 3.2 Criar rede Docker compartilhada

```bash
# Criar rede se não existir
docker network create web || true
```

### 3.3 Conectar n8n à rede (se necessário)

```bash
# Descobrir o nome do container do n8n
docker ps | grep n8n

# Conectar à rede web
docker network connect web <nome-do-container-n8n>
```

## 🔨 Passo 4: Build e Deploy

### 4.1 Build da imagem

```bash
docker-compose build
```

### 4.2 Inicializar banco de dados

```bash
# Criar e popular o banco
docker-compose run --rm hallyuhub sh -c "npx prisma migrate deploy && npx prisma db seed"
```

### 4.3 Iniciar o container

```bash
docker-compose up -d
```

### 4.4 Verificar logs

```bash
docker-compose logs -f hallyuhub
```

## 🌐 Passo 5: Configurar Nginx

### 5.1 Criar configuração do site

```bash
nano /etc/nginx/sites-available/hallyuhub
```

Cole:

```nginx
server {
    listen 80;
    server_name hallyuhub.com www.hallyuhub.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache de assets estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    location /images {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.2 Ativar o site

```bash
ln -s /etc/nginx/sites-available/hallyuhub /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 🔒 Passo 6: SSL com Certbot

### 6.1 Instalar Certbot

```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### 6.2 Obter certificado SSL

```bash
certbot --nginx -d hallyuhub.com -d www.hallyuhub.com
```

Siga as instruções e escolha redirecionar HTTP para HTTPS.

## ✅ Passo 7: Verificação

### 7.1 Testar o site

```bash
curl http://localhost:3000
curl https://hallyuhub.com
```

### 7.2 Verificar containers

```bash
docker ps
```

Você deve ver:
- ✅ Container do n8n rodando
- ✅ Container do hallyuhub rodando

## 🔄 Passo 8: Atualização Automática de Dados com IA

### 8.1 Criar script de atualização

```bash
nano /var/www/hallyuhub/update-data.sh
```

Cole:

```bash
#!/bin/bash
cd /var/www/hallyuhub
docker-compose exec -T hallyuhub npm run atualize:ai -- --news=5 --artists=2 --productions=1
```

Torne executável:

```bash
chmod +x /var/www/hallyuhub/update-data.sh
```

### 8.2 Configurar Cron (atualização diária)

```bash
crontab -e
```

Adicione:

```cron
# Atualizar dados do HallyuHub diariamente às 6h
0 6 * * * /var/www/hallyuhub/update-data.sh >> /var/log/hallyuhub-update.log 2>&1
```

## 🛠️ Comandos Úteis

### Gerenciamento do Container

```bash
# Ver logs
docker-compose logs -f hallyuhub

# Reiniciar
docker-compose restart hallyuhub

# Parar
docker-compose stop hallyuhub

# Iniciar
docker-compose start hallyuhub

# Rebuild após mudanças
docker-compose up -d --build
```

### Atualizar código

```bash
cd /var/www/hallyuhub
git pull  # Se usando Git
docker-compose up -d --build
```

### Backup do banco de dados

```bash
# Backup
docker-compose exec hallyuhub sh -c "sqlite3 /app/prisma/prod.db .dump" > backup-$(date +%Y%m%d).sql

# Restaurar
cat backup-20240131.sql | docker-compose exec -T hallyuhub sh -c "sqlite3 /app/prisma/prod.db"
```

## 🔍 Troubleshooting

### Container não inicia

```bash
docker-compose logs hallyuhub
```

### Porta 3000 já em uso

```bash
# Ver o que está usando a porta
lsof -i :3000

# Mudar a porta no docker-compose.yml
ports:
  - "3001:3000"  # Usar 3001 externamente
```

### Nginx não conecta

```bash
# Verificar se o container está rodando
docker ps | grep hallyuhub

# Testar conexão direta
curl http://localhost:3000
```

### SSL não funciona

```bash
# Renovar certificado
certbot renew

# Verificar configuração
nginx -t
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
docker stats hallyuhub
```

### Ver espaço em disco

```bash
df -h
docker system df
```

## 🎯 Checklist Final

- [ ] Código enviado para o servidor
- [ ] `.env.production` configurado
- [ ] Docker Compose configurado
- [ ] Container buildado e rodando
- [ ] Nginx configurado
- [ ] SSL instalado
- [ ] Site acessível via HTTPS
- [ ] Cron job configurado para atualizações
- [ ] Backup configurado

## 🚀 Resultado Final

Após seguir todos os passos, você terá:

- ✅ **HallyuHub** rodando em `https://hallyuhub.com`
- ✅ **n8n** rodando em `https://n8n.seudominio.com`
- ✅ Ambos isolados em containers Docker
- ✅ SSL/HTTPS funcionando
- ✅ Atualização automática de dados com IA
- ✅ Backups configurados

---

**Precisa de ajuda?** Me avise se encontrar algum problema durante o deploy!

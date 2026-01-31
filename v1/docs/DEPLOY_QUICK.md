# 🚀 Deploy Rápido - HallyuHub

Guia simplificado para fazer deploy no seu servidor Ubuntu 24.04 da Hostinger.

## 📦 Passo 1: Enviar código para o servidor

**Do seu Mac:**

```bash
cd /Users/fabiouchidate/Antigravity/khub/v1

# Criar arquivo compactado
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf hallyuhub.tar.gz .

# Enviar para o servidor (substitua SEU_IP)
scp hallyuhub.tar.gz root@SEU_IP:/tmp/
```

## 🖥️ Passo 2: No servidor

```bash
# Conectar ao servidor
ssh root@SEU_IP

# Criar diretório e extrair
mkdir -p /var/www/hallyuhub
cd /var/www/hallyuhub
tar -xzf /tmp/hallyuhub.tar.gz
rm /tmp/hallyuhub.tar.gz

# Criar .env.production
cat > .env.production << 'EOF'
DATABASE_URL="file:./prod.db"
NEXT_PUBLIC_SITE_URL="https://SEU_DOMINIO.com"
GEMINI_API_KEY=AIzaSyBrIIHZVv36uAaXSoYL2xl0bJRJG1KMP-E
NODE_ENV=production
EOF

# Criar rede Docker
docker network create web || true

# Build e iniciar
docker-compose build
docker-compose run --rm hallyuhub sh -c "npx prisma migrate deploy"
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 🌐 Passo 3: Configurar Nginx

```bash
# Criar configuração
cat > /etc/nginx/sites-available/hallyuhub << 'EOF'
server {
    listen 80;
    server_name SEU_DOMINIO.com www.SEU_DOMINIO.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Ativar
ln -s /etc/nginx/sites-available/hallyuhub /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 🔒 Passo 4: SSL (Opcional mas recomendado)

```bash
# Instalar Certbot
apt update && apt install certbot python3-certbot-nginx -y

# Obter certificado
certbot --nginx -d SEU_DOMINIO.com -d www.SEU_DOMINIO.com
```

## ✅ Verificar

```bash
# Ver containers rodando
docker ps

# Testar site
curl http://localhost:3000
curl https://SEU_DOMINIO.com
```

## 🔄 Atualizar depois

```bash
cd /var/www/hallyuhub
# Enviar novo código via SCP
docker-compose up -d --build
```

---

**Pronto!** Seu site estará rodando em `https://SEU_DOMINIO.com` 🎉

Para o guia completo, veja: `docs/DEPLOY_UBUNTU.md`

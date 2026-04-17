# HallyuHub v1 - Guia Operacional

Este diretório contém a versão v1 do portal HallyuHub.

## Requisitos
- Node.js 20+
- Docker & Docker Compose
- Banco PostgreSQL (para rodar local sem Docker) ou Docker Desktop

## Rodando Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o ambiente:**
   Copie `.env.example` para `.env` e ajuste as variáveis.
   ```bash
   cp .env.example .env
   ```

3. **Inicie o banco e migrations:**
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## Deploy em Produção (Hostinger VPS)

### 1. Preparação do Servidor
No seu VPS, crie os diretórios base:
```bash
sudo mkdir -p /srv/hallyuhub-staging
sudo mkdir -p /srv/hallyuhub-prod
sudo chown -R $USER:$USER /srv/hallyuhub-*
```

### 2. Configuração do DNS
Aponte seus domínios placeholders para o IP do VPS:
- `staging.seu-dominio.com`
- `www.seu-dominio.com`

### 3. Configuração de Secrets no GitHub
No seu repositório GitHub, crie os seguintes **Secrets** (configurados por Environment: `staging` e `production`):
- `SSH_HOST`: IP do seu VPS.
- `SSH_USER`: Usuário SSH.
- `SSH_KEY`: Sua chave privada PEM.
- `DATABASE_URL`: URL de conexão do banco (ex: `postgresql://user:pass@db:5432/db_name`).
- `NEXT_PUBLIC_SITE_URL`: URL base do site.

### 4. SSL com Certbot
Após o primeiro deploy, ative o SSL no VPS:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d staging.seu-dominio.com
sudo certbot --nginx -d www.seu-dominio.com -d seu-dominio.com
```

## Checklist de Aceite
- [x] Projeto compila (Next.js 14) e roda localmente.
- [x] Dockerfiles e Compose (staging/prod) presentes e válidos.
- [x] Nginx confs com domínios placeholder geradas.
- [x] Workflow GitHub Actions criado e parametrizado.
- [x] Variáveis por ambiente consumidas via Secrets.
- [x] Prisma migrations e seed executam com sucesso.
- [x] Páginas do menu existentes e responsivas.
- [x] Endpoint `/api/health` responde `{ ok: true }`.

## Roadmap v2
- Coleta automática de dados via scripts.
- Sumarização de notícias com IA.
- Painel Admin para revisão humana.

# Staging verification Sun Feb  1 18:30:33 -03 2026
\n# Staging verification 02/12/2026 20:46:17

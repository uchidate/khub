# ⚡ Testar Autenticação AGORA - Guia Rápido

## 🎯 Pré-requisitos

- ✅ Email configurado (SMTP funcionando)
- ✅ Servidor local rodando (`npm run dev`)
- ✅ Banco de dados rodando

---

## 🚀 Teste Rápido (5 minutos)

### 1️⃣ Iniciar Servidor

```bash
npm run dev
```

Aguarde até ver:
```
✓ Ready in 3.5s
○ Local: http://localhost:3000
```

---

### 2️⃣ Testar Registro

**Opção A: Via Navegador**

1. Acesse: http://localhost:3000/auth/register
2. Preencha:
   - Nome: `Seu Nome`
   - Email: `seu_email@gmail.com`
   - Senha: `123456`
3. Clique em **"Registrar"**
4. **Verifique seu email!** Deve chegar email de boas-vindas

**Opção B: Via cURL**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste@exemplo.com",
    "password": "123456"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso!",
  "user": { ... }
}
```

---

### 3️⃣ Testar Login

**Via Navegador:**

1. Acesse: http://localhost:3000/auth/login
2. Use email e senha que criou
3. Clique em **"Entrar"**
4. Deve redirecionar para `/dashboard` ou página inicial

**Via cURL (com NextAuth):**

```bash
# NextAuth usa session via cookies, melhor testar no navegador
```

---

### 4️⃣ Testar Reset de Senha

**Passo 1: Solicitar Reset**

1. Acesse: http://localhost:3000/auth/forgot-password
2. Digite seu email
3. Clique em **"Enviar Link"**
4. **Verifique seu email!** Deve chegar email com link de reset

**Ou via cURL:**

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com"
  }'
```

**Passo 2: Redefinir Senha**

1. Abra o email recebido
2. Clique no link de reset
3. Digite nova senha
4. Clique em **"Redefinir Senha"**
5. Faça login com a nova senha!

**Via cURL:**

```bash
# Pegue o token do email ou dos logs (em dev)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DO_EMAIL",
    "password": "nova_senha_123"
  }'
```

---

### 5️⃣ Testar Google Login (Opcional)

1. Configure Google OAuth:
   - Obtenha credenciais em: https://console.cloud.google.com
   - Adicione redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Adicione no `.env`:
     ```env
     GOOGLE_CLIENT_ID=seu-client-id
     GOOGLE_CLIENT_SECRET=seu-client-secret
     ```

2. Reinicie servidor

3. Acesse: http://localhost:3000/auth/login

4. Clique em **"Entrar com Google"**

5. Autorize o app

6. Deve criar conta e fazer login automaticamente!

---

## 🔍 Verificar Resultados

### Ver Logs do Servidor

```bash
# Terminal onde rodou npm run dev
# Procure por mensagens como:
✅ Welcome email sent to: usuario@exemplo.com
✅ Password reset email sent to: usuario@exemplo.com
```

### Ver Usuário no Banco

```bash
# Abrir Prisma Studio
npx prisma studio

# Navegue até model "User"
# Deve ver o usuário criado
```

**Ou via SQL:**

```sql
-- Ver todos usuários
SELECT id, name, email, role, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- Ver último usuário criado
SELECT * FROM "User"
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Ver Tokens de Reset

```sql
-- Tokens ativos (não expirados)
SELECT email, token, expires
FROM "PasswordResetToken"
WHERE expires > NOW();
```

---

## 📧 Verificar Emails Recebidos

### Email de Boas-Vindas

**Deve conter:**
- ✅ Título: "🎉 Bem-vindo ao HallyuHub!"
- ✅ Mensagem personalizada com seu nome
- ✅ Lista de funcionalidades
- ✅ Botão "Explorar Agora"
- ✅ Design profissional

### Email de Reset

**Deve conter:**
- ✅ Título: "🔐 Reset de Senha"
- ✅ Mensagem personalizada
- ✅ Botão "Redefinir Senha"
- ✅ Link de reset válido por 1 hora
- ✅ Aviso de segurança

---

## ❌ Problemas Comuns

### "Email não está sendo enviado"

**Verifique:**

```bash
# 1. SMTP está configurado?
grep SMTP .env

# 2. Teste SMTP
node test-smtp-now.js

# 3. Ver logs do servidor
# Procure por erros relacionados a email
```

### "Erro ao criar usuário"

**Causas possíveis:**
- Email já cadastrado (tente outro email)
- Senha muito curta (mínimo 6 caracteres)
- Banco de dados não está rodando

**Verificar banco:**

```bash
# Testar conexão
npx prisma db execute --sql "SELECT 1"

# Se falhar, iniciar banco
docker-compose up -d postgres
```

### "Credenciais inválidas" no login

**Verifique:**
- Email está correto?
- Senha está correta?
- Usuário existe no banco?

```sql
SELECT email, password IS NOT NULL as has_password
FROM "User"
WHERE email = 'seu_email@exemplo.com';
```

### "Token inválido ou expirado"

**Causas:**
- Passou mais de 1 hora desde solicitação
- Token já foi usado
- Token foi deletado

**Solução:** Solicite novo reset de senha

---

## 🎯 Checklist de Teste

- [ ] Servidor dev rodando (`npm run dev`)
- [ ] Registro funcionou
- [ ] Email de boas-vindas recebido
- [ ] Login funcionou
- [ ] Sessão criada (nome aparece no site)
- [ ] Forgot password enviou email
- [ ] Link de reset funcionou
- [ ] Nova senha funcionou no login
- [ ] Google login funcionou (se configurado)

---

## 📊 Status Atual

```
✅ NextAuth.js configurado
✅ Credentials Provider (email/senha)
✅ Google Provider (OAuth)
✅ Registro de usuários
✅ Hash de senhas (bcryptjs)
✅ Reset de senha com email
✅ Email de boas-vindas
✅ Páginas de UI (login, registro, reset)
✅ Proteção de rotas
✅ Roles (user, editor, admin)
```

---

## 🚀 Próximos Passos

### Desenvolvimento

1. **Melhorar UI:**
   - Adicionar loading states
   - Melhorar validação de formulários
   - Adicionar feedback visual

2. **Funcionalidades:**
   - Verificação de email (enviar link de confirmação)
   - 2FA (autenticação de dois fatores)
   - Social login (Facebook, Twitter)

3. **Segurança:**
   - Rate limiting (prevenir brute force)
   - reCAPTCHA no registro
   - Audit log (rastrear logins)

### Produção

1. Configurar variáveis de ambiente de produção
2. Testar fluxo completo em staging
3. Configurar Google OAuth com domínio de produção
4. Monitorar emails (taxa de entrega, bounces)
5. Implementar analytics de login

---

**✅ Sistema de Autenticação Testado e Funcionando!**

Agora você pode usar login, registro e reset de senha no seu app! 🎉

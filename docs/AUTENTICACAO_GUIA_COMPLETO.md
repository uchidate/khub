# 🔐 Sistema de Autenticação - Guia Completo

## 📋 Visão Geral

O HallyuHub usa **NextAuth.js** com múltiplos providers e email integrado para um sistema de autenticação completo e seguro.

### ✅ Funcionalidades Implementadas

- 🔑 **Login com Email/Senha** (Credentials)
- 🌐 **Login com Google** (OAuth)
- 📝 **Registro de Novos Usuários**
- 📧 **Email de Boas-Vindas** (automático após registro)
- 🔒 **Reset de Senha** (com email)
- 👤 **Perfis de Usuário** (roles: user, editor, admin)
- 🔐 **Senhas Hasheadas** (bcryptjs)
- ⏰ **Sessões JWT** (30 dias)
- 🛡️ **Tokens Seguros** (expir

ação automática)

---

## 🏗️ Arquitetura

### Stack Tecnológica

```
NextAuth.js + Prisma + PostgreSQL + Nodemailer
```

### Models do Banco de Dados

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?   // Hasheado com bcryptjs
  image         String?
  role          String    @default("user")
  accounts      Account[]
  sessions      Session[]
  favorites     Favorite[]
  activities    Activity[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model PasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime  // Expira em 1 hora
}
```

### Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  USUÁRIO                                                │
│    │                                                    │
│    ├──► Login (Email/Senha)                            │
│    │     └─► NextAuth Credentials Provider             │
│    │           └─► Validar com Prisma                  │
│    │                 └─► Gerar JWT                     │
│    │                       └─► Cookie de Sessão        │
│    │                                                    │
│    ├──► Login (Google)                                 │
│    │     └─► NextAuth Google Provider                  │
│    │           └─► OAuth Flow                          │
│    │                 └─► Criar/Atualizar User          │
│    │                       └─► Gerar JWT               │
│    │                                                    │
│    ├──► Registro                                       │
│    │     └─► /api/auth/register                        │
│    │           └─► Criar User                          │
│    │                 └─► Hash Senha (bcrypt)           │
│    │                       └─► Enviar Email Boas-Vindas│
│    │                                                    │
│    └──► Reset Senha                                    │
│          └─► /api/auth/forgot-password                 │
│                └─► Gerar Token                         │
│                      └─► Enviar Email Reset            │
│                            └─► User clica link         │
│                                  └─► /auth/reset-password│
│                                        └─► Nova senha   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### 1. Login com Email/Senha

#### Frontend (Cliente)

```typescript
import { signIn } from 'next-auth/react'

const handleLogin = async (email: string, password: string) => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  if (result?.error) {
    console.error('Erro:', result.error)
  } else {
    // Login sucesso! Redirecionar
    window.location.href = '/dashboard'
  }
}
```

#### Páginas

- **Login:** `/auth/login`
- **Tela:** [app/auth/login/page.tsx](../app/auth/login/page.tsx)

---

### 2. Login com Google

#### Configuração

```env
# .env
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
```

#### Frontend

```typescript
import { signIn } from 'next-auth/react'

const handleGoogleLogin = () => {
  signIn('google', { callbackUrl: '/dashboard' })
}
```

**Botão:**
```tsx
<button onClick={handleGoogleLogin}>
  Entrar com Google
</button>
```

---

### 3. Registro de Novo Usuário

#### API Route

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso!",
  "user": {
    "id": "...",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Email Automático

Após registro, o usuário recebe automaticamente um **email de boas-vindas**:

- ✅ Design profissional
- ✅ Link para explorar o site
- ✅ Lista de funcionalidades

#### Frontend

```typescript
const handleRegister = async (name, email, password) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })

  const data = await response.json()

  if (data.success) {
    // Sucesso! Redirecionar para login
    window.location.href = '/auth/login?registered=true'
  } else {
    // Mostrar erro
    alert(data.error)
  }
}
```

**Página:** `/auth/register`

---

### 4. Reset de Senha

#### Fluxo Completo

**Passo 1: Solicitar Reset**

```typescript
const handleForgotPassword = async (email: string) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await response.json()

  if (data.success) {
    alert('Email enviado! Verifique sua caixa de entrada.')
  }
}
```

**Passo 2: User Recebe Email**

O usuário recebe um email com:
- Link de reset válido por **1 hora**
- Design profissional
- Instruções claras

**Passo 3: Redefinir Senha**

O link leva para: `/auth/reset-password?token=ABC123`

```typescript
const handleResetPassword = async (token: string, newPassword: string) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: newPassword }),
  })

  const data = await response.json()

  if (data.success) {
    alert('Senha alterada com sucesso!')
    window.location.href = '/auth/login'
  }
}
```

**Páginas:**
- Solicitar: `/auth/forgot-password`
- Redefinir: `/auth/reset-password`

---

## 🛡️ Segurança

### Senhas

- ✅ **Hash:** bcryptjs com 12 rounds
- ✅ **Mínimo:** 6 caracteres
- ✅ **Nunca exposta:** Apenas hash armazenado

### Tokens

- ✅ **Reset:** 64 caracteres hexadecimais (randomBytes)
- ✅ **Expiração:** 1 hora
- ✅ **Uso único:** Deletado após uso
- ✅ **JWT:** Assinado com NEXTAUTH_SECRET

### Sessões

- ✅ **Estratégia:** JWT (stateless)
- ✅ **Duração:** 30 dias
- ✅ **Cookies:** HttpOnly, Secure (produção)

### Proteção contra Ataques

- ✅ **Timing Attack:** Não revela se email existe
- ✅ **Brute Force:** Rate limiting (recomendado adicionar)
- ✅ **CSRF:** Proteção nativa do NextAuth
- ✅ **XSS:** Cookies HttpOnly

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=sua-senha-aqui
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub

# App
NEXT_PUBLIC_SITE_URL=https://hallyuhub.com.br
```

### Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 📖 API Routes

### Autenticação (NextAuth)

- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints
- `GET /api/auth/session` - Obter sessão atual
- `GET /api/auth/csrf` - CSRF token
- `POST /api/auth/signin/[provider]` - Sign in
- `POST /api/auth/signout` - Sign out

### Registro e Reset

- `POST /api/auth/register` - Criar novo usuário
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Redefinir senha com token

---

## 💻 Uso em Componentes

### Server Components (App Router)

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div>
      <h1>Olá, {session.user.name}!</h1>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
```

### Client Components

```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'

export function UserProfile() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Carregando...</div>
  }

  if (!session) {
    return <a href="/auth/login">Login</a>
  }

  return (
    <div>
      <p>Olá, {session.user.name}!</p>
      <button onClick={() => signOut()}>Sair</button>
    </div>
  )
}
```

### Middleware (Proteger Rotas)

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ],
}
```

---

## 🎭 Roles e Permissões

### Roles Disponíveis

- **user** (padrão) - Usuário comum
- **editor** - Pode criar/editar conteúdo
- **admin** - Acesso total

### Verificar Role

```typescript
// Server Component
const session = await auth()

if (session?.user.role !== 'admin') {
  return <div>Acesso negado</div>
}
```

```typescript
// Client Component
const { data: session } = useSession()

if (session?.user.role === 'admin') {
  return <AdminPanel />
}
```

### Proteger API Routes

```typescript
// app/api/admin/route.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }

  // Lógica admin aqui...
  return NextResponse.json({ data: '...' })
}
```

---

## 🧪 Testando

### Teste Manual

1. **Registro:**
   - Acesse: `http://localhost:3000/auth/register`
   - Preencha formulário
   - Verifique email de boas-vindas

2. **Login:**
   - Acesse: `http://localhost:3000/auth/login`
   - Use credenciais criadas
   - Deve redirecionar para dashboard

3. **Reset de Senha:**
   - Acesse: `http://localhost:3000/auth/forgot-password`
   - Digite seu email
   - Verifique email recebido
   - Clique no link e redefina senha

4. **Google Login:**
   - Clique em "Entrar com Google"
   - Autorize o app
   - Deve criar conta automaticamente

### Teste com cURL

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"123456"}'

# Forgot Password
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com"}'
```

---

## 🚨 Troubleshooting

### "Email e senha são obrigatórios"
- Verifique se está enviando email e password no body
- Certifique-se que Content-Type é application/json

### "Credenciais inválidas"
- Email não existe OU senha está errada
- Verifique se o usuário foi criado: `SELECT * FROM "User" WHERE email = '...'`

### "Email não está sendo enviado"
- Verifique variáveis SMTP no .env
- Rode: `node test-smtp-now.js` para testar SMTP
- Veja logs do servidor: procure por "Email sent" ou "Failed to send"

### "Google Login não funciona"
- Verifique GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
- Confirme redirect URI no Google Console: `http://localhost:3000/api/auth/callback/google`

### "Token inválido ou expirado"
- Tokens expiram em 1 hora
- Solicite novo reset de senha

---

## 📊 Logs e Monitoramento

### Logs Úteis

```bash
# Ver logs de autenticação
docker-compose logs -f hallyuhub | grep -i "auth\|email\|login"

# Ver apenas erros
docker-compose logs -f hallyuhub | grep -i "error\|failed"

# Ver emails enviados
docker-compose logs -f hallyuhub | grep "email sent"
```

### Métricas no Banco

```sql
-- Total de usuários
SELECT COUNT(*) FROM "User";

-- Usuários registrados hoje
SELECT COUNT(*) FROM "User"
WHERE "createdAt" > CURRENT_DATE;

-- Tokens de reset pendentes
SELECT COUNT(*) FROM "PasswordResetToken"
WHERE expires > NOW();

-- Usuários por role
SELECT role, COUNT(*) FROM "User"
GROUP BY role;
```

---

## ✅ Checklist de Produção

Antes de ir para produção:

- [ ] NEXTAUTH_SECRET configurado (diferente do dev)
- [ ] NEXTAUTH_URL apontando para domínio de produção
- [ ] Google OAuth configurado com redirect URIs corretos
- [ ] SMTP configurado e testado (emails sendo entregues)
- [ ] SSL habilitado (HTTPS)
- [ ] Cookies secure=true em produção
- [ ] Rate limiting implementado
- [ ] Logs configurados
- [ ] Backup do banco configurado
- [ ] Política de senha forte (mínimo 8 caracteres recomendado)
- [ ] 2FA planejado (para futuro)

---

## 📚 Recursos Adicionais

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [Email Service Usage](./EMAIL_SERVICE_USAGE.md)

---

**🎉 Sistema de Autenticação Pronto e Funcionando!**

Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.

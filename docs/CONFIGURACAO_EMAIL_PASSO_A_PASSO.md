# 📧 Configuração Email Hostinger com Domínio no Registro.br

**Situação:** Domínio `hallyuhub.com.br` registrado no Registro.br + Email contratado na Hostinger

**Objetivo:** Configurar `no_reply@hallyuhub.com.br` para envio de emails

---

## ✅ FASE 1: Criar Conta de Email na Hostinger

### Passo 1: Acessar Painel Hostinger
1. Acesse: https://hpanel.hostinger.com
2. Login com suas credenciais
3. No menu principal, clique em **"Emails"**

### Passo 2: Selecionar Domínio
- Procure por **hallyuhub.com.br** na lista de domínios
- Se não aparecer, você precisará primeiro adicionar o domínio ao painel:
  - Vá em "Domínios" → "Adicionar Domínio"
  - Digite: `hallyuhub.com.br`
  - Selecione: "Usar um domínio existente"
  - **IMPORTANTE:** Não configure nameservers agora (pois está no Registro.br)

### Passo 3: Criar Conta de Email
1. Clique em **"Criar Conta de Email"** / **"Create Email Account"**
2. Preencha:
   ```
   Email: no_reply
   Domínio: @hallyuhub.com.br
   Senha: [Crie uma senha forte]
   Armazenamento: 1 GB (suficiente para no-reply)
   ```
3. Clique em **"Criar"**

### Passo 4: Anotar Senha
⚠️ **MUITO IMPORTANTE:** Anote a senha em local seguro! Você vai precisar dela para:
- Configurar SMTP no aplicativo
- Acessar webmail (se necessário)

---

## ✅ FASE 2: Obter Configurações DNS da Hostinger

### Passo 1: Acessar Configurações de Email
1. No painel Hostinger, em "Emails"
2. Clique no email `no_reply@hallyuhub.com.br`
3. Procure por **"Configuração"** ou **"Configuration"**

### Passo 2: Encontrar Registros DNS
Procure por uma seção chamada:
- **"DNS Records"**
- **"Email Authentication"**
- **"Configurações DNS"**
- Ou clique em um ícone de engrenagem/configurações

### Passo 3: Copiar Registros MX

Você deve encontrar algo assim:

```
MX Records:
Prioridade 10: mx1.hostinger.com
Prioridade 20: mx2.hostinger.com
```

### Passo 4: Copiar Registro SPF

```
TXT Record (SPF):
v=spf1 include:_spf.hostinger.com ~all
```

### Passo 5: Gerar DKIM (Importante!)

1. Procure por **"DKIM"** ou **"Email Authentication"**
2. Clique em **"Gerar DKIM"** / **"Generate DKIM"**
3. Copie o registro gerado (será algo como):
   ```
   Host: default._domainkey
   Valor: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSI...
   ```

**Se não encontrar opção de DKIM:**
- Não tem problema, SPF já ajuda muito
- DKIM pode ser configurado depois

---

## ✅ FASE 3: Configurar DNS no Registro.br

### Passo 1: Acessar Painel Registro.br
1. Acesse: https://registro.br
2. Faça login
3. Vá em **"Meus Domínios"**

### Passo 2: Editar Zona DNS
1. Clique em **hallyuhub.com.br**
2. No menu lateral, clique em **"DNS"**
3. Clique em **"Editar Zona"**

### Passo 3: Verificar Registros Atuais

⚠️ **ATENÇÃO:** Antes de adicionar, verifique se já existem registros MX!

- Se existirem registros MX antigos (ex: do Gmail, Outlook, etc.)
- Você precisará **DELETAR** os antigos antes de adicionar os da Hostinger
- Caso contrário, pode gerar conflito

### Passo 4: Adicionar Registros MX

Clique em **"Adicionar Registro"** ou **"+"**

**Registro 1:**
```
Tipo: MX
Nome/Host: @ (ou deixe vazio)
Prioridade: 10
Destino: mx1.hostinger.com
TTL: 3600 (ou padrão)
```

**Registro 2:**
```
Tipo: MX
Nome/Host: @ (ou deixe vazio)
Prioridade: 20
Destino: mx2.hostinger.com
TTL: 3600 (ou padrão)
```

### Passo 5: Adicionar Registro SPF

Clique em **"Adicionar Registro"**

```
Tipo: TXT
Nome/Host: @ (ou deixe vazio)
Conteúdo: v=spf1 include:_spf.hostinger.com ~all
TTL: 3600
```

### Passo 6: Adicionar DKIM (se você gerou na Hostinger)

Clique em **"Adicionar Registro"**

```
Tipo: TXT
Nome/Host: default._domainkey
Conteúdo: [COLE O VALOR QUE COPIOU DA HOSTINGER]
TTL: 3600
```

### Passo 7: Adicionar DMARC (Opcional mas Recomendado)

```
Tipo: TXT
Nome/Host: _dmarc
Conteúdo: v=DMARC1; p=quarantine; rua=mailto:no_reply@hallyuhub.com.br
TTL: 3600
```

### Passo 8: Salvar Alterações

1. Revise todos os registros
2. Clique em **"Salvar"** ou **"Aplicar Alterações"**

---

## ✅ FASE 4: Aguardar Propagação DNS

### Quanto tempo demora?
- **Mínimo:** 30 minutos a 2 horas
- **Normal:** 4 a 24 horas
- **Máximo:** Até 48 horas (raro)

### Como verificar se propagou?

**Opção 1: Comando dig (Mac/Linux)**
```bash
dig MX hallyuhub.com.br
```

Você deve ver:
```
hallyuhub.com.br.  3600  IN  MX  10 mx1.hostinger.com.
hallyuhub.com.br.  3600  IN  MX  20 mx2.hostinger.com.
```

**Opção 2: Ferramentas Online**
- https://mxtoolbox.com/SuperTool.aspx
- Digite: `hallyuhub.com.br`
- Clique em "MX Lookup"

**Opção 3: Script que criei**
```bash
node scripts/test-email.js --check-dns
```

---

## ✅ FASE 5: Configurar SMTP no Aplicativo

### Adicionar Variáveis de Ambiente

**Arquivo: `.env` e `.env.production`**

```env
# Email Configuration - Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=SUA_SENHA_AQUI
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

### Atualizar no Servidor (se já está em produção)

```bash
# SSH no servidor
ssh root@165.227.200.98

# Editar .env
cd /var/www/hallyuhub
nano .env.production

# Adicionar as variáveis acima

# Reiniciar aplicação
docker-compose restart hallyuhub
```

---

## ✅ FASE 6: Testar Configuração

### Teste 1: Verificar DNS propagou

```bash
node scripts/test-email.js --check-dns
```

### Teste 2: Instalar Nodemailer (se ainda não tem)

```bash
npm install nodemailer
# ou
yarn add nodemailer
```

### Teste 3: Enviar Email de Teste

```bash
# Configurar senha (temporariamente no terminal)
export SMTP_PASSWORD="SUA_SENHA_AQUI"

# Enviar teste
node scripts/test-email.js seu_email_pessoal@gmail.com
```

### Teste 4: Modo Interativo

```bash
node scripts/test-email.js --interactive
```

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Registro.br]                    [Hostinger]              │
│       │                                  │                 │
│       │                                  │                 │
│   ┌───▼────┐                      ┌──────▼──────┐         │
│   │  DNS   │                      │   Servidor  │         │
│   │ hallyuhub                     │   de Email  │         │
│   │ .com.br│◄─────────────────────│  Hostinger  │         │
│   └───┬────┘   Registros MX       └─────────────┘         │
│       │        SPF, DKIM                                   │
│       │                                                    │
│   Quando alguém envia email para                          │
│   no_reply@hallyuhub.com.br:                              │
│                                                            │
│   1. DNS consulta registro MX                             │
│   2. Descobre: mx1.hostinger.com                          │
│   3. Entrega email no servidor Hostinger                  │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ FAQ - Perguntas Frequentes

### 1. Preciso mudar os nameservers do Registro.br?
**NÃO!** Mantenha os nameservers do Registro.br. Você só precisa adicionar os registros MX, SPF e DKIM.

### 2. Posso usar o Registro.br como provedor de email?
Não, o Registro.br **não oferece serviço de email**. Ele apenas registra domínios. Por isso você usa a Hostinger para email.

### 3. Meu domínio é .com.br, funciona igual?
Sim! Funciona exatamente igual para:
- `.com.br`
- `.net.br`
- `.org.br`
- Qualquer outro `.br`

### 4. Vou perder meu site se mudar os registros MX?
**NÃO!** Registros MX são apenas para email. Seu site (registro A ou CNAME) não será afetado.

### 5. Quanto custa o email na Hostinger?
Depende do plano contratado. Geralmente:
- **Premium:** 1 conta de email
- **Business:** 100 contas de email
- **Email hosting específico:** Ilimitado

### 6. Posso criar mais emails depois?
Sim! Basta repetir a Fase 1 para criar:
- `contato@hallyuhub.com.br`
- `suporte@hallyuhub.com.br`
- `admin@hallyuhub.com.br`
- etc.

### 7. O email no_reply pode receber emails?
Tecnicamente sim, mas o nome sugere "não responda". Se quiser um email para receber respostas, crie:
- `contato@hallyuhub.com.br`
- `suporte@hallyuhub.com.br`

---

## 🆘 Problemas Comuns

### Erro: "Email não envia"

**Checklist:**
- [ ] Senha está correta?
- [ ] Porta 587 (TLS) ou 465 (SSL)?
- [ ] Firewall não está bloqueando?
- [ ] DNS propagou? (aguarde 24h)

### Erro: "Emails vão para spam"

**Solução:**
- Configurar SPF ✅
- Configurar DKIM ✅
- Configurar DMARC ✅
- Evitar palavras como "grátis", "promoção" em excesso
- Testar em: https://www.mail-tester.com

### Erro: "MX não encontrado"

**Solução:**
- Aguardar propagação DNS (até 48h)
- Verificar se salvou corretamente no Registro.br
- Limpar cache DNS local:
  ```bash
  # Windows
  ipconfig /flushdns

  # Mac
  sudo killall -HUP mDNSResponder

  # Linux
  sudo systemd-resolve --flush-caches
  ```

---

## 📞 Suporte

**Hostinger:**
- Chat 24/7 no painel: https://hpanel.hostinger.com
- Criar ticket: Suporte → Novo Ticket

**Registro.br:**
- https://registro.br/ajuda/
- Tickets: https://registro.br/ticket/

---

## ✅ Checklist Final

### Configuração Básica
- [ ] Conta de email criada na Hostinger
- [ ] Senha anotada em local seguro
- [ ] Registros MX adicionados no Registro.br
- [ ] Registro SPF adicionado no Registro.br
- [ ] Aguardado propagação DNS (mínimo 4h)

### Configuração Avançada (Recomendado)
- [ ] DKIM gerado e configurado
- [ ] DMARC configurado
- [ ] Teste de email realizado com sucesso

### Produção
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação reiniciada
- [ ] Email de teste enviado e recebido

---

Após seguir este guia, seu email `no_reply@hallyuhub.com.br` estará 100% funcional! 🎉

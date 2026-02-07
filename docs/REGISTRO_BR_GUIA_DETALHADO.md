# 🇧🇷 Guia Detalhado: Configurar DNS para Email no Registro.br

**Objetivo:** Configurar registros DNS no Registro.br para que `no_reply@hallyuhub.com.br` funcione com servidor de email da Hostinger.

**Tempo estimado:** 15-20 minutos

---

## 📋 PREPARAÇÃO - Informações Necessárias

Antes de começar, tenha em mãos:

### Da Hostinger (você vai copiar do painel deles):

```
✅ Registros MX:
   Prioridade 10: mx1.hostinger.com
   Prioridade 20: mx2.hostinger.com

✅ Registro SPF:
   v=spf1 include:_spf.hostinger.com ~all

✅ Registro DKIM (se gerou na Hostinger):
   default._domainkey → [valor longo começando com v=DKIM1...]
```

---

## 🔐 PASSO 1: Acessar o Painel do Registro.br

### 1.1 - Abrir Site
1. Abra o navegador
2. Digite: `https://registro.br`
3. Pressione Enter

### 1.2 - Fazer Login
1. No canto superior direito, clique em **"Entrar"** ou **"Login"**
2. Digite seu **CPF/CNPJ**
3. Digite sua **Senha**
4. Clique em **"Entrar"**

**🔐 Dica:** Se tem autenticação de dois fatores, confirme no seu celular/app.

---

## 🏠 PASSO 2: Acessar Painel de Domínios

Após login, você verá o painel principal.

### 2.1 - Localizar Menu de Domínios

Você verá algo assim (representação textual):

```
┌────────────────────────────────────────────────────────┐
│  REGISTRO.BR                    [Seu Nome]  [Sair]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Menu Lateral:                                         │
│  ┌──────────────┐                                     │
│  │ • Dashboard  │ ← Você está aqui                    │
│  │ • Domínios   │ ← CLIQUE AQUI                       │
│  │ • DNS        │                                      │
│  │ • Cobrança   │                                      │
│  │ • Suporte    │                                      │
│  └──────────────┘                                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 2.2 - Clicar em "Domínios"
1. No menu lateral esquerdo, clique em **"Domínios"** ou **"Meus Domínios"**
2. Aguarde carregar a lista de domínios

---

## 📝 PASSO 3: Selecionar seu Domínio

Você verá uma lista com seus domínios:

```
┌────────────────────────────────────────────────────────┐
│  Meus Domínios                                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🌐 hallyuhub.com.br                          │    │
│  │    Expira em: 01/01/2025                     │    │
│  │    Status: Ativo ✅                           │    │
│  │                                               │    │
│  │    [Gerenciar] [DNS] [Renovar]               │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.1 - Ações Possíveis:

**Opção A:** Clique no **nome do domínio** (`hallyuhub.com.br`)
**Opção B:** Clique no botão **"Gerenciar"**
**Opção C:** Clique no botão **"DNS"** (mais direto)

👉 **Recomendo: Clique em "DNS"** (pula uma etapa)

---

## 🔧 PASSO 4: Acessar Configurações de DNS

Se você clicou em "DNS", pule para o **Passo 5**.

Se você clicou em "Gerenciar" ou no nome do domínio:

```
┌────────────────────────────────────────────────────────┐
│  hallyuhub.com.br - Gerenciar Domínio                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Abas disponíveis:                                     │
│  ┌──────────────────────────────────────────────┐    │
│  │ [Informações] [DNS] [Contatos] [Renovação]  │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Clique na aba: DNS ←──────────────────────          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.1 - Clicar na Aba "DNS"
1. Procure por uma aba chamada **"DNS"** ou **"Zona DNS"**
2. Clique nela

---

## 📊 PASSO 5: Visualizar Zona DNS Atual

Agora você está na tela de DNS. Você verá algo assim:

```
┌────────────────────────────────────────────────────────┐
│  DNS - hallyuhub.com.br                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Opções:                                               │
│  • Usar servidores DNS do Registro.br (Recomendado)   │
│  • Usar servidores DNS externos                        │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ Servidores DNS Ativos:                       │    │
│  │ • ns1.registro.br                            │    │
│  │ • ns2.registro.br                            │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  [Editar Zona] ← CLIQUE AQUI                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.1 - Importante: Verificar Nameservers

⚠️ **ATENÇÃO:** Certifique-se que está usando os nameservers do **Registro.br**:
- `ns1.registro.br`
- `ns2.registro.br`

✅ Se estiver usando nameservers da Hostinger ou outros, **não funciona**!

### 5.2 - Clicar em "Editar Zona"
1. Procure o botão **"Editar Zona"** ou **"Gerenciar Zona"**
2. Clique nele

---

## ✏️ PASSO 6: Editor de Zona DNS

Agora você está no editor! Aqui que a mágica acontece. 🎩✨

```
┌────────────────────────────────────────────────────────┐
│  Editar Zona DNS - hallyuhub.com.br                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Registros DNS Atuais:                                 │
│  ┌──────────────────────────────────────────────┐    │
│  │ Tipo │ Nome     │ Valor          │ TTL       │    │
│  ├──────┼──────────┼────────────────┼───────────┤    │
│  │  A   │ @        │ 165.227.200.98 │ 3600      │    │
│  │  A   │ www      │ 165.227.200.98 │ 3600      │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  [+ Adicionar Registro]  [Salvar]  [Cancelar]         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 6.1 - Verificar Registros Existentes

**IMPORTANTE:** Antes de adicionar, verifique se já existem registros **MX**!

Se você vê algo como:
```
│  MX   │ @        │ smtp.google.com │ ...       │
│  MX   │ @        │ aspmx.l.google.com │ ...    │
```

👉 **DELETE ESSES REGISTROS MX ANTIGOS PRIMEIRO!**

**Como deletar:**
1. Procure por um ícone de **lixeira** 🗑️ ou **X** ao lado do registro
2. Clique nele
3. Confirme a exclusão

⚠️ **Só delete registros MX!** Não delete registros A, CNAME, TXT (a menos que sejam SPF/DKIM antigos)

---

## ➕ PASSO 7: Adicionar Registro MX #1

Agora vamos adicionar os registros da Hostinger!

### 7.1 - Clicar em "Adicionar Registro"
1. Procure o botão **"+ Adicionar Registro"** ou **"Novo Registro"**
2. Clique nele

### 7.2 - Preencher Formulário - MX Primário

Um modal/formulário vai abrir:

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Registro DNS                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tipo de Registro: [▼ Selecione]                      │
│                    • A                                 │
│                    • AAAA                              │
│                    • CNAME                             │
│                    • MX       ← SELECIONE ESTE        │
│                    • TXT                               │
│                    • ...                               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Preencha assim:**

1. **Tipo:** Selecione **MX** no dropdown

2. **Nome/Host:**
   - Digite: `@`
   - OU deixe vazio (depende do painel)
   - OU selecione: "Raiz do domínio" / "Root"

3. **Prioridade:**
   - Digite: `10`

4. **Destino/Valor:**
   - Digite: `mx1.hostinger.com`
   - ⚠️ **SEM ponto final!** (alguns painéis aceitam com ou sem)

5. **TTL (Time To Live):**
   - Selecione: `3600` (1 hora)
   - OU deixe no padrão (geralmente já é 3600)

**Exemplo preenchido:**

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Registro MX                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Nome/Host:       [@         ]                        │
│  Tipo:            [MX        ▼]                       │
│  Prioridade:      [10        ]                        │
│  Destino:         [mx1.hostinger.com          ]       │
│  TTL:             [3600      ▼]                       │
│                                                        │
│              [Cancelar]  [Adicionar]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 7.3 - Clicar em "Adicionar" ou "Salvar"

---

## ➕ PASSO 8: Adicionar Registro MX #2

Repita o processo para o segundo MX (backup):

### 8.1 - Clicar em "+ Adicionar Registro" novamente

### 8.2 - Preencher:

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Registro MX                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Nome/Host:       [@         ]                        │
│  Tipo:            [MX        ▼]                       │
│  Prioridade:      [20        ] ← PRIORIDADE MAIOR!    │
│  Destino:         [mx2.hostinger.com          ]       │
│  TTL:             [3600      ▼]                       │
│                                                        │
│              [Cancelar]  [Adicionar]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

⚠️ **IMPORTANTE:** Prioridade **20** (maior que o primeiro)

### 8.3 - Clicar em "Adicionar"

---

## ➕ PASSO 9: Adicionar Registro SPF

SPF evita que seus emails sejam marcados como spam.

### 9.1 - Clicar em "+ Adicionar Registro"

### 9.2 - Preencher:

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Registro TXT                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Nome/Host:       [@         ]                        │
│  Tipo:            [TXT       ▼] ← TIPO TXT!           │
│  Conteúdo/Valor:  [                              ]    │
│                   v=spf1 include:_spf.hostinger...    │
│  TTL:             [3600      ▼]                       │
│                                                        │
│              [Cancelar]  [Adicionar]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Preencha:**
1. **Nome/Host:** `@`
2. **Tipo:** `TXT`
3. **Conteúdo:**
   ```
   v=spf1 include:_spf.hostinger.com ~all
   ```
   ⚠️ **COPIE EXATAMENTE ASSIM!** (com espaços)

4. **TTL:** `3600`

### 9.3 - ⚠️ IMPORTANTE: Verificar SPF Existente

Antes de adicionar, verifique se já existe um registro TXT com SPF:

```
│  TXT  │ @        │ v=spf1 include:_spf.google.com ~all │
```

**Se já existe:**
- Você pode **editar** ao invés de adicionar novo
- OU **deletar o antigo** e adicionar o novo
- ⚠️ **Não tenha 2 SPF ao mesmo tempo!** (causa conflito)

**Se tinha SPF do Google e quer manter os dois:**
```
v=spf1 include:_spf.google.com include:_spf.hostinger.com ~all
```

### 9.4 - Clicar em "Adicionar"

---

## ➕ PASSO 10: Adicionar DKIM (Opcional mas Recomendado)

DKIM é uma assinatura digital que prova que o email é legítimo.

### 10.1 - Primeiro: Gerar DKIM na Hostinger

⚠️ **PARE!** Antes de adicionar DKIM no Registro.br, você precisa **gerar** ele na Hostinger!

**Como gerar na Hostinger:**

1. Acesse painel Hostinger: https://hpanel.hostinger.com
2. Vá em: **Emails** → **hallyuhub.com.br**
3. Procure por: **"Email Authentication"** ou **"DKIM"**
4. Clique em: **"Gerar DKIM"** / **"Generate DKIM"**
5. Copie o valor gerado (vai ser algo como):
   ```
   v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...
   ```

### 10.2 - Se a Hostinger não tem opção de DKIM

Não tem problema! DKIM é **opcional**. Você pode pular esta etapa.

SPF + MX já são suficientes para funcionar. DKIM só melhora a reputação do email.

### 10.3 - Se você copiou o DKIM, adicionar no Registro.br:

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Registro TXT                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Nome/Host:       [default._domainkey        ]        │
│  Tipo:            [TXT                       ▼]       │
│  Conteúdo/Valor:  [v=DKIM1; k=rsa; p=...     ]        │
│  TTL:             [3600                      ▼]       │
│                                                        │
│              [Cancelar]  [Adicionar]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Preencha:**
1. **Nome/Host:** `default._domainkey`
2. **Tipo:** `TXT`
3. **Conteúdo:** Cole o valor DKIM inteiro (pode ser bem longo!)
4. **TTL:** `3600`

### 10.4 - Clicar em "Adicionar"

---

## ➕ PASSO 11: Adicionar DMARC (Opcional)

DMARC define o que fazer com emails que falham na autenticação.

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Registro TXT                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Nome/Host:       [_dmarc                    ]        │
│  Tipo:            [TXT                       ▼]       │
│  Conteúdo/Valor:  [v=DMARC1; p=quarantine... ]        │
│  TTL:             [3600                      ▼]       │
│                                                        │
│              [Cancelar]  [Adicionar]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Preencha:**
1. **Nome/Host:** `_dmarc`
2. **Tipo:** `TXT`
3. **Conteúdo:**
   ```
   v=DMARC1; p=quarantine; rua=mailto:no_reply@hallyuhub.com.br
   ```
4. **TTL:** `3600`

---

## 📝 PASSO 12: Revisar Todos os Registros

Antes de salvar, confira se está tudo certo:

```
┌────────────────────────────────────────────────────────────────┐
│  Zona DNS - hallyuhub.com.br                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tipo │ Nome              │ Valor/Destino         │ Prioridade │
│  ─────┼───────────────────┼───────────────────────┼────────────│
│   A   │ @                 │ 165.227.200.98        │ -          │
│   A   │ www               │ 165.227.200.98        │ -          │
│  ─────┼───────────────────┼───────────────────────┼────────────│
│  MX ✅│ @                 │ mx1.hostinger.com     │ 10         │
│  MX ✅│ @                 │ mx2.hostinger.com     │ 20         │
│  ─────┼───────────────────┼───────────────────────┼────────────│
│  TXT ✅│ @                │ v=spf1 include:_spf...│ -          │
│  TXT ✅│ default._domainkey│ v=DKIM1; k=rsa; p=... │ -          │
│  TXT ✅│ _dmarc            │ v=DMARC1; p=quarantine│ -          │
│  ─────┴───────────────────┴───────────────────────┴────────────│
│                                                                │
│  ⚠️  Mudanças não salvas! Clique em "Salvar" para aplicar    │
│                                                                │
│                 [Cancelar]  [Salvar Alterações] ✅             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### ✅ Checklist de Verificação:

- [ ] **2 registros MX** (prioridades 10 e 20)?
- [ ] **MX apontam para** `mx1.hostinger.com` e `mx2.hostinger.com`?
- [ ] **1 registro SPF** (TXT com `v=spf1`)?
- [ ] **SPF inclui** `_spf.hostinger.com`?
- [ ] **DKIM adicionado** (opcional)?
- [ ] **DMARC adicionado** (opcional)?
- [ ] **Não deletei nenhum registro A** (site continua funcionando)?

---

## 💾 PASSO 13: SALVAR AS ALTERAÇÕES!

### 13.1 - Clicar no Botão de Salvar

1. Procure o botão: **"Salvar Alterações"** / **"Salvar"** / **"Aplicar"**
2. **CLIQUE NELE!** (Muito importante! 😄)

### 13.2 - Confirmar (se pedir)

Pode aparecer um aviso:

```
┌────────────────────────────────────────────────────────┐
│  Confirmar Alterações                                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ⚠️  As alterações na zona DNS podem levar até 48h    │
│      para propagar completamente.                      │
│                                                        │
│  Deseja continuar?                                     │
│                                                        │
│              [Não]  [Sim, Salvar]                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

👉 Clique em **"Sim"** ou **"Salvar"**

### 13.3 - Confirmação de Sucesso

Você deve ver:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ✅ Alterações salvas com sucesso!                     │
│                                                        │
│  Suas mudanças DNS serão propagadas em até 48 horas.  │
│                                                        │
│                        [OK]                            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

🎉 **PARABÉNS!** Você configurou o DNS!

---

## ⏰ PASSO 14: Aguardar Propagação

### O que acontece agora?

Os servidores DNS do mundo inteiro precisam "aprender" as novas configurações.

**Tempo de propagação:**
- ⚡ **Mínimo:** 30 minutos a 2 horas
- 📊 **Normal:** 4 a 24 horas
- 🐌 **Máximo:** Até 48 horas (raro)

### O que você pode fazer enquanto espera?

1. ☕ Tomar um café
2. 📱 Configurar variáveis de ambiente no aplicativo
3. 📚 Ler a documentação do Nodemailer
4. 🎮 Jogar um pouco
5. 😴 Dormir (se for de noite)

---

## 🔍 PASSO 15: Verificar Propagação

### Método 1: Comando dig (Mac/Linux)

Abra o Terminal e execute:

```bash
dig MX hallyuhub.com.br
```

**O que você quer ver:**

```
;; ANSWER SECTION:
hallyuhub.com.br.  3600  IN  MX  10 mx1.hostinger.com.
hallyuhub.com.br.  3600  IN  MX  20 mx2.hostinger.com.
```

Se ver isso = **FUNCIONOU!** ✅

### Método 2: Ferramentas Online

1. Acesse: https://mxtoolbox.com/SuperTool.aspx
2. Digite: `hallyuhub.com.br`
3. Clique em **"MX Lookup"**

**O que você quer ver:**

```
Pref  Hostname
10    mx1.hostinger.com
20    mx2.hostinger.com
```

### Método 3: Script que criei

```bash
cd /Users/fabiouchidate/Antigravity/khub
node scripts/test-email.js --check-dns
```

---

## ✅ PASSO 16: Teste Final

Depois que o DNS propagou (aguarde pelo menos 4 horas):

### 16.1 - Instalar Nodemailer

```bash
npm install nodemailer
```

### 16.2 - Configurar Senha

```bash
export SMTP_PASSWORD="sua_senha_da_hostinger"
```

### 16.3 - Testar Envio

```bash
node scripts/test-email.js seu_email_pessoal@gmail.com
```

**Sucesso?** Você deve receber o email em alguns segundos! 📧✅

---

## 🆘 PROBLEMAS COMUNS

### 1. "Não encontro o botão Editar Zona"

**Soluções:**
- Procure por: "Gerenciar Zona", "Configurar DNS", "DNS Manager"
- Verifique se está na aba "DNS" (não em "Informações" ou "Contatos")
- Tente atualizar a página (F5)

### 2. "Aparece erro ao adicionar registro MX"

**Possíveis causas:**
- Já existe outro MX com mesma prioridade → Delete o antigo
- Formato errado → Confira se é exatamente `mx1.hostinger.com` (sem http, sem www)
- Nome/Host errado → Use `@` ou deixe vazio

### 3. "Salvei mas não aparece na lista"

**Soluções:**
- Atualize a página (F5)
- Saia e entre novamente na edição de zona
- Aguarde 1-2 minutos e recarregue

### 4. "Deu erro ao salvar"

**Possíveis mensagens:**
- *"TTL inválido"* → Use 3600 ou 86400
- *"Registro duplicado"* → Já existe um igual, delete o antigo primeiro
- *"Formato inválido"* → Revise se copiou certo (sem espaços extras)

### 5. "Depois de 48h ainda não funciona"

**Checklist:**
1. Confirme que salvou as alterações (revise no painel)
2. Verifique se os nameservers são do Registro.br:
   ```bash
   dig NS hallyuhub.com.br
   ```
   Deve mostrar: `ns1.registro.br` e `ns2.registro.br`
3. Teste o MX:
   ```bash
   dig MX hallyuhub.com.br
   ```
4. Limpe cache DNS local:
   ```bash
   # Mac
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

## 📞 SUPORTE REGISTRO.BR

Se ainda tiver problemas:

### Chat Online
- https://registro.br → Botão "Chat" (canto inferior direito)
- Horário: 9h às 18h (dias úteis)

### Ticket de Suporte
1. Acesse: https://registro.br/ticket/
2. Clique em "Criar Ticket"
3. Categoria: "DNS"
4. Descreva o problema

### Telefone
- 📞 (11) 5509-3511 (São Paulo)
- 📞 0800 886 3511 (Demais localidades)

---

## 🎯 RESUMO FINAL

### O que você configurou:

```
✅ 2 Registros MX
   → Permite receber emails em @hallyuhub.com.br

✅ 1 Registro SPF
   → Evita que seus emails sejam marcados como spam

✅ 1 Registro DKIM (opcional)
   → Assinatura digital, aumenta confiança

✅ 1 Registro DMARC (opcional)
   → Define política de autenticação
```

### Próximos passos:

1. ⏰ Aguardar propagação DNS (4-48h)
2. 🧪 Testar com `node scripts/test-email.js`
3. ⚙️ Configurar SMTP no aplicativo
4. 🚀 Começar a enviar emails!

---

🎉 **PARABÉNS!** Você completou a configuração DNS no Registro.br!

Se tiver qualquer dúvida durante o processo, me chame que eu te ajudo! 🚀

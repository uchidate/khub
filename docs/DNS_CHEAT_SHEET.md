# 📋 DNS Cheat Sheet - Valores Exatos para Copiar

**Use este arquivo como referência rápida enquanto configura!**

---

## 🎯 REGISTROS QUE VOCÊ VAI ADICIONAR

### 1️⃣ Registro MX #1 (Primário)

```
Tipo:        MX
Nome/Host:   @
Prioridade:  10
Destino:     mx1.hostinger.com
TTL:         3600
```

---

### 2️⃣ Registro MX #2 (Backup)

```
Tipo:        MX
Nome/Host:   @
Prioridade:  20
Destino:     mx2.hostinger.com
TTL:         3600
```

---

### 3️⃣ Registro SPF (Obrigatório)

```
Tipo:        TXT
Nome/Host:   @
Conteúdo:    v=spf1 include:_spf.hostinger.com ~all
TTL:         3600
```

⚠️ **COPIE EXATAMENTE:** `v=spf1 include:_spf.hostinger.com ~all`

---

### 4️⃣ Registro DKIM (Opcional)

```
Tipo:        TXT
Nome/Host:   default._domainkey
Conteúdo:    [GERAR NA HOSTINGER PRIMEIRO!]
TTL:         3600
```

**Como gerar:**
1. Hostinger → Emails → Email Authentication
2. Clicar em "Generate DKIM"
3. Copiar o valor (começará com `v=DKIM1; k=rsa; p=...`)

---

### 5️⃣ Registro DMARC (Opcional)

```
Tipo:        TXT
Nome/Host:   _dmarc
Conteúdo:    v=DMARC1; p=quarantine; rua=mailto:no_reply@hallyuhub.com.br
TTL:         3600
```

---

## 🔍 VERIFICAÇÃO RÁPIDA

### Depois de salvar, seus registros devem ficar assim:

```
┌─────┬───────────────────┬───────────────────────────┬────────────┐
│ Tipo│ Nome/Host         │ Valor/Destino             │ Prioridade │
├─────┼───────────────────┼───────────────────────────┼────────────┤
│ MX  │ @                 │ mx1.hostinger.com         │ 10         │
│ MX  │ @                 │ mx2.hostinger.com         │ 20         │
│ TXT │ @                 │ v=spf1 include:_spf...    │ -          │
│ TXT │ default._domainkey│ v=DKIM1; k=rsa; p=...     │ -          │
│ TXT │ _dmarc            │ v=DMARC1; p=quarantine... │ -          │
└─────┴───────────────────┴───────────────────────────┴────────────┘
```

---

## ⚠️ ATENÇÃO - NÃO CONFUNDA!

### ✅ CORRETO:
- `mx1.hostinger.com` (SEM ponto no final)
- `mx2.hostinger.com` (SEM ponto no final)
- `_spf.hostinger.com` (COM underscore no início)

### ❌ ERRADO:
- `mx1.hostinger.com.` (com ponto no final)
- `www.mx1.hostinger.com` (com www)
- `https://mx1.hostinger.com` (com https)
- `spf.hostinger.com` (sem underscore)

---

## 🧪 TESTES APÓS PROPAGAÇÃO

### Comando para testar (Mac/Linux):

```bash
# Testar MX
dig MX hallyuhub.com.br +short

# Testar SPF
dig TXT hallyuhub.com.br +short | grep spf

# Testar DKIM
dig TXT default._domainkey.hallyuhub.com.br +short
```

### Ferramenta Online:
https://mxtoolbox.com/SuperTool.aspx?action=mx:hallyuhub.com.br

---

## ⏰ LINHA DO TEMPO

```
Agora         → Configurar DNS no Registro.br (15 min)
               ↓
+30 min       → Primeiras propagações começam
               ↓
+4 horas      → Maioria dos servidores propagou (pode testar)
               ↓
+24 horas     → 99% propagado (funcionando totalmente)
               ↓
+48 horas     → 100% garantido
```

---

## 📝 VARIÁVEIS DE AMBIENTE (.env)

Adicione após DNS propagar:

```env
# Email Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=SUA_SENHA_AQUI
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

---

## 🆘 PROBLEMAS COMUNS

| Problema | Solução |
|----------|---------|
| "Campo obrigatório vazio" | Nome/Host use `@` ou deixe vazio |
| "Prioridade inválida" | Use números: 10, 20, 30... |
| "Destino inválido" | Sem `http://`, sem `www`, sem `.` no final |
| "TTL muito baixo" | Use 3600 (1 hora) ou 86400 (1 dia) |
| "Registro duplicado" | Delete o antigo antes de adicionar novo |

---

## 📱 CONTATOS ÚTEIS

**Hostinger Suporte:**
- Chat 24/7: https://hpanel.hostinger.com

**Registro.br Suporte:**
- Site: https://registro.br/ajuda/
- Tel: 0800 886 3511
- Chat: https://registro.br (botão inferior direito)

---

## ✅ CHECKLIST FINAL

Antes de sair do Registro.br:

- [ ] Adicionei 2 registros MX (prioridades 10 e 20)
- [ ] Adicionei registro SPF (TXT com v=spf1...)
- [ ] DKIM adicionado (opcional)
- [ ] DMARC adicionado (opcional)
- [ ] Cliquei em "Salvar Alterações"
- [ ] Vi mensagem de confirmação "Salvo com sucesso"
- [ ] Anotei data/hora para verificar propagação depois

---

**🎯 Dica:** Salve este arquivo ou imprima para consultar durante a configuração!

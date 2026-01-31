# Guia: Integração Segura com Google Drive via OAuth 2.0

Este guia explica como configurar a autenticação OAuth 2.0 com Google Drive para fazer upload de imagens de forma segura, sem expor suas credenciais.

## Passo 1: Configurar Google Cloud Console

### 1.1 Criar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em "Select a project" → "New Project"
3. Nome do projeto: `HallyuHub`
4. Clique em "Create"

### 1.2 Ativar Google Drive API
1. No menu lateral, vá em "APIs & Services" → "Library"
2. Procure por "Google Drive API"
3. Clique em "Enable"

### 1.3 Criar Credenciais OAuth 2.0
1. Vá em "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "OAuth client ID"
3. Se solicitado, configure a tela de consentimento:
   - User Type: **External**
   - App name: `HallyuHub`
   - User support email: seu email
   - Developer contact: seu email
   - Clique em "Save and Continue"
   - Em "Scopes", clique em "Add or Remove Scopes"
   - Adicione: `https://www.googleapis.com/auth/drive.file`
   - Clique em "Save and Continue"
   - Em "Test users", adicione seu email
   - Clique em "Save and Continue"

4. Volte para "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: **Desktop app**
6. Name: `HallyuHub Desktop`
7. Clique em "Create"

### 1.4 Baixar Credenciais
1. Após criar, você verá um modal com Client ID e Client Secret
2. **IMPORTANTE**: Copie ambos os valores
3. Você também pode baixar o JSON clicando no ícone de download

## Passo 2: Configurar Variáveis de Ambiente

Edite o arquivo `v1/.env` e adicione:

```env
# Google Drive OAuth
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env` com essas credenciais!

## Passo 3: Autenticar com Google Drive

Execute o comando de autenticação:

```bash
npm run gdrive:auth
```

**O que acontece**:
1. Um navegador será aberto automaticamente
2. Você fará login com sua conta Google
3. Autorizará o app a acessar seu Google Drive
4. Um token será salvo localmente em `google-drive-tokens.json`
5. Este token será usado automaticamente nos próximos uploads

**Primeira vez**: O Google mostrará um aviso de "App não verificado". Clique em "Advanced" → "Go to HallyuHub (unsafe)" para continuar.

## Passo 4: Preparar Imagens para Upload

1. Crie uma pasta `v1/temp-images` (se não existir)
2. Coloque as imagens com nomes específicos:
   - `lisa.jpg` ou `lisa.png`
   - `felix.jpg` ou `felix.png`
   - `song-kang.jpg` ou `song-kang.png`
   - `han-so-hee.jpg` ou `han-so-hee.png`
   - `cha-eun-woo.jpg` ou `cha-eun-woo.png`
   - `my-demon-poster.jpg`
   - `gyeongseong-creature-poster.jpg`
   - `wonderful-world-poster.jpg`
   - `my-name-poster.jpg`

**Recomendações**:
- Formato: JPG ou PNG
- Tamanho: Máximo 2MB por imagem
- Resolução: Mínimo 800px de largura

## Passo 5: Upload Automático

Execute o comando de upload:

```bash
npm run gdrive:upload
```

**O que acontece**:
1. O script lê as imagens da pasta `temp-images`
2. Faz upload para uma pasta `HallyuHub` no seu Google Drive
3. Torna as imagens públicas automaticamente
4. Gera URLs diretas para cada imagem
5. Atualiza o banco de dados com as URLs
6. Exibe um resumo do que foi feito

**Exemplo de saída**:
```
🚀 Iniciando upload para Google Drive...
📁 Criando pasta 'HallyuHub' no Drive...
✅ Pasta criada: HallyuHub

📤 Fazendo upload de imagens...
✅ lisa.jpg → https://drive.google.com/uc?export=view&id=ABC123
✅ felix.jpg → https://drive.google.com/uc?export=view&id=DEF456
...

💾 Atualizando banco de dados...
✅ Lisa: Foto atualizada
✅ Felix: Foto atualizada
...

✨ Upload concluído! 5 imagens enviadas.
```

## Passo 6: Verificar Resultados

1. Acesse `http://localhost:3004/artists`
2. As fotos reais devem aparecer no lugar dos placeholders
3. Verifique também em `http://localhost:3004/productions`

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run gdrive:auth` | Autenticar com Google Drive (executar uma vez) |
| `npm run gdrive:upload` | Upload de imagens e atualização do banco |

## Troubleshooting

### "Error: invalid_client"
- Verifique se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretos no `.env`
- Certifique-se de que não há espaços extras

### "Error: redirect_uri_mismatch"
- No Google Cloud Console, vá em "Credentials"
- Edite o OAuth client ID
- Em "Authorized redirect URIs", adicione: `http://localhost:3000/oauth2callback`

### "Token has been expired or revoked"
- Execute `npm run gdrive:auth` novamente para renovar o token

### "File not found: temp-images/lisa.jpg"
- Certifique-se de que as imagens estão na pasta `v1/temp-images`
- Verifique se os nomes dos arquivos estão corretos (case-sensitive)

### "Permission denied"
- Verifique se você autorizou o app durante o fluxo OAuth
- Execute `npm run gdrive:auth` novamente

## Segurança

✅ **O que é seguro**:
- Client ID (pode ser público)
- Redirect URI (localhost)
- Tokens salvos localmente (não commitados)

❌ **O que NUNCA deve ser commitado**:
- Client Secret (no `.env`)
- Tokens (`google-drive-tokens.json`)
- Arquivo `.env` completo

## Renovação de Tokens

Os tokens OAuth expiram após um tempo. O sistema renova automaticamente usando o refresh token. Se houver problemas, execute:

```bash
npm run gdrive:auth
```

## Alternativas

Se preferir não usar OAuth, você pode:
1. Fazer upload manual para o Google Drive
2. Usar o guia anterior em `docs/GOOGLE_DRIVE_IMAGES.md`
3. Usar outro serviço como Imgur ou Cloudinary

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const open = require('open');
const http = require('http');
const url = require('url');

// Configuração OAuth
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, '..', 'google-drive-tokens.json');
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

async function authenticate() {
    console.log('🔐 Iniciando autenticação com Google Drive...\n');

    // Verificar se as credenciais estão configuradas
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('❌ Erro: Credenciais do Google não encontradas!');
        console.log('\n📝 Configure as seguintes variáveis no arquivo .env:');
        console.log('   GOOGLE_CLIENT_ID=seu_client_id');
        console.log('   GOOGLE_CLIENT_SECRET=seu_client_secret');
        console.log('   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback\n');
        console.log('📖 Veja o guia completo em: docs/GOOGLE_DRIVE_OAUTH.md\n');
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );

    // Verificar se já existe um token válido
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        oauth2Client.setCredentials(token);

        console.log('✅ Token existente encontrado!');
        console.log('🔄 Verificando validade...\n');

        try {
            // Testar se o token ainda é válido
            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            await drive.files.list({ pageSize: 1 });

            console.log('✅ Token válido! Você já está autenticado.\n');
            console.log('💡 Para fazer upload de imagens, execute:');
            console.log('   npm run gdrive:upload\n');
            return;
        } catch (error) {
            console.log('⚠️  Token expirado. Renovando...\n');
        }
    }

    // Gerar URL de autenticação
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('🌐 Abrindo navegador para autenticação...');
    console.log('📋 Se o navegador não abrir, acesse manualmente:\n');
    console.log(authUrl + '\n');

    // Criar servidor temporário para receber o callback
    const server = http.createServer(async (req, res) => {
        if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
            const code = qs.get('code');

            res.end('✅ Autenticação concluída! Você pode fechar esta janela.');

            server.close();

            // Trocar o código pelo token
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            // Salvar token
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
            console.log('\n✅ Autenticação bem-sucedida!');
            console.log('💾 Token salvo em:', TOKEN_PATH);
            console.log('\n🎉 Pronto! Agora você pode fazer upload de imagens:');
            console.log('   npm run gdrive:upload\n');
        }
    }).listen(3000, () => {
        // Abrir navegador
        open(authUrl, { wait: false }).then(cp => cp.unref());
    });
}

authenticate().catch(console.error);

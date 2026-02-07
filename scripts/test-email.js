#!/usr/bin/env node
/**
 * Script de Teste de Email SMTP - Hostinger
 *
 * Testa se a configuração de email está funcionando corretamente
 *
 * Uso:
 *   node scripts/test-email.js destinatario@email.com
 *   node scripts/test-email.js --interactive
 */

const readline = require('readline');

// Parse argumentos
const args = process.argv.slice(2);
const interactive = args.includes('--interactive');
const recipientArg = args.find(arg => !arg.startsWith('--'));

/**
 * Configuração SMTP Hostinger
 */
const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || 'no_reply@hallyuhub.com.br',
    password: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.SMTP_FROM || 'no_reply@hallyuhub.com.br',
    fromName: process.env.SMTP_FROM_NAME || 'HallyuHub',
};

/**
 * Interface readline para input interativo
 */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Pergunta interativa
 */
function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

/**
 * Testa configuração SMTP usando fetch (nativo no Node 18+)
 */
async function testSMTPConnection() {
    console.log('\n📧 Testando conexão SMTP...\n');
    console.log('Configuração:');
    console.log(`  Host: ${SMTP_CONFIG.host}`);
    console.log(`  Porta: ${SMTP_CONFIG.port}`);
    console.log(`  Usuário: ${SMTP_CONFIG.user}`);
    console.log(`  Senha: ${SMTP_CONFIG.password ? '****' + SMTP_CONFIG.password.slice(-4) : '[NÃO CONFIGURADA]'}`);

    if (!SMTP_CONFIG.password) {
        console.error('\n❌ ERRO: Senha não configurada!');
        console.log('\nConfigure a senha via variável de ambiente:');
        console.log('  export SMTP_PASSWORD="sua_senha_aqui"');
        console.log('\nOu edite o arquivo .env:');
        console.log('  SMTP_PASSWORD=sua_senha_aqui');
        return false;
    }

    // Verificação básica - não podemos testar SMTP diretamente sem biblioteca
    console.log('\n⚠️  Para testar completamente, instale o nodemailer:');
    console.log('  npm install nodemailer');
    console.log('\nPor enquanto, apenas validando configuração...');

    return true;
}

/**
 * Envia email de teste (requer nodemailer)
 */
async function sendTestEmail(recipient) {
    try {
        // Tentar importar nodemailer
        const nodemailer = require('nodemailer');

        console.log('\n📨 Enviando email de teste...\n');

        // Criar transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_CONFIG.host,
            port: SMTP_CONFIG.port,
            secure: SMTP_CONFIG.port === 465, // true para 465, false para outros
            auth: {
                user: SMTP_CONFIG.user,
                pass: SMTP_CONFIG.password
            },
            tls: {
                rejectUnauthorized: false // Aceitar certificados auto-assinados
            }
        });

        // Verificar conexão
        console.log('⏳ Verificando conexão com servidor SMTP...');
        await transporter.verify();
        console.log('✅ Conexão estabelecida com sucesso!\n');

        // Enviar email
        const now = new Date().toLocaleString('pt-BR');
        const info = await transporter.sendMail({
            from: `"${SMTP_CONFIG.fromName}" <${SMTP_CONFIG.fromEmail}>`,
            to: recipient,
            subject: `✅ Teste de Email Hostinger - ${now}`,
            text: `Este é um email de teste enviado em ${now}.\n\nSe você recebeu este email, sua configuração SMTP está funcionando perfeitamente! 🎉\n\n---\nHallyuHub\nhttps://hallyuhub.com.br`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">✅ Teste de Email Hostinger</h2>
                    <p>Este é um email de teste enviado em <strong>${now}</strong>.</p>
                    <p>Se você recebeu este email, sua configuração SMTP está funcionando perfeitamente! 🎉</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        <strong>HallyuHub</strong><br>
                        <a href="https://hallyuhub.com.br">https://hallyuhub.com.br</a>
                    </p>
                </div>
            `
        });

        console.log('✅ Email enviado com sucesso!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Destinatário: ${recipient}`);
        console.log(`   De: ${SMTP_CONFIG.fromName} <${SMTP_CONFIG.fromEmail}>`);

        return true;

    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error('\n❌ ERRO: nodemailer não está instalado\n');
            console.log('Instale com:');
            console.log('  npm install nodemailer');
            console.log('\nOu use yarn:');
            console.log('  yarn add nodemailer');
            return false;
        }

        console.error('\n❌ ERRO ao enviar email:', error.message);

        if (error.responseCode === 535) {
            console.log('\n⚠️  Erro de autenticação. Verifique:');
            console.log('  - Email está correto: ' + SMTP_CONFIG.user);
            console.log('  - Senha está correta');
            console.log('  - Conta de email foi criada na Hostinger');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Erro de conexão. Verifique:');
            console.log('  - Host: ' + SMTP_CONFIG.host);
            console.log('  - Porta: ' + SMTP_CONFIG.port);
            console.log('  - Firewall não está bloqueando a conexão');
        }

        return false;
    }
}

/**
 * Modo interativo
 */
async function interactiveMode() {
    console.log('\n📧 Teste de Email SMTP - Modo Interativo\n');

    // Perguntar email destinatário
    const recipient = await question('Digite o email de destino para teste: ');

    if (!recipient || !recipient.includes('@')) {
        console.error('❌ Email inválido!');
        rl.close();
        return;
    }

    // Testar conexão
    const connectionOk = await testSMTPConnection();

    if (!connectionOk) {
        rl.close();
        return;
    }

    // Perguntar se quer continuar
    const confirm = await question('\nDeseja enviar email de teste? (s/n): ');

    if (confirm.toLowerCase() === 's' || confirm.toLowerCase() === 'sim') {
        await sendTestEmail(recipient);
    } else {
        console.log('\n👋 Teste cancelado.');
    }

    rl.close();
}

/**
 * Modo direto (com argumento)
 */
async function directMode(recipient) {
    console.log('\n📧 Teste de Email SMTP\n');

    const connectionOk = await testSMTPConnection();

    if (!connectionOk) {
        return;
    }

    await sendTestEmail(recipient);
}

/**
 * Verificar DNS
 */
async function checkDNS() {
    console.log('\n🔍 Verificando registros DNS...\n');

    const domain = SMTP_CONFIG.fromEmail.split('@')[1];

    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // Verificar MX
        console.log('📬 Registros MX:');
        try {
            const { stdout } = await execAsync(`dig MX ${domain} +short`);
            if (stdout.trim()) {
                console.log(stdout.trim());
            } else {
                console.log('  ❌ Nenhum registro MX encontrado');
            }
        } catch (error) {
            console.log('  ⚠️  Comando dig não disponível');
        }

        // Verificar SPF
        console.log('\n🛡️  Registro SPF:');
        try {
            const { stdout } = await execAsync(`dig TXT ${domain} +short | grep spf`);
            if (stdout.trim()) {
                console.log(stdout.trim());
            } else {
                console.log('  ❌ Nenhum registro SPF encontrado');
            }
        } catch (error) {
            console.log('  ⚠️  SPF não encontrado ou dig não disponível');
        }

    } catch (error) {
        console.log('⚠️  Não foi possível verificar DNS automaticamente');
        console.log('\nVerifique manualmente em:');
        console.log('  https://mxtoolbox.com/SuperTool.aspx?action=mx%3a' + domain);
    }
}

/**
 * Exibir ajuda
 */
function showHelp() {
    console.log(`
📧 Teste de Email SMTP - Hostinger

USO:
  node scripts/test-email.js <email>              Enviar email de teste
  node scripts/test-email.js --interactive        Modo interativo
  node scripts/test-email.js --check-dns          Verificar DNS
  node scripts/test-email.js --help               Exibir ajuda

EXEMPLOS:
  node scripts/test-email.js seuemail@gmail.com
  node scripts/test-email.js --interactive

VARIÁVEIS DE AMBIENTE:
  SMTP_HOST          Servidor SMTP (padrão: smtp.hostinger.com)
  SMTP_PORT          Porta SMTP (padrão: 587)
  SMTP_USER          Usuário SMTP (padrão: no_reply@hallyuhub.com.br)
  SMTP_PASSWORD      Senha SMTP (OBRIGATÓRIO)
  SMTP_FROM          Email remetente
  SMTP_FROM_NAME     Nome do remetente

REQUISITOS:
  - Node.js 18+ (para suporte nativo a fetch)
  - nodemailer (npm install nodemailer)
`);
}

/**
 * Main
 */
async function main() {
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }

    if (args.includes('--check-dns')) {
        await checkDNS();
        return;
    }

    if (interactive) {
        await interactiveMode();
    } else if (recipientArg) {
        await directMode(recipientArg);
    } else {
        console.log('❌ Uso incorreto. Use --help para ver opções.');
        console.log('\nExemplos:');
        console.log('  node scripts/test-email.js seuemail@gmail.com');
        console.log('  node scripts/test-email.js --interactive');
    }
}

main().catch(console.error);

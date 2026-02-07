#!/usr/bin/env node
/**
 * Teste rápido de SMTP
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
    console.log('🧪 Testando conexão SMTP Hostinger...\n');

    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
    };

    console.log('📋 Configuração:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Porta: ${config.port}`);
    console.log(`   Usuário: ${config.user}`);
    console.log(`   Senha: ${'*'.repeat(config.password?.length || 0)}\n`);

    if (!config.password) {
        console.error('❌ SMTP_PASSWORD não configurada!\n');
        process.exit(1);
    }

    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.password
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('⏳ Verificando conexão...');
        await transporter.verify();

        console.log('✅ CONEXÃO SMTP OK!\n');
        console.log('🎉 Seu email está configurado e PRONTO PARA USAR!\n');
        console.log('Para enviar um email de teste:');
        console.log('  node scripts/test-email.js seu_email@gmail.com\n');

        return true;

    } catch (error) {
        console.error('❌ ERRO na conexão SMTP:\n');
        console.error(`   ${error.message}\n`);

        if (error.responseCode === 535) {
            console.log('💡 Possíveis causas:');
            console.log('   - Senha incorreta');
            console.log('   - Email não criado na Hostinger');
            console.log('   - Conta bloqueada\n');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.log('💡 Possíveis causas:');
            console.log('   - Firewall bloqueando porta 587');
            console.log('   - Problema de rede');
            console.log('   - Host incorreto\n');
        }

        return false;
    }
}

test().then(success => {
    process.exit(success ? 0 : 1);
});

#!/usr/bin/env ts-node
/**
 * Script de teste para notificações Slack
 * Envia notificações de exemplo para todos os canais configurados
 *
 * Uso: npx ts-node scripts/test-slack-notifications.ts
 */

require('dotenv').config();
const { getSlackService } = require('../lib/services/slack-notification-service');

async function testSlackNotifications() {
    console.log('🧪 Testando notificações Slack...\n');

    const slack = getSlackService();

    if (!slack.isEnabled()) {
        console.log('❌ Nenhum webhook configurado!');
        console.log('Configure as variáveis SLACK_WEBHOOK_* no arquivo .env\n');
        process.exit(1);
    }

    console.log('✅ Webhooks configurados\n');

    // Test 1: Content notification
    console.log('📤 Teste 1/5: Notificação de conteúdo (artista)...');
    try {
        const result1 = await slack.notifyContentAdded({
            type: 'artist',
            name: 'NewJeans (Teste)',
            details: {
                'Membros': '5',
                'Debut': '2022',
                'Agência': 'ADOR',
            },
            source: 'Script de Teste',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        });
        console.log(result1 ? '   ✅ Enviado para #hallyuhub-content' : '   ❌ Falha ao enviar');
    } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
    }

    // Test 2: Content batch summary
    console.log('\n📤 Teste 2/5: Resumo de geração em lote...');
    try {
        const result2 = await slack.notifyContentBatchSummary({
            artists: 3,
            news: 5,
            productions: 2,
            provider: 'Gemini',
            duration: '45s',
        });
        console.log(result2 ? '   ✅ Enviado para #hallyuhub-content' : '   ❌ Falha ao enviar');
    } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
    }

    // Test 3: Deploy notification
    console.log('\n📤 Teste 3/5: Notificação de deploy...');
    try {
        const result3 = await slack.notifyDeploy({
            environment: 'staging',
            status: 'success',
            branch: 'develop',
            commit: 'abc1234567890',
            duration: '2m 15s',
        });
        console.log(result3 ? '   ✅ Enviado para #hallyuhub-deploys' : '   ❌ Falha ao enviar');
    } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
    }

    // Test 4: Backup notification
    console.log('\n📤 Teste 4/5: Notificação de backup...');
    try {
        const result4 = await slack.notifyBackup({
            environment: 'production',
            status: 'success',
            size: '156MB',
            retainedCount: 7,
        });
        console.log(result4 ? '   ✅ Enviado para #hallyuhub-alerts' : '   ❌ Falha ao enviar');
    } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
    }

    // Test 5: Health alert
    console.log('\n📤 Teste 5/5: Alerta de saúde...');
    try {
        const result5 = await slack.notifyHealthAlert({
            service: 'Sistema de Testes',
            status: 'up',
            message: 'Todos os testes de notificação foram executados com sucesso! ✨',
        });
        console.log(result5 ? '   ✅ Enviado para #hallyuhub-alerts' : '   ❌ Falha ao enviar');
    } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Testes concluídos!');
    console.log('Verifique os canais do Slack para confirmar o recebimento.');
    console.log('='.repeat(60) + '\n');
}

// Execute
testSlackNotifications()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });

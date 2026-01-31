import { PrismaClient } from '@prisma/client';
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🖼️  Atualizando imagens com URLs do Google Drive...');

    // Ler o arquivo de configuração
    const configPath = path.join(__dirname, 'update-images.json');

    if (!fs.existsSync(configPath)) {
        console.error('❌ Arquivo update-images.json não encontrado!');
        console.log('📝 Crie o arquivo em: scripts/update-images.json');
        console.log('📖 Veja o guia em: docs/GOOGLE_DRIVE_IMAGES.md');
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Atualizar artistas
    console.log('\n👤 Atualizando fotos dos artistas...');
    for (const [artistName, imageUrl] of Object.entries(config.artists) as [string, any][]) {
        if (imageUrl.includes('COLE_O_FILE_ID_AQUI')) {
            console.log(`⏭️  Pulando ${artistName} (URL não configurada)`);
            continue;
        }

        try {
            await prisma.artist.update({
                where: { nameRomanized: artistName },
                data: { primaryImageUrl: imageUrl }
            });
            console.log(`✅ ${artistName}: Foto atualizada`);
        } catch (error) {
            console.log(`⚠️  ${artistName}: Artista não encontrado no banco`);
        }
    }

    // Atualizar produções
    console.log('\n🎬 Atualizando pôsteres das produções...');
    for (const [productionTitle, imageUrl] of Object.entries(config.productions) as [string, any][]) {
        if (imageUrl.includes('COLE_O_FILE_ID_AQUI')) {
            console.log(`⏭️  Pulando "${productionTitle}" (URL não configurada)`);
            continue;
        }

        try {
            // Primeiro, adicionar o campo imageUrl ao modelo Production se não existir
            // Por enquanto, vamos usar um campo genérico ou adicionar ao synopsis
            console.log(`ℹ️  "${productionTitle}": Pôster pronto (adicione campo 'posterUrl' ao schema para usar)`);
        } catch (error) {
            console.log(`⚠️  "${productionTitle}": Produção não encontrada`);
        }
    }

    console.log('\n✨ Atualização de imagens concluída!');
    console.log('🌐 Acesse http://localhost:3004/artists para ver as mudanças');
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

const { google } = require('googleapis');
import prisma from '../lib/prisma';
const fs = require('fs');
const path = require('path');
const TOKEN_PATH = path.join(__dirname, '..', 'google-drive-tokens.json');
const IMAGES_DIR = path.join(__dirname, '..', 'temp-images');

// Mapeamento de arquivos para artistas
const ARTIST_IMAGES = {
    'lisa': 'Lisa',
    'felix': 'Felix',
    'song-kang': 'Song Kang',
    'han-so-hee': 'Han So-hee',
    'cha-eun-woo': 'Cha Eun-woo'
};

// Mapeamento de arquivos para produções
const PRODUCTION_IMAGES = {
    'my-demon-poster': 'My Demon',
    'gyeongseong-creature-poster': 'A Criatura de Gyeongseong',
    'wonderful-world-poster': 'Wonderful World',
    'my-name-poster': 'My Name'
};

async function getAuthClient() {
    if (!fs.existsSync(TOKEN_PATH)) {
        console.error('❌ Token não encontrado!');
        console.log('📝 Execute primeiro: npm run gdrive:auth\n');
        process.exit(1);
    }

    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
    );

    oauth2Client.setCredentials(token);
    return oauth2Client;
}

async function createFolder(drive: any, folderName: any) {
    // Verificar se a pasta já existe
    const response = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (response.data.files.length > 0) {
        console.log(`📁 Pasta '${folderName}' já existe`);
        return response.data.files[0].id;
    }

    // Criar nova pasta
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });

    console.log(`📁 Pasta '${folderName}' criada`);
    return folder.data.id;
}

async function uploadImage(drive: any, filePath: any, fileName: any, folderId: any) {
    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    };

    const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });

    // Tornar o arquivo público
    await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // Retornar URL direta
    return `https://drive.google.com/uc?export=view&id=${file.data.id}`;
}

async function main() {
    console.log('🚀 Iniciando upload para Google Drive...\n');

    // Verificar se a pasta de imagens existe
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Pasta não encontrada: ${IMAGES_DIR}`);
        console.log('📝 Crie a pasta e adicione as imagens:');
        console.log('   mkdir temp-images');
        console.log('   # Adicione as imagens na pasta\n');
        process.exit(1);
    }

    // Autenticar
    const auth = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    // Criar pasta no Drive
    const folderId = await createFolder(drive, 'HallyuHub');

    // Processar artistas
    console.log('\n👤 Processando imagens de artistas...');
    const artistUpdates = [];

    for (const [filePrefix, artistName] of Object.entries(ARTIST_IMAGES)) {
        const files = fs.readdirSync(IMAGES_DIR).filter((f: any) =>
            f.toLowerCase().startsWith(filePrefix) && (f.endsWith('.jpg') || f.endsWith('.png'))
        );

        if (files.length === 0) {
            console.log(`⏭️  ${artistName}: Imagem não encontrada (${filePrefix}.jpg/png)`);
            continue;
        }

        const filePath = path.join(IMAGES_DIR, files[0]);
        const imageUrl = await uploadImage(drive, filePath, files[0], folderId);

        artistUpdates.push({ name: artistName, url: imageUrl });
        console.log(`✅ ${artistName}: ${imageUrl}`);
    }

    // Atualizar banco de dados
    if (artistUpdates.length > 0) {
        console.log('\n💾 Atualizando banco de dados...');
        for (const { name, url } of artistUpdates) {
            try {
                await prisma.artist.update({
                    where: { nameRomanized: name },
                    data: { primaryImageUrl: url }
                });
                console.log(`✅ ${name}: Banco atualizado`);
            } catch (error) {
                console.log(`⚠️  ${name}: Não encontrado no banco`);
            }
        }
    }

    console.log('\n✨ Upload concluído!');
    console.log(`📊 Total: ${artistUpdates.length} imagens enviadas`);
    console.log('\n🌐 Acesse http://localhost:3004/artists para ver as mudanças\n');
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e.message);
        if (e.message.includes('invalid_grant')) {
            console.log('\n💡 Token expirado. Execute: npm run gdrive:auth\n');
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

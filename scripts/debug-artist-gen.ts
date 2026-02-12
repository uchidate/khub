import { AIOrchestrator } from '../lib/ai/orchestrator';
import { ArtistGenerator } from '../lib/ai/generators/artist-generator';
import prisma from '../lib/prisma';
import { SlackNotificationService } from '../lib/services/slack-notification-service';

async function debugArtistGeneration() {
    console.log('--- Debugging Artist Generation ---');

    const orchestrator = new AIOrchestrator({
        geminiApiKey: process.env.GEMINI_API_KEY,
        openaiApiKey: process.env.OPENAI_API_KEY,
        claudeApiKey: process.env.ANTHROPIC_API_KEY,
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL
    });
    console.log('Available providers:', orchestrator.getAvailableProviders());

    const artistGenerator = new ArtistGenerator(orchestrator, prisma);
    const existingArtists = await prisma.artist.findMany({
        select: { nameRomanized: true, tmdbId: true }
    });
    const excludeList = existingArtists.map(a => a.nameRomanized);

    console.log('Existing artists count:', existingArtists.length);

    try {
        console.log('Attempting to generate 1 artist...');
        const artists = await artistGenerator.generateMultipleArtists(1, { excludeList });

        if (artists.length > 0) {
            console.log('✅ Success! Generated:', artists[0].nameRomanized);
            console.log('Bio:', artists[0].bio);
        } else {
            console.log('❌ No artists generated.');
        }
    } catch (error: any) {
        console.error('❌ Error during generation:', error.message);
        if (error.stack) console.error(error.stack);
    }

    await prisma.$disconnect();
}

debugArtistGeneration();

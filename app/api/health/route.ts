import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function checkOllama(): Promise<boolean> {
    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    if (!ollamaUrl) return false;

    try {
        const response = await fetch(`${ollamaUrl}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export async function GET() {
    const ollamaOk = await checkOllama();

    const aiProviders = {
        ollama: {
            configured: !!process.env.OLLAMA_BASE_URL,
            available: ollamaOk,
            url: process.env.OLLAMA_BASE_URL || null,
        },
        gemini: {
            configured: !!process.env.GEMINI_API_KEY,
        },
        openai: {
            configured: !!process.env.OPENAI_API_KEY,
        },
        claude: {
            configured: !!process.env.ANTHROPIC_API_KEY,
        },
    };

    const hasAnyProvider = Object.values(aiProviders).some(p => p.configured);

    return NextResponse.json({
        ok: true,
        ts: new Date().toISOString(),
        env: process.env.NODE_ENV,
        deploy_env: process.env.DEPLOY_ENV || 'unknown',
        ai: {
            hasProvider: hasAnyProvider,
            providers: aiProviders,
        },
    });
}

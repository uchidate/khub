import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-helpers';

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

async function checkTMDB(): Promise<boolean> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return false;

    try {
        const response = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${apiKey}`, {
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Admin-only detailed health check.
 * Exposes provider status, monitoring config, and infrastructure details.
 */
export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const [ollamaOk, tmdbOk] = await Promise.all([checkOllama(), checkTMDB()]);

    const aiProviders = {
        ollama: {
            configured: !!process.env.OLLAMA_BASE_URL,
            available: ollamaOk,
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

    const monitoring = {
        slack: {
            content: !!process.env.SLACK_WEBHOOK_CONTENT,
            alerts: !!process.env.SLACK_WEBHOOK_ALERTS,
            deploys: !!process.env.SLACK_WEBHOOK_DEPLOYS,
        },
        tmdb: {
            configured: !!process.env.TMDB_API_KEY,
            available: tmdbOk,
        },
    };

    return NextResponse.json({
        ok: true,
        ts: new Date().toISOString(),
        env: process.env.NODE_ENV,
        deploy_env: process.env.DEPLOY_ENV || 'unknown',
        ai: {
            hasProvider: hasAnyProvider,
            providers: aiProviders,
        },
        monitoring,
    });
}

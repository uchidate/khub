import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    return NextResponse.json({
        ok: true,
        ts: new Date().toISOString(),
        env: process.env.NODE_ENV,
        deploy_env: process.env.DEPLOY_ENV || 'unknown'
    });
}

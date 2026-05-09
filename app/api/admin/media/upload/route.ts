import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blog')
const MAX_SIZE = 50 * 1024 * 1024 // 50MB antes de comprimir
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Tipo não permitido. Use JPG, PNG, WebP ou GIF.' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Arquivo muito grande. Máximo 50MB.' }, { status: 400 })

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })

    const base = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9-_]/gi, '-').toLowerCase().slice(0, 60)
    const filename = `${base}-${Date.now()}.webp`
    const filepath = path.join(UPLOAD_DIR, filename)

    const input = Buffer.from(await file.arrayBuffer())

    // Redimensiona para no máximo 1600px de largura e converte para WebP
    await sharp(input)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(filepath)

    return NextResponse.json({ url: `/uploads/blog/${filename}`, filename })
}

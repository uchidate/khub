import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
    const artists = await prisma.artist.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false },
        select: {
            id:               true,
            nameRomanized:    true,
            nameHangul:       true,
            birthDate:        true,
            bio:              true,
            analiseEditorial: true,
            curiosidades:     true,
        },
        orderBy: { nameRomanized: 'asc' },
    })

    // Parse analiseEditorial sections: **Title**\nContent
    function parseSection(text: string | null, sectionName: string): string {
        if (!text) return ''
        const pattern = /\*\*([^*\n]{1,50})\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/g
        let m: RegExpExecArray | null
        while ((m = pattern.exec(text)) !== null) {
            if (m[1].trim().toLowerCase() === sectionName.toLowerCase()) {
                return m[2].trim()
            }
        }
        return ''
    }

    const rows = artists.map(a => ({
        ID:             a.id,
        Nome:           a.nameRomanized,
        'Nome Hangul':  a.nameHangul ?? '',
        'Data Nasc.':   a.birthDate ? a.birthDate.toISOString().slice(0, 10) : '',
        Bio:            a.bio ?? '',
        Projetos:       parseSection(a.analiseEditorial, 'Projetos'),
        Reconhecimentos: parseSection(a.analiseEditorial, 'Reconhecimentos'),
        'Análise Editorial (completo)': a.analiseEditorial ?? '',
        Curiosidades:   (a.curiosidades ?? []).join('\n'),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
        { wch: 30 },  // ID
        { wch: 30 },  // Nome
        { wch: 25 },  // Nome Hangul
        { wch: 12 },  // Data Nasc.
        { wch: 60 },  // Bio
        { wch: 70 },  // Projetos
        { wch: 70 },  // Reconhecimentos
        { wch: 80 },  // Análise Editorial completo
        { wch: 80 },  // Curiosidades
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Artistas')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const today = new Date().toISOString().slice(0, 10)
    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="artistas-${today}.xlsx"`,
        },
    })
}

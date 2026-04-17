/**
 * JsonLd — renders a <script type="application/ld+json"> tag for structured data.
 * Use in server components only (no 'use client').
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}

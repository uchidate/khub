const LOCALE = 'pt-BR'

/** "01 jan 2024 14:30" */
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString(LOCALE, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/** "01/01/2024" */
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString(LOCALE)
}

/** "01/01/2024" with explicit format */
export function formatDateNumeric(date: Date | string): string {
    return new Date(date).toLocaleDateString(LOCALE, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

/** "01 jan" */
export function formatDateShort(date: Date | string): string {
    return new Date(date).toLocaleDateString(LOCALE, {
        day: '2-digit',
        month: 'short',
    })
}

export function BrandDot({ className = '' }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex items-end pb-[0.12em] ${className}`}
            style={{ lineHeight: 1 }}
        >
            <svg width="0.22em" height="0.22em" viewBox="0 0 1 1" style={{ display: 'inline-block', fill: '#ff246e' }}>
                <circle cx="0.5" cy="0.5" r="0.5" />
            </svg>
        </span>
    )
}

'use client'

import { useEffect } from 'react'

/**
 * Global error boundary — captura erros fatais no layout raiz.
 * O app/error.tsx cobre páginas individuais; este cobre quando o
 * próprio layout.tsx quebra, exigindo <html> e <body> próprios.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body
        style={{
          background: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '420px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Algo deu muito errado
          </h1>
          <p style={{ color: '#888', marginBottom: '2rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            Ocorreu um erro inesperado no servidor. Nossa equipe foi notificada.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <pre
              style={{
                background: '#111',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                textAlign: 'left',
                overflow: 'auto',
                marginBottom: '1.5rem',
                color: '#f87171',
                border: '1px solid #3f3f46',
              }}
            >
              {error.message}
              {error.digest && `\n\ndigest: ${error.digest}`}
            </pre>
          )}

          <button
            onClick={reset}
            style={{
              background: '#e11d48',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 28px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}

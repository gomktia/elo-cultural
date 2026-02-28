'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#F8FAFC',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Algo deu errado
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
              Ocorreu um erro inesperado. Nossa equipe já foi notificada.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                backgroundColor: '#0047AB',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

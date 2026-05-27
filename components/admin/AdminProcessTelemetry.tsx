'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { resolveAdminTelemetryRoute } from '@/lib/admin/process-telemetry'

export function AdminProcessTelemetry({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!enabled || !resolveAdminTelemetryRoute(pathname)) return

    void fetch('/api/admin/process-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname }),
      keepalive: true,
    }).catch(() => {
      // Telemetria nao deve interferir no uso do admin.
    })
  }, [enabled, pathname])

  return null
}

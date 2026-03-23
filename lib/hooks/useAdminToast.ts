'use client'

import { useMemo } from 'react'
import { useToast } from './useToast'

/**
 * useAdminToast
 *
 * Wrapper conveniente sobre useToast com helpers semânticos.
 * Padroniza feedback de ações no admin (salvar, excluir, erro, etc.).
 *
 * Retorna um objeto estável (useMemo) — seguro usar em deps de useCallback/useEffect.
 */
export function useAdminToast() {
  const { addToast } = useToast()

  return useMemo(() => ({
    success: (message: string) =>
      addToast({ type: 'success', message, duration: 3000 }),
    error: (message: string) =>
      addToast({ type: 'error', message, duration: 5000 }),
    info: (message: string) =>
      addToast({ type: 'info', message, duration: 3000 }),
    warning: (message: string) =>
      addToast({ type: 'warning', message, duration: 4000 }),

    // Helpers específicos do admin
    saved: () => addToast({ type: 'success', message: 'Salvo com sucesso', duration: 2500 }),
    deleted: (entity = 'item') =>
      addToast({ type: 'success', message: `${entity} excluído`, duration: 2500 }),
    translationDone: (name: string) =>
      addToast({ type: 'success', message: `Tradução concluída: ${name}`, duration: 3000 }),
    translationFailed: () =>
      addToast({ type: 'error', message: 'Falha na tradução. Verifique os providers de IA.', duration: 5000 }),
    copyDone: () =>
      addToast({ type: 'info', message: 'Copiado para o clipboard', duration: 2000 }),
  }), [addToast])
}

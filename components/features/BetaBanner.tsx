import { getSystemSettings } from '@/lib/settings'
import { Construction } from 'lucide-react'

export async function BetaBanner() {
  const settings = await getSystemSettings()

  if (!settings.betaMode) return null

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center z-[9998]">
      <div className="flex items-center justify-center gap-2 text-sm text-amber-400 font-medium">
        <Construction size={14} className="flex-shrink-0" />
        <span>
          O HallyuHub está em versão beta — alguns recursos ainda estão em desenvolvimento. Sua experiência pode mudar.
        </span>
      </div>
    </div>
  )
}

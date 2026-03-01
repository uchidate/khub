import { getSystemSettings } from '@/lib/settings'
import { Construction } from 'lucide-react'

export async function BetaBanner() {
  const settings = await getSystemSettings()

  if (!settings.betaMode) return null

  return (
    <div className="sticky top-0 z-[9997] w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 text-center">
      <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
        <Construction size={12} className="flex-shrink-0" />
        <span className="hidden sm:inline">
          O HallyuHub está em versão beta — alguns recursos ainda estão em desenvolvimento. Sua experiência pode mudar.
        </span>
        <span className="sm:hidden">
          HallyuHub em versão beta — recursos em desenvolvimento.
        </span>
      </div>
    </div>
  )
}

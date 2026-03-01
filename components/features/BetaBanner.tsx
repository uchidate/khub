import { getSystemSettings } from '@/lib/settings'
import { BetaBannerClient } from './BetaBannerClient'

export async function BetaBanner() {
  const settings = await getSystemSettings()

  if (!settings.betaMode) return null

  return <BetaBannerClient />
}

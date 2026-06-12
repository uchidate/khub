import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { getArchiveHubsByLocale } from '@/lib/seo/archive-hubs'
import { HUB_INDEX_UI_STRINGS } from '@/lib/seo/hub-i18n'
import { HubsIndexContent } from '@/components/seo/HubsIndexContent'

export const revalidate = 3600

const BASE_URL = SITE_URL
const strings = HUB_INDEX_UI_STRINGS.vi

export const metadata: Metadata = {
    title: strings.metaTitle,
    description: strings.metaDescription,
    alternates: { canonical: `${BASE_URL}/vi/hubs` },
}

export default function HubsIndexPageVi() {
    return <HubsIndexContent locale="vi" hubs={getArchiveHubsByLocale('vi')} />
}

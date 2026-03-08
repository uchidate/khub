import { redirect } from 'next/navigation'

export default async function NewsEditRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { id } = await params
  const { returnTo } = await searchParams
  const qs = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''
  redirect(`/admin/news?editId=${id}${qs}`)
}

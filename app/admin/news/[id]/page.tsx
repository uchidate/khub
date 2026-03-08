import { redirect } from 'next/navigation'

export default async function NewsEditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/news?editId=${id}`)
}

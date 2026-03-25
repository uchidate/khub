import { redirect } from 'next/navigation'

export default async function BlogEditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/write?edit=${id}`)
}

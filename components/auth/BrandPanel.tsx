import Link from 'next/link'
import { BrandMark } from '@/components/ui/BrandMark'

export function BrandPanel() {
  return (
    <div className="hidden lg:flex w-[340px] shrink-0 flex-col justify-between bg-surface p-10 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#ff2d78]/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-60 h-60 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

      <Link href="/" className="flex items-center gap-2.5 relative z-10 hover:opacity-80 transition-opacity">
        <BrandMark size={30} />
        <span className="text-lg font-black tracking-[-0.02em] text-foreground">
          Hallyu<span className="text-[#ff2d78]">Hub</span>
        </span>
      </Link>

      <div className="relative z-10 space-y-3">
        <p className="text-2xl font-black text-foreground leading-tight">
          O portal do <span className="text-[#ff2d78]">K-Pop</span> e <br />
          da cultura coreana.
        </p>
        <p className="text-sm text-muted">
          Perfis de artistas, grupos, doramas e filmes — tudo em português.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-xs text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        hallyuhub.com.br
      </div>
    </div>
  )
}

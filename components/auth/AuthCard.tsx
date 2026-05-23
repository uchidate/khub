import type { ReactNode } from 'react'
import Link from 'next/link'
import { BrandMark } from '@/components/ui/BrandMark'
import { BrandPanel } from './BrandPanel'

interface AuthCardProps {
  children: ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl border border-border rounded-2xl overflow-hidden flex">
        <BrandPanel />
        <div className="flex-1 flex items-center justify-center p-8 lg:p-10 bg-background">
          <div className="w-full max-w-sm">
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <BrandMark size={24} />
              <span className="text-[15px] font-black tracking-[-0.02em]">
                Hallyu<span className="text-[#ff2d78]">Hub</span>
              </span>
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-background text-muted text-xs">ou com email</span>
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function AuthInput({
  id, label, type = 'text', value, onChange, placeholder, disabled, required, icon,
}: {
  id: string; label: string; type?: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; disabled?: boolean; required?: boolean
  icon?: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-foreground mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">{icon}</span>}
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled} required={required}
          className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
        />
      </div>
    </div>
  )
}

export function AuthSubmitButton({ isLoading, label }: { isLoading: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={isLoading}
      className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
    >
      {isLoading
        ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
        : label}
    </button>
  )
}

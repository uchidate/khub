import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ErrorMessageProps {
  title: string
  message: string
  retry?: () => void
  showSupport?: boolean
}

export function ErrorMessage({ title, message, retry, showSupport }: ErrorMessageProps) {
  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center max-w-md mx-auto">
      <div className="text-red-500 mb-4">
        <AlertCircle className="w-12 h-12 mx-auto" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-400 mb-4">{message}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        {retry && (
          <Button onClick={retry} variant="primary">
            🔄 Tentar Novamente
          </Button>
        )}
        {showSupport && (
          <Button
            onClick={() => window.open('mailto:suporte@hallyuhub.com.br', '_blank')}
            variant="outline"
          >
            📧 Contatar Suporte
          </Button>
        )}
      </div>
    </div>
  )
}

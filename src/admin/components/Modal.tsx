// src/admin/components/Modal.tsx
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowLeft } from 'lucide-react'

interface ModalProps {
  children: React.ReactNode
  onClose: () => void
  title: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Show a back button before the title. */
  onBack?: () => void
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[1120px]',
}

export default function Modal({ children, onClose, title, maxWidth = 'md', onBack }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay-in">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative bg-panel border border-line-strong rounded-panel shadow-screen w-full ${maxWidthClasses[maxWidth]} max-h-[86vh] flex flex-col overflow-hidden animate-card-in`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-b border-line-strong">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="w-[34px] h-[34px] rounded-control border-[1.5px] border-line-input flex items-center justify-center text-ink-nav hover:bg-page"
              >
                <ArrowLeft className="w-[17px] h-[17px]" aria-hidden />
              </button>
            )}
            <h2 className="m-0 text-[19px] font-bold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-[34px] h-[34px] rounded-control border-[1.5px] border-line-input flex items-center justify-center text-ink-nav hover:bg-page"
          >
            <X className="w-[17px] h-[17px]" aria-hidden />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  )
}

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`flex-1 overflow-y-auto px-6 py-5 ${className}`}>{children}</div>
}

interface ModalFooterProps {
  children: React.ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="px-6 py-3.5 border-t border-line-strong bg-page flex justify-end gap-2.5">{children}</div>
}

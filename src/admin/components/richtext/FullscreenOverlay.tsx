// src/admin/components/richtext/FullscreenOverlay.tsx
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { Button } from '../ui'
import { pushDialog } from '../ui/dialogStack'

interface FullscreenOverlayProps {
  title: string
  subtitle?: string | null
  icon: ReactNode
  toolbar: ReactNode
  onDone: () => void
  children: ReactNode
}

/** The writing room: a fixed overlay with a big toolbar and a wide page. */
export default function FullscreenOverlay({ title, subtitle, icon, toolbar, onDone, children }: FullscreenOverlayProps) {
  // Escape leaves the writing room only while no dialog (Link, Image) is open on top of it.
  useEffect(() => {
    const pop = pushDialog(onDone)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      pop()
      document.body.style.overflow = prev
    }
  }, [onDone])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 bg-page flex flex-col animate-overlay-in">
      <div className="flex items-center gap-3 px-6 py-3 bg-panel border-b border-line-strong">
        <span className="w-[30px] h-[30px] rounded-tile bg-structure text-white flex items-center justify-center [&_svg]:w-[17px] [&_svg]:h-[17px]">
          {icon}
        </span>
        <span className="text-[16px] font-bold text-ink">{title}</span>
        {subtitle && <span className="text-[14px] text-ink-2">{subtitle}</span>}
        <div className="flex-1" />
        <Button variant="dark" icon={<Check aria-hidden />} onClick={onDone}>
          Done writing
        </Button>
      </div>
      {toolbar}
      <div className="flex-1 overflow-auto flex justify-center px-6 py-10">
        <div className="w-full max-w-[760px] min-h-[60vh] bg-panel border border-line-strong rounded-panel px-12 py-11 animate-card-in origin-top">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

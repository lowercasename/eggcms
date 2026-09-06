// src/admin/editors/LinkFieldEditor.tsx
import { useState } from 'react'
import { Link as LinkIcon, ExternalLink, FileText, X } from 'lucide-react'
import LinkModal from '../components/richtext/LinkModal'
import { Button } from '../components/ui'
import type { EditorProps } from './types'

interface LinkValue {
  type: 'internal' | 'external'
  ref?: string
  url?: string
  label?: string
}

export default function LinkFieldEditor({ value, onChange }: EditorProps) {
  const [showModal, setShowModal] = useState(false)
  const linkValue = value as LinkValue | null

  const displayText = linkValue ? (linkValue.type === 'internal' ? linkValue.label || linkValue.ref : linkValue.url) : null

  return (
    <div>
      {linkValue ? (
        <div className="control flex items-center gap-2.5 pl-3 pr-1.5 py-1.5">
          {linkValue.type === 'internal' ? (
            <FileText className="w-[17px] h-[17px] text-ink-2 shrink-0" aria-hidden />
          ) : (
            <ExternalLink className="w-[17px] h-[17px] text-ink-2 shrink-0" aria-hidden />
          )}
          <span className={`flex-1 min-w-0 truncate text-ink ${linkValue.type === 'external' ? 'font-mono text-[15px]' : 'text-[16px]'}`}>{displayText}</span>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            Edit
          </Button>
          <Button variant="icon" size="sm" aria-label="Remove link" onClick={() => onChange(null)}>
            <X aria-hidden />
          </Button>
        </div>
      ) : (
        <Button variant="secondary" icon={<LinkIcon aria-hidden />} onClick={() => setShowModal(true)}>
          Choose link...
        </Button>
      )}

      {showModal && (
        <LinkModal
          currentHref={linkValue?.type === 'external' ? linkValue.url : undefined}
          currentContentRef={linkValue?.type === 'internal' ? linkValue.ref : undefined}
          onSaveExternal={(url) => {
            onChange({ type: 'external', url })
            setShowModal(false)
          }}
          onSaveInternal={(ref, label) => {
            onChange({ type: 'internal', ref, label })
            setShowModal(false)
          }}
          onRemove={() => {
            onChange(null)
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// src/admin/editors/LinkFieldEditor.tsx
import { useState } from 'react'
import type { FieldDefinition } from '../types'
import LinkModal from '../components/richtext/LinkModal'
import { Link as LinkIcon, ExternalLink, FileText, X } from 'lucide-react'

interface LinkValue {
  type: 'internal' | 'external'
  ref?: string      // "schema:id" for internal
  url?: string      // URL for external
  label?: string    // Display label for internal
}

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function LinkFieldEditor({ field, value, onChange }: Props) {
  const [showModal, setShowModal] = useState(false)
  const linkValue = value as LinkValue | null

  const displayText = linkValue
    ? linkValue.type === 'internal'
      ? linkValue.label || linkValue.ref
      : linkValue.url
    : null

  return (
    <div>
      {linkValue ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-[#E8E8E3] rounded-lg bg-[#FAFAF8]">
          {linkValue.type === 'internal' ? (
            <FileText className="w-4 h-4 text-[#9C9C91] flex-shrink-0" />
          ) : (
            <ExternalLink className="w-4 h-4 text-[#9C9C91] flex-shrink-0" />
          )}
          <span className="text-sm text-[#1A1A18] truncate flex-1">{displayText}</span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs text-[#6B6B63] hover:text-[#1A1A18] transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 rounded text-[#9C9C91] hover:text-[#DC4E42] hover:bg-[#FEF2F1] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 w-full border border-dashed border-[#E8E8E3] rounded-lg text-sm text-[#6B6B63] hover:border-[#9C9C91] hover:text-[#1A1A18] transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          Choose link...
        </button>
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

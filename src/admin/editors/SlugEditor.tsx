// src/admin/editors/SlugEditor.tsx
import { useEffect } from 'react'
import { Button } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import { useEntry } from '../contexts/EntryContext'
import { slugify } from '../../lib/slugify'
import type { EditorProps } from './types'

/** The slug a field's `from` sources would produce right now, or '' if they are empty. */
function deriveSlug(from: string | string[] | undefined, formData: Record<string, unknown> | undefined): string {
  if (!from || !formData) return ''
  const sources = Array.isArray(from) ? from : [from]
  const parts = sources
    .map((f) => formData[f])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
  return parts.length > 0 ? slugify(parts.join(' ')) : ''
}

/**
 * A URL path shown in mono behind a leading slash. On a brand-new entry it
 * writes itself from its `from` field(s), usually the title, and cannot be
 * edited yet; afterwards it can be typed over or regenerated.
 */
export default function SlugEditor({ field, value, onChange, formData }: EditorProps) {
  const { id, required } = useFieldControl()
  const { isNew } = useEntry()
  const current = (value as string) || ''
  const derived = deriveSlug(field.from, formData)

  // While the entry is new, keep the stored slug in step with the title.
  useEffect(() => {
    if (isNew && derived && derived !== current) onChange(derived)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, derived])

  const helpId = `${id}-slug-help`

  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center gap-2.5">
        <div className={`control flex-1 flex items-center px-3 font-mono text-[16px] ${isNew ? 'bg-page' : ''}`}>
          <span className="text-ink-2 select-none" aria-hidden>
            /
          </span>
          <input
            id={id}
            type="text"
            value={current}
            readOnly={isNew}
            placeholder={isNew ? '…' : field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-required={required || undefined}
            aria-describedby={isNew ? helpId : undefined}
            className="flex-1 min-w-0 py-[11px] pl-0.5 font-mono text-[16px] bg-transparent outline-none focus-visible:outline-none text-ink read-only:text-ink-2 placeholder:text-ink-3 placeholder:italic"
          />
        </div>
        {!isNew && field.from && (
          <Button variant="secondary" onClick={() => derived && onChange(derived)}>
            Generate
          </Button>
        )}
      </div>
      {isNew && (
        <p id={helpId} className="m-0 text-[14px] text-ink-2">
          Made from the title. You can change it later.
        </p>
      )}
    </div>
  )
}

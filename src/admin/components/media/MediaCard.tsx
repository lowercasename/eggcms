// src/admin/components/media/MediaCard.tsx
import { Check } from 'lucide-react'
import { describeUsage, extensionOf, formatSize, iconForKind, type MediaItem } from '../../lib/media'

interface MediaCardProps {
  item: MediaItem
  /** manage: a checkbox for bulk actions; pick: the whole card chooses the file. */
  mode: 'manage' | 'pick'
  selected?: boolean
  onToggle?: (selected: boolean) => void
  onPick?: () => void
}

/**
 * One file in the library. The file name is the largest text, because that is
 * what people recognise files by; the type sits in a corner chip and an icon so
 * it survives a missing thumbnail; and every card says whether it is in use.
 */
export default function MediaCard({ item, mode, selected = false, onToggle, onPick }: MediaCardProps) {
  const Icon = iconForKind(item.kind)
  const usage = describeUsage(item.references)
  const isImage = item.kind === 'image'

  const thumb = (
    <div className="relative aspect-[4/3] bg-[repeating-linear-gradient(45deg,var(--color-line-hair),var(--color-line-hair)_6px,var(--color-page)_6px,var(--color-page)_12px)] flex items-center justify-center overflow-hidden">
      {isImage ? (
        <img src={item.path} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <Icon className="w-[34px] h-[34px] text-ink-2" aria-hidden />
      )}
      {mode === 'manage' && (
        <span
          aria-hidden
          className={`absolute top-2 left-2 w-6 h-6 rounded-[6px] flex items-center justify-center ${
            selected ? 'bg-selected' : 'bg-panel border-2 border-ink-3'
          }`}
        >
          {selected && <Check className="w-4 h-4 text-white" />}
        </span>
      )}
      <span className="absolute bottom-2 right-2 px-2 py-[3px] rounded-[6px] bg-panel border border-line-strong font-mono text-[12px] font-medium text-ink">
        {extensionOf(item)}
      </span>
    </div>
  )

  const body = (
    <div className="px-3 py-3 flex flex-col gap-[3px] text-left min-w-0">
      {mode === 'manage' ? (
        <a
          href={item.path}
          target="_blank"
          rel="noreferrer"
          title={item.filename}
          className="text-[15px] font-semibold text-ink truncate hover:underline"
        >
          {item.filename}
        </a>
      ) : (
        <span className="text-[15px] font-semibold text-ink truncate" title={item.filename}>
          {item.filename}
        </span>
      )}
      <span className="text-[14px] text-ink-2">{formatSize(item.size)}</span>
      <span className={`text-[14px] ${usage.used ? 'text-structure font-semibold' : 'text-ink-2'}`}>{usage.text}</span>
    </div>
  )

  const frame = selected ? 'border-[2.5px] border-selected' : 'border-[1.5px] border-line-strong'

  if (mode === 'pick') {
    return (
      <button
        type="button"
        data-testid="media-card"
        onClick={onPick}
        aria-pressed={selected}
        className={`bg-panel rounded-menu overflow-hidden text-left transition-colors hover:border-ink ${frame}`}
      >
        {thumb}
        {body}
      </button>
    )
  }

  return (
    <div data-testid="media-card" className={`relative bg-panel rounded-menu overflow-hidden ${frame}`}>
      <label className="block cursor-pointer">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggle?.(e.target.checked)}
          aria-label={`Select ${item.filename}`}
          className="sr-only peer"
        />
        <span className="block peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-action">{thumb}</span>
      </label>
      {body}
    </div>
  )
}

// src/admin/components/ui/SegmentedControl.tsx

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  /** Stretch each segment to share the width equally (entry list filter). */
  fullWidth?: boolean
  className?: string
}

/** A row of mutually exclusive filters; the selected one is filled ink. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
  className = '',
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={props['aria-label']}
      className={`inline-flex ${fullWidth ? 'flex w-full' : ''} border-[1.5px] border-line-strong rounded-control overflow-hidden bg-panel ${className}`}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={[
              'min-h-[38px] px-3.5 py-2 text-[14px] leading-tight whitespace-nowrap',
              'transition-colors duration-150 focus-visible:z-10 focus-visible:outline-offset-[-3px]',
              fullWidth ? 'flex-1 text-center px-1' : '',
              i > 0 ? 'border-l-[1.5px] border-line-strong' : '',
              selected ? 'bg-selected text-white font-bold' : 'text-ink-nav font-semibold hover:bg-page',
            ].join(' ')}
          >
            {opt.label}
            {opt.count !== undefined && (
              <>
                {' '}
                <span className={`ml-0.5 font-mono ${selected ? 'text-white/85' : 'text-ink-2'}`}>{opt.count}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

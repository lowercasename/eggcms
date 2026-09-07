// src/admin/components/ui/Toggle.tsx

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** The words shown beside the switch for off and on. */
  words?: [string, string]
  'aria-label'?: string
  id?: string
}

/** A 52×28 switch followed by the word for its state, so it never relies on colour. */
export default function Toggle({ checked, onChange, disabled, words = ['No', 'Yes'], id, ...props }: ToggleProps) {
  return (
    <div className="inline-flex items-center gap-[11px]">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={props['aria-label']}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-[52px] h-[28px] rounded-full border-2 transition-colors duration-150',
          'disabled:opacity-50',
          checked ? 'bg-action border-action' : 'bg-panel border-ink-3',
        ].join(' ')}
      >
        <span
          aria-hidden
          className={[
            'absolute top-[3px] w-[18px] h-[18px] rounded-full transition-[left,background-color] duration-150',
            checked ? 'left-[27px] bg-white' : 'left-[3px] bg-ink-3',
          ].join(' ')}
        />
      </button>
      <span className="text-[15px] font-semibold text-ink-nav" aria-hidden>
        {checked ? words[1] : words[0]}
      </span>
    </div>
  )
}

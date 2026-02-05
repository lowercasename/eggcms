// src/admin/components/ui/Toggle.tsx

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative w-11 h-6 rounded-full
        transition-colors duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E5644E]
        ${checked ? 'bg-[#E5644E]' : 'bg-[#E8E8E3]'}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
          transition-transform duration-200 ease-out
          ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
        `}
      />
    </button>
  )
}

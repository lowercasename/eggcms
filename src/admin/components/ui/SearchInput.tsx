// src/admin/components/ui/SearchInput.tsx
import { type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** A bordered search box with a leading icon and a clear button once typed in. */
export default function SearchInput({ value, onChange, placeholder, className = '', ...props }: SearchInputProps) {
  return (
    <div className={`control flex items-center gap-2 pl-3 pr-1.5 ${className}`}>
      <Search className="w-[17px] h-[17px] text-ink-2 shrink-0" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 py-[10px] text-[15px] bg-transparent outline-none placeholder:text-ink-2 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="w-[30px] h-[30px] shrink-0 rounded-[6px] flex items-center justify-center text-ink-nav hover:bg-page"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

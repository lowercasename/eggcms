// src/admin/components/ui/FileInput.tsx
import { type InputHTMLAttributes, useRef } from 'react'
import Button from './Button'
import { Upload } from 'lucide-react'

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Called with the first selected file. */
  onChange?: (file: File | null) => void
  /** Called with every selected file. Use with `multiple`. */
  onFiles?: (files: File[]) => void
  loading?: boolean
  label?: string
}

export default function FileInput({ onChange, onFiles, loading, label = 'Choose file', accept, disabled, ...props }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    onFiles?.(files)
    onChange?.(files[0] ?? null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled || loading}
        className="hidden"
        {...props}
      />
      <Button
        loading={loading}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-1.5" />
        {label}
      </Button>
    </div>
  )
}

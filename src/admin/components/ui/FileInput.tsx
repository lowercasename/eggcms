// src/admin/components/ui/FileInput.tsx
import { type InputHTMLAttributes, useRef } from 'react'
import Button from './Button'
import { Upload } from 'lucide-react'

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onChange: (file: File | null) => void
  loading?: boolean
  label?: string
}

export default function FileInput({ onChange, loading, label = 'Choose file', accept, disabled, ...props }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onChange(file)
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

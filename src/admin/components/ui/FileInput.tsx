// src/admin/components/ui/FileInput.tsx
import { type InputHTMLAttributes, useRef } from 'react'
import Button, { type ButtonVariant } from './Button'
import { Upload } from 'lucide-react'

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'id'> {
  /** Goes on the visible button, so a field label can point at it. */
  id?: string
  /** Called with the first selected file. */
  onChange?: (file: File | null) => void
  /** Called with every selected file. Use with `multiple`. */
  onFiles?: (files: File[]) => void
  loading?: boolean
  label?: string
  variant?: ButtonVariant
}

export default function FileInput({
  onChange,
  onFiles,
  loading,
  label = 'Choose files',
  variant = 'primary',
  accept,
  disabled,
  id,
  ...props
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    onFiles?.(files)
    onChange?.(files[0] ?? null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled || loading}
        aria-label={label}
        tabIndex={-1}
        className="hidden"
        {...props}
      />
      <Button id={id} variant={variant} loading={loading} disabled={disabled} icon={<Upload aria-hidden />} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
    </div>
  )
}

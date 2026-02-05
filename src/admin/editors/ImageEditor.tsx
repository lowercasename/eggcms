// src/admin/editors/ImageEditor.tsx
import { useState } from 'react'
import type { FieldDefinition } from '../types'
import { api } from '../lib/api'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function ImageEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await api.uploadMedia(file)
      onChange(result.data.path)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const imagePath = value as string

  return (
    <div className="space-y-2">
      {imagePath && (
        <div className="relative inline-block">
          <img
            src={imagePath}
            alt="Preview"
            className="max-w-xs max-h-48 rounded border"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  )
}

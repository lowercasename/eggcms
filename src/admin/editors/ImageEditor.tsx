// src/admin/editors/ImageEditor.tsx
import { useState } from 'react'
import type { FieldDefinition } from '../types'
import { api } from '../lib/api'
import { FileInput, Button } from '../components/ui'
import { X, Image } from 'lucide-react'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function ImageEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File | null) => {
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
    <div className="space-y-3">
      {imagePath ? (
        <div className="relative inline-block group">
          <img
            src={imagePath}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border border-[#E8E8E3] object-cover"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#DC4E42] text-white flex items-center justify-center shadow-sm hover:bg-[#c44339] transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs h-32 rounded-lg border-2 border-dashed border-[#E8E8E3] flex flex-col items-center justify-center bg-[#FAFAF8]">
          <Image className="w-8 h-8 text-[#9C9C91] mb-2" strokeWidth={1.5} />
          <p className="text-xs text-[#9C9C91]">No image selected</p>
        </div>
      )}

      <FileInput
        accept="image/*"
        onChange={handleUpload}
        loading={uploading}
        label={uploading ? 'Uploading...' : imagePath ? 'Replace image' : 'Choose image'}
      />
    </div>
  )
}

// src/admin/editors/ImageEditor.tsx
import { useState, useEffect } from 'react'
import type { FieldDefinition } from '../types'
import { api } from '../lib/api'
import { FileInput, Button } from '../components/ui'
import { X, Image, FolderOpen, Upload, Loader2 } from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  path: string
  mimetype: string
}

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function ImageEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

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

      <div className="flex gap-2">
        <FileInput
          accept="image/*"
          onChange={handleUpload}
          loading={uploading}
          label={uploading ? 'Uploading...' : 'Upload new'}
        />
        <Button variant="secondary" onClick={() => setShowPicker(true)}>
          <FolderOpen className="w-4 h-4 mr-1.5" />
          Choose from library
        </Button>
      </div>

      {showPicker && (
        <MediaPicker
          onSelect={(path) => {
            onChange(path)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (path: string) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMedia()
      .then((res) => {
        const images = (res.data as MediaItem[]).filter((item) =>
          item.mimetype.startsWith('image/')
        )
        setItems(images)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E3]">
          <h3 className="text-lg font-semibold text-[#1A1A18]">Select Image</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9C9C91] hover:bg-[#F5F5F3] hover:text-[#1A1A18] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#9C9C91]" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 mx-auto mb-3 text-[#9C9C91]" strokeWidth={1.5} />
              <p className="text-sm text-[#9C9C91]">No images in library</p>
              <p className="text-xs text-[#9C9C91] mt-1">Upload an image first</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.path)}
                  className="aspect-square rounded-lg border-2 border-transparent hover:border-[#E5644E] overflow-hidden bg-[#F5F5F3] transition-colors focus:outline-none focus:border-[#E5644E]"
                >
                  <img
                    src={item.path}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E8E3] bg-[#FAFAF8] rounded-b-xl">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

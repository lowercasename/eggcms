// src/admin/pages/Media.tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Heading, Alert, FileInput, Button, Card } from '../components/ui'
import { Loader2, Image, FileText, Copy, Trash2 } from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  path: string
  mimetype: string
  size: number
  created_at: string
}

export default function Media() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const fetchMedia = () => {
    setLoading(true)
    api.getMedia()
      .then((res) => setItems(res.data as MediaItem[]))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUpload = async (file: File | null) => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      await api.uploadMedia(file)
      fetchMedia()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await api.deleteMedia(id)
      fetchMedia()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-8 bg-[#FAFAF8] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Heading>Media Library</Heading>
          <p className="text-sm text-[#9C9C91] mt-1">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </p>
        </div>
        <FileInput
          accept="image/*"
          onChange={handleUpload}
          loading={uploading}
          label={uploading ? 'Uploading...' : 'Upload'}
        />
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-[#9C9C91]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 mb-4 rounded-full bg-[#F5F5F3] flex items-center justify-center">
            <Image className="w-8 h-8 text-[#9C9C91]" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-[#1A1A18]">No media files yet</p>
          <p className="text-xs text-[#9C9C91] mt-1">Upload your first image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group" hoverable>
              <div className="aspect-square bg-[#F5F5F3] flex items-center justify-center relative">
                {item.mimetype.startsWith('image/') ? (
                  <img
                    src={item.path}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-[#9C9C91]" strokeWidth={1.5} />
                    <span className="text-[10px] text-[#9C9C91] uppercase tracking-wide">{item.mimetype.split('/')[1]}</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(item.path)}
                    className="p-2 rounded-lg bg-white/90 text-[#1A1A18] hover:bg-white transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-white/90 text-[#DC4E42] hover:bg-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-[#1A1A18] truncate" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-xs text-[#9C9C91]">{formatSize(item.size)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

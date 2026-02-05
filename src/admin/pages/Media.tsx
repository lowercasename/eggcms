// src/admin/pages/Media.tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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
      e.target.value = '' // Reset input
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Media Library</h2>
        <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No media files yet. Upload your first image!</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden bg-white">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {item.mimetype.startsWith('image/') ? (
                  <img
                    src={item.path}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">{item.mimetype}</div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-xs text-gray-500">{formatSize(item.size)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(item.path)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

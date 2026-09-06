// src/admin/pages/Media.tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Heading, Alert, FileInput, Card } from '../components/ui'
import Dropzone from '../components/Dropzone'
import {
  Loader2,
  Image,
  FileText,
  Music,
  Video,
  File as FileIcon,
  Copy,
  Trash2,
} from 'lucide-react'

type MediaKind = 'image' | 'document' | 'audio' | 'video'

interface MediaItem {
  id: string
  filename: string
  path: string
  mimetype: string
  kind: MediaKind | null
  size: number
  created_at: string
}

const FILTERS: Array<{ value: 'all' | MediaKind; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
]

const KIND_ICONS = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
}

function iconFor(item: MediaItem) {
  return (item.kind && KIND_ICONS[item.kind]) || FileIcon
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function Media() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [failures, setFailures] = useState<Array<{ name: string; message: string }>>([])
  const [filter, setFilter] = useState<'all' | MediaKind>('all')

  const fetchMedia = () => {
    setLoading(true)
    api
      .getMedia()
      .then((res) => setItems(res.data as MediaItem[]))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  // Uploads run one at a time so dropping a folder of PDFs doesn't open fifty
  // parallel requests, and so one rejected file doesn't take the rest with it.
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    setError('')
    setFailures([])
    setProgress({ done: 0, total: files.length })

    const failed: Array<{ name: string; message: string }> = []

    for (const [index, file] of files.entries()) {
      try {
        await api.uploadMedia(file)
      } catch (err) {
        failed.push({
          name: file.name,
          message: err instanceof Error ? err.message : 'Upload failed',
        })
      }
      setProgress({ done: index + 1, total: files.length })
    }

    setFailures(failed)
    setUploading(false)
    setProgress(null)
    fetchMedia()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return

    try {
      await api.deleteMedia(id)
      fetchMedia()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const visible = filter === 'all' ? items : items.filter((item) => item.kind === filter)

  return (
    <Dropzone
      onFiles={uploadFiles}
      disabled={uploading}
      label="Drop files to add them to the library"
      className="p-8 bg-[#FAFAF8] min-h-screen"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading>Media Library</Heading>
          <p className="text-sm text-[#9C9C91] mt-1">
            {items.length} {items.length === 1 ? 'file' : 'files'}
            {filter !== 'all' && ` · showing ${visible.length}`}
          </p>
        </div>
        <FileInput
          multiple
          onFiles={uploadFiles}
          loading={uploading}
          label={
            uploading
              ? progress
                ? `Uploading ${progress.done}/${progress.total}...`
                : 'Uploading...'
              : 'Upload'
          }
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6">
        {FILTERS.map(({ value, label }) => {
          const count =
            value === 'all' ? items.length : items.filter((i) => i.kind === value).length
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === value
                  ? 'bg-[#1A1A18] text-white'
                  : 'text-[#6B6B63] hover:bg-[#F5F5F3] hover:text-[#1A1A18]'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {failures.length > 0 && (
        <Alert variant="error" className="mb-6">
          <p className="font-medium">
            {failures.length} {failures.length === 1 ? 'file was' : 'files were'} not uploaded:
          </p>
          <ul className="mt-1 space-y-0.5">
            {failures.map((f) => (
              <li key={f.name} className="text-sm">
                <span className="font-medium">{f.name}</span> {f.message}
              </li>
            ))}
          </ul>
        </Alert>
      )}

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
          <p className="text-xs text-[#9C9C91] mt-1">
            Drag images, PDFs or audio here, or use the Upload button
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm font-medium text-[#1A1A18]">Nothing of that kind yet</p>
          <p className="text-xs text-[#9C9C91] mt-1">Drag files here to add some</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visible.map((item) => {
            const Icon = iconFor(item)
            const isImage = item.kind === 'image'

            return (
              <Card key={item.id} className="overflow-hidden group" hoverable>
                <div className="aspect-square bg-[#F5F5F3] flex items-center justify-center relative">
                  {isImage ? (
                    <img
                      src={item.path}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="w-8 h-8 text-[#9C9C91]" strokeWidth={1.5} />
                      <span className="text-[10px] text-[#9C9C91] uppercase tracking-wide">
                        {item.filename.includes('.')
                          ? item.filename.split('.').pop()
                          : item.mimetype.split('/')[1]}
                      </span>
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
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-[#1A1A18] truncate block hover:text-[#E5644E] transition-colors"
                    title={item.filename}
                  >
                    {item.filename}
                  </a>
                  <p className="text-xs text-[#9C9C91]">{formatSize(item.size)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Dropzone>
  )
}

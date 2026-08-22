// src/admin/editors/FileEditor.tsx
import { useState, useEffect } from 'react'
import type { FieldDefinition } from '../types'
import { api } from '../lib/api'
import Dropzone from '../components/Dropzone'
import Modal, { ModalBody, ModalFooter } from '../components/Modal'
import { Button } from '../components/ui'
import { X, FileText, FolderOpen, Upload, Loader2 } from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  path: string
  mimetype: string
  kind: string | null
  size: number
}

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

/** Kinds this field will accept. Defaults to documents (PDFs and the like). */
function acceptedKinds(field: FieldDefinition): string[] {
  return field.kinds && field.kinds.length > 0 ? field.kinds : ['document']
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileEditor({ field, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [entry, setEntry] = useState<MediaItem | null>(null)

  const filePath = (value as string) || ''

  // The name on disk is a UUID, so look up what the file was called when it
  // was uploaded. Falls back to the path if it isn't in the library.
  useEffect(() => {
    if (!filePath) {
      setEntry(null)
      return
    }
    let cancelled = false
    api
      .getMedia()
      .then((res) => {
        if (cancelled) return
        const match = (res.data as MediaItem[]).find((m) => m.path === filePath)
        setEntry(match ?? null)
      })
      .catch(() => {
        if (!cancelled) setEntry(null)
      })
    return () => {
      cancelled = true
    }
  }, [filePath])

  const upload = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const result = await api.uploadMedia(file)
      onChange(result.data.path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const filename = entry?.filename || (filePath ? filePath.split('/').pop() || '' : '')

  return (
    <>
      <Dropzone
        onFiles={upload}
        disabled={uploading}
        label="Drop a file to attach it"
        className="rounded-lg"
      >
        <div className="flex items-center gap-4 p-3 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8]">
          {/* Preview */}
          {filePath ? (
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-md border border-[#E8E8E3] bg-white flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#6B6B63]" strokeWidth={1.5} />
              </div>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => onChange(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#DC4E42] text-white flex items-center justify-center shadow-sm hover:bg-[#c44339] transition-colors"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 flex-shrink-0 rounded-md border border-dashed border-[#D4D4CF] flex items-center justify-center bg-white">
              <FileText className="w-6 h-6 text-[#9C9C91]" strokeWidth={1.5} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-1.5 min-w-0">
            {filePath ? (
              <a
                data-testid="file-filename"
                href={filePath}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[#1A1A18] truncate hover:text-[#E5644E] transition-colors"
                title={filename}
              >
                {filename}
                {entry && (
                  <span className="ml-2 text-xs text-[#9C9C91]">{formatSize(entry.size)}</span>
                )}
              </a>
            ) : (
              <p className="text-sm text-[#9C9C91]">No file attached. Drop one here.</p>
            )}

            <label className="inline-flex items-center gap-1.5 text-sm text-[#6B6B63] hover:text-[#1A1A18] transition-colors cursor-pointer">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload new'}
              <input
                type="file"
                onChange={(e) => upload(Array.from(e.target.files ?? []))}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-1.5 text-sm text-[#6B6B63] hover:text-[#1A1A18] transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Choose from library
            </button>
          </div>
        </div>
      </Dropzone>

      {error && <p className="mt-2 text-sm text-[#DC4E42]">{error}</p>}

      {showPicker && (
        <FilePicker
          kinds={acceptedKinds(field)}
          onSelect={(path) => {
            onChange(path)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

function FilePicker({
  kinds,
  onSelect,
  onClose,
}: {
  kinds: string[]
  onSelect: (path: string) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getMedia()
      .then((res) => {
        setItems((res.data as MediaItem[]).filter((item) => kinds.includes(item.kind ?? '')))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    // kinds comes from the schema and doesn't change while the picker is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Modal title="Select File" onClose={onClose}>
      <ModalBody>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#9C9C91]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#9C9C91]" strokeWidth={1.5} />
            <p className="text-sm text-[#9C9C91]">No files in the library yet</p>
            <p className="text-xs text-[#9C9C91] mt-1">Upload one from the Media page first</p>
          </div>
        ) : (
          <div className="border border-[#E8E8E3] rounded-lg divide-y divide-[#E8E8E3] max-h-80 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F5F5F3] transition-colors"
              >
                <FileText className="w-4 h-4 flex-shrink-0 text-[#9C9C91]" />
                <span className="text-sm text-[#1A1A18] truncate flex-1">{item.filename}</span>
                <span className="text-xs text-[#9C9C91]">{formatSize(item.size)}</span>
              </button>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

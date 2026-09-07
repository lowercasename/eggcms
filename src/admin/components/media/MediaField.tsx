// src/admin/components/media/MediaField.tsx
import { useEffect, useState, type ReactNode } from 'react'
import { FolderOpen, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { errorMessage } from '../../lib/errors'
import { formatSize, iconForKind, rejectWrongKinds, type MediaItem, type MediaKind } from '../../lib/media'
import Dropzone from '../Dropzone'
import MediaPickerDialog from './MediaPickerDialog'
import { Button, FileInput } from '../ui'
import { useFieldControl } from '../ui/FieldContext'

interface MediaFieldProps {
  /** The stored upload path, or nothing. */
  value: string | null
  onChange: (path: string | null) => void
  /** Which kinds of file this field takes. */
  kinds: MediaKind[]
  /** What to call the thing in buttons and prompts: "image", "file". */
  noun: string
  /** Render the preview for an attached path. */
  preview: (path: string, entry: MediaItem | null) => ReactNode
  /** Preview when nothing is attached. */
  placeholder: ReactNode
  filenameTestId?: string
}

/**
 * The shared body of the image and file editors: a drop target with a preview,
 * the file's name and size, and the three things you can do with it.
 */
export default function MediaField({ value, onChange, kinds, noun, preview, placeholder, filenameTestId }: MediaFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [entry, setEntry] = useState<MediaItem | null>(null)
  const { id } = useFieldControl()

  const path = value || ''

  // The name shown is the library's original file name, not the path.
  useEffect(() => {
    if (!path) {
      setEntry(null)
      return
    }
    let cancelled = false
    api
      .findMedia(path)
      .then((found) => {
        if (!cancelled) setEntry(found)
      })
      .catch((err) => {
        if (!cancelled) {
          setEntry(null)
          console.warn(`[media] Could not look up ${path}:`, err)
        }
      })
    return () => {
      cancelled = true
    }
  }, [path])

  const upload = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const { refused } = rejectWrongKinds([file], kinds)
    if (refused.length > 0) {
      setError(`${refused[0].name}: ${refused[0].message}`)
      return
    }
    setUploading(true)
    setError('')
    try {
      const result = await api.uploadMedia(file)
      onChange(result.data.path)
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const filename = entry?.filename || (path ? path.split('/').pop() || '' : '')
  const accept = kinds.length === 1 && kinds[0] === 'image' ? 'image/*' : undefined

  return (
    <>
      <Dropzone onFiles={upload} disabled={uploading} label={`Drop ${noun === 'image' ? 'an image' : 'a file'} to attach it`} className="rounded-block">
        <div className="flex items-center gap-4 p-3.5 rounded-block border-[1.5px] border-line-strong bg-stripe">
          <div className="shrink-0">{path ? preview(path, entry) : placeholder}</div>

          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {path ? (
              <a
                data-testid={filenameTestId}
                href={path}
                target="_blank"
                rel="noreferrer"
                title={filename}
                className="text-[15px] font-semibold text-ink truncate hover:underline"
              >
                {filename}
                {entry && <span className="ml-2 text-[14px] font-normal text-ink-2">{formatSize(entry.size)}</span>}
              </a>
            ) : (
              <p className="m-0 text-[15px] text-ink-2">No {noun} attached. Drop one here, or:</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <FileInput id={id} variant="secondary" accept={accept} onFiles={upload} loading={uploading} label={uploading ? 'Uploading…' : 'Upload new'} />
              <Button variant="secondary" icon={<FolderOpen aria-hidden />} onClick={() => setShowPicker(true)}>
                Choose from library
              </Button>
              {path && (
                <Button variant="destructive" icon={<Trash2 aria-hidden />} onClick={() => onChange(null)} aria-label={`Remove ${noun}`}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dropzone>

      {error && (
        <p role="alert" className="mt-2 mb-0 text-[14px] text-danger-text">
          {error}
        </p>
      )}

      {showPicker && (
        <MediaPickerDialog
          title={`Choose ${noun === 'image' ? 'an image' : 'a file'}`}
          kinds={kinds}
          onSelect={(p) => {
            onChange(p)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

/** A 64px tile with the kind's icon, for files without a thumbnail. */
export function KindTile({ kind, dashed }: { kind: MediaKind | null; dashed?: boolean }) {
  const Icon = iconForKind(kind)
  return (
    <div
      className={`w-16 h-16 rounded-control flex items-center justify-center bg-panel ${
        dashed ? 'border-[1.5px] border-dashed border-line-input' : 'border-[1.5px] border-line-strong'
      }`}
    >
      <Icon className="w-6 h-6 text-ink-2" aria-hidden />
    </div>
  )
}

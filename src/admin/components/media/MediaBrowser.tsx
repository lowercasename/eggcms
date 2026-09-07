// src/admin/components/media/MediaBrowser.tsx
import { useEffect, useMemo, useState } from 'react'
import { Upload, SearchX, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { errorMessage } from '../../lib/errors'
import { KIND_LABELS, KIND_ORDER, describeKinds, rejectWrongKinds, sortMedia, type MediaItem, type MediaKind, type MediaSort } from '../../lib/media'
import Dropzone from '../Dropzone'
import MediaCard from './MediaCard'
import { Button, EmptyState, FileInput, NoticeBar, SearchInput, SegmentedControl, Select } from '../ui'

interface MediaBrowserProps {
  /** manage: the Media page (multi-select, delete); pick: choose one file for a field. */
  mode: 'manage' | 'pick'
  /** Restrict to these kinds. Omit for everything. */
  kinds?: MediaKind[]
  onPick?: (path: string) => void
  /** Show the page header ("Media · 224 files · Upload files"). */
  header?: boolean
  className?: string
}

type Filter = 'all' | MediaKind

const SORT_OPTIONS: Array<{ value: MediaSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
]

/** Where the one selected file is used: "It is used on 2 pages." */
function describeOneFile(references: number): string {
  if (references === 0) return 'It is not used yet.'
  if (references === 1) return 'It is used on a page.'
  return `It is used on ${references} pages.`
}

/**
 * What the selection bar says, in two parts: the count in bold ("2 files
 * selected.") and what that means for the website ("One of them is used on a
 * page.").
 */
function describeSelection(selected: MediaItem[]): { count: string; usage: string } {
  if (selected.length === 1) {
    return { count: '1 file selected.', usage: describeOneFile(selected[0].references?.length ?? 0) }
  }
  const count = `${selected.length} files selected.`
  const used = selected.filter((i) => (i.references?.length ?? 0) > 0).length
  if (used === 0) return { count, usage: 'None of them is used on a page.' }
  if (used === 1) return { count, usage: 'One of them is used on a page.' }
  return { count, usage: `${used} of them are used on pages.` }
}

/**
 * The media library: search, type filter, sort, a grid of MediaCards, drop-
 * anywhere upload, and either multi-select + delete (manage) or single pick.
 * The picker a field opens is this same view in a dialog.
 */
export default function MediaBrowser({ mode, kinds, onPick, header, className = '' }: MediaBrowserProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failures, setFailures] = useState<{ op: 'upload' | 'delete'; items: Array<{ name: string; message: string }> }>({ op: 'upload', items: [] })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<MediaSort>('newest')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const allowedKinds = kinds && kinds.length > 0 ? kinds : KIND_ORDER
  const restricted = !!kinds && kinds.length > 0

  const fetchMedia = () => {
    setLoading(true)
    setError('')
    api
      .getMedia()
      // A picker shows only the kinds its field takes; the library shows
      // everything, including files whose type was not recognised, so they can
      // still be found and deleted.
      .then((res) => setItems((res.data as MediaItem[]).filter((i) => !restricted || (i.kind !== null && allowedKinds.includes(i.kind)))))
      .catch((err) => setError(errorMessage(err, 'Could not load the library')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMedia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A selection only means anything while the same files are on screen, and a
  // pending "Yes, delete" only while the selection it was asked about stands.
  useEffect(() => {
    setSelected(new Set())
  }, [query, filter])
  useEffect(() => {
    setConfirmingDelete(false)
  }, [selected])

  // Uploads run one at a time so dropping a folder of PDFs doesn't open fifty
  // parallel requests, and so one rejected file doesn't take the rest with it.
  const uploadFiles = async (dropped: File[]) => {
    if (dropped.length === 0) return
    const { accepted: files, refused } = restricted ? rejectWrongKinds(dropped, allowedKinds) : { accepted: dropped, refused: [] }
    setError('')
    setFailures({ op: 'upload', items: refused })
    if (files.length === 0) return
    setUploading(true)
    setProgress({ done: 0, total: files.length })
    const failed: Array<{ name: string; message: string }> = [...refused]
    let lastPath: string | null = null
    for (const [index, file] of files.entries()) {
      try {
        const result = await api.uploadMedia(file)
        lastPath = result.data.path
      } catch (err) {
        failed.push({ name: file.name, message: errorMessage(err, 'Upload failed') })
      }
      setProgress({ done: index + 1, total: files.length })
    }
    setFailures({ op: 'upload', items: failed })
    setUploading(false)
    setProgress(null)
    if (mode === 'pick' && lastPath && files.length === 1) {
      onPick?.(lastPath)
      return
    }
    fetchMedia()
  }

  const deleteSelected = async () => {
    setDeleting(true)
    setError('')
    const failed: Array<{ name: string; message: string }> = []
    for (const item of items.filter((i) => selected.has(i.id))) {
      try {
        await api.deleteMedia(item.id)
      } catch (err) {
        failed.push({ name: item.filename, message: errorMessage(err, 'Delete failed') })
      }
    }
    setFailures({ op: 'delete', items: failed })
    setSelected(new Set())
    setConfirmingDelete(false)
    setDeleting(false)
    fetchMedia()
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, image: 0, document: 0, audio: 0, video: 0 }
    for (const i of items) if (i.kind) c[i.kind] += 1
    return c
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = items.filter((i) => (filter === 'all' || i.kind === filter) && (!q || i.filename.toLowerCase().includes(q)))
    return sortMedia(list, sort)
  }, [items, filter, query, sort])

  const selectedItems = items.filter((i) => selected.has(i.id))
  const selection = describeSelection(selectedItems)
  const showFilter = allowedKinds.length > 1

  const filterOptions = [
    { value: 'all' as Filter, label: 'All', count: counts.all },
    ...allowedKinds.map((k) => ({ value: k as Filter, label: KIND_LABELS[k], count: counts[k] })),
  ]

  const uploadLabel = uploading ? (progress ? `Uploading ${progress.done}/${progress.total}…` : 'Uploading…') : 'Upload files'

  return (
    <Dropzone onFiles={uploadFiles} disabled={uploading} label="Drop files to add them to the library" className={`flex flex-col min-h-0 ${className}`}>
      {header && (
        <div className="flex items-center gap-3.5 px-6 py-3.5 bg-panel border-b border-line-strong">
          <h1 className="m-0 text-[19px] font-bold text-ink">Media</h1>
          <span className="text-[15px] text-ink-2">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </span>
          <div className="flex-1" />
          <FileInput multiple onFiles={uploadFiles} loading={uploading} label={uploadLabel} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-panel border-b border-line-strong">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by file name" className="w-[280px]" />
        {showFilter && <SegmentedControl aria-label="Type" options={filterOptions} value={filter} onChange={setFilter} />}
        <div className="flex-1" />
        <div className="w-[190px]">
          <Select aria-label="Sort" options={SORT_OPTIONS} value={sort} onChange={(e) => setSort(e.target.value as MediaSort)} className="!py-[9px] !text-[15px] font-semibold" />
        </div>
        {!header && <FileInput multiple={mode === 'manage'} onFiles={uploadFiles} loading={uploading} label={uploadLabel} variant="secondary" />}
      </div>

      {selectedItems.length > 0 && (
        <NoticeBar
          variant="selection"
          actions={
            confirmingDelete ? (
              <>
                <span className="text-[14px]">Delete for good?</span>
                <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                  Keep {selectedItems.length === 1 ? 'it' : 'them'}
                </Button>
                <Button variant="destructive-solid" size="sm" loading={deleting} onClick={deleteSelected}>
                  Yes, delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" className="!border-draft-2 !text-draft" onClick={() => setSelected(new Set())}>
                  Clear selection
                </Button>
                <Button variant="destructive" icon={<Trash2 aria-hidden />} onClick={() => setConfirmingDelete(true)}>
                  Delete {selectedItems.length} {selectedItems.length === 1 ? 'file' : 'files'}
                </Button>
              </>
            )
          }
        >
          <b>{selection.count}</b> {selection.usage}
        </NoticeBar>
      )}

      {error && <NoticeBar variant="error">Could not load the library: {error}</NoticeBar>}
      {failures.items.length > 0 && (
        <NoticeBar variant="error">
          <b>
            {failures.items.length} {failures.items.length === 1 ? 'file was' : 'files were'} not {failures.op === 'delete' ? 'deleted' : 'added'}:
          </b>{' '}
          {failures.items.map((f, i) => (
            <span key={f.name}>
              {i > 0 && ' · '}
              <span className="font-semibold">{f.name}</span> — {f.message}
            </span>
          ))}
        </NoticeBar>
      )}

      <div className="flex-1 overflow-auto px-6 py-5">
        {loading ? (
          <p className="text-[15px] text-ink-2">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState
            dashed="strong"
            icon={<Upload />}
            title="No files yet"
            description={restricted ? `Drag files here, or choose them from your computer. This field takes ${describeKinds(allowedKinds)}.` : 'Drag images, PDFs, audio or video here, or choose them from your computer.'}
            action={<FileInput multiple onFiles={uploadFiles} loading={uploading} label="Choose files" />}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title={query ? `No files match “${query.trim()}”` : `No ${filter === 'all' ? 'files' : KIND_LABELS[filter as MediaKind].toLowerCase()} yet`}
            description={query ? `Try fewer words, or clear the search to see all ${items.length} files.` : 'Drag files here to add some.'}
            action={
              query ? (
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-[18px]">
            {visible.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                mode={mode}
                selected={selected.has(item.id)}
                onToggle={(on) =>
                  setSelected((prev) => {
                    const next = new Set(prev)
                    if (on) next.add(item.id)
                    else next.delete(item.id)
                    return next
                  })
                }
                onPick={() => onPick?.(item.path)}
              />
            ))}
          </div>
        )}
      </div>
    </Dropzone>
  )
}

// src/admin/pages/ItemEdit.tsx
import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useLocation } from 'wouter'
import { Trash2, EyeOff } from 'lucide-react'
import { api } from '../lib/api'
import type { Schema } from '../types'
import { useDirtyState } from '../hooks/useDirtyState'
import { useJustSaved } from '../hooks/useJustSaved'
import { useDirtyStateContext } from '../contexts/DirtyStateContext'
import { EntryProvider } from '../contexts/EntryContext'
import { fieldsOf } from '../lib/entries'
import { errorMessage } from '../lib/errors'
import { entryNoun, unsavedChanges } from '../lib/words'
import { getItemLabel } from '../components/ItemList'
import { resolveLabelField } from './Collection'
import EntryHeader from '../components/EntryHeader'
import FieldList from '../components/FieldList'
import { Button, NoticeBar } from '../components/ui'

interface ItemEditProps {
  schema: Schema
  itemId: string
  refreshList: () => void
}

/**
 * Editing one entry of a collection. The header names it and shows its
 * status; a notice bar under the header says whether it is saved, live, or
 * neither, and carries the one or two things to do about that.
 */
export default function ItemEdit({ schema, itemId, refreshList }: ItemEditProps) {
  const [, navigate] = useLocation()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [justSaved, showJustSaved] = useJustSaved()

  const isNew = itemId === 'new'
  const noun = entryNoun(schema.label)
  const labelField = resolveLabelField(schema)
  const titleField = Array.isArray(labelField) ? labelField[0] : labelField

  // Only user-editable fields count for dirty state (exclude server metadata)
  const editableData = useMemo(() => fieldsOf(data), [data])
  const { isDirty, markClean, savedData, changedCount } = useDirtyState(editableData, loading, itemId)
  const { setDirty, setItemDirty } = useDirtyStateContext()

  useEffect(() => {
    setDirty(isDirty)
    return () => setDirty(false)
  }, [isDirty, setDirty])

  useEffect(() => {
    if (!isNew) {
      setItemDirty(itemId, isDirty)
      return () => setItemDirty(itemId, false)
    }
  }, [isDirty, itemId, isNew, setItemDirty])

  const isDraft = isNew ? true : !!(data._meta as { draft?: boolean } | undefined)?.draft

  const [loadAttempt, setLoadAttempt] = useState(0)
  useEffect(() => {
    if (isNew) {
      const defaults: Record<string, unknown> = {}
      for (const field of schema.fields) {
        if (field.default !== undefined) defaults[field.name] = field.default
      }
      setData(defaults)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')
    api
      .getItem(schema.name, itemId)
      .then((res) => setData(res.data as Record<string, unknown>))
      .catch((err) => setLoadError(errorMessage(err, 'Request failed')))
      .finally(() => setLoading(false))
  }, [itemId, schema.name, schema.fields, isNew, loadAttempt])

  const save = async (asDraft: boolean, source: Record<string, unknown> = data) => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...fieldsOf(source), draft: asDraft ? 1 : 0 }
      if (isNew) {
        const result = await api.createItem(schema.name, payload)
        const created = result.data as { id: string }
        markClean()
        refreshList()
        navigate(`/collections/${schema.name}/${created.id}`, { replace: true })
      } else {
        const result = await api.updateItem(schema.name, itemId, payload)
        const saved = result.data as Record<string, unknown>
        if (source === data) {
          setData(saved)
        } else {
          // Unpublishing writes the saved content, so unsaved edits stay unsaved.
          setData((current) => ({ ...current, _meta: saved._meta }))
        }
        markClean(fieldsOf(saved))
        refreshList()
        showJustSaved(asDraft ? 'Draft saved just now.' : 'Published just now.')
      }
    } catch (err) {
      setError(errorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  // The last saved fields under the metadata the entry has now: what Discard
  // goes back to, and what taking it off the website re-saves as a draft.
  const lastSaved = savedData ? { ...savedData, _meta: data._meta } : data

  const discard = () => {
    setData(lastSaved)
    setConfirmingDiscard(false)
  }

  const remove = async () => {
    try {
      await api.deleteItem(schema.name, itemId)
      markClean()
      refreshList()
      navigate(`/collections/${schema.name}`)
    } catch (err) {
      setError(errorMessage(err, 'Delete failed'))
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-[15px] text-ink-2">Loading…</div>
  }

  // Never show an empty form for a record that failed to load: saving it would wipe the real one.
  if (loadError) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <NoticeBar variant="error" actions={<Button variant="secondary" onClick={() => setLoadAttempt((n) => n + 1)}>Try again</Button>}>
          <b>This {noun} could not be loaded.</b> {loadError}
        </NoticeBar>
      </div>
    )
  }

  const title = getItemLabel(data as { id: string }, labelField)
  const hasTitle = title.trim().length > 0
  const status = isDirty ? 'edited' : isDraft ? 'draft' : 'published'
  const changes = unsavedChanges(changedCount)

  const menu = isNew
    ? []
    : [
        ...(!isDraft ? [{ label: 'Take off the website', icon: <EyeOff aria-hidden />, onSelect: () => save(true, lastSaved) }] : []),
        { label: `Delete ${noun}`, icon: <Trash2 aria-hidden />, destructive: true, onSelect: () => setConfirmingDelete(true) },
      ]

  /** Both bars for an entry that is not on the website yet; only the sentence differs. */
  function notPublishedBar(message: string): ReactNode {
    return (
      <NoticeBar
        variant="info"
        sticky
        actions={
          <>
            <Button variant="secondary" onClick={() => save(true)} loading={saving}>
              Save draft
            </Button>
            <Button onClick={() => save(false)} disabled={!hasTitle || saving}>
              Publish
            </Button>
          </>
        }
      >
        {message}
      </NoticeBar>
    )
  }

  /** The one bar under the header: whatever the entry most needs said about it. */
  function statusBar(): ReactNode {
    if (confirmingDelete) {
      return (
        <NoticeBar
          variant="error"
          sticky
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
              <Button variant="destructive-solid" onClick={remove}>
                Yes, delete
              </Button>
            </>
          }
        >
          {`Delete “${hasTitle ? title : `Untitled ${noun}`}”? This cannot be undone.`}
        </NoticeBar>
      )
    }
    if (justSaved && !isDirty) {
      return (
        <NoticeBar variant="published" sticky>
          <b>{justSaved}</b>
        </NoticeBar>
      )
    }
    if (isNew) {
      return notPublishedBar('Not on the website yet — give it a title, then publish.')
    }
    if (isDirty && confirmingDiscard) {
      return (
        <NoticeBar
          variant="unsaved"
          sticky
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmingDiscard(false)}>
                Keep editing
              </Button>
              <Button variant="destructive-solid" onClick={discard}>
                Yes, discard
              </Button>
            </>
          }
        >
          <b>Throw away {changes}?</b> The {noun} goes back to how it was last saved.
        </NoticeBar>
      )
    }
    if (isDirty) {
      return (
        <NoticeBar
          variant="unsaved"
          sticky
          animate
          actions={
            <>
              <Button variant="secondary" className="!border-draft-2 !text-draft" onClick={() => setConfirmingDiscard(true)}>
                Discard
              </Button>
              {isDraft && (
                <Button variant="secondary" onClick={() => save(true)} loading={saving}>
                  Save draft
                </Button>
              )}
              <Button onClick={() => save(false)} loading={saving} disabled={!hasTitle}>
                {isDraft ? 'Publish' : 'Publish changes'}
              </Button>
            </>
          }
        >
          <b>{changes}.</b> {isDraft ? `The website doesn't show this ${noun} yet.` : 'The website still shows the last published version.'}
        </NoticeBar>
      )
    }
    if (isDraft) {
      return notPublishedBar('Not on the website yet — publish when it is ready.')
    }
    return null
  }

  return (
    <EntryProvider value={{ isNew }}>
      <div className="flex-1 min-h-0 flex flex-col">
        <EntryHeader title={hasTitle ? title : `Untitled ${noun}`} untitled={!hasTitle} status={status} menu={menu} />

        <div className="flex-1 min-h-0 overflow-y-auto">
          {statusBar()}

          {error && <NoticeBar variant="error">{error}</NoticeBar>}

          <div className="flex justify-center px-7 py-6">
            <div className="w-full max-w-[780px]">
              <FieldList
                fields={schema.fields}
                data={data}
                onChange={(next) => setData(next)}
                highlight={isNew ? { field: titleField, hint: 'Start here — this is the name shown across the website.' } : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </EntryProvider>
  )
}

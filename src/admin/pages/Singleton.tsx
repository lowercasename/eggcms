// src/admin/pages/Singleton.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useSchemas } from '../App'
import { useDirtyState } from '../hooks/useDirtyState'
import { useJustSaved } from '../hooks/useJustSaved'
import { useDirtyStateContext } from '../contexts/DirtyStateContext'
import EntryHeader from '../components/EntryHeader'
import FieldList from '../components/FieldList'
import { Button, EmptyState, NoticeBar } from '../components/ui'

/** A one-off record such as Site Settings: the same editor, without drafts. */
export default function Singleton() {
  const params = useParams<{ schema: string }>()
  const { schemas } = useSchemas()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, showJustSaved] = useJustSaved()
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  const schema = schemas.find((s) => s.name === params.schema && s.type === 'singleton')

  const { isDirty, markClean, savedData, changedCount } = useDirtyState(data, loading, schema?.name)
  const { setDirty } = useDirtyStateContext()

  useEffect(() => {
    setDirty(isDirty)
    return () => setDirty(false)
  }, [isDirty, setDirty])

  useEffect(() => {
    if (!schema) return
    setLoading(true)
    api
      .getSingleton(schema.name)
      .then((res) => {
        const { _meta, ...fields } = (res.data as Record<string, unknown>) || {}
        setData(fields)
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [schema?.name])

  const save = async () => {
    if (!schema) return
    setSaving(true)
    setError('')
    try {
      await api.updateSingleton(schema.name, data)
      markClean()
      showJustSaved('Saved just now.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<AlertCircle />} title="These settings do not exist" description="Choose something from the list on the left." />
      </div>
    )
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-[15px] text-ink-2">Loading…</div>
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <EntryHeader title={schema.label} status={isDirty ? 'edited' : null} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {justSaved ? (
          <NoticeBar variant="published" sticky>
            <b>{justSaved}</b>
          </NoticeBar>
        ) : isDirty && confirmingDiscard ? (
          <NoticeBar
            variant="unsaved"
            sticky
            actions={
              <>
                <Button variant="secondary" onClick={() => setConfirmingDiscard(false)}>
                  Keep editing
                </Button>
                <Button
                  variant="destructive-solid"
                  onClick={() => {
                    if (savedData) setData(savedData)
                    setConfirmingDiscard(false)
                  }}
                >
                  Yes, discard
                </Button>
              </>
            }
          >
            <b>
              Throw away {changedCount} unsaved change{changedCount === 1 ? '' : 's'}?
            </b>{' '}
            Everything goes back to how it was last saved.
          </NoticeBar>
        ) : isDirty ? (
          <NoticeBar
            variant="unsaved"
            sticky
            animate
            actions={
              <>
                <Button variant="secondary" className="!border-draft-2 !text-draft" onClick={() => setConfirmingDiscard(true)}>
                  Discard
                </Button>
                <Button onClick={save} loading={saving}>
                  Save changes
                </Button>
              </>
            }
          >
            <b>
              {changedCount} unsaved change{changedCount === 1 ? '' : 's'}.
            </b>{' '}
            The website still shows the last saved version.
          </NoticeBar>
        ) : null}

        {error && <NoticeBar variant="error">{error}</NoticeBar>}

        <div className="flex justify-center px-7 py-6">
          <div className="w-full max-w-[780px]">
            <FieldList fields={schema.fields} data={data} onChange={setData} />
          </div>
        </div>
      </div>
    </div>
  )
}

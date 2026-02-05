// src/admin/pages/Collection.tsx
import { useState, useEffect } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import { api } from '../lib/api'
import ItemList from '../components/ItemList'
import type { Schema } from '../types'

interface CollectionProps {
  schemas: Schema[]
}

export default function Collection({ schemas }: CollectionProps) {
  const { schema: schemaName } = useParams<{ schema: string }>()
  const [items, setItems] = useState<Array<{ id: string }>>([])
  const [loading, setLoading] = useState(true)

  const schema = schemas.find((s) => s.name === schemaName && s.type === 'collection')

  useEffect(() => {
    if (!schema) return

    setLoading(true)
    api.getContent<{ id: string }>(schema.name)
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [schema?.name])

  if (!schema) {
    return <div className="p-8">Schema not found</div>
  }

  // Find the first string field to use as label
  const labelField = 'title' // Default to title for now

  return (
    <div className="flex h-screen">
      {loading ? (
        <div className="w-72 border-r flex items-center justify-center">Loading...</div>
      ) : (
        <ItemList items={items} schemaName={schema.name} labelField={labelField} />
      )}
      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ schema, refreshList: () => {
          api.getContent<{ id: string }>(schema.name)
            .then((res) => setItems(res.data))
        }}} />
      </div>
    </div>
  )
}

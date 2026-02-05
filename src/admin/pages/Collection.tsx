// src/admin/pages/Collection.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { api } from '../lib/api'
import ItemList from '../components/ItemList'
import ItemEdit from './ItemEdit'
import { useSchemas } from '../App'
import { AlertCircle, Loader2, Search } from 'lucide-react'

export default function Collection() {
  const params = useParams<{ schema: string; id?: string }>()
  const { schemas } = useSchemas()
  const [items, setItems] = useState<Array<{ id: string }>>([])
  const [loading, setLoading] = useState(true)

  const schema = schemas.find((s) => s.name === params.schema && s.type === 'collection')

  const refreshList = () => {
    if (!schema) return
    api.getContent<{ id: string }>(schema.name)
      .then((res) => setItems(res.data))
      .catch(console.error)
  }

  useEffect(() => {
    if (!schema) return

    setLoading(true)
    api.getContent<{ id: string }>(schema.name)
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [schema?.name])

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAF8]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FEF2F1] flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#DC4E42]" />
          </div>
          <p className="text-sm font-medium text-[#1A1A18]">Schema not found</p>
          <p className="text-xs text-[#9C9C91] mt-1">The requested collection doesn't exist</p>
        </div>
      </div>
    )
  }

  // Use schema's labelField or default to 'title'
  const labelField = schema.labelField || 'title'

  return (
    <div className="flex h-screen bg-[#FAFAF8]">
      {loading ? (
        <div className="w-72 border-r border-[#E8E8E3] bg-[#FAFAF8] flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#9C9C91]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      ) : (
        <ItemList items={items} schemaName={schema.name} labelField={labelField} />
      )}
      <div className="flex-1 overflow-y-auto">
        {params.id ? (
          <ItemEdit schema={schema} itemId={params.id} refreshList={refreshList} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F5F3] flex items-center justify-center">
                <Search className="w-8 h-8 text-[#9C9C91]" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-[#1A1A18]">No item selected</p>
              <p className="text-xs text-[#9C9C91] mt-1">Select an item from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// src/admin/components/ItemList.tsx
import { useLocation } from 'wouter'
import NavLink from './NavLink'
import { Plus, Archive } from 'lucide-react'

interface Item {
  id: string
  title?: string
  name?: string
  _meta?: {
    draft?: boolean
    createdAt?: string
    updatedAt?: string
  }
}

interface ItemListProps {
  items: Item[]
  schemaName: string
  labelField?: string | string[]
}

function getItemLabel(item: Item, labelField: string | string[]): string {
  if (Array.isArray(labelField)) {
    const parts = labelField
      .map(f => (item as Record<string, unknown>)[f])
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
    return parts.join(' ') || 'Untitled'
  }
  return (item as Record<string, unknown>)[labelField] as string || 'Untitled'
}

export default function ItemList({ items, schemaName, labelField = 'title' }: ItemListProps) {
  const [location] = useLocation()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-72 border-r border-[#E8E8E3] bg-[#FAFAF8] h-screen overflow-y-auto">
      {/* Header with New button */}
      <div className="p-4 border-b border-[#E8E8E3] bg-white sticky top-0 z-10">
        <NavLink
          href={`/collections/${schemaName}/new`}
          className="
            flex items-center justify-center gap-2 w-full
            px-4 py-2.5 rounded-lg text-sm font-medium
            bg-[#E5644E] text-white
            hover:bg-[#D45A45]
            transition-colors duration-200
          "
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New entry
        </NavLink>
      </div>

      {/* Items list */}
      <div className="py-2">
        {items.map((item) => {
          const href = `/collections/${schemaName}/${item.id}`
          const isActive = location === href
          const label = getItemLabel(item, labelField)

          return (
            <NavLink
              key={item.id}
              href={href}
              className={`
                block mx-2 px-3 py-3 rounded-lg
                transition-all duration-150
                ${isActive
                  ? 'bg-white shadow-sm border border-[#E8E8E3]'
                  : 'hover:bg-white/60'
                }
              `}
            >
              <div className={`text-sm truncate ${isActive ? 'font-medium text-[#1A1A18]' : 'text-[#1A1A18]'}`}>
                {label}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`
                  inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                  ${item._meta?.draft
                    ? 'bg-[#FEF8EC] text-[#B8862B]'
                    : 'bg-[#F0F9F3] text-[#3D9A5D]'
                  }
                `}>
                  {item._meta?.draft ? 'Draft' : 'Published'}
                </span>
                {item._meta?.updatedAt && (
                  <span className="text-[11px] text-[#9C9C91]">
                    {formatDate(item._meta.updatedAt)}
                  </span>
                )}
              </div>
            </NavLink>
          )
        })}

        {items.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F5F5F3] flex items-center justify-center">
              <Archive className="w-6 h-6 text-[#9C9C91]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-[#9C9C91]">No entries yet</p>
            <p className="text-xs text-[#9C9C91] mt-1">Create your first one above</p>
          </div>
        )}
      </div>
    </div>
  )
}

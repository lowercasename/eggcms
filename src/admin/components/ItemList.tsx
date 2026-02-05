// src/admin/components/ItemList.tsx
import { NavLink } from 'react-router-dom'

interface Item {
  id: string  // UUID
  title?: string
  name?: string
  draft?: number
  created_at?: string
}

interface ItemListProps {
  items: Item[]
  schemaName: string
  labelField?: string
}

export default function ItemList({ items, schemaName, labelField = 'title' }: ItemListProps) {
  return (
    <div className="w-72 border-r bg-gray-50 h-screen overflow-y-auto">
      <div className="p-4 border-b bg-white sticky top-0">
        <NavLink
          to={`/collections/${schemaName}/new`}
          className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
        >
          + New
        </NavLink>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={`/collections/${schemaName}/${item.id}`}
            className={({ isActive }) =>
              `block p-4 hover:bg-white ${isActive ? 'bg-white border-l-2 border-blue-600' : ''}`
            }
          >
            <div className="font-medium truncate">
              {(item as Record<string, unknown>)[labelField] as string || `Item ${item.id}`}
            </div>
            <div className="text-sm text-gray-500">
              {item.draft ? 'Draft' : 'Published'}
            </div>
          </NavLink>
        ))}

        {items.length === 0 && (
          <div className="p-4 text-gray-500 text-center">No items yet</div>
        )}
      </div>
    </div>
  )
}

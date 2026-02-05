// src/admin/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Schema } from '../types'

interface SidebarProps {
  schemas: Schema[]
}

export default function Sidebar({ schemas }: SidebarProps) {
  const { logout } = useAuth()

  const singletons = schemas.filter((s) => s.type === 'singleton')
  const collections = schemas.filter((s) => s.type === 'collection')

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded ${isActive ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`

  return (
    <div className="w-56 bg-white border-r h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">EggCMS</h1>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {singletons.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Singletons
            </h2>
            <div className="space-y-1">
              {singletons.map((s) => (
                <NavLink key={s.name} to={`/singletons/${s.name}`} className={linkClass}>
                  {s.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {collections.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Collections
            </h2>
            <div className="space-y-1">
              {collections.map((s) => (
                <NavLink key={s.name} to={`/collections/${s.name}`} className={linkClass}>
                  {s.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <NavLink to="/media" className={linkClass}>
            Media
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={() => logout()}
          className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

// src/admin/components/Sidebar.tsx
import { useLocation } from 'wouter'
import { Egg, Settings2, Folder, Image, LogOut } from 'lucide-react'
import NavLink from './NavLink'
import { useAuth } from '../context/AuthContext'
import { useDirtyStateContext } from '../contexts/DirtyStateContext'
import { useSchemas } from '../App'
import type { Schema } from '../types'

interface SidebarProps {
  schemas: Schema[]
}

const itemClass = (active: boolean) =>
  [
    'flex items-center gap-2.5 px-2.5 py-[11px] rounded-control text-[15px] leading-tight transition-colors duration-150',
    '[&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:shrink-0',
    active ? 'bg-selected text-white font-semibold [&_svg]:text-white' : 'text-ink-nav hover:bg-page [&_svg]:text-ink-2',
  ].join(' ')

/** 196px of navigation: the site, its content types, the media library, sign out. */
export default function Sidebar({ schemas }: SidebarProps) {
  const { logout } = useAuth()
  const { confirmNavigation } = useDirtyStateContext()
  const { siteName } = useSchemas()
  const [location] = useLocation()

  const singletons = schemas.filter((s) => s.type === 'singleton')
  const collections = schemas.filter((s) => s.type === 'collection')
  const isActive = (href: string) => location === href || location.startsWith(href + '/')

  return (
    <aside className="w-[196px] shrink-0 bg-panel border-r border-line-strong h-screen flex flex-col px-2.5 py-3.5">
      <div className="flex items-center gap-[9px] px-1.5 pb-3.5 mb-3 border-b border-line-hair">
        <div className="w-8 h-8 rounded-button bg-action flex items-center justify-center shrink-0" aria-hidden>
          <Egg className="w-[19px] h-[19px] text-white" />
        </div>
        <span className="text-[16px] font-bold text-ink truncate">{siteName}</span>
      </div>

      <nav aria-label="Content" className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {singletons.map((s) => (
          <NavLink key={s.name} href={`/singletons/${s.name}`} className={itemClass(isActive(`/singletons/${s.name}`))}>
            <Settings2 aria-hidden />
            {s.label}
          </NavLink>
        ))}
        {collections.map((s) => (
          <NavLink key={s.name} href={`/collections/${s.name}`} className={itemClass(isActive(`/collections/${s.name}`))}>
            <Folder aria-hidden />
            {s.label}
          </NavLink>
        ))}
        <NavLink href="/media" className={itemClass(isActive('/media'))}>
          <Image aria-hidden />
          Media
        </NavLink>
      </nav>

      <div className="h-px bg-line-hair -mx-2.5 my-2" />
      <button type="button" onClick={() => confirmNavigation() && logout()} className={`${itemClass(false)} w-full text-left`}>
        <LogOut aria-hidden />
        Sign out
      </button>
    </aside>
  )
}

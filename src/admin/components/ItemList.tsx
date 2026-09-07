// src/admin/components/ItemList.tsx
import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { Plus, PanelLeftClose, Check, CircleDot, CircleDashed, FilePlus, SearchX } from 'lucide-react'
import NavLink from './NavLink'
import { useDirtyItems } from '../contexts/DirtyStateContext'
import { entryNoun, plural } from '../lib/words'
import { Button, EmptyState, SearchInput, SegmentedControl } from './ui'

interface Item {
  id: string
  _meta?: { draft?: boolean; createdAt?: string; updatedAt?: string }
  [key: string]: unknown
}

interface ItemListProps {
  items: Item[]
  schemaName: string
  schemaLabel: string
  labelField?: string | string[]
  /** Hide the list (the editor can show it again). */
  onHide?: () => void
  /** A new entry is being written: show it at the top as an untitled draft. */
  creating?: boolean
}

type Filter = 'all' | 'live' | 'draft'

export function getItemLabel(item: Item, labelField: string | string[]): string {
  const fields = Array.isArray(labelField) ? labelField : [labelField]
  return fields
    .map((f) => item[f])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
}

type Status = 'published' | 'draft' | 'edited'

const STATUS: Record<Status, { Icon: typeof Check; word: string; color: string }> = {
  published: { Icon: Check, word: 'Published', color: 'text-published-icon' },
  draft: { Icon: CircleDashed, word: 'Draft', color: 'text-draft-2' },
  edited: { Icon: CircleDot, word: 'Edited', color: 'text-draft-2' },
}

/**
 * The entry list beside the editor: count, New, search, All/Live/Draft, and
 * one 48px row per entry with its status shown as icon and word.
 */
export default function ItemList({ items, schemaName, schemaLabel, labelField = 'title', onHide, creating }: ItemListProps) {
  const [location] = useLocation()
  const { dirtyItems } = useDirtyItems()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const noun = entryNoun(schemaLabel)
  const nouns = plural(noun, 2)
  const untitled = `Untitled ${noun}`

  const counts = useMemo(
    () => ({
      all: items.length,
      live: items.filter((i) => !i._meta?.draft).length,
      draft: items.filter((i) => !!i._meta?.draft).length,
    }),
    [items]
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (filter === 'live' && item._meta?.draft) return false
      if (filter === 'draft' && !item._meta?.draft) return false
      if (!q) return true
      return (getItemLabel(item, labelField) || untitled).toLowerCase().includes(q)
    })
  }, [items, filter, query, labelField, untitled])

  // Published is the norm, so it gets only its tick. A draft or an edited entry
  // says so in a word as well as an icon, so the two are never told apart by
  // shape alone.
  const row = (key: string, href: string, label: string, status: Status, active: boolean) => {
    const { Icon, word, color } = STATUS[status]
    const isUntitled = !label
    const spoken = status === 'published'
    return (
      <NavLink
        key={key}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={[
          'flex items-center gap-[9px] px-2.5 py-3 min-h-[48px] rounded-control text-[15px] transition-colors duration-100',
          active ? 'bg-page border-2 border-ink font-bold' : 'border border-transparent hover:bg-page',
        ].join(' ')}
      >
        <span role={spoken ? 'img' : undefined} aria-label={spoken ? word : undefined} aria-hidden={spoken ? undefined : true} className={`shrink-0 flex ${color}`}>
          <Icon className="w-4 h-4" aria-hidden />
        </span>{' '}
        <span className={`flex-1 min-w-0 truncate ${isUntitled ? 'italic text-ink-2' : 'text-ink'}`}>{label || untitled}</span>
        {!spoken && (
          <>
            {' '}
            <span className={`shrink-0 text-[13px] font-bold ${color}`}>{word}</span>
          </>
        )}
      </NavLink>
    )
  }

  return (
    <div className="w-[250px] shrink-0 bg-panel border-r border-line-strong h-screen flex flex-col">
      <div className="p-3.5 border-b border-line-hair flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 m-0 text-[16px] font-bold text-ink">
            {schemaLabel}{' '}
            <span className="font-medium text-ink-2 font-mono text-[15px]">{items.length}</span>
          </h2>
          {onHide && (
            <Button variant="icon" size="sm" aria-label="Hide this list" title="Hide this list" onClick={onHide}>
              <PanelLeftClose aria-hidden />
            </Button>
          )}
        </div>
        <NavLink
          href={`/collections/${schemaName}/new`}
          className="flex items-center justify-center gap-2 py-3 rounded-button bg-action text-white text-[15px] font-semibold hover:bg-action-text transition-colors"
        >
          <Plus className="w-[18px] h-[18px]" aria-hidden />
          New {noun}
        </NavLink>
        <SearchInput value={query} onChange={setQuery} placeholder={`Search ${nouns}`} />
        <SegmentedControl
          aria-label="Show"
          fullWidth
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'live', label: 'Live', count: counts.live },
            { value: 'draft', label: 'Draft', count: counts.draft },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {creating && row('new', `/collections/${schemaName}/new`, '', 'draft', true)}

        {visible.map((item) => {
          const href = `/collections/${schemaName}/${item.id}`
          const status: Status = dirtyItems.has(item.id) ? 'edited' : item._meta?.draft ? 'draft' : 'published'
          return row(item.id, href, getItemLabel(item, labelField), status, location === href)
        })}

        {items.length === 0 && !creating && (
          <EmptyState
            icon={<FilePlus />}
            title={`No ${nouns} yet`}
            description={`Every ${noun} on the website starts here.`}
            action={
              <NavLink
                href={`/collections/${schemaName}/new`}
                className="inline-flex items-center gap-2 px-4 py-[11px] rounded-button bg-action text-white text-[15px] font-bold whitespace-nowrap hover:bg-action-text"
              >
                <Plus className="w-[17px] h-[17px]" aria-hidden />
                New
              </NavLink>
            }
          />
        )}

        {items.length > 0 && visible.length === 0 && (
          <EmptyState
            icon={<SearchX />}
            title={query ? `No ${nouns} match “${query.trim()}”` : `No ${filter === 'live' ? 'live' : 'draft'} ${nouns}`}
            description={
              query ? `Try fewer words, or clear the search to see all ${items.length} ${plural(noun, items.length)}.` : `Choose All to see every ${noun}.`
            }
            action={
              query ? (
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  Show all
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}

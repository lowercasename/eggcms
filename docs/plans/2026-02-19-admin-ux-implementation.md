# Admin UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 7 admin UX improvements: site heading, repeater UX, link modal bug fix, unsaved badge, image component design, and link field type.

**Architecture:** All changes are in the admin frontend (React) except site heading (env var on server) and link field (full 7-file field type addition). Each task is independent and can be committed separately.

**Tech Stack:** React 19, Vitest, Testing Library, Tiptap, Hono, Tailwind

---

### Task 1: Site Heading (env var `SITE_NAME`)

Expose `SITE_NAME` env var through the schemas API and display it in the sidebar.

**Files:**
- Modify: `src/server/routes/schemas.ts`
- Modify: `src/server/routes/schemas.test.ts`
- Modify: `src/admin/App.tsx`
- Modify: `src/admin/components/Sidebar.tsx`
- Modify: `src/admin/types/index.ts`

**Step 1: Write the failing test**

In `src/server/routes/schemas.test.ts`, add a test that expects `siteName` in the schemas response:

```typescript
it('includes siteName from SITE_NAME env var', async () => {
  process.env.SITE_NAME = 'My Cool Site'
  const app = new Hono()
  app.route('/api', createSchemasRoute(testSchemas))
  const res = await app.request('/api/schemas')
  const json = await res.json()
  expect(json.siteName).toBe('My Cool Site')
  delete process.env.SITE_NAME
})

it('defaults siteName to EggCMS when env var not set', async () => {
  delete process.env.SITE_NAME
  const app = new Hono()
  app.route('/api', createSchemasRoute(testSchemas))
  const res = await app.request('/api/schemas')
  const json = await res.json()
  expect(json.siteName).toBe('EggCMS')
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/server/routes/schemas.test.ts`
Expected: FAIL - `siteName` not in response

**Step 3: Implement the server change**

In `src/server/routes/schemas.ts`, add `siteName` to the response at line 42:

```typescript
// Change the return from:
return c.json({ data: publicSchemas })
// To:
return c.json({ data: publicSchemas, siteName: process.env.SITE_NAME || 'EggCMS' })
```

**Step 4: Run test to verify it passes**

Run: `bun run test src/server/routes/schemas.test.ts`
Expected: PASS

**Step 5: Wire up the admin UI**

In `src/admin/App.tsx`:
- Add `siteName` to the `SchemasContextValue` interface:
  ```typescript
  interface SchemasContextValue {
    schemas: Schema[]
    siteName: string
  }
  ```
- Update the default context: `{ schemas: [], siteName: 'EggCMS' }`
- Extract `siteName` from the API response in the `useEffect`:
  ```typescript
  .then((res) => {
    setSchemas(res.data as Schema[])
    setSiteName((res as any).siteName || 'EggCMS')
  })
  ```
- Add `const [siteName, setSiteName] = useState('EggCMS')` state
- Pass it in the provider: `<SchemasContext.Provider value={{ schemas, siteName }}>`

In `src/admin/components/Sidebar.tsx`:
- Import `useSchemas` from `../App`
- Replace the hardcoded "EggCMS" text with `siteName` from context:
  ```typescript
  const { siteName } = useSchemas ? useSchemas() : { siteName: 'EggCMS' }
  // In the JSX:
  <span className="text-lg font-semibold text-[#1A1A18]">{siteName}</span>
  ```

Note: The Sidebar receives `schemas` as a prop already. We could also pass `siteName` as a prop from Layout, or use the context. Using the context is cleaner since Layout already has access.

Actually, simpler approach: just pass `siteName` as a prop alongside `schemas` through Layout. But the context approach is cleaner. Use the context.

**Step 6: Commit**

```bash
git add src/server/routes/schemas.ts src/server/routes/schemas.test.ts src/admin/App.tsx src/admin/components/Sidebar.tsx
git commit -m "feat: configurable site heading via SITE_NAME env var"
```

---

### Task 2: Repeater UX Improvements

Two changes: single-block auto-add (no dropdown), and auto-add on select for multi-block.

**Files:**
- Modify: `src/admin/editors/BlocksEditor.tsx`
- Modify: `src/admin/editors/BlocksEditor.test.tsx`

**Step 1: Write the failing tests**

Add to `src/admin/editors/BlocksEditor.test.tsx`:

```typescript
describe('single block type', () => {
  const singleBlockField: FieldDefinition & { blocks?: typeof textBlock[] } = {
    name: 'blocks',
    type: 'blocks',
    blocks: [textBlock],
  }

  it('hides select dropdown when only one block type', () => {
    render(
      <BlocksEditor field={singleBlockField} value={[]} onChange={mockOnChange} />
    )

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('adds the single block type directly on Add click', async () => {
    const user = userEvent.setup()

    render(
      <BlocksEditor field={singleBlockField} value={[]} onChange={mockOnChange} />
    )

    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ _type: 'text' }),
    ])
  })
})

describe('auto-add on select', () => {
  it('adds block immediately when selecting from dropdown', async () => {
    const user = userEvent.setup()

    render(
      <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'text')

    // Should add immediately without clicking Add
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ _type: 'text' }),
    ])
  })

  it('resets select after auto-adding', async () => {
    const user = userEvent.setup()

    render(
      <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'text')

    expect(select).toHaveValue('')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `bun run test src/admin/editors/BlocksEditor.test.tsx`
Expected: FAIL - select still visible for single block, no auto-add

**Step 3: Implement the changes**

In `src/admin/editors/BlocksEditor.tsx`:

1. Create a helper function `addBlockByType` extracted from `addBlock`:

```typescript
const addBlockByType = (typeName: string) => {
  const blockDef = blockDefinitions.find((b) => b.name === typeName)
  if (!blockDef) return

  const newBlock: Block = {
    _type: typeName,
    _id: generateId(),
  }

  for (const f of blockDef.fields) {
    if (f.default !== undefined) {
      newBlock[f.name] = f.default
    }
  }

  onChange([...blocks, newBlock])
  setSelectedBlockType('')
  setExpandedBlocks((prev) => new Set(prev).add(newBlock._id))
}
```

2. Update the `addBlock` function to use it:
```typescript
const addBlock = () => {
  if (blockDefinitions.length === 1) {
    addBlockByType(blockDefinitions[0].name)
  } else if (selectedBlockType) {
    addBlockByType(selectedBlockType)
  }
}
```

3. Update the Select onChange to auto-add:
```typescript
onChange={(e) => {
  const val = e.target.value
  if (val) {
    addBlockByType(val)
  }
}}
```

4. Conditionally render the footer based on single vs multi block:
```typescript
<div className="flex gap-2 pt-2">
  {blockDefinitions.length === 1 ? (
    <Button variant="secondary" onClick={addBlock}>
      <Plus className="w-4 h-4 mr-1.5" />
      Add {blockDefinitions[0].label}
    </Button>
  ) : (
    <>
      <Select
        value={selectedBlockType}
        onChange={(e) => {
          const val = e.target.value
          if (val) addBlockByType(val)
        }}
        options={blockOptions}
        placeholder="Select block type to add..."
        className="flex-1"
      />
    </>
  )}
</div>
```

Note: With auto-add on select, the separate "Add Block" button is no longer needed for multi-block case either. The select dropdown acts as the trigger. Just keep the select.

**Step 4: Run tests to verify they pass**

Run: `bun run test src/admin/editors/BlocksEditor.test.tsx`
Expected: PASS

Note: Some existing tests may need updating since the "Add Block" button behavior changes for multi-block case. The existing tests that click "Add Block" after selecting should still work if the auto-add fires on select (the onChange would have already been called). Review and update existing tests:
- "disables Add Block button when no type selected" → this test may need to change since the Add Block button may not exist for multi-block
- "enables Add Block button when type selected" → same
- "adds block when Add Block clicked" → the block is now added on select, before clicking Add
- "resets select after adding block" → the select resets after auto-add

Update these tests to match the new behavior. The key existing tests to update:

```typescript
// Old: "disables Add Block button when no type selected"
// Remove or update - no separate Add button for multi-block

// Old: "adds block when Add Block clicked"
// Update to: "adds block when selecting from dropdown"
// (already covered by the new auto-add test)
```

**Step 5: Commit**

```bash
git add src/admin/editors/BlocksEditor.tsx src/admin/editors/BlocksEditor.test.tsx
git commit -m "feat: improve repeater UX - auto-add on select, single-block shortcut"
```

---

### Task 3: Link Modal Focus Bug

The Tiptap editor captures keystrokes even when the modal is open. Fix by disabling the editor when modals are open.

**Files:**
- Modify: `src/admin/editors/RichtextEditor.tsx`
- Modify: `src/admin/editors/RichtextEditor.test.tsx`

**Step 1: Write the failing test**

Add to `src/admin/editors/RichtextEditor.test.tsx`:

```typescript
it('disables editor when link modal opens', async () => {
  // Render editor, open link modal, verify editor.setEditable(false) is called
  // This test depends on how the existing tests mock Tiptap.
  // Check existing test file patterns first.
})
```

Note: Since Tiptap's `useEditor` is hard to test directly in unit tests (it requires a real DOM and ProseMirror), the approach should be:

1. When `showLinkModal` or `showImagePicker` is true, call `editor.setEditable(false)`
2. When they close, call `editor.setEditable(true)`

The simplest implementation:

```typescript
// Add useEffect that syncs modal state with editor editability
useEffect(() => {
  if (!editor) return
  const modalOpen = showLinkModal || showImagePicker
  editor.setEditable(!modalOpen)
}, [editor, showLinkModal, showImagePicker])
```

This is a small change. If existing RichtextEditor tests mock the editor, add a test that verifies `setEditable` is called. If not, this is a 3-line fix that can be verified manually.

**Step 2: Check existing test structure**

Read `src/admin/editors/RichtextEditor.test.tsx` to see how editor is mocked. If the mock supports `setEditable`, write a test. Otherwise, implement the fix directly.

**Step 3: Implement the fix**

In `src/admin/editors/RichtextEditor.tsx`, add after the `useEditor` call (around line 48):

```typescript
// Disable editor when modals are open to prevent keystroke capture
useEffect(() => {
  if (!editor) return
  editor.setEditable(!showLinkModal && !showImagePicker)
}, [editor, showLinkModal, showImagePicker])
```

**Step 4: Run all richtext tests**

Run: `bun run test src/admin/editors/RichtextEditor.test.tsx`
Expected: PASS (existing tests should still pass)

**Step 5: Commit**

```bash
git add src/admin/editors/RichtextEditor.tsx
git commit -m "fix: prevent editor keystroke capture when modals are open"
```

---

### Task 4: Unsaved Badge in Collection List

Show which items have unsaved changes in the sidebar item list.

**Files:**
- Modify: `src/admin/contexts/DirtyStateContext.tsx`
- Modify: `src/admin/pages/ItemEdit.tsx`
- Modify: `src/admin/components/ItemList.tsx`
- Modify: `src/admin/components/ItemList.test.tsx`

**Step 1: Write the failing test**

Add to `src/admin/components/ItemList.test.tsx`:

```typescript
import { DirtyItemsProvider, useDirtyItems } from '../../contexts/DirtyStateContext'

// Wrapper that provides dirty items context with a specific item marked dirty
function DirtyWrapper({ dirtyIds, children }: { dirtyIds: string[], children: React.ReactNode }) {
  return (
    <DirtyItemsProvider>
      <DirtyItemsSetter dirtyIds={dirtyIds} />
      {children}
    </DirtyItemsProvider>
  )
}

function DirtyItemsSetter({ dirtyIds }: { dirtyIds: string[] }) {
  const { setItemDirty } = useDirtyItems()
  useEffect(() => {
    dirtyIds.forEach(id => setItemDirty(id, true))
  }, [])
  return null
}

it('shows unsaved indicator for dirty items', () => {
  render(
    <DirtyWrapper dirtyIds={['1']}>
      <ItemList
        items={[{ id: '1', title: 'Hello', _meta: { draft: false } }]}
        schemaName="post"
      />
    </DirtyWrapper>
  )

  expect(screen.getByText('Unsaved')).toBeTruthy()
})

it('does not show unsaved indicator for clean items', () => {
  render(
    <DirtyWrapper dirtyIds={[]}>
      <ItemList
        items={[{ id: '1', title: 'Hello', _meta: { draft: false } }]}
        schemaName="post"
      />
    </DirtyWrapper>
  )

  expect(screen.queryByText('Unsaved')).not.toBeTruthy()
})
```

Note: The test structure will depend on how we expose the dirty items context. The key idea:
- `DirtyStateContext` gets a new `dirtyItems` Map and `setItemDirty(id, dirty)` function
- ItemList reads from it
- ItemEdit writes to it

**Step 2: Run test to verify it fails**

Run: `bun run test src/admin/components/ItemList.test.tsx`
Expected: FAIL - `DirtyItemsProvider` doesn't exist yet

**Step 3: Extend DirtyStateContext**

In `src/admin/contexts/DirtyStateContext.tsx`, add item-level dirty tracking:

```typescript
// Add to the context interface:
interface DirtyStateContextValue {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  confirmNavigation: () => boolean
  dirtyItems: Set<string>
  setItemDirty: (itemId: string, dirty: boolean) => void
}

// In the provider, add:
const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set())

const setItemDirty = useCallback((itemId: string, dirty: boolean) => {
  setDirtyItems(prev => {
    const next = new Set(prev)
    if (dirty) next.add(itemId)
    else next.delete(itemId)
    return next
  })
}, [])

// Add to provider value:
// { isDirty, setDirty, confirmNavigation, dirtyItems, setItemDirty }
```

**Step 4: Update ItemEdit to report dirty state per item**

In `src/admin/pages/ItemEdit.tsx`, the component already syncs `isDirty` to the context. Extend it to also report the item ID:

```typescript
const { setDirty, setItemDirty } = useDirtyStateContext()

useEffect(() => {
  setDirty(isDirty)
  if (!isNew && itemId) {
    setItemDirty(itemId, isDirty)
  }
  return () => {
    setDirty(false)
    if (!isNew && itemId) {
      setItemDirty(itemId, false)
    }
  }
}, [isDirty, setDirty, setItemDirty, itemId, isNew])
```

**Step 5: Update ItemList to show unsaved badge**

In `src/admin/components/ItemList.tsx`, import and use the context:

```typescript
import { useDirtyStateContext } from '../contexts/DirtyStateContext'

// Inside the component:
// Use try/catch or optional context since ItemList might render outside the provider in tests
let dirtyItems = new Set<string>()
try {
  const ctx = useDirtyStateContext()
  dirtyItems = ctx.dirtyItems
} catch {
  // Outside provider (e.g., tests without wrapper)
}

// In the item render, after the Draft/Published badge:
{dirtyItems.has(item.id) && (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-[#FEF8EC] text-[#B8862B]">
    Unsaved
  </span>
)}
```

**Step 6: Run tests**

Run: `bun run test src/admin/components/ItemList.test.tsx`
Expected: PASS

Also run: `bun run test src/admin/pages/ItemEdit.test.tsx`
Expected: PASS (existing tests should still pass since the mock context should be compatible)

**Step 7: Commit**

```bash
git add src/admin/contexts/DirtyStateContext.tsx src/admin/pages/ItemEdit.tsx src/admin/components/ItemList.tsx src/admin/components/ItemList.test.tsx
git commit -m "feat: show unsaved badge in collection item list"
```

---

### Task 5: Image Component - InDesign-style Boundaries

Make image placement and configuration visible at a glance. This is primarily CSS + minor JSX changes.

**Files:**
- Modify: `src/admin/index.css`
- Modify: `src/admin/components/richtext/ImageNodeView.tsx`

**Step 1: Plan the visual design**

Use the frontend-design skill for this task. The key visual elements:

**Always visible (not selected):**
- Dashed border around the image frame
- Small badge showing size + alignment (e.g., "M" "Left")
- Subtle background to distinguish from content

**When selected:**
- Solid accent-color border
- Existing popover toolbar stays

**Step 2: Update the CSS**

In `src/admin/index.css`, update the image figure styles:

```css
/* Image figure wrapper (NodeView) - InDesign-style frame */
.richtext-editor .image-figure {
  position: relative;
  margin: 1rem 0;
}

.richtext-editor .image-figure .image-container {
  display: block;
  position: relative;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 4px;
  transition: border-color var(--transition-fast);
}

.richtext-editor .image-figure .image-container:hover {
  border-color: var(--color-text-muted);
}

/* Selected state - solid accent border */
.richtext-editor .image-figure .image-container.selected {
  border-color: var(--color-accent);
  border-style: solid;
}

.richtext-editor .image-figure img {
  width: 100%;
  height: auto;
  border-radius: calc(var(--radius-md) - 2px);
  display: block;
}

/* Remove old selected style on img - now on container */
.richtext-editor .image-figure img.selected {
  outline: none;
  outline-offset: 0;
}

/* Size/alignment badge */
.richtext-editor .image-figure .image-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  pointer-events: none;
  backdrop-filter: blur(4px);
}
```

**Step 3: Update ImageNodeView.tsx**

Add the badge and move `selected` class to container:

```tsx
// In the JSX, update the image-container div:
<div
  className={`image-container ${selected ? 'selected' : ''}`}
  onDoubleClick={handleDoubleClick}
  ref={containerRef}
>
  <img
    src={src}
    alt={alt || ""}
    draggable={false}
  />
  {/* Size/alignment badge */}
  <div className="image-badge">
    {width ? width : (currentSize === 'small' ? 'S' : currentSize === 'medium' ? 'M' : currentSize === 'large' ? 'L' : 'Full')}
    {currentAlignment !== 'center' && (
      <>
        <span style={{ opacity: 0.4 }}>|</span>
        {currentAlignment === 'left' ? 'Left' : 'Right'}
      </>
    )}
  </div>
</div>
```

Note: Remove `className={selected ? "selected" : ""}` from the `<img>` tag since we're now styling the container.

**Step 4: Run existing image tests**

Run: `bun run test src/admin/components/richtext/ImageNodeView.test.tsx`
Expected: PASS (may need to update selectors if tests query for img.selected)

**Step 5: Commit**

```bash
git add src/admin/index.css src/admin/components/richtext/ImageNodeView.tsx
git commit -m "feat: InDesign-style image frame with size/alignment badge"
```

---

### Task 6: Link Field (`f.link()`)

New field type following the 7-file pattern. This is the largest task.

**Files:**
- Modify: `src/lib/schema.ts`
- Modify: `src/lib/schema.test.ts`
- Modify: `src/admin/types/index.ts`
- Modify: `src/server/routes/schemas.ts`
- Modify: `src/server/lib/content.ts`
- Create: `src/admin/editors/LinkFieldEditor.tsx`
- Modify: `src/admin/pages/ItemEdit.tsx`
- Modify: `src/admin/editors/BlocksEditor.tsx`
- Modify: `src/admin/editors/BlockEditor.tsx`

**Step 1: Write schema validation test**

In `src/lib/schema.test.ts`:

```typescript
it('accepts valid link field', () => {
  const schema = defineCollection({
    name: 'page',
    label: 'Pages',
    fields: [f.link('cta')],
  })
  expect(() => validateSchema(schema)).not.toThrow()
})

it('accepts link field with collections restriction', () => {
  const schema = defineCollection({
    name: 'page',
    label: 'Pages',
    fields: [f.link('cta', { collections: ['posts', 'pages'] })],
  })
  expect(() => validateSchema(schema)).not.toThrow()
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/lib/schema.test.ts`
Expected: FAIL - 'link' not a valid field type

**Step 3: Add link to schema types**

In `src/lib/schema.ts`:

1. Add `'link'` to the `FieldType` union:
```typescript
export type FieldType =
  | 'string' | 'text' | 'richtext' | 'number' | 'boolean'
  | 'datetime' | 'image' | 'slug' | 'select' | 'blocks' | 'block'
  | 'link'
```

2. Add `collections` to `FieldDefinition`:
```typescript
export interface FieldDefinition {
  // ... existing fields
  collections?: string[]  // For link fields - restrict to these collections
}
```

3. Add `f.link()` helper:
```typescript
link: (name: string, opts?: { collections?: string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'link', ...opts }),
```

**Step 4: Run schema test**

Run: `bun run test src/lib/schema.test.ts`
Expected: PASS

**Step 5: Mirror types in admin**

In `src/admin/types/index.ts`, add to `FieldDefinition`:
```typescript
collections?: string[]  // For link fields
```

**Step 6: Update API schema mapping**

In `src/server/routes/schemas.ts`, add `collections` to `mapField`:
```typescript
const mapField = (f: typeof schemas[0]['fields'][0]): Record<string, unknown> => ({
  // ... existing fields
  collections: f.collections,
})
```

**Step 7: Add to JSON_FIELD_TYPES**

In `src/server/lib/content.ts`, add 'link' to the array:
```typescript
const JSON_FIELD_TYPES = ['blocks', 'block', 'link']
```

**Step 8: Create LinkFieldEditor**

Create `src/admin/editors/LinkFieldEditor.tsx`:

```tsx
import { useState } from 'react'
import type { FieldDefinition } from '../types'
import LinkModal from '../components/richtext/LinkModal'
import { Link as LinkIcon, ExternalLink, FileText, X } from 'lucide-react'

interface LinkValue {
  type: 'internal' | 'external'
  ref?: string      // "schema:id" for internal
  url?: string      // URL for external
  label?: string    // Display label for internal
}

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function LinkFieldEditor({ field, value, onChange }: Props) {
  const [showModal, setShowModal] = useState(false)
  const linkValue = value as LinkValue | null

  const displayText = linkValue
    ? linkValue.type === 'internal'
      ? linkValue.label || linkValue.ref
      : linkValue.url
    : null

  return (
    <div>
      {linkValue ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-[#E8E8E3] rounded-lg bg-[#FAFAF8]">
          {linkValue.type === 'internal' ? (
            <FileText className="w-4 h-4 text-[#9C9C91] flex-shrink-0" />
          ) : (
            <ExternalLink className="w-4 h-4 text-[#9C9C91] flex-shrink-0" />
          )}
          <span className="text-sm text-[#1A1A18] truncate flex-1">
            {displayText}
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs text-[#6B6B63] hover:text-[#1A1A18] transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 rounded text-[#9C9C91] hover:text-[#DC4E42] hover:bg-[#FEF2F1] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 w-full border border-dashed border-[#E8E8E3] rounded-lg text-sm text-[#6B6B63] hover:border-[#9C9C91] hover:text-[#1A1A18] transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          Choose link...
        </button>
      )}

      {showModal && (
        <LinkModal
          currentHref={linkValue?.type === 'external' ? linkValue.url : undefined}
          currentContentRef={linkValue?.type === 'internal' ? linkValue.ref : undefined}
          onSaveExternal={(url) => {
            onChange({ type: 'external', url })
            setShowModal(false)
          }}
          onSaveInternal={(ref, label) => {
            onChange({ type: 'internal', ref, label })
            setShowModal(false)
          }}
          onRemove={() => {
            onChange(null)
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
```

Note: The LinkModal may need the `collections` filter passed to it. Currently LinkModal loads all collections. If `field.collections` is set, we should filter. This can be done by either:
- Adding a `collections` prop to LinkModal to filter which collections are shown
- Or by passing it through and filtering in the modal

For now, implement without filtering. The filter can be a follow-up since it requires changes to LinkModal.

**Step 9: Register in editor maps**

In `src/admin/pages/ItemEdit.tsx`, add:
```typescript
import LinkFieldEditor from '../editors/LinkFieldEditor'
// In editorMap:
link: LinkFieldEditor,
```

In `src/admin/editors/BlocksEditor.tsx`, add:
```typescript
import LinkFieldEditor from './LinkFieldEditor'
// In editorMap (before the recursive additions):
link: LinkFieldEditor,
```

In `src/admin/editors/BlockEditor.tsx`, add:
```typescript
import LinkFieldEditor from './LinkFieldEditor'
// In editorMap:
link: LinkFieldEditor,
```

**Step 10: Run all tests**

Run: `bun run test`
Expected: All PASS

**Step 11: Commit**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts src/admin/types/index.ts src/server/routes/schemas.ts src/server/lib/content.ts src/admin/editors/LinkFieldEditor.tsx src/admin/pages/ItemEdit.tsx src/admin/editors/BlocksEditor.tsx src/admin/editors/BlockEditor.tsx
git commit -m "feat: add f.link() field type for internal/external links"
```

---

## Task Order Summary

| Order | Task | Risk | Effort |
|-------|------|------|--------|
| 1 | Site Heading | Low | Small |
| 2 | Repeater UX | Low | Small |
| 3 | Link Modal Bug | Low | Tiny |
| 4 | Unsaved Badge | Low | Small |
| 5 | Image Design | Medium | Medium |
| 6 | Link Field | Low | Large |

Tasks are independent and can be done in any order, but this ordering puts quick wins first.

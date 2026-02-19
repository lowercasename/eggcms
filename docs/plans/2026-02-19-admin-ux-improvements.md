# Admin UX Improvements Design

Date: 2026-02-19

## 1. Site Heading (Environment Variable)

Add `SITE_NAME` env var. The sidebar header shows this instead of hardcoded "EggCMS". Falls back to "EggCMS" if unset.

- Server exposes `siteName` via the `/schemas` API response (or a new `/config` endpoint)
- Admin reads it and renders in `Sidebar.tsx` header
- Works with Docker (just set env var in docker-compose)

## 2 & 3. Link Field (`f.link()`)

New field type that stores either an internal content reference or an external URL.

**Storage format (JSON):**
```json
{ "type": "internal", "ref": "posts:abc-123", "label": "My Post" }
{ "type": "external", "url": "https://example.com" }
```

**Schema API:**
```typescript
f.link('cta')                                     // Any collection
f.link('cta', { collections: ['pages', 'posts'] }) // Restricted
```

**Editor:** Reuses the existing LinkModal two-tab UI (external URL tab + internal content picker tab). Opens on click/button press.

**Menus example:**
```typescript
const menuItem = defineBlock({
  name: 'menuItem',
  label: 'Menu Item',
  fields: [
    f.string('label', { required: true }),
    f.link('target', { required: true }),
  ]
})

defineCollection({
  name: 'menu',
  label: 'Menus',
  fields: [
    f.string('title'),
    f.blocks('items', { blocks: [menuItem] }),
  ]
})
```

**Files to update (7-file pattern):**
1. `src/lib/schema.ts` - Add 'link' to FieldType, `collections?: string[]` to FieldDefinition, `f.link()` helper
2. `src/admin/types/index.ts` - Mirror `collections?: string[]`
3. `src/server/routes/content.ts` - Add `collections` mapping in `mapField()`
4. `src/server/lib/content.ts` - Add 'link' to `JSON_FIELD_TYPES`
5. `src/admin/editors/LinkEditor.tsx` - New editor using LinkModal
6. `src/admin/pages/ItemEdit.tsx` - Add to editorMap
7. `src/admin/editors/BlocksEditor.tsx` + `BlockEditor.tsx` - Add to nested editorMaps

## 4. Repeater UX Improvements

Two changes to `BlocksEditor.tsx`:

**Single block type:** If `field.blocks` has exactly one entry, hide the select dropdown. The "Add" button directly adds that block type.

**Auto-add on select:** When the user picks a block type from the dropdown (multi-block case), immediately add the block. No separate "Add" button click needed. The dropdown resets to placeholder after adding.

## 5. Link Modal Focus Bug

**Problem:** Typing in the link modal's text inputs instead types into the Tiptap editor underneath.

**Root cause (suspected):** Tiptap's ProseMirror editor captures keyboard events even when focus is in the modal.

**Fix:** When any modal opens over the editor, set `editor.setEditable(false)` and restore on close. This prevents the editor from capturing keystrokes. Apply to all modals (LinkModal, ImageSettingsModal, etc.).

## 6. Image Component - InDesign-style Boundaries

Make it visually clear how an image is configured within text flow.

**Always visible (not selected):**
- Subtle dashed border around the image frame showing its full extent
- Small size/alignment badge (e.g. "M, Left" or "Full")

**When selected:**
- Frame becomes more prominent (solid border, accent color)
- Floating toolbar appears (existing behavior)
- Alignment indicators showing text wrap direction

**Design principles:**
- The image should always look like a "frame" placed in the text
- Configuration should be glanceable without selecting
- Inspired by InDesign's frame + text wrap UI

## 7. Unsaved Badge in Collection List

**Problem:** When editing a document with unsaved changes, the collection sidebar doesn't indicate which items are dirty.

**Solution:**
- Add a `dirtyItems` context (simple `Map<string, boolean>`) provided near the app root
- `ItemEdit` writes to it when dirty state changes
- `ItemList` reads from it to show an indicator
- Display: small dot or subtle "Unsaved" badge next to the item label in the sidebar list

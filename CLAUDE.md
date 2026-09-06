# EggCMS

A lightweight, schema-driven headless CMS built for deploying alongside static site generators (Eleventy, Astro, etc.).

## Tech Stack

- **Runtime:** Bun 1.3.8
- **Server:** Hono
- **Database:** SQLite + Drizzle ORM
- **Admin UI:** React 19 + Vite + Tailwind + Radix primitives
- **Rich text:** Tiptap (minimal)
- **Testing:** Vitest

## Key Concepts

**Singletons:** Single instances (Site Settings, Homepage Hero)
**Collections:** Lists of items (Blog Posts, Pages)
**Blocks:** Reusable field groupings defined with `defineBlock()`. Can be used two ways:
- `f.blocks('content', { blocks: [...] })` - Array of blocks (page builder)
- `f.block('featuredImage', { block: imageBlock })` - Single block instance (grouped fields)

## Schema System

Schemas define content types using TypeScript:
- `defineSingleton()` - one-off settings
- `defineCollection()` - lists with drafts
- `defineBlock()` - reusable field groupings
- `f.*` field helpers (string, richtext, image, block, blocks, etc.)

## Schema Configuration

Collections support these options:
- `labelField` - Field to display in admin item list (defaults to 'title'). Use this when your schema doesn't have a `title` field (e.g., `labelField: 'firstName'` for a Person schema).

Blocks support two optional presentation hints, used only by the admin:
- `icon` - a Lucide icon name (e.g. `book-open`) shown on the block's row and in the insert menu. Without it the admin guesses from the block's field types.
- `description` - one sentence shown in the insert menu. Without it the admin lists the block's field labels.

Rich text fields accept `toolbar: 'minimal'` to show only Bold, Italic and Link (for single-paragraph fields such as publication details).

**Important:** When adding new schema properties, you must update THREE places:
1. `src/lib/schema.ts` - Add to `SchemaDefinition` interface
2. `src/admin/types/index.ts` - Add to `Schema` interface
3. `src/server/routes/content.ts` - Include in `/schemas` API response mapping

## Adding New Field Types

To add a new field type (e.g., `f.myField()`), update these files:

### 1. Schema Definition (`src/lib/schema.ts`)
- Add to `FieldType` union type
- Add any new properties to `FieldDefinition` interface (e.g., `myFieldConfig?: SomeType`)
- Add validation in `validateSchema()` if needed
- Add `f.myField()` helper function

### 2. Admin Types (`src/admin/types/index.ts`)
- Mirror any new `FieldDefinition` properties here

### 3. API Schema Mapping (`src/server/routes/content.ts`)
- In the `mapField()` function inside `/schemas` route, include any new field properties so they're sent to the admin UI

### 4. Content Storage (`src/server/lib/content.ts`)
- If the field stores JSON data (objects/arrays), add the type to `JSON_FIELD_TYPES` array
- This ensures proper JSON.stringify on save and JSON.parse on load

### 5. Admin Editor (`src/admin/editors/`)
- Create `MyFieldEditor.tsx` component
- Props: `{ field: FieldDefinition; value: unknown; onChange: (v: unknown) => void; formData?: Record<string, unknown> }`

### 6. Editor Registration (`src/admin/pages/ItemEdit.tsx`)
- Import the editor
- Add to `editorMap`: `myField: MyFieldEditor`

### 7. Nested Editor Support (if field can appear inside blocks)
- Add to `editorMap` in `src/admin/editors/BlocksEditor.tsx`
- Add to `editorMap` in `src/admin/editors/BlockEditor.tsx`

### Example: The `block` field type

The `block` field stores a single block definition's worth of data (vs `blocks` which stores an array):

```typescript
// Schema definition
f.block('featuredImage', { block: imageBlock })

// Stores as JSON: { "src": "/uploads/...", "alt": "...", "caption": "..." }
```

Files modified when adding `block`:
- `src/lib/schema.ts` - Added 'block' to FieldType, `block?: BlockDefinition` to FieldDefinition, `f.block()` helper
- `src/admin/types/index.ts` - Added `block?: BlockDefinition`
- `src/server/routes/content.ts` - Added `block` mapping in `mapField()`
- `src/server/lib/content.ts` - Added 'block' to `JSON_FIELD_TYPES`
- `src/admin/editors/BlockEditor.tsx` - Created editor component
- `src/admin/pages/ItemEdit.tsx` - Added to editorMap
- `src/admin/editors/BlocksEditor.tsx` - Added to editorMap for nesting

### Example: The `file` field type

The `file` field attaches a document (or audio/video) from the media library:

```typescript
f.file('pdf')                              // documents only (the default)
f.file('recording', { kinds: ['audio'] })  // audio only
```

Stores the upload path as a plain string, e.g. `/uploads/<uuid>.pdf`.

Files modified when adding `file`:
- `src/lib/schema.ts` - Added 'file' to FieldType, `kinds?: string[]` to FieldDefinition, `f.file()` helper
- `src/admin/types/index.ts` - Added `kinds?: string[]`
- `src/server/routes/schemas.ts` - Added `kinds` mapping in `mapField()`
- `src/admin/editors/FileEditor.tsx` - Created editor component (drop target + library picker)
- `src/admin/pages/ItemEdit.tsx` + `BlocksEditor.tsx` + `BlockEditor.tsx` - Added to editorMaps

No entry in `JSON_FIELD_TYPES`: the value is a string, like `image`.

### Example: The `link` field type

The `link` field stores either an internal content reference or an external URL:

```typescript
// Schema definition
f.link('cta')                                      // Any collection
f.link('cta', { collections: ['pages', 'posts'] }) // Restricted

// Stores as JSON:
// Internal: { "type": "internal", "ref": "posts:abc-123", "label": "My Post" }
// External: { "type": "external", "url": "https://example.com" }
```

Files modified when adding `link`:
- `src/lib/schema.ts` - Added 'link' to FieldType, `collections?: string[]` to FieldDefinition, `f.link()` helper
- `src/admin/types/index.ts` - Added `collections?: string[]`
- `src/server/routes/schemas.ts` - Added `collections` mapping in `mapField()`
- `src/server/lib/content.ts` - Added 'link' to `JSON_FIELD_TYPES`
- `src/admin/editors/LinkFieldEditor.tsx` - Created editor component (reuses LinkModal)
- `src/admin/pages/ItemEdit.tsx` - Added to editorMap
- `src/admin/editors/BlocksEditor.tsx` + `BlockEditor.tsx` - Added to editorMaps for nesting

## Admin design system

The admin follows the design handoff in `docs/plans/2026-09-06-admin-redesign.md`. The rules that matter when adding UI:

- **Tokens, never hex.** Colours, radii, shadows, fonts and motion live in `@theme` in `src/admin/index.css` and are used as Tailwind utilities (`bg-page`, `text-ink-2`, `border-line-input`, `rounded-panel`, `shadow-menu`). No literal hex in `src/admin/**/*.tsx`.
- **Layout by field type.** `FormField` (`src/admin/components/ui/FormField.tsx`) renders scalar fields as a `FieldRow` (label in a fixed 180px column, 140px inside blocks) and tall fields (`richtext`, `text`, `blocks`, `block`, `image`, `file`) as a `FieldBlock` (label above, type chip, actions on the right). `FieldList` groups consecutive scalar rows into one card. A new field type needs no layout code: register its editor in `src/admin/editors/index.ts` and, if it is tall, add it to `TALL_TYPES`.
- **Editors wire themselves to the label.** Read `useFieldControl()` for the control `id` / hint id. Editors that need buttons in the label row (Full screen, Collapse all) render them inside `<FieldActions>`.
- **Primitives** in `src/admin/components/ui/`: `Button` (primary / secondary / destructive / destructive-solid / dark / structure / ghost / icon), `Chip` (published / edited / draft / type), `SegmentedControl`, `SearchInput`, `NoticeBar` (unsaved / info / selection / published / error), `EmptyState`, `Stepper`, `Toggle`, `InsertDivider`, `TypeMenu`, `OverflowMenu`. Status is always icon + word, never colour alone.
- **Blocks.** `BlocksEditor` renders any block schema: accordion (`openId`), insert-between dividers with a `TypeMenu`, ↑/↓ plus HTML5 drag, inline confirm-remove, and an explaining empty state. Row previews come from `getBlockPreview()` in `src/admin/lib/blocks.ts` (first non-empty text-like field). A blocks field with exactly one block type renders as a numbered `RepeaterEditor`.
- **Media.** `MediaBrowser` (`mode: 'manage' | 'pick'`) is the one way media is browsed; the Media page and every "Choose from library" dialog use it. `GET /api/media` returns `references` for each file so cards can say "Used on 2 pages".
- **Motion** lives in `src/admin/components/motion/` (`Collapse`, `useFlip`, `pinElement`) and honours `prefers-reduced-motion`.

## Storybook

Every primitive, editor, media view and the handoff screens have stories (`*.stories.tsx` next to the component; screens in `src/admin/stories/`). Stories run against an in-memory API (`src/admin/lib/api.mock.ts`, aliased in `.storybook/main.ts`) seeded from `src/admin/lib/sample.ts`.

```bash
bun run storybook        # dev server on :6006
bun run build-storybook  # static build
bun run test:stories     # render every story in headless Chromium with axe a11y checks
```

`bun run test` runs the unit project only; `bunx vitest run` runs both. The story project needs Playwright's Chromium (`bunx playwright install chromium`).

## API Response Structure

Content items returned from the API separate schema fields from system metadata:

```json
{
  "id": "abc-123",
  "title": "My Post",
  "content": "...",
  "_meta": {
    "draft": false,
    "createdAt": "2026-02-05T17:35:48.873Z",
    "updatedAt": "2026-02-06T12:04:29.037Z"
  }
}
```

- `id` stays at top level (primary resource identifier)
- Schema-defined fields at top level
- `_meta` contains system fields:
  - `draft` (boolean) - only for collections
  - `createdAt` (ISO timestamp)
  - `updatedAt` (ISO timestamp)

**Important:** When saving/updating items, send `draft` at the top level (not in `_meta`):
```json
{ "title": "My Post", "draft": 0 }
```

The conversion happens in `src/server/lib/content.ts` in `deserializeRow()`.

## Media library

`src/server/lib/mediaTypes.ts` is the single source of truth for what may be
uploaded. Every allowed MIME type maps to a kind (`image`, `document`, `audio`,
`video`) which the API returns on each item and accepts as a `?kind=` filter.

- Uploads are stored under a slugified version of their original filename
  (`src/server/lib/filenames.ts`), not a UUID, so public URLs are readable and
  citable. Names collide into `-2`, `-3`, and Cyrillic is transliterated.
- Uploads are capped by `MAX_UPLOAD_MB` (default 100).
- Browsers report PDFs as `application/octet-stream` often enough that the type
  falls back to the file extension before an upload is refused.
- Files can be dropped anywhere on the Media page, and onto a `file` field.

## Architecture

- Auto-migration on startup (safe changes only, blocks on unsafe)
- Single admin user via .env (no multi-user)
- JWT auth in httpOnly cookie
- Public API is read-only, published content only
- Webhooks fire on publish/delete (not drafts)
- Local storage default, optional S3/DO Spaces

## Custom Schemas in Docker

For Docker deployments, provide custom schemas via YAML or JavaScript instead of rebuilding the image.

**1. Create a `schemas.yaml` file** (see `schemas.example.yaml` for reference):

```yaml
- name: post
  label: Blog Posts
  type: collection
  fields:
    - name: title
      type: string
      required: true
    - name: content
      type: richtext
```

JavaScript (`schemas.js` with `export default [...]`) is also supported.

**2. Mount it in docker-compose.yml:**

```yaml
volumes:
  - ./schemas.yaml:/app/schemas.yaml
```

**File detection:** The loader tries `/app/schemas.yaml`, `.yml`, then `.js` in order. Set `SCHEMAS_PATH` to use a custom path.

**Fallback:** If no external file is found, the built-in compiled schemas are used.

## Development Approach: Test-First (TDD)

**IMPORTANT:** All new features and bug fixes MUST follow test-driven development:

1. **Write the failing test first** - Define expected behavior before implementation
2. **Run the test to verify it fails** - Confirms the test is actually testing something
3. **Write minimal code to make it pass** - No more than needed
4. **Refactor if needed** - Clean up while tests are green
5. **Commit** - Small, focused commits

This applies to:
- New API endpoints → Write route tests first
- New editors/components → Write component tests first
- Bug fixes → Write a test that reproduces the bug first
- Refactors → Ensure tests exist before changing code

**Do NOT** skip tests for "simple" changes. Most bugs come from "simple" code.

## Commands

```bash
bun install       # Install deps (bunfig.toml pins the hoisted linker)
bun run dev       # Dev server
bun run build     # Production build
bun run start     # Run production
bun run test      # Unit tests (jsdom + server)
bun run test:stories  # Storybook stories in Chromium
bun run storybook # Component workbench
```

## Git Usage

Always run git commands from the working directory. Do not use `git -C /path/to/repo` - just run `git` directly since the working directory is already set correctly.

## Image Processing

Uses `sharp` for image dimension capture on upload. The Dockerfile includes `vips` dependencies required by sharp.

## Database Driver

This project uses `bun:sqlite` (Bun's native SQLite driver) instead of `better-sqlite3`.

**Why:** better-sqlite3 is a native Node.js addon that requires compilation for the specific Node/Bun ABI version. This often causes "NODE_MODULE_VERSION mismatch" errors when Bun's version differs from what the prebuilt binary expects.

**Solution:** bun:sqlite is built into Bun and has no ABI compatibility issues. Drizzle ORM has native support via `drizzle-orm/bun-sqlite`.

**Note:** The `better-sqlite3` package remains in package.json for drizzle-kit compatibility (migrations tooling), but the runtime uses bun:sqlite.

## Design Doc

See `docs/plans/2026-02-05-eggcms-design.md` for full design details.

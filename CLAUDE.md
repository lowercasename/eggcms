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
bun install       # Install deps
bun run dev       # Dev server
bun run build     # Production build
bun run start     # Run production
bun run test      # Run tests
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

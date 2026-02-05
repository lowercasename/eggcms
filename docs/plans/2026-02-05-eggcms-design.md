# EggCMS Design

A lightweight, schema-driven headless CMS for deploying alongside static site generators.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Bun 1.3.8 |
| Server | Hono |
| Database | SQLite + Drizzle ORM |
| Admin UI | React 19 + Vite + Tailwind + Radix primitives |
| Rich text | Tiptap (minimal config) |
| Testing | Vitest |
| Build | tsup (server), Vite (admin) |

## Project Structure

```
eggcms/
├── src/
│   ├── server/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── content.ts
│   │   │   └── media.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   └── lib/
│   │       ├── schema.ts
│   │       ├── schema.test.ts
│   │       ├── migrate.ts
│   │       ├── migrate.test.ts
│   │       ├── storage.ts
│   │       └── webhook.ts
│   ├── admin/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── editors/
│   │   │   ├── StringEditor.tsx
│   │   │   ├── TextEditor.tsx
│   │   │   ├── RichtextEditor.tsx
│   │   │   ├── NumberEditor.tsx
│   │   │   ├── BooleanEditor.tsx
│   │   │   ├── DatetimeEditor.tsx
│   │   │   ├── ImageEditor.tsx
│   │   │   ├── SlugEditor.tsx
│   │   │   ├── SelectEditor.tsx
│   │   │   └── BlocksEditor.tsx
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Singleton.tsx
│   │       ├── Collection.tsx
│   │       └── Media.tsx
│   ├── lib/
│   │   └── schema.ts          # Shared schema types & helpers
│   └── schemas/               # Default/example schemas
│       ├── index.ts
│       ├── settings.ts
│       └── post.ts
├── uploads/                   # Local file storage (gitignored)
├── data/                      # SQLite database (gitignored)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Schema System

### Defining Singletons

```typescript
// schemas/settings.ts
import { defineSingleton, f } from '../lib/schema'

export default defineSingleton({
  name: 'settings',
  label: 'Site Settings',
  fields: [
    f.string('siteTitle', { required: true }),
    f.string('tagline'),
    f.image('logo'),
    f.string('footerText'),
  ]
})
```

### Defining Collections

```typescript
// schemas/post.ts
import { defineCollection, f } from '../lib/schema'

export default defineCollection({
  name: 'post',
  label: 'Blog Posts',
  fields: [
    f.string('title', { required: true }),
    f.slug('slug', { from: 'title' }),
    f.richtext('content'),
    f.image('featuredImage'),
    f.datetime('publishedAt'),
  ]
})
```

Collections automatically get:
- `id` (auto-increment primary key)
- `draft` (boolean, default: true)
- `created_at`, `updated_at` (timestamps)

### Defining Blocks (Page Builder)

```typescript
// schemas/blocks/hero.ts
import { defineBlock, f } from '../../lib/schema'

export default defineBlock({
  name: 'hero',
  label: 'Hero Section',
  fields: [
    f.string('heading', { required: true }),
    f.text('subheading'),
    f.image('backgroundImage'),
    f.select('alignment', {
      options: ['left', 'center', 'right'],
      default: 'center'
    }),
  ]
})
```

### Using Blocks in a Collection

```typescript
// schemas/page.ts
import { defineCollection, f } from '../lib/schema'
import hero from './blocks/hero'
import textBlock from './blocks/textBlock'
import cta from './blocks/cta'

export default defineCollection({
  name: 'page',
  label: 'Pages',
  fields: [
    f.string('title', { required: true }),
    f.slug('slug', { from: 'title' }),
    f.blocks('content', {
      blocks: [hero, textBlock, cta]
    }),
  ]
})
```

### Field Types

| Helper | Description | SQL Type |
|--------|-------------|----------|
| `f.string()` | Single-line text | TEXT |
| `f.text()` | Multi-line textarea | TEXT |
| `f.richtext()` | Tiptap editor | TEXT |
| `f.number()` | Numeric input | REAL |
| `f.boolean()` | Toggle switch | INTEGER |
| `f.datetime()` | Date/time picker | TEXT (ISO 8601) |
| `f.image()` | Image upload + preview | TEXT (path/URL) |
| `f.slug()` | Auto-generated from field | TEXT |
| `f.select()` | Dropdown options | TEXT |
| `f.blocks()` | Page builder array | TEXT (JSON) |

### Field Options

```typescript
f.string('title', {
  required: true,       // Validation
  default: 'Untitled',  // Default value
  placeholder: '...',   // UI hint
})

f.slug('slug', {
  from: 'title',        // Auto-generate from this field
})

f.select('status', {
  options: ['draft', 'review', 'published'],
  default: 'draft',
})

f.blocks('content', {
  blocks: [hero, text, cta],  // Allowed block types
})
```

## Database

### Schema

```
_schemas          # Tracks schema state for migrations
├── name (PK)
├── hash
├── fields_json
└── type

_media            # Uploaded files registry
├── id
├── filename
├── path
├── mimetype
├── size
├── width
├── height
├── alt
└── created_at

[collection]      # One table per collection (e.g., post, page)
├── id
├── ...fields
├── draft
├── created_at
└── updated_at

[singleton]       # One table per singleton (max 1 row)
├── id
└── ...fields
```

### Auto-Migration Rules

**Safe (automatic):**
- Add field → `ALTER TABLE ADD COLUMN`
- Remove field with no data → drop column
- Remove field with data → keep orphaned, log warning
- Type changes within same storage class (string ↔ text ↔ slug ↔ richtext)

**Blocked (CMS won't start):**
- Unsafe type changes (e.g., string → number with non-numeric data)
- Reserved field names: `id`, `created_at`, `updated_at`, `_type`
- Duplicate field names

Error messages tell you exactly what's wrong; you fix the data directly in SQLite or adjust your schema.

## API

### Endpoints

```
# Content
GET    /api/content/:schema          # List (collections) or get (singletons)
GET    /api/content/:schema/:id      # Get item by ID
POST   /api/content/:schema          # Create item (auth required)
PUT    /api/content/:schema/:id      # Update item (auth required)
DELETE /api/content/:schema/:id      # Delete item (auth required)

# Auth
POST   /api/auth/login               # Returns JWT in httpOnly cookie
POST   /api/auth/logout              # Clears cookie

# Media
GET    /api/media                    # List all media
POST   /api/media                    # Upload file (auth required)
DELETE /api/media/:id                # Delete file (auth required)
```

### Response Format

```typescript
// Collection list
{ data: [...items], meta: { total: 42 } }

// Single item / singleton
{ data: { id, ...fields } }

// Error
{ error: { code: 'NOT_FOUND', message: '...' } }
```

### Public vs Authenticated Access

When `PUBLIC_API=true` (default):
- `GET` requests return published content only (no drafts)
- All `POST`, `PUT`, `DELETE` require authentication

When `PUBLIC_API=false`:
- All requests require authentication

```bash
GET /api/content/post              # Published only
GET /api/content/post?drafts=true  # All items (requires auth)
```

## Authentication

### Configuration

```bash
# .env
ADMIN_EMAIL=mom@example.com
ADMIN_PASSWORD=correct-horse-battery-staple
JWT_SECRET=random-32-char-string-here
```

### Security

- Password compared with `crypto.timingSafeEqual`
- JWT in httpOnly, secure, sameSite=strict cookie
- 7-day expiry
- Rate limiting: 5 login attempts per minute
- No password reset flow (update .env and restart)

## File Storage

### Configuration

```bash
# Local (default)
STORAGE=local

# S3-compatible (e.g., DO Spaces)
STORAGE=s3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=my-bucket
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

### Behavior

- Images resized on upload (configurable max dimensions)
- Original preserved
- Metadata stored in `_media` table
- Local files served from `/uploads/*`
- S3 files served via signed URLs or public bucket

## Webhooks

### Configuration

```bash
WEBHOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_xxx
WEBHOOK_DEBOUNCE_MS=5000  # Optional: wait for inactivity before firing
```

### Behavior

Webhook fires when:
- Publishing an item (draft → published, or saving published item)
- Deleting a published item
- Saving a singleton

Webhook does NOT fire when:
- Saving or deleting a draft

Payload:
```json
{
  "event": "content.updated",
  "schema": "post",
  "id": 42,
  "timestamp": "2026-02-05T14:30:00Z"
}
```

Fire-and-forget; failures logged but don't block saves.

## Admin UI

### Layout

**Three-column for collections:**
```
[ Nav ] [ Item List ] [ Edit Form ]
```

**Two-column for singletons:**
```
[ Nav ] [ Edit Form ]
```

### Navigation

```
SINGLETONS
· Settings
· Homepage

COLLECTIONS
· Posts
· Pages

─────────
Media
```

### Routes

```
/admin/login
/admin/singletons/:name
/admin/collections/:name
/admin/collections/:name/:id
/admin/media
```

### Rich Text Editor (Tiptap)

Minimal toolbar:
- Bold, italic
- Links
- Headings (H2, H3)
- Bullet list, numbered list
- Images

## Deployment

### Site Project Structure

```
my-site/
├── schemas/
│   ├── index.ts
│   ├── settings.ts
│   └── post.ts
├── site/                    # Eleventy/Astro
│   ├── _data/
│   │   └── cms.js
│   └── ...
├── docker-compose.yml
├── .env
└── Dockerfile
```

### Dockerfile

```dockerfile
FROM ghcr.io/yourname/eggcms:latest
COPY schemas/ /app/schemas/
```

### docker-compose.yml

```yaml
services:
  cms:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    env_file: .env

  site:
    image: node:20-alpine
    working_dir: /site
    volumes:
      - ./site:/site
    command: npx @11ty/eleventy --serve
    ports:
      - "8080:8080"
    depends_on:
      - cms
```

### Eleventy Data Fetch

```javascript
// site/_data/cms.js
module.exports = async function() {
  const base = process.env.CMS_URL || 'http://cms:3000'
  const [posts, settings] = await Promise.all([
    fetch(`${base}/api/content/post`).then(r => r.json()),
    fetch(`${base}/api/content/settings`).then(r => r.json()),
  ])
  return { posts: posts.data, settings: settings.data }
}
```

## Environment Variables

```bash
# Required
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
JWT_SECRET=random-32-char-string

# Optional
PORT=3000
PUBLIC_API=true
WEBHOOK_URL=https://...
WEBHOOK_DEBOUNCE_MS=5000

# Storage (default: local)
STORAGE=local
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

## Development

```bash
bun install       # Install dependencies
bun run dev       # Hono + Vite dev servers
bun run build     # Production build
bun run start     # Run production
bun run test      # Run tests
```

## Testing

Tested:
- Schema loader (validation, error detection)
- Migration logic (change detection, SQL generation)
- API routes (CRUD, auth, permissions)
- Field serialization (blocks to JSON)

Not tested (manual):
- React components
- Tiptap configuration

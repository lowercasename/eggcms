# EggCMS

A lightweight, schema-driven headless CMS built with Bun, Hono, and React. Designed to deploy alongside static site generators.

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings

# Start development server
bun run dev
```

The admin UI will be available at `http://localhost:5173/admin` and the API at `http://localhost:3000`.

## Running the Server

### Development

```bash
# Run both API server and admin UI with hot reload
bun run dev

# Or run them separately
bun run dev:server   # API server on port 3000
bun run dev:admin    # Vite dev server on port 5173
```

### Production

```bash
# Build everything
bun run build

# Start production server
bun run start
```

In production, the admin UI is served from `/admin` on the same port as the API.

## Configuration

All configuration is done via environment variables. Create a `.env` file in the project root:

### Required Settings

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Admin login email address |
| `ADMIN_PASSWORD` | Admin login password |
| `JWT_SECRET` | Secret key for JWT tokens (use a random 32+ character string) |

### Optional Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `PUBLIC_API` | `true` | Allow unauthenticated read access to published content |
| `WEBHOOK_URL` | - | URL to POST webhook notifications |
| `WEBHOOK_DEBOUNCE_MS` | `5000` | Debounce webhook calls (ms). Set to `0` to disable |

### Storage Settings

By default, files are stored locally in the `uploads/` directory.

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE` | `local` | Storage backend: `local` or `s3` |
| `S3_ENDPOINT` | - | S3-compatible endpoint URL |
| `S3_BUCKET` | - | S3 bucket name |
| `S3_ACCESS_KEY` | - | S3 access key |
| `S3_SECRET_KEY` | - | S3 secret key |

## Defining Schemas

Schemas define your content types. Create schema files in `src/schemas/`:

### Collections

Collections are lists of items (e.g., blog posts, products):

```typescript
// src/schemas/post.ts
import { defineCollection, f } from '../lib/schema'

export default defineCollection({
  name: 'post',
  label: 'Blog Posts',
  fields: [
    f.string('title', { required: true }),
    f.slug('slug', { from: 'title' }),
    f.richtext('content'),
    f.image('featuredImage', { label: 'Featured image' }),
    f.datetime('publishedAt', { label: 'Publish date' }),
    f.boolean('featured'),
  ],
})
```

### Singletons

Singletons are single records (e.g., site settings, homepage):

```typescript
// src/schemas/settings.ts
import { defineSingleton, f } from '../lib/schema'

export default defineSingleton({
  name: 'settings',
  label: 'Site Settings',
  fields: [
    f.string('siteTitle', { required: true, default: 'My Site' }),
    f.string('tagline'),
    f.image('logo'),
    f.text('footerText', { label: 'Footer text' }),
  ],
})
```

### Register Schemas

Export all schemas from `src/schemas/index.ts`:

```typescript
import type { SchemaDefinition } from '../lib/schema'
import settings from './settings'
import post from './post'

const schemas: SchemaDefinition[] = [settings, post]

export default schemas
```

### Field Types

| Type | Description | Options |
|------|-------------|---------|
| `f.string(name)` | Single-line text | `required`, `default`, `placeholder`, `label` |
| `f.text(name)` | Multi-line text | `required`, `default`, `placeholder`, `label` |
| `f.richtext(name)` | Rich text editor (HTML) | `required`, `label` |
| `f.number(name)` | Numeric input | `required`, `default`, `placeholder`, `label` |
| `f.boolean(name)` | Toggle switch | `default`, `label` |
| `f.datetime(name)` | Date and time picker | `required`, `default`, `label` |
| `f.image(name)` | Image upload | `required`, `label` |
| `f.slug(name)` | URL-friendly slug | `from` (required - source field), `label` |
| `f.select(name)` | Dropdown select | `options` (required - string array), `required`, `label` |

### Field Labels

Fields support custom labels. If not provided, camelCase names are automatically converted to sentence case:

```typescript
// Custom label
f.string('siteTitle', { label: 'Site title' })

// Auto-converted: "publishedAt" -> "Published at"
f.datetime('publishedAt')
```

## Schema Updates / Migrations

EggCMS automatically handles schema migrations on server startup:

- **New schemas**: Tables are created automatically
- **New fields**: Columns are added with optional defaults
- **Removed fields**: Columns are kept in the database (data preserved) but no longer appear in the admin UI
- **Type changes**: Not automatically migrated - requires manual database changes

To update a schema:

1. Edit the schema file in `src/schemas/`
2. Restart the server (or let `--watch` restart it automatically in dev mode)
3. Migrations run automatically

You'll see output like:

```
Running migrations...
  [new] Creating table: post
  [changed] Migrating: settings
    Adding column: newField
  Completed 2 migration(s)
Server ready
```

Or if no changes:

```
Running migrations...
  No schema changes detected
Server ready
```

**Note**: In development mode (`bun run dev`), the server should automatically restart when schema files change. If it doesn't, manually restart with `Ctrl+C` and `bun run dev`.

The database is stored at `data/eggcms.db` (SQLite).

## API Reference

### Public Endpoints (when `PUBLIC_API=true`)

```
GET /api/content/:schema          # List items or get singleton
GET /api/content/:schema/:id      # Get single item
```

Draft items are never exposed to the public API.

### Authenticated Endpoints

```
POST   /api/auth/login            # Login
POST   /api/auth/logout           # Logout
GET    /api/auth/me               # Get current user

GET    /api/content/:schema       # List (with ?drafts=true for drafts)
GET    /api/content/:schema/:id   # Get item
POST   /api/content/:schema       # Create item
PUT    /api/content/:schema/:id   # Update item
DELETE /api/content/:schema/:id   # Delete item

GET    /api/media                 # List media
POST   /api/media                 # Upload media (multipart/form-data)
DELETE /api/media/:id             # Delete media
```

### Response Format

```json
{
  "data": { ... },
  "meta": { "total": 10 }
}
```

Errors:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found"
  }
}
```

## Webhooks

Configure `WEBHOOK_URL` to receive POST notifications when content is published or deleted:

```json
{
  "event": "content.updated",
  "schema": "post",
  "id": "abc-123-uuid",
  "timestamp": "2026-02-05T10:30:00.000Z"
}
```

Events:
- `content.updated` - Content published or singleton updated
- `content.deleted` - Published content deleted

Draft saves do not trigger webhooks. Use `WEBHOOK_DEBOUNCE_MS` to batch rapid changes.

## Project Structure

```
├── src/
│   ├── admin/          # React admin UI
│   ├── lib/            # Shared utilities
│   ├── schemas/        # Content type definitions
│   └── server/         # Hono API server
├── data/               # SQLite database
├── uploads/            # Local file uploads
└── dist/               # Production build output
```

## Tech Stack

- **Runtime**: Bun 1.3+
- **Server**: Hono
- **Database**: SQLite (via better-sqlite3 + Drizzle ORM)
- **Admin UI**: React 19 + React Router + Tailwind CSS v4
- **Rich Text**: Tiptap
- **Auth**: JWT with httpOnly cookies

## License

MIT

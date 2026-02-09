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

## Docker Deployment

EggCMS is published to GitHub Container Registry and can be deployed alongside your static site generator.

### Quick Start with Docker

```bash
docker pull ghcr.io/lowercasename/eggcms:latest
```

### Deploying with a Static Site (Eleventy, Astro, etc.)

The typical production setup is:

- **EggCMS** runs on a server (VPS, fly.io, Railway, etc.)
- **Your static site** builds and deploys to Vercel, Netlify, or Cloudflare Pages
- **Webhooks** trigger rebuilds when content changes

```yaml
# docker-compose.yml (for EggCMS on your server)
services:
  cms:
    image: ghcr.io/lowercasename/eggcms:latest
    ports:
      - "3333:3000"
    volumes:
      - ./data:/app/data               # SQLite database
      - ./uploads:/app/uploads         # Uploaded media files
      - ./schemas.js:/app/schemas.js   # Your custom schemas
    environment:
      - ADMIN_EMAIL=admin@example.com
      - ADMIN_PASSWORD=your-secure-password
      - JWT_SECRET=your-random-32-char-secret-key
      # Trigger Vercel rebuild when content is published:
      - WEBHOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_xxxx/yyyy
    restart: unless-stopped
```

### Directory Structure

```
your-server/
├── docker-compose.yml
├── schemas.js              # Your content schemas
├── data/                   # Created automatically (SQLite DB)
└── uploads/                # Created automatically (media files)
```

### Custom Schemas

Create a `cms/schemas.js` file to define your content types:

```javascript
// cms/schemas.js
export default [
  // Singleton for site-wide settings
  {
    name: 'settings',
    label: 'Site Settings',
    type: 'singleton',
    fields: [
      { name: 'siteTitle', type: 'string', required: true },
      { name: 'tagline', type: 'string' },
      { name: 'logo', type: 'image' },
    ],
  },

  // Collection for blog posts
  {
    name: 'post',
    label: 'Blog Posts',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'slug', type: 'slug', from: 'title' },
      { name: 'content', type: 'richtext' },
      { name: 'featuredImage', type: 'image' },
      { name: 'publishedAt', type: 'datetime' },
    ],
  },

  // Collection with page builder blocks
  {
    name: 'page',
    label: 'Pages',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'slug', type: 'slug', from: 'title' },
      { name: 'blocks', type: 'blocks', blocks: ['heroBlock', 'textBlock'] },
    ],
  },

  // Block definitions (referenced by name above)
  {
    name: 'heroBlock',
    label: 'Hero Section',
    type: 'block',
    fields: [
      { name: 'heading', type: 'string', required: true },
      { name: 'subheading', type: 'string' },
      { name: 'backgroundImage', type: 'image' },
    ],
  },

  {
    name: 'textBlock',
    label: 'Text Content',
    type: 'block',
    fields: [
      { name: 'content', type: 'richtext', required: true },
    ],
  },
]
```

### Fetching Content in Your Static Site

Use your CMS server's public URL (or set it via environment variable):

**Eleventy (JavaScript):**

```javascript
// _data/posts.js
module.exports = async function() {
  const cmsUrl = process.env.CMS_URL || 'https://cms.yoursite.com';
  const response = await fetch(`${cmsUrl}/api/content/post`);
  const { data } = await response.json();
  return data;
};
```

**Astro:**

```astro
---
const cmsUrl = import.meta.env.CMS_URL || 'https://cms.yoursite.com';
const response = await fetch(`${cmsUrl}/api/content/post`);
const { data: posts } = await response.json();
---
{posts.map(post => <article>{post.title}</article>)}
```

### Triggering Rebuilds

EggCMS can notify external services when content is published or deleted, triggering a rebuild of your static site.

**Vercel:**

1. Go to your Vercel project → Settings → Git → Deploy Hooks
2. Create a hook (e.g., "CMS Update") and copy the URL
3. Set it as your webhook:

```yaml
environment:
  - WEBHOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_xxxx/yyyy
```

**Netlify:**

1. Go to Site settings → Build & deploy → Build hooks
2. Create a hook and copy the URL
3. Set it as your webhook:

```yaml
environment:
  - WEBHOOK_URL=https://api.netlify.com/build_hooks/xxxxxxxxxxxx
```

**Cloudflare Pages:**

1. Go to your Pages project → Settings → Builds & deployments → Deploy hooks
2. Create a hook and copy the URL
3. Set it as your webhook:

```yaml
environment:
  - WEBHOOK_URL=https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/xxxx
```

The CMS sends a POST request to the webhook URL when content is published or deleted. Use `WEBHOOK_DEBOUNCE_MS` (default: 5000) to batch rapid changes.

#### Build Command

Instead of (or in addition to) an HTTP webhook, you can run a shell command directly when content changes. This is useful for triggering static site builds on the same server:

```yaml
environment:
  - WEBHOOK_COMMAND=npx @11ty/eleventy
  - WEBHOOK_COMMAND_CWD=/var/www/my-site
```

The command shares the same debounce as HTTP webhooks. If a build is already running, additional triggers queue one more build (not multiple), ensuring the latest content is always built without pile-up.

### Volumes Reference

| Volume | Purpose | Required |
|--------|---------|----------|
| `/app/data` | SQLite database storage | Yes |
| `/app/uploads` | Uploaded media files | Yes |
| `/app/schemas.js` | Custom schema definitions | Yes (for custom schemas) |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `JWT_SECRET` | Yes | Random 32+ character secret |
| `PORT` | No | Server port (default: 3000) |
| `PUBLIC_API` | No | Allow public read access (default: true) |
| `PUBLIC_URL` | No | Base URL for media files (e.g., `https://cms.example.com`) |
| `WEBHOOK_URL` | No | URL for content change notifications |
| `WEBHOOK_COMMAND` | No | Shell command to run on content changes (e.g., `npx @11ty/eleventy`) |
| `WEBHOOK_COMMAND_CWD` | No | Working directory for the command (default: server cwd) |
| `SCHEMAS_PATH` | No | Custom path to schemas file (default: /app/schemas.js) |

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
| `PUBLIC_URL` | - | Base URL for media files (e.g., `https://cms.example.com`). When set, image paths in API responses become full URLs. |
| `WEBHOOK_URL` | - | URL to POST webhook notifications |
| `WEBHOOK_COMMAND` | - | Shell command to run on content changes |
| `WEBHOOK_COMMAND_CWD` | - | Working directory for the command (default: server cwd) |
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

Schemas define your content types. For Docker deployments, create a `schemas.js` file:

```javascript
// schemas.js
export default [
  // Singleton: single record (e.g., site settings)
  {
    name: 'settings',
    label: 'Site Settings',
    type: 'singleton',
    fields: [
      { name: 'siteTitle', type: 'string', required: true, default: 'My Site' },
      { name: 'tagline', type: 'string' },
      { name: 'logo', type: 'image' },
    ],
  },

  // Collection: list of items (e.g., blog posts)
  {
    name: 'post',
    label: 'Blog Posts',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'slug', type: 'slug', from: 'title' },
      { name: 'content', type: 'richtext' },
      { name: 'featuredImage', type: 'image', label: 'Featured image' },
      { name: 'publishedAt', type: 'datetime', label: 'Publish date' },
      { name: 'featured', type: 'boolean' },
    ],
  },

  // Collection with page builder blocks
  {
    name: 'page',
    label: 'Pages',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'slug', type: 'slug', from: 'title' },
      { name: 'blocks', type: 'blocks', blocks: ['heroBlock', 'textBlock'] },
    ],
  },

  // Block: reusable field group (referenced by name in blocks fields)
  {
    name: 'heroBlock',
    label: 'Hero Section',
    type: 'block',
    fields: [
      { name: 'heading', type: 'string', required: true },
      { name: 'backgroundImage', type: 'image' },
    ],
  },

  {
    name: 'textBlock',
    label: 'Text Content',
    type: 'block',
    fields: [
      { name: 'content', type: 'richtext', required: true },
    ],
  },
]
```

Mount it in Docker: `-v ./schemas.js:/app/schemas.js`

### Schema Types

| Type | Description |
|------|-------------|
| `singleton` | Single record (site settings, homepage config) |
| `collection` | List of items with drafts (blog posts, products) |
| `block` | Reusable field group for page builders |

### Field Types

| Type | Description | Options |
|------|-------------|---------|
| `string` | Single-line text | `required`, `default`, `placeholder`, `label` |
| `text` | Multi-line text | `required`, `default`, `placeholder`, `label` |
| `richtext` | Rich text editor (HTML) | `required`, `label` |
| `number` | Numeric input | `required`, `default`, `placeholder`, `label` |
| `boolean` | Toggle switch | `default`, `label` |
| `datetime` | Date and time picker | `required`, `default`, `label` |
| `image` | Image upload | `required`, `label` |
| `slug` | URL-friendly slug | `from` (source field name), `label` |
| `select` | Dropdown select | `options` (string array), `required`, `default`, `label` |
| `blocks` | Page builder blocks | `blocks` (array of block names) |
| `block` | Single block instance | `block` (block name) |

### Field Options

```javascript
// Required field
{ name: 'title', type: 'string', required: true }

// With default value
{ name: 'status', type: 'select', options: ['draft', 'published'], default: 'draft' }

// Custom label (otherwise auto-generated from name)
{ name: 'publishedAt', type: 'datetime', label: 'Publish date' }

// Slug from another field
{ name: 'slug', type: 'slug', from: 'title' }

// Page builder with specific blocks
{ name: 'content', type: 'blocks', blocks: ['heroBlock', 'textBlock', 'imageBlock'] }
```

### TypeScript Schemas (Development)

When developing EggCMS itself, you can use TypeScript helpers in `src/schemas/`:

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
  ],
})
```

Register schemas in `src/schemas/index.ts`. These are compiled into the Docker image.

## Schema Updates / Migrations

EggCMS automatically handles schema migrations on server startup:

- **New schemas**: Tables are created automatically
- **New fields**: Columns are added with optional defaults
- **Removed fields**: Columns are kept in the database (data preserved) but no longer appear in the admin UI
- **Type changes**: Not automatically migrated - requires manual database changes

To update a schema:

1. Edit your `schemas.js` file
2. Restart the container (`docker-compose restart cms`)
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

### Public Endpoints

```
GET /api/schemas                  # List all schema definitions (always public)
GET /api/content/:schema          # List items or get singleton (when PUBLIC_API=true)
GET /api/content/:schema/:id      # Get single item (when PUBLIC_API=true)
```

The `/api/schemas` endpoint is always public, allowing API introspection for building frontends. Content endpoints require `PUBLIC_API=true` (the default). Draft items are never exposed to the public API.

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

### Build Command

Set `WEBHOOK_COMMAND` to run a shell command when content changes, instead of or in addition to sending an HTTP webhook. Useful for triggering static site builds on the same server:

```bash
WEBHOOK_COMMAND="npx @11ty/eleventy"
WEBHOOK_COMMAND_CWD="/var/www/my-site"
```

Commands are queued so only one runs at a time. If content changes arrive while a build is running, one additional build is queued (further triggers are collapsed). Both `WEBHOOK_URL` and `WEBHOOK_COMMAND` can be used together.

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

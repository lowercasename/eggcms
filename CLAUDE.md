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
**Blocks:** Reusable page builder components (one level deep, no nesting)

## Schema System

Schemas define content types using TypeScript:
- `defineSingleton()` - one-off settings
- `defineCollection()` - lists with drafts
- `defineBlock()` - page builder components
- `f.*` field helpers (string, richtext, image, blocks, etc.)

## Schema Configuration

Collections support these options:
- `labelField` - Field to display in admin item list (defaults to 'title'). Use this when your schema doesn't have a `title` field (e.g., `labelField: 'firstName'` for a Person schema).

**Important:** When adding new schema properties, you must update THREE places:
1. `src/lib/schema.ts` - Add to `SchemaDefinition` interface
2. `src/admin/types/index.ts` - Add to `Schema` interface
3. `src/server/routes/content.ts` - Include in `/_schemas` API response mapping

## Architecture

- Auto-migration on startup (safe changes only, blocks on unsafe)
- Single admin user via .env (no multi-user)
- JWT auth in httpOnly cookie
- Public API is read-only, published content only
- Webhooks fire on publish/delete (not drafts)
- Local storage default, optional S3/DO Spaces

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

## Database Driver

This project uses `bun:sqlite` (Bun's native SQLite driver) instead of `better-sqlite3`.

**Why:** better-sqlite3 is a native Node.js addon that requires compilation for the specific Node/Bun ABI version. This often causes "NODE_MODULE_VERSION mismatch" errors when Bun's version differs from what the prebuilt binary expects.

**Solution:** bun:sqlite is built into Bun and has no ABI compatibility issues. Drizzle ORM has native support via `drizzle-orm/bun-sqlite`.

**Note:** The `better-sqlite3` package remains in package.json for drizzle-kit compatibility (migrations tooling), but the runtime uses bun:sqlite.

## Design Doc

See `docs/plans/2026-02-05-eggcms-design.md` for full design details.

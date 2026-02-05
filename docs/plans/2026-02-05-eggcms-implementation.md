# EggCMS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a lightweight, schema-driven headless CMS with Bun, Hono, SQLite, and React 19.

**Architecture:** Schema files define content types → auto-migration creates DB tables → Hono API serves content → React admin provides editing UI.

**Tech Stack:** Bun 1.3.8, Hono, Drizzle ORM, SQLite, React 19, Vite, Tailwind, Radix, Tiptap, Vitest

---

## Phase 1: Project Scaffolding

### Task 1.1: Initialize Bun Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Create package.json**

```json
{
  "name": "eggcms",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/server/index.ts",
    "build": "bun run build:server && bun run build:admin",
    "build:server": "bun build src/server/index.ts --outdir dist/server --target node",
    "build:admin": "vite build",
    "start": "bun dist/server/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "drizzle-orm": "^0.39.0",
    "better-sqlite3": "^11.8.0",
    "jose": "^6.0.0",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/bun": "^1.2.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "drizzle-kit": "^0.30.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
data/
uploads/
.env
*.log
.DS_Store
```

**Step 4: Create .env.example**

```bash
# Required
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-in-production
JWT_SECRET=generate-a-random-32-char-string

# Optional
PORT=3000
PUBLIC_API=true
WEBHOOK_URL=
WEBHOOK_DEBOUNCE_MS=5000

# Storage (default: local)
STORAGE=local
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

**Step 5: Install dependencies**

Run: `bun install`

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize project with bun and dependencies"
```

---

### Task 1.2: Create Directory Structure

**Files:**
- Create: `src/server/index.ts`
- Create: `src/lib/schema.ts`
- Create: `src/schemas/index.ts`

**Step 1: Create server entry point stub**

```typescript
// src/server/index.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

const port = parseInt(process.env.PORT || '3000')
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })

export default app
```

**Step 2: Create schema lib stub**

```typescript
// src/lib/schema.ts
export type FieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'image'
  | 'slug'
  | 'select'
  | 'blocks'

export interface FieldDefinition {
  name: string
  type: FieldType
  required?: boolean
  default?: unknown
  placeholder?: string
  options?: string[]
  from?: string
  blocks?: BlockDefinition[]
}

export interface SchemaDefinition {
  name: string
  label: string
  type: 'singleton' | 'collection' | 'block'
  fields: FieldDefinition[]
  drafts?: boolean
}

export type BlockDefinition = SchemaDefinition & { type: 'block' }
export type SingletonDefinition = SchemaDefinition & { type: 'singleton' }
export type CollectionDefinition = SchemaDefinition & { type: 'collection' }

export function defineSingleton(config: Omit<SingletonDefinition, 'type'>): SingletonDefinition {
  return { ...config, type: 'singleton' }
}

export function defineCollection(config: Omit<CollectionDefinition, 'type' | 'drafts'> & { drafts?: boolean }): CollectionDefinition {
  return { ...config, type: 'collection', drafts: config.drafts ?? true }
}

export function defineBlock(config: Omit<BlockDefinition, 'type'>): BlockDefinition {
  return { ...config, type: 'block' }
}

// Field helpers
export const f = {
  string: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'string', ...opts }),
  text: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'text', ...opts }),
  richtext: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'richtext', ...opts }),
  number: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'number', ...opts }),
  boolean: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'boolean', ...opts }),
  datetime: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'datetime', ...opts }),
  image: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'image', ...opts }),
  slug: (name: string, opts: { from: string } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'slug', ...opts }),
  select: (name: string, opts: { options: string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'select', ...opts }),
  blocks: (name: string, opts: { blocks: BlockDefinition[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'blocks', ...opts }),
}
```

**Step 3: Create schemas registry stub**

```typescript
// src/schemas/index.ts
import type { SchemaDefinition } from '../lib/schema'

// Schemas will be imported here
const schemas: SchemaDefinition[] = []

export default schemas
```

**Step 4: Test server starts**

Run: `bun run dev`
Expected: Server running message, GET /health returns `{"status":"ok"}`

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: add directory structure and server stub"
```

---

## Phase 2: Schema System

### Task 2.1: Schema Validation

**Files:**
- Modify: `src/lib/schema.ts`
- Create: `src/lib/schema.test.ts`

**Step 1: Write failing test for reserved field names**

```typescript
// src/lib/schema.test.ts
import { describe, it, expect } from 'vitest'
import { validateSchema, defineCollection, f } from './schema'

describe('validateSchema', () => {
  it('rejects reserved field names', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('id')],
    })
    expect(() => validateSchema(schema)).toThrow('Field \'id\' is reserved')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/schema.test.ts`
Expected: FAIL - validateSchema not defined

**Step 3: Implement validateSchema**

Add to `src/lib/schema.ts`:

```typescript
const RESERVED_FIELDS = ['id', 'created_at', 'updated_at', '_type', 'draft']

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaValidationError'
  }
}

export function validateSchema(schema: SchemaDefinition): void {
  const fieldNames = new Set<string>()

  for (const field of schema.fields) {
    // Check reserved names
    if (RESERVED_FIELDS.includes(field.name)) {
      throw new SchemaValidationError(`Field '${field.name}' is reserved`)
    }

    // Check duplicates
    if (fieldNames.has(field.name)) {
      throw new SchemaValidationError(`Field '${field.name}' defined twice in schema '${schema.name}'`)
    }
    fieldNames.add(field.name)

    // Validate slug has 'from' field
    if (field.type === 'slug' && !field.from) {
      throw new SchemaValidationError(`Slug field '${field.name}' requires 'from' option`)
    }

    // Validate select has options
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      throw new SchemaValidationError(`Select field '${field.name}' requires 'options'`)
    }

    // Validate blocks has block definitions
    if (field.type === 'blocks' && (!field.blocks || field.blocks.length === 0)) {
      throw new SchemaValidationError(`Blocks field '${field.name}' requires 'blocks' array`)
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/schema.test.ts`
Expected: PASS

**Step 5: Add more validation tests**

```typescript
// Add to src/lib/schema.test.ts
it('rejects duplicate field names', () => {
  const schema = defineCollection({
    name: 'post',
    label: 'Posts',
    fields: [f.string('title'), f.string('title')],
  })
  expect(() => validateSchema(schema)).toThrow('Field \'title\' defined twice')
})

it('requires from option for slug fields', () => {
  const schema = defineCollection({
    name: 'post',
    label: 'Posts',
    fields: [f.string('slug', { type: 'slug' } as any)],
  })
  expect(() => validateSchema(schema)).toThrow('requires \'from\' option')
})

it('accepts valid schema', () => {
  const schema = defineCollection({
    name: 'post',
    label: 'Posts',
    fields: [
      f.string('title', { required: true }),
      f.slug('slug', { from: 'title' }),
    ],
  })
  expect(() => validateSchema(schema)).not.toThrow()
})
```

**Step 6: Run all tests**

Run: `bun test`
Expected: All PASS

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add schema validation with reserved field and duplicate checks"
```

---

### Task 2.2: Example Schemas

**Files:**
- Create: `src/schemas/settings.ts`
- Create: `src/schemas/post.ts`
- Modify: `src/schemas/index.ts`

**Step 1: Create settings singleton**

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
    f.text('footerText'),
  ],
})
```

**Step 2: Create post collection**

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
    f.image('featuredImage'),
    f.datetime('publishedAt'),
  ],
})
```

**Step 3: Register schemas**

```typescript
// src/schemas/index.ts
import type { SchemaDefinition } from '../lib/schema'
import settings from './settings'
import post from './post'

const schemas: SchemaDefinition[] = [settings, post]

export default schemas
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add example settings and post schemas"
```

---

## Phase 3: Database Layer

### Task 3.1: Database Connection

**Files:**
- Create: `src/server/db/index.ts`
- Create: `src/server/db/tables.ts`

**Step 1: Create database connection**

```typescript
// src/server/db/index.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const sqlite = new Database(path.join(dataDir, 'eggcms.db'))
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite)
export { sqlite }
```

**Step 2: Create internal tables schema**

```typescript
// src/server/db/tables.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Tracks schema state for migrations
export const schemasTable = sqliteTable('_schemas', {
  name: text('name').primaryKey(),
  type: text('type').notNull(), // 'singleton' | 'collection'
  hash: text('hash').notNull(),
  fieldsJson: text('fields_json').notNull(),
})

// Media registry
export const mediaTable = sqliteTable('_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  createdAt: text('created_at').notNull(),
})
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add database connection and internal tables"
```

---

### Task 3.2: Migration Logic

**Files:**
- Create: `src/server/lib/migrate.ts`
- Create: `src/server/lib/migrate.test.ts`

**Step 1: Write failing test for table creation**

```typescript
// src/server/lib/migrate.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { generateTableSql } from './migrate'
import { defineCollection, f } from '../../lib/schema'

describe('generateTableSql', () => {
  it('generates CREATE TABLE for collection', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [
        f.string('title', { required: true }),
        f.number('views'),
        f.boolean('featured'),
      ],
    })

    const sql = generateTableSql(schema)

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "post"')
    expect(sql).toContain('"id" INTEGER PRIMARY KEY AUTOINCREMENT')
    expect(sql).toContain('"title" TEXT NOT NULL')
    expect(sql).toContain('"views" REAL')
    expect(sql).toContain('"featured" INTEGER')
    expect(sql).toContain('"draft" INTEGER DEFAULT 1')
    expect(sql).toContain('"created_at" TEXT')
    expect(sql).toContain('"updated_at" TEXT')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/lib/migrate.test.ts`
Expected: FAIL - generateTableSql not defined

**Step 3: Implement generateTableSql**

```typescript
// src/server/lib/migrate.ts
import type { SchemaDefinition, FieldDefinition } from '../../lib/schema'

function fieldToSqlType(field: FieldDefinition): string {
  const typeMap: Record<string, string> = {
    string: 'TEXT',
    text: 'TEXT',
    richtext: 'TEXT',
    slug: 'TEXT',
    select: 'TEXT',
    image: 'TEXT',
    datetime: 'TEXT',
    blocks: 'TEXT',
    number: 'REAL',
    boolean: 'INTEGER',
  }
  return typeMap[field.type] || 'TEXT'
}

export function generateTableSql(schema: SchemaDefinition): string {
  const columns: string[] = []

  // Primary key
  columns.push('"id" INTEGER PRIMARY KEY AUTOINCREMENT')

  // User-defined fields
  for (const field of schema.fields) {
    const sqlType = fieldToSqlType(field)
    const notNull = field.required ? ' NOT NULL' : ''
    const defaultVal = field.default !== undefined
      ? ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`
      : ''
    columns.push(`"${field.name}" ${sqlType}${notNull}${defaultVal}`)
  }

  // Collection-specific columns
  if (schema.type === 'collection') {
    columns.push('"draft" INTEGER DEFAULT 1')
  }

  // Timestamps
  columns.push('"created_at" TEXT')
  columns.push('"updated_at" TEXT')

  return `CREATE TABLE IF NOT EXISTS "${schema.name}" (\n  ${columns.join(',\n  ')}\n)`
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/server/lib/migrate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SQL generation for schema tables"
```

---

### Task 3.3: Schema Hash and Change Detection

**Files:**
- Modify: `src/server/lib/migrate.ts`
- Modify: `src/server/lib/migrate.test.ts`

**Step 1: Write failing test for schema hashing**

```typescript
// Add to src/server/lib/migrate.test.ts
import { hashSchema, detectChanges } from './migrate'

describe('hashSchema', () => {
  it('produces consistent hash for same schema', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title')],
    })
    expect(hashSchema(schema)).toBe(hashSchema(schema))
  })

  it('produces different hash when fields change', () => {
    const schema1 = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title')],
    })
    const schema2 = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title'), f.string('body')],
    })
    expect(hashSchema(schema1)).not.toBe(hashSchema(schema2))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/lib/migrate.test.ts`
Expected: FAIL

**Step 3: Implement hashSchema**

```typescript
// Add to src/server/lib/migrate.ts
import { createHash } from 'crypto'

export function hashSchema(schema: SchemaDefinition): string {
  const content = JSON.stringify({
    name: schema.name,
    type: schema.type,
    fields: schema.fields,
    drafts: schema.type === 'collection' ? (schema as any).drafts : undefined,
  })
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/server/lib/migrate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add schema hashing for change detection"
```

---

### Task 3.4: Run Migrations on Startup

**Files:**
- Create: `src/server/lib/migrator.ts`
- Modify: `src/server/index.ts`

**Step 1: Create migrator module**

```typescript
// src/server/lib/migrator.ts
import { sqlite, db } from '../db'
import { schemasTable } from '../db/tables'
import { eq } from 'drizzle-orm'
import { validateSchema, type SchemaDefinition } from '../../lib/schema'
import { generateTableSql, hashSchema } from './migrate'

export async function runMigrations(schemas: SchemaDefinition[]): Promise<void> {
  // Create internal tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "_schemas" (
      "name" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL,
      "hash" TEXT NOT NULL,
      "fields_json" TEXT NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "_media" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "filename" TEXT NOT NULL,
      "path" TEXT NOT NULL,
      "mimetype" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "width" INTEGER,
      "height" INTEGER,
      "alt" TEXT,
      "created_at" TEXT NOT NULL
    )
  `)

  for (const schema of schemas) {
    // Validate schema
    validateSchema(schema)

    // Skip blocks (they're not tables)
    if (schema.type === 'block') continue

    const hash = hashSchema(schema)
    const existing = db.select().from(schemasTable).where(eq(schemasTable.name, schema.name)).get()

    if (!existing) {
      // New schema - create table
      console.log(`Creating table for schema: ${schema.name}`)
      const sql = generateTableSql(schema)
      sqlite.exec(sql)

      // Record schema
      db.insert(schemasTable).values({
        name: schema.name,
        type: schema.type,
        hash,
        fieldsJson: JSON.stringify(schema.fields),
      }).run()
    } else if (existing.hash !== hash) {
      // Schema changed - handle migration
      console.log(`Schema changed: ${schema.name}`)
      await handleSchemaMigration(schema, existing, hash)
    }
  }
}

async function handleSchemaMigration(
  schema: SchemaDefinition,
  existing: { fieldsJson: string; hash: string },
  newHash: string
): Promise<void> {
  const oldFields = JSON.parse(existing.fieldsJson) as Array<{ name: string; type: string }>
  const newFields = schema.fields

  const oldFieldNames = new Set(oldFields.map((f) => f.name))
  const newFieldNames = new Set(newFields.map((f) => f.name))

  // Add new columns
  for (const field of newFields) {
    if (!oldFieldNames.has(field.name)) {
      const sqlType = field.type === 'number' ? 'REAL' : field.type === 'boolean' ? 'INTEGER' : 'TEXT'
      const defaultVal = field.default !== undefined
        ? ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`
        : ''
      console.log(`  Adding column: ${field.name}`)
      sqlite.exec(`ALTER TABLE "${schema.name}" ADD COLUMN "${field.name}" ${sqlType}${defaultVal}`)
    }
  }

  // Check for removed columns (just warn, don't drop)
  for (const oldField of oldFields) {
    if (!newFieldNames.has(oldField.name)) {
      console.warn(`  Warning: Field '${oldField.name}' removed from schema but column kept in database`)
    }
  }

  // Update schema record
  db.update(schemasTable)
    .set({ hash: newHash, fieldsJson: JSON.stringify(schema.fields) })
    .where(eq(schemasTable.name, schema.name))
    .run()
}
```

**Step 2: Update server to run migrations**

```typescript
// src/server/index.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { runMigrations } from './lib/migrator'
import schemas from '../schemas'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

async function start() {
  // Run migrations
  await runMigrations(schemas)

  const port = parseInt(process.env.PORT || '3000')
  console.log(`Server running on http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}

start().catch(console.error)

export default app
```

**Step 3: Test migrations run**

Run: `bun run dev`
Expected: "Creating table for schema: settings" and "Creating table for schema: post"

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add auto-migration on startup"
```

---

## Phase 4: API Routes

### Task 4.1: Authentication

**Files:**
- Create: `src/server/lib/auth.ts`
- Create: `src/server/routes/auth.ts`
- Create: `src/server/lib/auth.test.ts`

**Step 1: Write failing test for password comparison**

```typescript
// src/server/lib/auth.test.ts
import { describe, it, expect } from 'vitest'
import { verifyPassword } from './auth'

describe('verifyPassword', () => {
  it('returns true for matching password', () => {
    expect(verifyPassword('secret', 'secret')).toBe(true)
  })

  it('returns false for non-matching password', () => {
    expect(verifyPassword('secret', 'wrong')).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/lib/auth.test.ts`
Expected: FAIL

**Step 3: Implement auth utilities**

```typescript
// src/server/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'crypto'

const encoder = new TextEncoder()

export function verifyPassword(input: string, expected: string): boolean {
  const inputBuf = encoder.encode(input)
  const expectedBuf = encoder.encode(expected)

  if (inputBuf.length !== expectedBuf.length) {
    // Compare anyway to prevent timing attacks
    timingSafeEqual(inputBuf, inputBuf)
    return false
  }

  return timingSafeEqual(inputBuf, expectedBuf)
}

export async function createToken(email: string): Promise<string> {
  const secret = encoder.encode(process.env.JWT_SECRET || 'dev-secret')

  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const secret = encoder.encode(process.env.JWT_SECRET || 'dev-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload as { email: string }
  } catch {
    return null
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/server/lib/auth.test.ts`
Expected: PASS

**Step 5: Create auth routes**

```typescript
// src/server/routes/auth.ts
import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { verifyPassword, createToken } from '../lib/auth'

const auth = new Hono()

// Rate limiting state (simple in-memory)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

auth.post('/login', async (c) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown'

  // Rate limiting
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  if (attempts && attempts.count >= 5 && now < attempts.resetAt) {
    return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }, 429)
  }

  const body = await c.req.json()
  const { email, password } = body

  const validEmail = process.env.ADMIN_EMAIL
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validEmail || !validPassword) {
    return c.json({ error: { code: 'CONFIG_ERROR', message: 'Admin credentials not configured' } }, 500)
  }

  if (email !== validEmail || !verifyPassword(password, validPassword)) {
    // Track failed attempt
    const current = loginAttempts.get(ip) || { count: 0, resetAt: now + 60000 }
    loginAttempts.set(ip, { count: current.count + 1, resetAt: current.resetAt })

    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401)
  }

  // Clear attempts on success
  loginAttempts.delete(ip)

  const token = await createToken(email)

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return c.json({ data: { email } })
})

auth.post('/logout', (c) => {
  deleteCookie(c, 'token', { path: '/' })
  return c.json({ data: { success: true } })
})

export default auth
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add authentication with JWT and rate limiting"
```

---

### Task 4.2: Auth Middleware

**Files:**
- Create: `src/server/middleware/auth.ts`

**Step 1: Create auth middleware**

```typescript
// src/server/middleware/auth.ts
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'

export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, 'token')

  if (!token) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
  }

  c.set('user', payload)
  await next()
}

export async function optionalAuth(c: Context, next: Next) {
  const token = getCookie(c, 'token')

  if (token) {
    const payload = await verifyToken(token)
    if (payload) {
      c.set('user', payload)
    }
  }

  await next()
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add auth middleware"
```

---

### Task 4.3: Content API Routes

**Files:**
- Create: `src/server/routes/content.ts`
- Create: `src/server/lib/content.ts`

**Step 1: Create content service**

```typescript
// src/server/lib/content.ts
import { sqlite } from '../db'
import type { SchemaDefinition } from '../../lib/schema'

export function getSchema(schemas: SchemaDefinition[], name: string): SchemaDefinition | undefined {
  return schemas.find((s) => s.name === name && s.type !== 'block')
}

export function listItems(schema: SchemaDefinition, includeDrafts: boolean): unknown[] {
  const draftClause = schema.type === 'collection' && !includeDrafts ? 'WHERE draft = 0' : ''
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" ${draftClause} ORDER BY id DESC`)
  return stmt.all()
}

export function getItem(schema: SchemaDefinition, id: number): unknown {
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" WHERE id = ?`)
  return stmt.get(id)
}

export function getSingleton(schema: SchemaDefinition): unknown {
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" LIMIT 1`)
  return stmt.get()
}

export function createItem(schema: SchemaDefinition, data: Record<string, unknown>): unknown {
  const now = new Date().toISOString()
  const fields = schema.fields.map((f) => f.name)
  const values: unknown[] = []
  const placeholders: string[] = []
  const columns: string[] = []

  for (const field of fields) {
    columns.push(`"${field}"`)
    placeholders.push('?')
    values.push(data[field] ?? null)
  }

  if (schema.type === 'collection') {
    columns.push('"draft"')
    placeholders.push('?')
    values.push(data.draft ?? 1)
  }

  columns.push('"created_at"', '"updated_at"')
  placeholders.push('?', '?')
  values.push(now, now)

  const sql = `INSERT INTO "${schema.name}" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
  const result = sqlite.prepare(sql).run(...values)

  return getItem(schema, result.lastInsertRowid as number)
}

export function updateItem(schema: SchemaDefinition, id: number, data: Record<string, unknown>): unknown {
  const now = new Date().toISOString()
  const sets: string[] = []
  const values: unknown[] = []

  for (const field of schema.fields) {
    if (field.name in data) {
      sets.push(`"${field.name}" = ?`)
      values.push(data[field.name])
    }
  }

  if (schema.type === 'collection' && 'draft' in data) {
    sets.push('"draft" = ?')
    values.push(data.draft)
  }

  sets.push('"updated_at" = ?')
  values.push(now)
  values.push(id)

  const sql = `UPDATE "${schema.name}" SET ${sets.join(', ')} WHERE id = ?`
  sqlite.prepare(sql).run(...values)

  return getItem(schema, id)
}

export function deleteItem(schema: SchemaDefinition, id: number): boolean {
  const result = sqlite.prepare(`DELETE FROM "${schema.name}" WHERE id = ?`).run(id)
  return result.changes > 0
}

export function upsertSingleton(schema: SchemaDefinition, data: Record<string, unknown>): unknown {
  const existing = getSingleton(schema)
  if (existing) {
    return updateItem(schema, (existing as { id: number }).id, data)
  } else {
    return createItem(schema, data)
  }
}
```

**Step 2: Create content routes**

```typescript
// src/server/routes/content.ts
import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../middleware/auth'
import * as content from '../lib/content'
import type { SchemaDefinition } from '../../lib/schema'

export function createContentRoutes(schemas: SchemaDefinition[]) {
  const app = new Hono()

  // GET /api/content/:schema - List or get singleton
  app.get('/:schema', optionalAuth, (c) => {
    const schemaName = c.req.param('schema')
    const schema = content.getSchema(schemas, schemaName)

    if (!schema) {
      return c.json({ error: { code: 'NOT_FOUND', message: `Schema '${schemaName}' not found` } }, 404)
    }

    const user = c.get('user')
    const publicApi = process.env.PUBLIC_API !== 'false'

    if (!publicApi && !user) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    }

    if (schema.type === 'singleton') {
      const data = content.getSingleton(schema)
      return c.json({ data: data || {} })
    }

    const includeDrafts = c.req.query('drafts') === 'true' && !!user
    const items = content.listItems(schema, includeDrafts)
    return c.json({ data: items, meta: { total: items.length } })
  })

  // GET /api/content/:schema/:id - Get single item
  app.get('/:schema/:id', optionalAuth, (c) => {
    const schemaName = c.req.param('schema')
    const id = parseInt(c.req.param('id'))
    const schema = content.getSchema(schemas, schemaName)

    if (!schema || schema.type === 'singleton') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404)
    }

    const user = c.get('user')
    const publicApi = process.env.PUBLIC_API !== 'false'

    if (!publicApi && !user) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    }

    const item = content.getItem(schema, id) as { draft?: number } | undefined

    if (!item) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    // Don't expose drafts to public API
    if (item.draft && !user) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    return c.json({ data: item })
  })

  // POST /api/content/:schema - Create item
  app.post('/:schema', requireAuth, async (c) => {
    const schemaName = c.req.param('schema')
    const schema = content.getSchema(schemas, schemaName)

    if (!schema) {
      return c.json({ error: { code: 'NOT_FOUND', message: `Schema '${schemaName}' not found` } }, 404)
    }

    const body = await c.req.json()

    if (schema.type === 'singleton') {
      const data = content.upsertSingleton(schema, body)
      return c.json({ data })
    }

    const data = content.createItem(schema, body)
    return c.json({ data }, 201)
  })

  // PUT /api/content/:schema/:id - Update item
  app.put('/:schema/:id', requireAuth, async (c) => {
    const schemaName = c.req.param('schema')
    const id = parseInt(c.req.param('id'))
    const schema = content.getSchema(schemas, schemaName)

    if (!schema || schema.type === 'singleton') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404)
    }

    const existing = content.getItem(schema, id)
    if (!existing) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    const body = await c.req.json()
    const data = content.updateItem(schema, id, body)
    return c.json({ data })
  })

  // DELETE /api/content/:schema/:id - Delete item
  app.delete('/:schema/:id', requireAuth, (c) => {
    const schemaName = c.req.param('schema')
    const id = parseInt(c.req.param('id'))
    const schema = content.getSchema(schemas, schemaName)

    if (!schema || schema.type === 'singleton') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404)
    }

    const deleted = content.deleteItem(schema, id)
    if (!deleted) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    return c.json({ data: { success: true } })
  })

  return app
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add content API routes"
```

---

### Task 4.4: Wire Up Routes

**Files:**
- Modify: `src/server/index.ts`

**Step 1: Update server to include all routes**

```typescript
// src/server/index.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { runMigrations } from './lib/migrator'
import auth from './routes/auth'
import { createContentRoutes } from './routes/content'
import schemas from '../schemas'

const app = new Hono()

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes
app.route('/api/auth', auth)
app.route('/api/content', createContentRoutes(schemas))

async function start() {
  await runMigrations(schemas)

  const port = parseInt(process.env.PORT || '3000')
  console.log(`Server running on http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}

start().catch(console.error)

export default app
```

**Step 2: Test API endpoints**

Run: `bun run dev`

Test with curl:
```bash
# Create .env with test credentials
echo "ADMIN_EMAIL=test@test.com" > .env
echo "ADMIN_PASSWORD=test123" >> .env
echo "JWT_SECRET=test-secret-key-32chars!!" >> .env

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Create post
curl -X POST http://localhost:3000/api/content/post \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Hello World","content":"<p>Test</p>"}'

# List posts (public)
curl http://localhost:3000/api/content/post
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire up API routes with CORS"
```

---

## Phase 5: Continue in Part 2

This plan continues in a follow-up document with:
- Phase 5: Media Routes & Storage
- Phase 6: Webhooks
- Phase 7: Admin UI Setup
- Phase 8: Admin UI Components
- Phase 9: Field Editors
- Phase 10: Docker & Deployment

---

**Checkpoint:** After completing Phase 4, you have a working API with:
- Schema validation and auto-migration
- Authentication with JWT
- Full CRUD for content
- Public read access for published content

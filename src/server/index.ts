import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import path from 'path'
import fs from 'fs'
import { runMigrations } from './lib/migrator'
import { loadSchemas } from './lib/schemaLoader'
import auth from './routes/auth'
import { createContentRoutes } from './routes/content'
import media from './routes/media'

const app = new Hono()

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Static file serving for uploads
app.use('/uploads/*', serveStatic({ root: './' }))

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes (initialized after schema loading)
app.route('/api/auth', auth)
app.route('/api/media', media)

// Content routes are added dynamically after schema loading
let contentRoutesInitialized = false

// Initialize schemas and routes
async function initialize() {
  const schemas = await loadSchemas()

  // Add content routes with loaded schemas
  app.route('/api/content', createContentRoutes(schemas))
  contentRoutesInitialized = true

  // Run migrations
  await runMigrations(schemas)

  console.log(`Loaded ${schemas.length} schema(s): ${schemas.map(s => s.name).join(', ')}`)
  console.log('Server ready')
}

// Serve admin SPA (in production)
const adminPath = path.join(process.cwd(), 'dist', 'admin')
if (fs.existsSync(adminPath)) {
  // Serve static files from admin build
  // Strip /admin prefix so /admin/assets/foo.js serves ./dist/admin/assets/foo.js
  app.use('/admin/*', serveStatic({
    root: './dist/admin',
    rewriteRequestPath: (p) => p.replace(/^\/admin/, ''),
  }))

  // For SPA routing, serve index.html for all /admin routes that don't match static files
  app.get('/admin/*', async (c) => {
    const indexPath = path.join(adminPath, 'index.html')
    const html = fs.readFileSync(indexPath, 'utf-8')
    return c.html(html)
  })

  // Redirect /admin to /admin/
  app.get('/admin', (c) => c.redirect('/admin/'))
}

// Start initialization
initialize().catch(console.error)

// Export for Bun's native serve
export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
}

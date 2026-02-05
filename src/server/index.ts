import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import path from 'path'
import fs from 'fs'
import { runMigrations } from './lib/migrator'
import auth from './routes/auth'
import { createContentRoutes } from './routes/content'
import media from './routes/media'
import schemas from '../schemas'

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

// Routes
app.route('/api/auth', auth)
app.route('/api/content', createContentRoutes(schemas))
app.route('/api/media', media)

// Serve admin SPA (in production)
const adminPath = path.join(process.cwd(), 'dist', 'admin')
if (fs.existsSync(adminPath)) {
  // Serve static files from admin build
  app.use('/admin/*', serveStatic({ root: './dist/admin' }))

  // For SPA routing, serve index.html for all /admin routes that don't match static files
  app.get('/admin/*', async (c) => {
    const indexPath = path.join(adminPath, 'index.html')
    const html = fs.readFileSync(indexPath, 'utf-8')
    return c.html(html)
  })

  // Redirect /admin to /admin/
  app.get('/admin', (c) => c.redirect('/admin/'))
}

// Run migrations on startup
runMigrations(schemas).then(() => {
  console.log('Server ready')
}).catch(console.error)

// Export for Bun's native serve
export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
}

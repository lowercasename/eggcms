import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
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

// Run migrations on startup
runMigrations(schemas).then(() => {
  console.log('Server ready')
}).catch(console.error)

// Export for Bun's native serve
export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
}

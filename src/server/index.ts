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

import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

const port = parseInt(process.env.PORT || '3000')
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })

export default app

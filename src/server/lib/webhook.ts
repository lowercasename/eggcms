// src/server/lib/webhook.ts

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export interface WebhookPayload {
  event: 'content.updated' | 'content.deleted'
  schema: string
  id?: string  // Note: Using string for UUID (not number)
  timestamp: string
}

export async function fireWebhook(payload: WebhookPayload): Promise<void> {
  const url = process.env.WEBHOOK_URL
  if (!url) return

  const debounceMs = parseInt(process.env.WEBHOOK_DEBOUNCE_MS || '0')

  if (debounceMs > 0) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => sendWebhook(url, payload), debounceMs)
  } else {
    await sendWebhook(url, payload)
  }
}

async function sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`Webhook sent: ${payload.event} ${payload.schema}`)
    }
  } catch (error) {
    console.error('Webhook error:', error)
  }
}

export function shouldFireWebhook(
  schema: { type: string },
  action: 'create' | 'update' | 'delete',
  data?: { draft?: number | boolean }
): boolean {
  // Singletons always fire
  if (schema.type === 'singleton') return true

  // Deleting a published item fires
  if (action === 'delete' && data && !data.draft) return true

  // Publishing (draft=false) fires
  if ((action === 'create' || action === 'update') && data && !data.draft) return true

  return false
}

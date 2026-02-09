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
  const command = process.env.WEBHOOK_COMMAND
  if (!url && !command) return

  const debounceMs = parseInt(process.env.WEBHOOK_DEBOUNCE_MS || '0')

  if (debounceMs > 0) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      if (url) sendWebhook(url, payload)
      if (command) runCommand()
    }, debounceMs)
  } else {
    if (url) await sendWebhook(url, payload)
    if (command) await runCommand()
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

// Command execution with queuing
type SpawnResult = { exitCode: number; stdout: string; stderr: string }
type SpawnFn = (command: string, cwd: string) => Promise<SpawnResult>

let commandRunning = false
let commandPending = false
let pendingResolvers: Array<() => void> = []

let spawnProcess: SpawnFn = async (command: string, cwd: string) => {
  const proc = Bun.spawn(['/bin/sh', '-c', command], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const exitCode = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  return { exitCode, stdout, stderr }
}

export function setSpawnProcess(fn: SpawnFn): void {
  spawnProcess = fn
}

export async function runCommand(): Promise<void> {
  const command = process.env.WEBHOOK_COMMAND
  if (!command) return

  // If already running, queue one pending build
  if (commandRunning) {
    commandPending = true
    return new Promise<void>(resolve => {
      pendingResolvers.push(resolve)
    })
  }

  commandRunning = true
  const cwd = process.env.WEBHOOK_COMMAND_CWD || process.cwd()

  try {
    console.log(`[build] Starting: ${command}`)
    const result = await spawnProcess(command, cwd)
    if (result.exitCode !== 0) {
      console.error(`[build] Process exited with code ${result.exitCode}`)
      if (result.stderr) {
        console.error(`[build] stderr: ${result.stderr}`)
      }
    } else {
      console.log(`[build] Process exited with code 0`)
    }
  } catch (error) {
    console.error('[build] Failed to start process:', error)
  } finally {
    commandRunning = false

    // If a build was queued, start it
    if (commandPending) {
      commandPending = false
      const resolvers = pendingResolvers
      pendingResolvers = []
      runCommand().then(() => {
        resolvers.forEach(r => r())
      })
    }
  }
}

export function shouldFireWebhook(
  schema: { type: string },
  action: 'create' | 'update' | 'delete',
  data?: { _meta?: { draft?: boolean } }
): boolean {
  // Singletons always fire
  if (schema.type === 'singleton') return true

  const isDraft = data?._meta?.draft

  // Deleting a published item fires
  if (action === 'delete' && data && !isDraft) return true

  // Publishing (draft=false) fires
  if ((action === 'create' || action === 'update') && data && !isDraft) return true

  return false
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('webhook command execution', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  // Helper to import a fresh module (no cached state between tests)
  async function loadWebhook() {
    vi.resetModules()
    return await import('./webhook.js')
  }

  // Helper to create a mock spawnProcess function
  function createMockSpawn(exitCode = 0) {
    return vi.fn().mockResolvedValue({ exitCode, stdout: '', stderr: '' })
  }

  describe('runCommand', () => {
    it('calls spawnProcess with the configured command', async () => {
      process.env.WEBHOOK_COMMAND = 'echo hello'
      delete process.env.WEBHOOK_COMMAND_CWD

      const { runCommand, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await runCommand()

      expect(mockSpawn).toHaveBeenCalledWith('echo hello', process.cwd())
    })

    it('uses WEBHOOK_COMMAND_CWD when set', async () => {
      process.env.WEBHOOK_COMMAND = 'npm run build'
      process.env.WEBHOOK_COMMAND_CWD = '/var/www/my-site'

      const { runCommand, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await runCommand()

      expect(mockSpawn).toHaveBeenCalledWith('npm run build', '/var/www/my-site')
    })

    it('does nothing when WEBHOOK_COMMAND is not set', async () => {
      delete process.env.WEBHOOK_COMMAND

      const { runCommand, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await runCommand()

      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('logs non-zero exit codes', async () => {
      process.env.WEBHOOK_COMMAND = 'exit 1'

      const { runCommand, setSpawnProcess } = await loadWebhook()
      const mockSpawn = vi.fn().mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'build failed',
      })
      setSpawnProcess(mockSpawn)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(console, 'log').mockImplementation(() => {})

      await runCommand()

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('exited with code 1')
      )
    })

    it('logs stderr output on failure', async () => {
      process.env.WEBHOOK_COMMAND = 'exit 1'

      const { runCommand, setSpawnProcess } = await loadWebhook()
      const mockSpawn = vi.fn().mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'Error: Missing template',
      })
      setSpawnProcess(mockSpawn)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(console, 'log').mockImplementation(() => {})

      await runCommand()

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Missing template')
      )
    })

    it('logs successful completion', async () => {
      process.env.WEBHOOK_COMMAND = 'echo done'

      const { runCommand, setSpawnProcess } = await loadWebhook()
      setSpawnProcess(createMockSpawn(0))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await runCommand()

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('exited with code 0')
      )
    })
  })

  describe('command queuing', () => {
    it('queues a build if one is already running', async () => {
      process.env.WEBHOOK_COMMAND = 'build'
      delete process.env.WEBHOOK_URL

      const { runCommand, setSpawnProcess } = await loadWebhook()

      let resolveFirst!: (v: any) => void
      let resolveSecond!: (v: any) => void

      let spawnCount = 0
      const mockSpawn = vi.fn().mockImplementation(() => {
        spawnCount++
        if (spawnCount === 1) {
          return new Promise(r => { resolveFirst = r })
        }
        return new Promise(r => { resolveSecond = r })
      })
      setSpawnProcess(mockSpawn)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      // Start first build (don't await)
      const first = runCommand()
      // Trigger second while first is running
      const second = runCommand()

      expect(spawnCount).toBe(1) // only first spawned

      // Complete first build
      resolveFirst({ exitCode: 0, stdout: '', stderr: '' })
      await first

      // Let queued build start
      await vi.advanceTimersByTimeAsync(0)

      expect(spawnCount).toBe(2) // second spawned after first completed

      resolveSecond({ exitCode: 0, stdout: '', stderr: '' })
      await second
    })

    it('collapses multiple triggers into one queued build', async () => {
      process.env.WEBHOOK_COMMAND = 'build'
      delete process.env.WEBHOOK_URL

      const { runCommand, setSpawnProcess } = await loadWebhook()

      let resolveFirst!: (v: any) => void
      let resolveSecond!: (v: any) => void

      let spawnCount = 0
      const mockSpawn = vi.fn().mockImplementation(() => {
        spawnCount++
        if (spawnCount === 1) {
          return new Promise(r => { resolveFirst = r })
        }
        return new Promise(r => { resolveSecond = r })
      })
      setSpawnProcess(mockSpawn)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      // Start first build
      const first = runCommand()
      // Trigger 3 more while running
      runCommand()
      runCommand()
      runCommand()

      expect(spawnCount).toBe(1)

      // Complete first
      resolveFirst({ exitCode: 0, stdout: '', stderr: '' })
      await first
      await vi.advanceTimersByTimeAsync(0)

      // Only ONE more build should have started
      expect(spawnCount).toBe(2)

      resolveSecond({ exitCode: 0, stdout: '', stderr: '' })
    })
  })

  describe('fireWebhook with command', () => {
    it('fires both HTTP webhook and command when both are configured', async () => {
      process.env.WEBHOOK_URL = 'https://example.com/hook'
      process.env.WEBHOOK_COMMAND = 'echo build'
      delete process.env.WEBHOOK_DEBOUNCE_MS

      const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchSpy)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      const { fireWebhook, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await fireWebhook({
        event: 'content.updated',
        schema: 'post',
        timestamp: new Date().toISOString(),
      })

      expect(fetchSpy).toHaveBeenCalled()
      expect(mockSpawn).toHaveBeenCalled()
    })

    it('fires only command when WEBHOOK_URL is not set', async () => {
      delete process.env.WEBHOOK_URL
      process.env.WEBHOOK_COMMAND = 'echo build'
      delete process.env.WEBHOOK_DEBOUNCE_MS

      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      const { fireWebhook, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await fireWebhook({
        event: 'content.updated',
        schema: 'post',
        timestamp: new Date().toISOString(),
      })

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(mockSpawn).toHaveBeenCalled()
    })

    it('fires only HTTP when WEBHOOK_COMMAND is not set', async () => {
      process.env.WEBHOOK_URL = 'https://example.com/hook'
      delete process.env.WEBHOOK_COMMAND
      delete process.env.WEBHOOK_DEBOUNCE_MS

      const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchSpy)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      const { fireWebhook, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await fireWebhook({
        event: 'content.updated',
        schema: 'post',
        timestamp: new Date().toISOString(),
      })

      expect(fetchSpy).toHaveBeenCalled()
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('does nothing when neither is configured', async () => {
      delete process.env.WEBHOOK_URL
      delete process.env.WEBHOOK_COMMAND

      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      const { fireWebhook, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      await fireWebhook({
        event: 'content.updated',
        schema: 'post',
        timestamp: new Date().toISOString(),
      })

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('applies debounce to both HTTP and command', async () => {
      process.env.WEBHOOK_URL = 'https://example.com/hook'
      process.env.WEBHOOK_COMMAND = 'echo build'
      process.env.WEBHOOK_DEBOUNCE_MS = '1000'

      const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchSpy)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      const { fireWebhook, setSpawnProcess } = await loadWebhook()
      const mockSpawn = createMockSpawn()
      setSpawnProcess(mockSpawn)

      const payload = {
        event: 'content.updated' as const,
        schema: 'post',
        timestamp: new Date().toISOString(),
      }

      fireWebhook(payload)
      fireWebhook(payload)
      fireWebhook(payload)

      // Nothing fired yet (debouncing)
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(mockSpawn).not.toHaveBeenCalled()

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(1000)

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })
  })
})

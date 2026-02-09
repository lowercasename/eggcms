# Webhook Command Execution

## Overview

Add shell command execution on webhook triggers, allowing EggCMS to run a build command (e.g., `npx @11ty/eleventy`) directly when content changes.

## Configuration

```
WEBHOOK_COMMAND=npx @11ty/eleventy          # Shell command to run
WEBHOOK_COMMAND_CWD=/var/www/my-site        # Working directory (defaults to process.cwd())
```

Both `WEBHOOK_URL` and `WEBHOOK_COMMAND` are optional and independent. If both are set, both fire after the shared debounce period.

## Command Execution

### Queuing State Machine

Three states:
- **Idle** — no build running, next trigger starts immediately
- **Running** — build in progress, next trigger sets a "pending" flag
- **Running + Pending** — one queued, additional triggers are collapsed

When a running build completes, if pending is set, it clears the flag and starts a new build.

### Process Details

- Runs via `Bun.spawn(['sh', '-c', command])` for shell interpretation
- `cwd` set from `WEBHOOK_COMMAND_CWD` or `process.cwd()`
- Inherits server environment variables
- Non-blocking (doesn't affect API responses)
- Logs start, stdout/stderr, and exit code to console
- Errors logged but don't retry

## Files Changed

1. `src/server/lib/webhook.ts` — command execution + queuing
2. `src/server/lib/webhook.test.ts` — new test file
3. `.env.example` — new env vars
4. `README.md` — documentation

import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const sqlite = new Database(path.join(dataDir, 'eggcms.db'))
sqlite.exec('PRAGMA journal_mode = WAL')

export const db = drizzle(sqlite)
export { sqlite }

// Fold the write-ahead log back into eggcms.db, then let the file go. SQLite
// only does this by itself once the log reaches 1000 pages, so until then a
// small site's content can live in eggcms.db-wal alone. A plain close() would
// wait for every prepared statement to be finalized; close(true) finalizes
// them itself.
export function closeDatabase() {
  sqlite.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  sqlite.close(true)
}

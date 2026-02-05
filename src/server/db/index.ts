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

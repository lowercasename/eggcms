import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const sqlite: DatabaseType = new Database(path.join(dataDir, 'eggcms.db'))
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite)
export { sqlite }

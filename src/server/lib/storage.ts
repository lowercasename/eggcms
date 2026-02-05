// src/server/lib/storage.ts
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export interface StorageService {
  save(file: File): Promise<{ path: string; filename: string }>
  delete(filePath: string): Promise<void>
  getUrl(filePath: string): string
}

export function createLocalStorage(): StorageService {
  const uploadsDir = path.join(process.cwd(), 'uploads')

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  return {
    async save(file: File) {
      const ext = path.extname(file.name) || ''
      const filename = `${randomUUID()}${ext}`
      const filePath = path.join(uploadsDir, filename)

      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      return { path: `/uploads/${filename}`, filename: file.name }
    },

    async delete(filePath: string) {
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''))
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    },

    getUrl(filePath: string) {
      return filePath
    },
  }
}

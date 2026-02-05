// src/server/lib/storage.ts
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

export function createS3Storage(): StorageService {
  const endpoint = process.env.S3_ENDPOINT
  const accessKey = process.env.S3_ACCESS_KEY
  const secretKey = process.env.S3_SECRET_KEY
  const bucket = process.env.S3_BUCKET

  if (!accessKey || !secretKey || !bucket) {
    throw new Error('S3 storage requires S3_ACCESS_KEY, S3_SECRET_KEY, and S3_BUCKET environment variables')
  }

  const client = new S3Client({
    endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  })

  return {
    async save(file: File) {
      const ext = path.extname(file.name) || ''
      const key = `${randomUUID()}${ext}`

      const buffer = Buffer.from(await file.arrayBuffer())

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      }))

      const url = `${process.env.S3_ENDPOINT}/${bucket}/${key}`
      return { path: url, filename: file.name }
    },

    async delete(filePath: string) {
      // Extract key from URL
      const url = new URL(filePath)
      const key = url.pathname.split('/').slice(2).join('/')

      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }))
    },

    getUrl(filePath: string) {
      return filePath
    },
  }
}

export function createStorage(): StorageService {
  if (process.env.STORAGE === 's3') {
    return createS3Storage()
  }
  return createLocalStorage()
}

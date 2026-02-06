// src/server/lib/url.ts
import * as cheerio from 'cheerio'

/**
 * Converts a relative path to a full URL if PUBLIC_URL is set.
 * Leaves absolute URLs (starting with http:// or https://) unchanged.
 */
export function toPublicUrl(path: string): string {
  const publicUrl = process.env.PUBLIC_URL

  // If no PUBLIC_URL configured, return as-is
  if (!publicUrl) {
    return path
  }

  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Combine PUBLIC_URL with relative path
  const base = publicUrl.replace(/\/$/, '') // Remove trailing slash
  const relativePath = path.startsWith('/') ? path : `/${path}`
  return `${base}${relativePath}`
}

/**
 * Transforms image src attributes in HTML content to use PUBLIC_URL.
 * Only transforms relative URLs, leaves absolute URLs unchanged.
 */
export function transformHtmlImageUrls(html: string): string {
  const publicUrl = process.env.PUBLIC_URL

  // If no PUBLIC_URL configured, return as-is
  if (!publicUrl) {
    return html
  }

  const $ = cheerio.load(html, { xml: { xmlMode: false } }, false)

  $('img').each((_, el) => {
    const src = $(el).attr('src')
    if (src) {
      $(el).attr('src', toPublicUrl(src))
    }
  })

  return $.html()
}

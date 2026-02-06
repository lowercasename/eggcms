// src/server/lib/url.ts

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

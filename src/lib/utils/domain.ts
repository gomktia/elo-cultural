const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eloculturas.com.br'

/**
 * Extract subdomain slug from hostname.
 * e.g. "pinhais.eloculturas.com.br" → "pinhais"
 * Returns null for root domain, localhost, or vercel preview domains.
 */
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0] // strip port

  if (isDevEnvironment(host)) return null
  if (isRootDomain(host)) return null

  // Check if hostname ends with the root domain
  const suffix = `.${ROOT_DOMAIN}`
  if (!host.endsWith(suffix)) return null

  const sub = host.slice(0, -suffix.length)
  // Only return simple slugs (no nested subdomains like "a.b")
  if (sub && !sub.includes('.')) return sub

  return null
}

/**
 * Get cookie domain for cross-subdomain sharing.
 * Returns ".eloculturas.com.br" in production, undefined in dev.
 */
export function getCookieDomain(hostname: string): string | undefined {
  const host = hostname.split(':')[0]
  if (isDevEnvironment(host)) return undefined
  if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) {
    return `.${ROOT_DOMAIN}`
  }
  return undefined
}

/**
 * Check if hostname is a development/preview environment.
 */
export function isDevEnvironment(hostname: string): boolean {
  const host = hostname.split(':')[0]
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app')
  )
}

/**
 * Check if hostname is the root domain (no subdomain).
 * e.g. "eloculturas.com.br" → true, "pinhais.eloculturas.com.br" → false
 */
export function isRootDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]
  return host === ROOT_DOMAIN
}

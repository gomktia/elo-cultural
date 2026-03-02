import { createBrowserClient } from '@supabase/ssr'

function getBrowserCookieDomain(): string | undefined {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (!rootDomain) return undefined

  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) {
    return undefined
  }
  if (host === rootDomain || host.endsWith(`.${rootDomain}`)) {
    return `.${rootDomain}`
  }
  return undefined
}

export function createClient() {
  const cookieDomain = getBrowserCookieDomain()

  if (cookieDomain) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          domain: cookieDomain,
        },
      }
    )
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { extractSubdomain, getCookieDomain, isDevEnvironment, isRootDomain } from '@/lib/utils/domain'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip tenant resolution for static assets, API routes, and error pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/') ||
    pathname === '/tenant-nao-encontrado'
  ) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // 1. Extract hostname info
  const hostname = request.headers.get('host') || ''
  const cookieDomain = getCookieDomain(hostname)
  const subdomain = extractSubdomain(hostname)
  const isDev = isDevEnvironment(hostname)
  const isRoot = isRootDomain(hostname)

  // 2. Create Supabase session with shared cookie domain
  const { supabase, user, supabaseResponse } = await updateSession(request, cookieDomain)

  const cookieOptions = {
    path: '/',
    httpOnly: false,
    sameSite: 'lax' as const,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }

  const existingTenantId = request.cookies.get('tenant_id')?.value
  const existingTenantSlug = request.cookies.get('tenant_slug')?.value

  // 3. Root domain → landing page, no tenant
  if (isRoot) {
    // Clear any lingering tenant cookies on root domain
    if (existingTenantId) {
      supabaseResponse.cookies.set('tenant_id', '', { ...cookieOptions, maxAge: 0 })
      supabaseResponse.cookies.set('tenant_slug', '', { ...cookieOptions, maxAge: 0 })
    }
    // Also clear legacy cookie
    if (request.cookies.get('tenant_domain')?.value) {
      supabaseResponse.cookies.set('tenant_domain', '', { ...cookieOptions, maxAge: 0 })
    }

    return applyAuthProtection(request, user, supabaseResponse, pathname)
  }

  // 4. Dev/preview → use first active tenant (current behavior)
  if (isDev) {
    if (!existingTenantId) {
      const { data: firstTenant } = await supabase
        .from('tenants')
        .select('id, dominio')
        .eq('status', 'ativo')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (firstTenant) {
        supabaseResponse.cookies.set('tenant_id', firstTenant.id, cookieOptions)
        supabaseResponse.cookies.set('tenant_slug', firstTenant.dominio, cookieOptions)
      }
    }

    return applyAuthProtection(request, user, supabaseResponse, pathname)
  }

  // 5. Subdomain → resolve tenant by slug
  if (subdomain) {
    // Only re-resolve if slug changed
    if (!existingTenantId || existingTenantSlug !== subdomain) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, dominio, status')
        .eq('dominio', subdomain)
        .single()

      if (!tenant || tenant.status !== 'ativo') {
        const url = request.nextUrl.clone()
        url.pathname = '/tenant-nao-encontrado'
        url.search = ''
        return NextResponse.redirect(url)
      }

      supabaseResponse.cookies.set('tenant_id', tenant.id, cookieOptions)
      supabaseResponse.cookies.set('tenant_slug', subdomain, cookieOptions)
    }

    return applyAuthProtection(request, user, supabaseResponse, pathname)
  }

  // 6. Unknown domain → error page
  const url = request.nextUrl.clone()
  url.pathname = '/tenant-nao-encontrado'
  url.search = ''
  return NextResponse.redirect(url)
}

function applyAuthProtection(
  request: NextRequest,
  user: any,
  supabaseResponse: NextResponse,
  pathname: string
) {
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/esqueci-senha')
  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projetos') ||
    pathname.startsWith('/avaliacao') ||
    pathname.startsWith('/gestor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/super')

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

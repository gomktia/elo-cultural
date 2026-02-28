import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Known domains that should skip tenant validation
const SKIP_DOMAINS = ['localhost', '127.0.0.1']

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Skip tenant resolution for static assets, API routes, and error pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/') ||
    pathname === '/tenant-nao-encontrado'
  ) {
    return supabaseResponse
  }

  // 1. Resolve tenant from hostname
  const hostname = request.headers.get('x-tenant-domain') || request.headers.get('host') || ''
  const domain = hostname.split(':')[0] // Remove port for localhost

  const existingTenantId = request.cookies.get('tenant_id')?.value
  const existingTenantDomain = request.cookies.get('tenant_domain')?.value
  const isLocalhost = SKIP_DOMAINS.includes(domain)

  // Resolve tenant if we don't have it cached in cookie yet
  if (!existingTenantId || existingTenantDomain !== domain) {
    if (isLocalhost) {
      // Dev: use first active tenant
      const { data: firstTenant } = await supabase
        .from('tenants')
        .select('id, dominio')
        .eq('status', 'ativo')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (firstTenant) {
        supabaseResponse.cookies.set('tenant_id', firstTenant.id, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
        })
        supabaseResponse.cookies.set('tenant_domain', firstTenant.dominio, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
        })
      }
    } else {
      // Production: resolve tenant by domain
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, dominio, status')
        .eq('dominio', domain)
        .single()

      if (!tenant || tenant.status !== 'ativo') {
        // Domain not found or tenant inactive — redirect to error page
        const url = request.nextUrl.clone()
        url.pathname = '/tenant-nao-encontrado'
        url.search = ''
        return NextResponse.redirect(url)
      }

      supabaseResponse.cookies.set('tenant_id', tenant.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      })
      supabaseResponse.cookies.set('tenant_domain', domain, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      })
    }
  }

  // 2. Auth protection for dashboard routes
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/cadastro') || pathname.startsWith('/esqueci-senha')
  const isDashboardRoute = pathname.startsWith('/projetos') || pathname.startsWith('/avaliacao') || pathname.startsWith('/gestor') || pathname.startsWith('/admin') || pathname.startsWith('/perfil') || pathname.startsWith('/super')

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

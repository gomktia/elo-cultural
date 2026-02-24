import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  // 1. Resolve tenant from hostname
  const hostname = request.headers.get('x-tenant-domain') || request.headers.get('host') || ''
  const domain = hostname.split(':')[0] // Remove port for localhost

  // Skip tenant resolution for static assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return supabaseResponse
  }

  // For dev: use x-tenant-domain header or default to first tenant
  // For prod: resolve tenant by domain from DB
  // We store tenant info in a cookie so pages can access it
  const tenantCookie = request.cookies.get('tenant_domain')?.value
  if (!tenantCookie && domain !== 'localhost') {
    // Set tenant domain cookie for the app to use
    supabaseResponse.cookies.set('tenant_domain', domain, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    })
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

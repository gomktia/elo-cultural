import Link from 'next/link'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { TenantTemaCores } from '@/types/database.types'

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Read tenant from cookie (set by middleware for subdomains)
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value

  let brandColor = '#0047AB'
  let brandSecondary = '#E91E63'
  let tenantLogoUrl: string | null = null
  let tenantName: string | null = null

  if (tenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome, tema_cores, logo_url')
      .eq('id', tenantId)
      .single()

    if (tenant) {
      const temaCores = tenant.tema_cores as TenantTemaCores | null
      brandColor = temaCores?.primary || '#0047AB'
      brandSecondary = temaCores?.secondary || '#E91E63'
      tenantLogoUrl = (tenant as any)?.logo_url || null
      tenantName = tenant.nome || null
    }
  }

  const brandRgb = hexToRgb(brandColor)
  const logoSrc = tenantLogoUrl || '/icon-192.png'
  const brandName = tenantName || 'EloCultural'

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{
        ['--brand-primary' as string]: brandColor,
        ['--brand-secondary' as string]: brandSecondary,
        ['--brand-rgb' as string]: brandRgb,
      }}
    >
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: brandColor }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src={logoSrc}
              alt={brandName}
              className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white p-1 shadow-sm object-contain transition-all group-hover:scale-105"
            />
            <span className="font-[Sora,sans-serif] font-bold text-lg md:text-xl tracking-tight text-white leading-none">
              {brandName}
            </span>
          </Link>

          <nav className="flex items-center gap-4 md:gap-6">
            <Link
              href="/"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Início
            </Link>
            <Link
              href="/editais"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Editais
            </Link>
            <Link
              href="/indicadores"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Indicadores
            </Link>
            <Link
              href="/mapa"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Mapa
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button
                  className="h-9 px-5 rounded-xl bg-white font-semibold hover:bg-white/90 transition-all text-sm shadow-sm"
                  style={{ color: brandColor }}
                >
                  Meu Painel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  className="h-9 px-6 rounded-xl bg-white font-semibold hover:bg-white/90 transition-all text-sm shadow-sm"
                  style={{ color: brandColor }}
                >
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer: Brand color ── */}
      <footer style={{ backgroundColor: brandColor }}>
        <div className="container mx-auto px-6 md:px-8">
          <div className="py-10 md:py-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2.5">
                <img src={logoSrc} alt={brandName} className="h-8 w-8 rounded-xl bg-white p-1 shadow-sm object-contain" />
                <span className="font-[Sora,sans-serif] font-bold text-lg tracking-tight text-white">
                  {brandName}
                </span>
              </div>
              <p className="text-sm text-white/60 max-w-xs text-center md:text-left">
                Plataforma de gestão de editais culturais. Transparência e eficiência no fomento à cultura.
              </p>
            </div>

            <div className="flex gap-12 md:gap-16">
              <div className="space-y-3">
                <h4 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Plataforma</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/editais" className="text-sm text-white/70 hover:text-white transition-colors">Editais</Link>
                  <Link href="/indicadores" className="text-sm text-white/70 hover:text-white transition-colors">Indicadores</Link>
                  <Link href="/mapa" className="text-sm text-white/70 hover:text-white transition-colors">Mapa Cultural</Link>
                  <Link href="/cadastro" className="text-sm text-white/70 hover:text-white transition-colors">Cadastro</Link>
                  <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">Entrar</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Legal</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/privacidade" className="text-sm text-white/70 hover:text-white transition-colors">Privacidade</Link>
                  <Link href="/termos" className="text-sm text-white/70 hover:text-white transition-colors">Termos de Uso</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 py-6 flex items-center justify-center">
            <p className="text-xs text-white/40 text-center">
              Elo Cultural &copy; {new Date().getFullYear()} &mdash; Plataforma de Editais Culturais
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getTenantFromCookie, getTenantBrand, brandCssVars } from '@/lib/tenant'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromCookie()
  if (!tenant) return {}

  const title = tenant.nome
    ? `${tenant.nome} — Editais Culturais`
    : undefined

  return {
    ...(title && { title }),
    ...(() => {
      const logoUrl = (tenant as unknown as Record<string, string | null>)?.logo_url
      return logoUrl ? { icons: { icon: logoUrl, apple: logoUrl } } : {}
    })(),
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tenant = await getTenantFromCookie()
  const { brandColor, logoSrc, brandName } = getTenantBrand(tenant)
  const whatsapp = (tenant as unknown as Record<string, string | null>)?.whatsapp_suporte as string | null
  const emailSuporte = (tenant as unknown as Record<string, string | null>)?.email_suporte as string | null
  const cssVars = brandCssVars(getTenantBrand(tenant))

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={cssVars}
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
            <Link
              href="/home"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sobre
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
                Gestão de editais culturais. Transparência e eficiência no fomento à cultura.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 md:gap-12">
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
                  <Link href="/verificar-assinatura" className="text-sm text-white/70 hover:text-white transition-colors">Verificar Assinatura</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Legislacao</h4>
                <div className="flex flex-col gap-2">
                  <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L14903.htm" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">Lei 14.903/2024 (PNAB)</a>
                  <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/D11453.htm" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">Decreto 11.453/2023</a>
                  <a href="https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">Lei 14.063/2020 (Assinatura)</a>
                </div>
              </div>
              {(whatsapp || emailSuporte) && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Contato</h4>
                  <div className="flex flex-col gap-2">
                    {whatsapp && (
                      <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">
                        WhatsApp: {whatsapp}
                      </a>
                    )}
                    {emailSuporte && (
                      <a href={`mailto:${emailSuporte}`} className="text-sm text-white/70 hover:text-white transition-colors">
                        {emailSuporte}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 py-6 flex items-center justify-center">
            <p className="text-xs text-white/40 text-center">
              {brandName} &copy; {new Date().getFullYear()} &mdash; Plataforma de Editais Culturais
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

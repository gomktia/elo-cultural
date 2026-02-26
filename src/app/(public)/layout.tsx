import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ── Navbar: Glass over hero ── */}
      <header className="sticky top-0 z-50 bg-[#0047AB] shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/icon-192.png"
              alt="Elo Cultural"
              className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white p-1 shadow-sm object-contain transition-all group-hover:scale-105"
            />
            <span className="font-[Sora,sans-serif] font-bold text-lg md:text-xl tracking-tight text-white leading-none">
              EloCultural
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

            {user ? (
              <Link href="/dashboard">
                <Button className="h-9 px-5 rounded-xl bg-white text-[#0047AB] font-semibold hover:bg-white/90 transition-all text-sm shadow-sm">
                  Meu Painel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-6 rounded-xl bg-white text-[#0047AB] font-semibold hover:bg-white/90 transition-all text-sm shadow-sm">
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

      {/* ── Footer: Brand blue ── */}
      <footer className="bg-[#0047AB]">
        <div className="container mx-auto px-6 md:px-8">
          <div className="py-10 md:py-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="Elo Cultural" className="h-8 w-8 rounded-xl bg-white p-1 shadow-sm object-contain" />
                <span className="font-[Sora,sans-serif] font-bold text-lg tracking-tight text-white">
                  EloCultural
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
                  <Link href="/cadastro" className="text-sm text-white/70 hover:text-white transition-colors">Cadastro</Link>
                  <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">Entrar</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Suporte</h4>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white/50">FAQ</span>
                  <span className="text-sm text-white/50">Contato</span>
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

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

            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" className="h-9 px-5 rounded-xl border-white/30 font-semibold text-white hover:bg-white hover:text-[#0047AB] transition-all text-sm">
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

      {/* ── Footer: Dark navy with brand accents ── */}
      <footer className="bg-[#0B1929]">
        <div className="container mx-auto px-6 md:px-8">
          <div className="py-12 md:py-16 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="Elo Cultural" className="h-8 w-8 rounded-xl bg-white/10 p-1 object-contain" />
                <span className="font-[Sora,sans-serif] font-bold text-lg tracking-tight text-white">
                  EloCultural
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs text-center md:text-left">
                Plataforma de gestão de editais culturais. Transparência e eficiência no fomento à cultura.
              </p>
            </div>

            <div className="flex gap-12 md:gap-16">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Plataforma</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/editais" className="text-sm text-slate-400 hover:text-white transition-colors">Editais</Link>
                  <Link href="/cadastro" className="text-sm text-slate-400 hover:text-white transition-colors">Cadastro</Link>
                  <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Entrar</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Suporte</h4>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-slate-500">FAQ</span>
                  <span className="text-sm text-slate-500">Contato</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] py-6 flex items-center justify-center">
            <p className="text-xs text-slate-500 text-center">
              Elo Cultural &copy; {new Date().getFullYear()} &mdash; Plataforma de Editais Culturais
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

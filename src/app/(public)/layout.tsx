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
      <header className="sticky top-0 z-50 bg-[#0B1929] border-b border-white/[0.06]">
        <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/icon-192.png"
              alt="Elo Cultural"
              className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white p-1 shadow-sm object-contain transition-all group-hover:scale-105"
            />
            <span className="font-[Sora,sans-serif] font-extrabold text-lg md:text-xl tracking-tight text-white leading-none">
              Elo<span className="text-gradient-brand bg-clip-text">Cultural</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3 md:gap-6">
            <Link
              href="/editais"
              className="hidden sm:block text-xs font-medium text-white/50 hover:text-white transition-all"
            >
              Editais
            </Link>
            <Link
              href="/cadastro"
              className="hidden sm:block text-xs font-medium text-white/50 hover:text-white transition-all"
            >
              Cadastro
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" className="h-9 px-5 rounded-xl border-white/15 font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all text-xs bg-white/[0.04]">
                  Meu Painel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-6 rounded-xl bg-white text-[#020817] font-semibold hover:bg-white/90 transition-all text-xs shadow-lg shadow-white/10">
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
      <footer className="bg-[#0B1929] border-t border-white/[0.06]">
        <div className="container mx-auto px-6 md:px-8">
          {/* Top section */}
          <div className="py-12 md:py-16 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="Elo Cultural" className="h-8 w-8 rounded-xl bg-white/10 p-1 object-contain" />
                <span className="font-[Sora,sans-serif] font-extrabold text-lg tracking-tight text-white">
                  Elo<span className="text-gradient-brand bg-clip-text">Cultural</span>
                </span>
              </div>
              <p className="text-sm text-slate-300 max-w-xs text-center md:text-left">
                Plataforma de gestão de editais culturais. Transparência e eficiência no fomento à cultura.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12 md:gap-16">
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">Plataforma</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/editais" className="text-sm text-slate-300 hover:text-white transition-colors">Editais</Link>
                  <Link href="/cadastro" className="text-sm text-slate-300 hover:text-white transition-colors">Cadastro</Link>
                  <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Entrar</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">Suporte</h4>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-slate-400">FAQ</span>
                  <span className="text-sm text-slate-400">Contato</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand colors dots */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#0047AB]" />
              <div className="h-2 w-2 rounded-full bg-[#e32a74]" />
              <div className="h-2 w-2 rounded-full bg-[#eeb513]" />
              <div className="h-2 w-2 rounded-full bg-[#77a80b]" />
            </div>
            <p className="text-[10px] text-slate-500 tracking-wide text-center">
              Elo Cultural &copy; {new Date().getFullYear()} &mdash; Inteligência em Processos Seletivos Culturais
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

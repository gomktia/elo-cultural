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
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/20">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <img
              src="/icon-192.png"
              alt="Elo Cultura"
              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-100 transition-all group-hover:scale-105 group-hover:-rotate-3"
            />
            <span className="font-[900] text-xl md:text-2xl tracking-tighter text-slate-900 leading-none">
              Elo<span className="text-[var(--brand-primary)]">Cultura</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 md:gap-8">
            <Link href="/editais" className="hidden sm:block text-[10px] font-black text-slate-400 hover:text-[var(--brand-primary)] transition-all uppercase tracking-[0.2em]">
              Editais
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" className="h-9 md:h-10.5 px-4 md:px-6 rounded-xl border-slate-200 font-bold text-slate-600 hover:text-[var(--brand-primary)] hover:bg-brand-primary/5 transition-all shadow-sm active:scale-98 text-[10px] md:text-xs">
                  Meu Painel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-9 md:h-10.5 px-5 md:px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-black shadow-lg shadow-brand-primary/20 transition-all active:scale-98 text-[10px] md:text-xs">
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
      <footer className="border-t border-slate-100 py-12 bg-white">
        <div className="container mx-auto px-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-20">
            <img src="/icon-192.png" alt="Elo Cultura" className="h-6 w-6 rounded-full" />
            <span className="font-black text-sm tracking-tighter text-slate-900">EloCultura</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
            Inteligência em Processos Seletivos Culturais • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

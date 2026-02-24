import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EditalCard } from '@/components/edital/EditalCard'
import type { Edital } from '@/types/database.types'
import { ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .in('status', ['publicacao', 'inscricao'])
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] left-[-200px] w-[600px] h-[600px] bg-[var(--brand-primary)]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[100px] right-[-100px] w-[500px] h-[500px] bg-[var(--brand-secondary)]/5 rounded-full blur-[100px]" />
      </div>

      <section className="relative pt-16 md:pt-24 pb-16 md:pb-20 px-4">
        <div className="container mx-auto text-center space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 shadow-sm animate-fade-in">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--brand-success)]" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Editais 2026 Abertos</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
            <span className="block italic font-bold text-[var(--brand-primary)] text-lg md:text-3xl mb-2 tracking-widest uppercase">Elo Cultura</span>
            Fomentando a <br className="hidden md:block" />
            Economia Criativa
          </h1>

          <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium px-4 md:px-0">
            A plataforma definitiva para gestão de editais culturais. Descubra oportunidades, envie seus projetos e acompanhe resultados com total transparência e segurança.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 md:pt-8">
            <Button asChild size="lg" className="h-12 md:h-14 px-8 text-sm md:text-base font-bold shadow-xl shadow-[var(--brand-primary)]/20 rounded-xl md:rounded-2xl">
              <Link href="/editais">
                Explorar Editais
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 md:h-14 px-8 text-sm md:text-base font-bold border-slate-200/60 transition-all hover:bg-slate-50 rounded-xl md:rounded-2xl">
              <Link href="/cadastro">
                Começar agora
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase tracking-[0.05em]">Editais em Destaque</h2>
            <div className="h-1.5 w-20 bg-[var(--brand-primary)] rounded-full" />
          </div>
          <Button asChild variant="ghost" className="font-bold text-slate-500 hover:text-[var(--brand-primary)] group">
            <Link href="/editais">
              Ver catálogo completo
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {editais && editais.length > 0 ? (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {(editais as Edital[]).map(edital => (
              <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px]">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
              <span className="text-4xl">📭</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Aguardando novas publicações</p>
          </div>
        )}
      </section>
    </div>
  )
}

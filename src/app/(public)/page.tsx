import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EditalCard } from '@/components/edital/EditalCard'
import { EditalSlider } from '@/components/home/EditalSlider'
import type { Edital } from '@/types/database.types'
import { ArrowRight, FileText, Upload, BarChart3 } from 'lucide-react'

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
    <div>

      {/* ═══════════════════════════════════════
          HERO — Edital Slider
          ═══════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#F0F4F8] to-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif]">
              Plataforma de Editais Culturais
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-500 max-w-xl mx-auto">
              Descubra oportunidades, envie seus projetos e acompanhe resultados de forma transparente.
            </p>
          </div>

          <EditalSlider editais={(editais as Edital[]) || []} />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          COMO FUNCIONA — 3 Steps
          ═══════════════════════════════════════ */}
      <section className="bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 text-center mb-10 tracking-tight">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-3xl mx-auto">
            {[
              {
                icon: FileText,
                title: 'Consulte Editais',
                description: 'Navegue pelos editais abertos e encontre oportunidades para seu projeto cultural.',
                color: '#0047AB',
              },
              {
                icon: Upload,
                title: 'Envie seu Projeto',
                description: 'Cadastre-se na plataforma e submeta seu projeto cultural de forma simples.',
                color: '#77a80b',
              },
              {
                icon: BarChart3,
                title: 'Acompanhe Resultados',
                description: 'Confira notas, ranking e o resultado final do processo seletivo.',
                color: '#eeb513',
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="text-center">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${step.color}12` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          EDITAIS EM DESTAQUE
          ═══════════════════════════════════════ */}
      <section className="bg-[#F8FAFC]">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
              Editais em Destaque
            </h2>
            <Button asChild variant="ghost" className="font-medium text-slate-500 hover:text-[var(--brand-primary)] group text-sm">
              <Link href="/editais">
                Ver todos os editais
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {editais && editais.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(editais as Edital[]).map(edital => (
                <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="h-14 w-14 rounded-xl bg-[#0047AB]/[0.06] flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-[var(--brand-primary)]" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">Nenhum edital aberto no momento</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Novos editais são publicados periodicamente. Cadastre-se para receber notificações.
              </p>
              <Button asChild className="mt-5 rounded-xl" size="lg">
                <Link href="/cadastro">
                  Cadastrar-se
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

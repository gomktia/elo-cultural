import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EditalCard } from '@/components/edital/EditalCard'
import type { Edital } from '@/types/database.types'
import { ArrowRight, Sparkles, FileText, Users, TrendingUp } from 'lucide-react'

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
    <div className="relative overflow-hidden">

      {/* ═══════════════════════════════════════
          HERO — Full-Bleed Cinematic
          ═══════════════════════════════════════ */}
      <section className="relative min-h-[85vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden hero-vignette">

        {/* Background photo with Ken Burns */}
        <div className="absolute inset-0 hero-ken-burns">
          <Image
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&h=1080&fit=crop&q=90&auto=format"
            alt="Cultura brasileira"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Multi-layer gradient overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `linear-gradient(
              to top,
              #020817 0%,
              rgba(2, 8, 23, 0.92) 15%,
              rgba(2, 8, 23, 0.65) 45%,
              rgba(2, 8, 23, 0.35) 75%,
              rgba(2, 8, 23, 0.50) 100%
            )`,
          }}
        />

        {/* Subtle brand color wash */}
        <div className="absolute inset-0 z-[1] mix-blend-soft-light opacity-30 bg-gradient-to-br from-[#0047AB] via-transparent to-[#e32a74]" />

        {/* Noise texture */}
        <div className="absolute inset-0 z-[2] noise-overlay opacity-40" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Status pill */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#77a80b] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#77a80b]" />
            </span>
            <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.15em] text-white/70">
              Editais 2026 Abertos
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-up-delay-1 font-[Sora,sans-serif]">
            <span className="block text-base md:text-xl font-bold uppercase tracking-[0.3em] mb-4 md:mb-5 text-[#eeb513] drop-shadow-[0_2px_8px_rgba(238,181,19,0.3)]">
              Elo Cultural
            </span>
            <span className="block text-[2.75rem] sm:text-6xl md:text-8xl font-extrabold tracking-tight text-white leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              Fomentando a
              <br />
              <span className="relative">
                Economia
                <svg className="absolute -bottom-2 md:-bottom-3 left-0 w-full h-3 md:h-4" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 8 Q75 2 150 6 Q225 10 298 4" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <defs>
                    <linearGradient id="underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0047AB" />
                      <stop offset="33%" stopColor="#e32a74" />
                      <stop offset="66%" stopColor="#eeb513" />
                      <stop offset="100%" stopColor="#77a80b" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              {' '}Criativa
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up-delay-2 mt-6 md:mt-8 text-base md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-medium px-4 md:px-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            Descubra oportunidades, envie seus projetos e acompanhe resultados.
            <br className="hidden md:block" />
            A plataforma completa para gestão de editais culturais.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center mt-10 md:mt-12">
            <Button asChild size="lg" className="h-13 md:h-14 px-8 md:px-10 text-sm md:text-base font-semibold rounded-2xl bg-gradient-to-r from-[#0047AB] via-[#e32a74] to-[#eeb513] bg-[length:200%_100%] hover:bg-right transition-all duration-500 text-white shadow-[0_8px_32px_rgba(227,42,116,0.3)] border-0">
              <Link href="/editais">
                <Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Explorar Editais
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-13 md:h-14 px-8 md:px-10 text-sm md:text-base font-semibold rounded-2xl border-white/20 text-white hover:bg-[#0047AB] hover:border-[#0047AB] hover:text-white hover:shadow-[0_8px_32px_rgba(0,71,171,0.3)] transition-all duration-300 bg-white/[0.06] backdrop-blur-sm">
              <Link href="/cadastro">
                Criar Conta Gratuita
              </Link>
            </Button>
          </div>

          {/* Decorative brand line */}
          <div className="animate-fade-up-delay-4 mt-16 md:mt-20 flex items-center justify-center gap-3">
            <div className="h-1 w-8 rounded-full bg-[#0047AB] opacity-60" />
            <div className="h-1 w-8 rounded-full bg-[#e32a74] opacity-60" />
            <div className="h-1 w-8 rounded-full bg-[#eeb513] opacity-60" />
            <div className="h-1 w-8 rounded-full bg-[#77a80b] opacity-60" />
          </div>
        </div>

        {/* Bottom brand accent line */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1 line-gradient-brand" />
      </section>

      {/* ═══════════════════════════════════════
          STATS BAR — Dark Navy
          ═══════════════════════════════════════ */}
      <section className="relative bg-[#0B1929] border-y border-white/[0.06] overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0047AB]/10 via-transparent to-[#e32a74]/10" />

        <div className="relative z-10 container mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '150+', label: 'Editais Publicados', color: '#0047AB', icon: FileText },
              { value: '2.400+', label: 'Projetos Inscritos', color: '#e32a74', icon: Sparkles },
              { value: 'R$ 12M+', label: 'Em Fomento Cultural', color: '#eeb513', icon: TrendingUp },
              { value: '800+', label: 'Artistas Beneficiados', color: '#77a80b', icon: Users },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center md:text-left group">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${stat.color}18` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                    <span
                      className="text-3xl md:text-4xl font-[Sora,sans-serif] font-bold tracking-tight"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-300 mt-1">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          EDITAIS EM DESTAQUE
          ═══════════════════════════════════════ */}
      <section className="relative bg-[#F8FAFC] overflow-hidden">
        {/* Subtle color accents in background */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0047AB]/[0.03] rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#e32a74]/[0.03] rounded-full blur-[80px] translate-y-1/2" />

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div className="space-y-3">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-secondary)] bg-[var(--brand-secondary)]/[0.08] px-3 py-1.5 rounded-lg">
                Oportunidades
              </span>
              <h2 className="text-3xl md:text-5xl font-[Sora,sans-serif] font-bold tracking-tight text-slate-900">
                Editais em Destaque
              </h2>
              <div className="h-1.5 w-24 rounded-full line-gradient-brand" />
            </div>
            <Button asChild variant="ghost" className="font-medium text-slate-500 hover:text-[var(--brand-primary)] group text-sm">
              <Link href="/editais">
                Ver todos os editais
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {editais && editais.length > 0 ? (
            <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {(editais as Edital[]).map(edital => (
                <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 md:py-28 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
                style={{ backgroundColor: 'rgba(0, 71, 171, 0.06)' }}
              >
                <FileText className="h-7 w-7 text-[var(--brand-primary)]" />
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-2">Nenhum edital aberto no momento</p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Novos editais são publicados periodicamente. Cadastre-se para receber notificações.
              </p>
              <Button asChild className="mt-6 rounded-xl" size="lg">
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

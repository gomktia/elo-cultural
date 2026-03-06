'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Upload, BarChart3, Shield, Users, MapPin, Bell, Zap,
  CheckCircle2, ArrowRight, ChevronRight, Star, Lock, Globe,
  ClipboardCheck, Award, TrendingUp, Eye, Layers, FileCheck,
  Wallet, Scale, Brain, Building2, Sparkles, MousePointerClick,
  LayoutDashboard, PieChart, UserCheck, FileSignature, Gavel,
  Receipt, Download, Settings, Search, Calendar, Hash
} from 'lucide-react'

/* ─── Intersection Observer hook for scroll reveals ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Animated counter ─── */
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView(0.3)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

/* ─── Profile feature card ─── */
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: any; title: string; desc: string; color: string; delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <h4 className="text-[15px] font-semibold text-slate-900 mb-1.5">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

/* ─── Differentiator row ─── */
function DiffRow({ icon: Icon, title, desc, us, them, color, delay }: {
  icon: any; title: string; desc: string; us: string; them: string; color: string; delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-[1fr,140px,140px] gap-4 items-center py-5 border-b border-slate-100 last:border-0"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : 'translateX(-20px)',
        transition: `all 0.5s ease ${delay}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${color}12` }}>
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:justify-center">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{us}</span>
      </div>
      <div className="flex items-center gap-2 md:justify-center">
        <span className="text-xs text-slate-400">{them}</span>
      </div>
    </div>
  )
}

/* ─── Profile tab data ─── */
const profiles = [
  {
    id: 'proponente',
    label: 'Proponente',
    tagline: 'Tudo o que o artista precisa, em um so lugar.',
    color: '#0047AB',
    icon: Users,
    features: [
      { icon: FileText, title: 'Inscricao em 4 Etapas', desc: 'Formulario guiado com dados pessoais, projeto, equipe, orcamento e cronograma.' },
      { icon: Upload, title: 'Upload de Documentos', desc: 'Envie RG, CPF, curriculo, portfolio e comprovantes diretamente pela plataforma.' },
      { icon: ClipboardCheck, title: 'Recibo Automatico', desc: 'Receba PDF de comprovante de inscricao imediatamente apos submissao.' },
      { icon: Eye, title: 'Acompanhamento em Tempo Real', desc: 'Veja o status do seu projeto: triagem, avaliacao, resultado, habilitacao.' },
      { icon: Gavel, title: 'Recursos Online', desc: 'Interponha recursos com fundamentacao, prazos e acompanhe a decisao.' },
      { icon: FileSignature, title: 'Assinatura Digital', desc: 'Assine termos de execucao digitalmente com hash SHA-256 e verificacao publica.' },
      { icon: Receipt, title: 'Prestacao de Contas', desc: 'Preencha as 9 secoes do relatorio final (Anexo XI) diretamente no sistema.' },
      { icon: Bell, title: 'Notificacoes', desc: 'Receba alertas por email e in-app sobre prazos, resultados e pendencias.' },
    ]
  },
  {
    id: 'gestor',
    label: 'Gestor Municipal',
    tagline: 'Gestao completa do fomento cultural, do edital ao pagamento.',
    color: '#77a80b',
    icon: Building2,
    features: [
      { icon: Settings, title: 'Configuracao de Editais', desc: 'Crie editais com categorias, vagas, valores, criterios de avaliacao e cotas.' },
      { icon: Brain, title: 'Triagem por IA', desc: 'Screening automatico de inscricoes com inteligencia artificial para agilizar analise.' },
      { icon: Award, title: 'Motor de Cotas Inteligente', desc: 'Alocacao dual-track automatica: ampla concorrencia + cotas com remanejamento.' },
      { icon: TrendingUp, title: 'Ranking Automatizado', desc: 'Consolidacao com desempate multi-criterio, desclassificacao e lista de suplentes.' },
      { icon: FileCheck, title: 'Habilitacao Documental', desc: 'Checklist por documento com conferencia individual e diligencia automatica.' },
      { icon: Wallet, title: 'Termos e Pagamentos', desc: 'Gere termos em lote, registre pagamentos e acompanhe liberacoes.' },
      { icon: Download, title: 'Exportacao PNAB Federal', desc: '4 abas no formato MinC (SpreadsheetML) geradas automaticamente.' },
      { icon: PieChart, title: 'Dashboard de Indicadores', desc: 'Metricas de execucao, pipeline de projetos, prazos e pendencias.' },
    ]
  },
  {
    id: 'avaliador',
    label: 'Avaliador',
    tagline: 'Avaliacao transparente, organizada e sem conflito de interesse.',
    color: '#eeb513',
    icon: Star,
    features: [
      { icon: ClipboardCheck, title: 'Formulario de Avaliacao', desc: 'Criterios configurados pelo gestor com notas individuais e justificativa.' },
      { icon: Users, title: 'Atribuicao Automatica', desc: 'Distribuicao round-robin equilibrada ou atribuicao manual pelo gestor.' },
      { icon: Scale, title: 'Deteccao de Discrepancia', desc: 'Alerta automatico quando notas divergem significativamente entre avaliadores.' },
      { icon: Eye, title: 'Visualizacao do Projeto', desc: 'Acesso completo ao projeto, documentos e historico do proponente.' },
      { icon: Hash, title: 'Comissao de Avaliacao', desc: 'Cadastro de comissao com portaria PDF, agrupamento por tipo de membro.' },
      { icon: Lock, title: 'Sigilo Garantido', desc: 'Cada avaliador ve apenas seus projetos atribuidos, sem acesso ao ranking.' },
    ]
  },
  {
    id: 'publico',
    label: 'Transparencia Publica',
    tagline: 'Acesso aberto a informacoes, resultados e verificacao.',
    color: '#e32a74',
    icon: Globe,
    features: [
      { icon: Search, title: 'Busca de Editais', desc: 'Pesquise por nome, filtre por status e veja editais abertos e encerrados.' },
      { icon: BarChart3, title: 'Resultados Publicados', desc: 'Selecao, habilitacao e homologacao publicadas com lista completa.' },
      { icon: MapPin, title: 'Mapa Cultural', desc: 'Visualize a distribuicao geografica dos projetos contemplados.' },
      { icon: TrendingUp, title: 'Indicadores', desc: 'Metricas publicas de execucao, diversidade e distribuicao de recursos.' },
      { icon: Shield, title: 'Verificar Assinatura', desc: 'Confira a autenticidade de qualquer documento assinado digitalmente.' },
      { icon: Calendar, title: 'Cronograma do Edital', desc: 'Todas as fases com datas, prazos e countdown ate o encerramento.' },
    ]
  },
]

const differentiators = [
  { icon: Brain, title: 'Triagem por IA', desc: 'Screening automatico de inscricoes', us: 'Automatico', them: 'Manual', color: '#0047AB' },
  { icon: Award, title: 'Motor de Cotas', desc: 'Alocacao dual-track com remanejamento', us: 'Inteligente', them: 'Planilha', color: '#77a80b' },
  { icon: FileSignature, title: 'Assinatura Digital', desc: 'SHA-256 com verificacao publica', us: 'Integrada', them: 'PDF manual', color: '#e32a74' },
  { icon: Layers, title: 'Multi-tenant SaaS', desc: 'Uma plataforma para N municipios', us: 'Ilimitado', them: 'Single-city', color: '#eeb513' },
  { icon: Download, title: 'Export PNAB Federal', desc: '4 abas no formato MinC automatico', us: '1 clique', them: 'Manual', color: '#0047AB' },
  { icon: Receipt, title: 'Prestacao de Contas', desc: '9 secoes do Anexo XI digitalizadas', us: 'Estruturada', them: 'Google Forms', color: '#77a80b' },
  { icon: Shield, title: 'LGPD Compliance', desc: 'Exportacao de dados e exclusao', us: 'Nativo', them: 'Inexistente', color: '#e32a74' },
  { icon: Globe, title: 'API de Transparencia', desc: 'Endpoints REST publicos', us: 'REST API', them: 'Nenhuma', color: '#eeb513' },
]

export default function SalesPage() {
  const [activeProfile, setActiveProfile] = useState('proponente')
  const activeData = profiles.find(p => p.id === activeProfile)!

  return (
    <div className="overflow-hidden">

      {/* ════════════════════════════════════════════
          HERO — Full-bleed cinematic
          ════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background — animated gradient mesh */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#020B18]" />
          <div
            className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30 blur-[120px]"
            style={{
              background: 'radial-gradient(circle, #0047AB 0%, transparent 70%)',
              animation: 'float1 12s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, #e32a74 0%, transparent 70%)',
              animation: 'float2 15s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full opacity-15 blur-[80px]"
            style={{
              background: 'radial-gradient(circle, #eeb513 0%, transparent 70%)',
              animation: 'float3 10s ease-in-out infinite',
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 md:px-8 text-center max-w-4xl">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
            style={{ animation: 'fadeUp 0.6s ease-out both' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#eeb513]" />
            <span className="text-xs font-medium text-white/70 tracking-wide">Plataforma completa de editais culturais</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ animation: 'fadeUp 0.6s ease-out 0.1s both' }}
          >
            <span className="text-white">Gestao de editais</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #4d8fea 0%, #e32a74 50%, #eeb513 100%)',
              }}
            >
              culturais inteligente
            </span>
          </h1>

          <p
            className="text-base md:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ animation: 'fadeUp 0.6s ease-out 0.2s both' }}
          >
            Do edital ao pagamento, do proponente a prestacao de contas.
            A plataforma mais completa do Brasil para fomento cultural municipal.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}
          >
            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0047AB] font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/10"
            >
              Comece Agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/editais"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-white/15 text-white/80 font-semibold text-sm hover:bg-white/5 hover:text-white transition-all"
            >
              Ver Editais Abertos
            </Link>
          </div>

          {/* Floating badges */}
          <div
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-white/30 text-xs font-medium"
            style={{ animation: 'fadeUp 0.6s ease-out 0.5s both' }}
          >
            {['Lei 14.903/2024 (PNAB)', 'Decreto 11.453/2023', 'LGPD Compliant', 'Gov.br OAuth'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS — Social proof bar
          ════════════════════════════════════════════ */}
      <section className="relative bg-white border-y border-slate-100">
        <div className="container mx-auto px-6 md:px-8 py-14 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl mx-auto text-center">
            {[
              { value: 246, suffix: '', label: 'Funcionalidades', color: '#0047AB' },
              { value: 95, suffix: '%', label: 'Checklist Completo', color: '#77a80b' },
              { value: 17, suffix: '+', label: 'Superioridades vs Concorrentes', color: '#e32a74' },
              { value: 100, suffix: '%', label: 'Campos PNAB Cobertos', color: '#eeb513' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: s.color }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          POR PERFIL — Tab-based feature showcase
          ════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] relative">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />

        <div className="relative container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0047AB] mb-3">Para cada perfil</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif]">
              Uma experiencia pensada para voce
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-lg mx-auto">
              Seja proponente, gestor, avaliador ou cidadao — cada perfil tem funcionalidades especificas.
            </p>
          </div>

          {/* Profile tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {profiles.map(p => {
              const Icon = p.icon
              const active = activeProfile === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className="group flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: active ? p.color : 'white',
                    color: active ? 'white' : '#64748B',
                    boxShadow: active
                      ? `0 4px 16px -2px ${p.color}40`
                      : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Profile tagline */}
          <p
            className="text-center text-lg font-semibold mb-10 transition-colors duration-300"
            style={{ color: activeData.color }}
          >
            {activeData.tagline}
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto" key={activeProfile}>
            {activeData.features.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                color={activeData.color}
                delay={i * 60}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          DIFERENCIAIS — Comparison table
          ════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#e32a74] mb-3">Diferenciais exclusivos</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif]">
              O que nenhum concorrente oferece
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-lg mx-auto">
              Comparamos com PNAB DF, Sistema Baru, LPGSC e Festival Neemias Lopes.
              Nenhum chega perto.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr,140px,140px] gap-4 pb-3 border-b-2 border-slate-200 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Funcionalidade</span>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider text-center">EloCultural</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Concorrentes</span>
            </div>

            {differentiators.map((d, i) => (
              <DiffRow key={d.title} {...d} delay={i * 70} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURES HIGHLIGHT — 3 big cards
          ════════════════════════════════════════════ */}
      <section className="bg-[#020B18] text-white relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #0047AB, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #77a80b, transparent)' }}
        />

        <div className="relative container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#eeb513] mb-3">Tecnologia de ponta</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-[Sora,sans-serif]">
              Construido para o setor publico brasileiro
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Lock,
                title: 'Seguranca e LGPD',
                desc: 'Assinatura SHA-256, verificacao publica, exportacao de dados pessoais, solicitacao de exclusao. Row-level security no banco de dados.',
                color: '#0047AB',
                gradient: 'from-[#0047AB]/10 to-transparent',
              },
              {
                icon: Zap,
                title: 'Automacao Inteligente',
                desc: 'Ranking automatico com desempate, motor de cotas, triagem IA, geracao de PDFs, notificacoes dual-channel, suplentes e convocacoes.',
                color: '#77a80b',
                gradient: 'from-[#77a80b]/10 to-transparent',
              },
              {
                icon: LayoutDashboard,
                title: 'Multi-Tenant SaaS',
                desc: 'Uma unica plataforma para N municipios. Cada prefeitura com sua marca, logo, cores, dominio e dados isolados.',
                color: '#e32a74',
                gradient: 'from-[#e32a74]/10 to-transparent',
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className={`relative rounded-2xl border border-white/[0.06] bg-gradient-to-b ${card.gradient} p-8 backdrop-blur-sm`}
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{card.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          JORNADA — 8-step process
          ════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#77a80b] mb-3">Jornada completa</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif]">
              Do edital a prestacao de contas
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-lg mx-auto">
              8 etapas totalmente digitalizadas. Sem papel, sem planilha, sem retrabalho.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {[
              { step: '01', title: 'Publicacao', desc: 'Edital configurado e publicado', color: '#0047AB', icon: FileText },
              { step: '02', title: 'Inscricao', desc: 'Proponentes enviam projetos', color: '#0047AB', icon: Upload },
              { step: '03', title: 'Avaliacao', desc: 'Pareceristas avaliam por criterios', color: '#eeb513', icon: Star },
              { step: '04', title: 'Ranking', desc: 'Consolidacao automatica + cotas', color: '#eeb513', icon: TrendingUp },
              { step: '05', title: 'Recursos', desc: 'Prazo e analise de recursos', color: '#e32a74', icon: Gavel },
              { step: '06', title: 'Habilitacao', desc: 'Conferencia documental', color: '#e32a74', icon: FileCheck },
              { step: '07', title: 'Execucao', desc: 'Termos, pagamentos, aditivos', color: '#77a80b', icon: Wallet },
              { step: '08', title: 'Prestacao', desc: 'Relatorio final e encerramento', color: '#77a80b', icon: Receipt },
            ].map((s, i) => {
              const Icon = s.icon
              const { ref, inView } = useInView()
              return (
                <div
                  key={s.step}
                  ref={ref}
                  className="text-center"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.5s ease ${i * 80}ms`,
                  }}
                >
                  <div className="relative mx-auto mb-3">
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-110"
                      style={{ backgroundColor: `${s.color}10` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: s.color }} />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-0.5">{s.title}</h4>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PDF GENERATION — Feature showcase
          ════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] border-y border-slate-100">
        <div className="container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0047AB] mb-3">Documentos oficiais</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif] mb-4">
                PDFs gerados automaticamente
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Todos os documentos oficiais do processo sao gerados pelo sistema com assinatura digital integrada.
                Chega de montar documentos no Word.
              </p>
              <div className="space-y-3">
                {[
                  'Termo de Execucao Cultural',
                  'Decisao Administrativa de Recurso',
                  'Portaria da Comissao de Avaliacao',
                  'Lista Oficial de Inscritos',
                  'Termo Aditivo',
                  'Recibo de Inscricao',
                ].map(doc => (
                  <div key={doc} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Stacked "paper" cards */}
              <div className="relative w-full max-w-sm mx-auto">
                {[2, 1, 0].map(i => (
                  <div
                    key={i}
                    className="absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-lg"
                    style={{
                      transform: `rotate(${i * 3 - 3}deg) translateY(${i * 8}px)`,
                      zIndex: 3 - i,
                    }}
                  />
                ))}
                <div className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-[#0047AB]/10 flex items-center justify-center">
                      <FileSignature className="h-5 w-5 text-[#0047AB]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Termo de Execucao</p>
                      <p className="text-xs text-slate-400">14 clausulas • Assinado digitalmente</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-2 rounded-full bg-slate-100" style={{ width: `${90 - i * 10}%` }} />
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700">Assinado</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">SHA-256 • 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          ACESSIBILIDADE — Government compliance
          ════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="container mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#77a80b] mb-3">Acessibilidade</p>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3 font-[Sora,sans-serif]">
                Inclusivo por natureza
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                VLibras integrado para traducao em Libras, campos de acessibilidade nos projetos
                (19 medidas em 3 categorias), e formularios responsivos para qualquer dispositivo.
              </p>
              <div className="flex flex-wrap gap-2">
                {['VLibras', 'Responsivo', 'WCAG 2.1', 'Alto Contraste', 'Leitor de Tela'].map(tag => (
                  <span key={tag} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-[#77a80b]/10 to-[#0047AB]/10 flex items-center justify-center">
                <UserCheck className="h-14 w-14 text-[#77a80b]/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA FINAL
          ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0047AB 0%, #002d6b 60%, #001a3f 100%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-[60%] h-full opacity-10"
          style={{
            background: 'radial-gradient(ellipse at top right, #eeb513, transparent 70%)',
          }}
        />

        <div className="relative container mx-auto px-6 md:px-8 py-20 md:py-28 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-[Sora,sans-serif] mb-4">
            Pronto para transformar a gestao cultural?
          </h2>
          <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto mb-10">
            Junte-se a plataforma mais completa para editais culturais do Brasil.
            Cadastro gratuito para proponentes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0047AB] font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-black/20"
            >
              Criar Conta Gratuita
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/editais"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Explorar Editais
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/25 text-[11px] font-medium uppercase tracking-wider">
            <span>Next.js</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Supabase</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>React PDF</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Gov.br OAuth</span>
          </div>
        </div>
      </section>

      {/* ─── CSS Keyframes ─── */}
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(30px, -20px) scale(0.9); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -30px); }
        }
      `}</style>
    </div>
  )
}

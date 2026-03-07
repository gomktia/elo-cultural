'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Upload, BarChart3, Shield, Users, MapPin, Bell, Zap,
  CheckCircle2, ArrowRight, ChevronRight, Star, Lock, Globe,
  ClipboardCheck, Award, TrendingUp, Eye, Layers, FileCheck,
  Wallet, Scale, Brain, Building2, MousePointerClick,
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
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; desc: string; color: string; delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="group relative rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-500 hover:shadow-lg hover:shadow-slate-100/80 hover:border-slate-200 hover:-translate-y-1"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Color accent bar */}
      <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
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
function DiffCard({ icon: Icon, title, desc, us, them, color, delay }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; desc: string; us: string; them: string; color: string; delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="group relative bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.5s ease ${delay}ms`,
      }}
    >
      {/* Color accent bar */}
      <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />

      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}14` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
        <div className="flex-1 flex items-center gap-2 bg-emerald-50/80 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <div>
            <span className="text-[10px] text-emerald-600/60 font-medium uppercase tracking-wider block leading-none mb-0.5">Elo Cultural</span>
            <span className="text-xs font-semibold text-emerald-700">{us}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block leading-none mb-0.5">Outros</span>
            <span className="text-xs font-semibold text-slate-500">{them}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Journey step card (extracted to avoid hooks-in-callback) ─── */
function JourneyStep({ step, title, desc, color, icon: Icon, index }: {
  step: string; title: string; desc: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; index: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className="text-center"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.5s ease ${index * 80}ms`,
      }}
    >
      <div className="relative mx-auto mb-3">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-110"
          style={{ backgroundColor: `${color}10` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <span
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {step}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-0.5">{title}</h4>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  )
}

/* ─── Profile tab data ─── */
const profiles = [
  {
    id: 'proponente',
    label: 'Proponente',
    tagline: 'Tudo o que o artista precisa, em um só lugar.',
    color: '#0047AB',
    icon: Users,
    features: [
      { icon: FileText, title: 'Inscrição em 4 Etapas', desc: 'Formulário guiado com dados pessoais, projeto, equipe, orçamento e cronograma.' },
      { icon: Upload, title: 'Upload de Documentos', desc: 'Envie RG, CPF, currículo, portfólio e comprovantes diretamente pela plataforma.' },
      { icon: ClipboardCheck, title: 'Recibo Automático', desc: 'Receba PDF de comprovante de inscrição imediatamente após submissão.' },
      { icon: Eye, title: 'Acompanhamento em Tempo Real', desc: 'Veja o status do seu projeto: triagem, avaliação, resultado, habilitação.' },
      { icon: Gavel, title: 'Recursos Online', desc: 'Interponha recursos com fundamentação, prazos e acompanhe a decisão.' },
      { icon: FileSignature, title: 'Assinatura Digital', desc: 'Assine termos de execução digitalmente com hash SHA-256 e verificação pública.' },
      { icon: Receipt, title: 'Prestação de Contas', desc: 'Preencha as 9 seções do relatório final (Anexo XI) diretamente no sistema.' },
      { icon: Bell, title: 'Notificações', desc: 'Receba alertas por email e in-app sobre prazos, resultados e pendências.' },
    ]
  },
  {
    id: 'gestor',
    label: 'Gestor Municipal',
    tagline: 'Gestão completa do fomento cultural, do edital ao pagamento.',
    color: '#77a80b',
    icon: Building2,
    features: [
      { icon: Settings, title: 'Configuração de Editais', desc: 'Crie editais com categorias, vagas, valores, critérios de avaliação e cotas.' },
      { icon: Brain, title: 'Triagem por IA', desc: 'Screening automático de inscrições com inteligência artificial para agilizar análise.' },
      { icon: Award, title: 'Motor de Cotas Inteligente', desc: 'Alocação dual-track automática: ampla concorrência + cotas com remanejamento.' },
      { icon: TrendingUp, title: 'Ranking Automatizado', desc: 'Consolidação com desempate multi-critério, desclassificação e lista de suplentes.' },
      { icon: FileCheck, title: 'Habilitação Documental', desc: 'Checklist por documento com conferência individual e diligência automática.' },
      { icon: Wallet, title: 'Termos e Pagamentos', desc: 'Gere termos em lote, registre pagamentos e acompanhe liberações.' },
      { icon: Download, title: 'Exportação PNAB Federal', desc: '4 abas no formato MinC (SpreadsheetML) geradas automaticamente.' },
      { icon: PieChart, title: 'Dashboard de Indicadores', desc: 'Métricas de execução, pipeline de projetos, prazos e pendências.' },
    ]
  },
  {
    id: 'avaliador',
    label: 'Avaliador',
    tagline: 'Avaliação transparente, organizada e sem conflito de interesse.',
    color: '#eeb513',
    icon: Star,
    features: [
      { icon: ClipboardCheck, title: 'Formulário de Avaliação', desc: 'Critérios configurados pelo gestor com notas individuais e justificativa.' },
      { icon: Users, title: 'Atribuição Automática', desc: 'Distribuição round-robin equilibrada ou atribuição manual pelo gestor.' },
      { icon: Scale, title: 'Detecção de Discrepância', desc: 'Alerta automático quando notas divergem significativamente entre avaliadores.' },
      { icon: Eye, title: 'Visualização do Projeto', desc: 'Acesso completo ao projeto, documentos e histórico do proponente.' },
      { icon: Hash, title: 'Comissão de Avaliação', desc: 'Cadastro de comissão com portaria PDF, agrupamento por tipo de membro.' },
      { icon: Lock, title: 'Sigilo Garantido', desc: 'Cada avaliador ve apenas seus projetos atribuidos, sem acesso ao ranking.' },
    ]
  },
  {
    id: 'publico',
    label: 'Transparência Pública',
    tagline: 'Acesso aberto a informações, resultados e verificação.',
    color: '#e32a74',
    icon: Globe,
    features: [
      { icon: Search, title: 'Busca de Editais', desc: 'Pesquise por nome, filtre por status e veja editais abertos e encerrados.' },
      { icon: BarChart3, title: 'Resultados Publicados', desc: 'Seleção, habilitação e homologação publicadas com lista completa.' },
      { icon: MapPin, title: 'Mapa Cultural', desc: 'Visualize a distribuição geográfica dos projetos contemplados.' },
      { icon: TrendingUp, title: 'Indicadores', desc: 'Métricas públicas de execução, diversidade e distribuição de recursos.' },
      { icon: Shield, title: 'Verificar Assinatura', desc: 'Confira a autenticidade de qualquer documento assinado digitalmente.' },
      { icon: Calendar, title: 'Cronograma do Edital', desc: 'Todas as fases com datas, prazos e countdown até o encerramento.' },
    ]
  },
]

const differentiators = [
  { icon: Brain, title: 'Triagem por IA', desc: 'Screening automático de inscrições', us: 'Automático', them: 'Manual', color: '#0047AB' },
  { icon: Award, title: 'Motor de Cotas', desc: 'Alocação dual-track com remanejamento', us: 'Inteligente', them: 'Planilha', color: '#77a80b' },
  { icon: FileSignature, title: 'Assinatura Digital', desc: 'SHA-256 com verificação pública', us: 'Integrada', them: 'PDF manual', color: '#e32a74' },
  { icon: Layers, title: 'Multi-tenant SaaS', desc: 'Uma plataforma para N municípios', us: 'Ilimitado', them: 'Single-city', color: '#eeb513' },
  { icon: Download, title: 'Export PNAB Federal', desc: '4 abas no formato MinC automático', us: '1 clique', them: 'Manual', color: '#0047AB' },
  { icon: Receipt, title: 'Prestação de Contas', desc: '9 seções do Anexo XI digitalizadas', us: 'Estruturada', them: 'Google Forms', color: '#77a80b' },
  { icon: Shield, title: 'LGPD Compliance', desc: 'Exportação de dados e exclusão', us: 'Nativo', them: 'Inexistente', color: '#e32a74' },
  { icon: Globe, title: 'API de Transparência', desc: 'Endpoints REST públicos', us: 'REST API', them: 'Nenhuma', color: '#eeb513' },
]

export default function SalesPage() {
  const [activeProfile, setActiveProfile] = useState('proponente')
  const activeData = profiles.find(p => p.id === activeProfile)!
  const [robotExcited, setRobotExcited] = useState(false)

  return (
    <div className="overflow-hidden">

      {/* ════════════════════════════════════════════
          HERO — White with animated gradient mesh
          ════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-white">
        {/* Background — pure white, no effects */}

        <div className="relative z-10 container mx-auto px-6 md:px-8 text-center max-w-4xl">
          {/* ── Robot organizing editais scene ── */}
          <div
            className="flex justify-center mb-6"
            style={{ animation: 'fadeUp 0.6s ease-out both' }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 480 220" className="w-full max-w-[320px] md:max-w-[420px] h-auto" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,71,171,0.10))' }}>
              {/* ── Document cards floating around robot ── */}

              {/* Card 1 — blue, top-left */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-6;0,0" dur="4s" repeatCount="indefinite" />
                <rect x="30" y="38" width="72" height="52" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="30" y="38" width="72" height="10" rx="8" fill="#0047AB" opacity="0.85" />
                <rect x="38" y="56" width="40" height="4" rx="2" fill="#CBD5E1" />
                <rect x="38" y="64" width="28" height="4" rx="2" fill="#E2E8F0" />
                <rect x="38" y="72" width="48" height="4" rx="2" fill="#E2E8F0" />
                <circle cx="88" cy="78" r="6" fill="#77a80b" opacity="0.9">
                  <animate attributeName="opacity" values="0;0;0.9;0.9" dur="4s" repeatCount="indefinite" />
                </circle>
                <path d="M85 78 L87 80.5 L91.5 75.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="opacity" values="0;0;1;1" dur="4s" repeatCount="indefinite" />
                </path>
              </g>

              {/* Card 2 — rosa, top-right */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="0,0;-5,-7;0,0" dur="4.5s" repeatCount="indefinite" />
                <rect x="378" y="28" width="72" height="52" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="378" y="28" width="72" height="10" rx="8" fill="#e32a74" opacity="0.85" />
                <rect x="386" y="46" width="36" height="4" rx="2" fill="#CBD5E1" />
                <rect x="386" y="54" width="50" height="4" rx="2" fill="#E2E8F0" />
                <rect x="386" y="62" width="30" height="4" rx="2" fill="#E2E8F0" />
                <circle cx="436" cy="68" r="6" fill="#77a80b" opacity="0.9">
                  <animate attributeName="opacity" values="0;0;0;0.9;0.9" dur="4.5s" repeatCount="indefinite" />
                </circle>
                <path d="M433 68 L435 70.5 L439.5 65.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="opacity" values="0;0;0;1;1" dur="4.5s" repeatCount="indefinite" />
                </path>
              </g>

              {/* Card 3 — amarelo, bottom-left */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="0,0;6,-4;0,0" dur="5s" repeatCount="indefinite" />
                <rect x="55" y="140" width="68" height="48" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="55" y="140" width="68" height="10" rx="8" fill="#eeb513" opacity="0.85" />
                <rect x="63" y="158" width="44" height="4" rx="2" fill="#CBD5E1" />
                <rect x="63" y="166" width="32" height="4" rx="2" fill="#E2E8F0" />
                <circle cx="109" cy="176" r="6" fill="#77a80b" opacity="0">
                  <animate attributeName="opacity" values="0;0;0;0;0.9;0.9" dur="5s" repeatCount="indefinite" />
                </circle>
                <path d="M106 176 L108 178.5 L112.5 173.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="opacity" values="0;0;0;0;1;1" dur="5s" repeatCount="indefinite" />
                </path>
              </g>

              {/* Card 4 — verde, bottom-right */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="0,0;-4,-8;0,0" dur="4.2s" repeatCount="indefinite" />
                <rect x="360" y="132" width="68" height="48" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="360" y="132" width="68" height="10" rx="8" fill="#77a80b" opacity="0.85" />
                <rect x="368" y="150" width="38" height="4" rx="2" fill="#CBD5E1" />
                <rect x="368" y="158" width="50" height="4" rx="2" fill="#E2E8F0" />
                <circle cx="414" cy="168" r="6" fill="#77a80b" opacity="0">
                  <animate attributeName="opacity" values="0;0;0.9;0.9;0.9" dur="4.2s" repeatCount="indefinite" />
                </circle>
                <path d="M411 168 L413 170.5 L417.5 165.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="opacity" values="0;0;1;1;1" dur="4.2s" repeatCount="indefinite" />
                </path>
              </g>

              {/* ── Curved connecting lines from cards to robot ── */}
              <path d="M102 64 Q 140 55, 190 90" fill="none" stroke="#0047AB" strokeWidth="1.2" opacity="0.18" strokeDasharray="6 4" strokeLinecap="round">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
              </path>
              <path d="M378 54 Q 340 50, 290 90" fill="none" stroke="#e32a74" strokeWidth="1.2" opacity="0.18" strokeDasharray="6 4" strokeLinecap="round">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="2.5s" repeatCount="indefinite" />
              </path>
              <path d="M123 155 Q 155 140, 200 135" fill="none" stroke="#eeb513" strokeWidth="1.2" opacity="0.18" strokeDasharray="6 4" strokeLinecap="round">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="2.2s" repeatCount="indefinite" />
              </path>
              <path d="M360 155 Q 325 140, 280 135" fill="none" stroke="#77a80b" strokeWidth="1.2" opacity="0.18" strokeDasharray="6 4" strokeLinecap="round">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="2.8s" repeatCount="indefinite" />
              </path>

              {/* ══ ROBOT (centered, same design as login MicoMascot) ══ */}
              <g transform="translate(175, 16) scale(0.65)">
                {/* Antenna */}
                <line x1="100" y1="22" x2="100" y2="38" stroke="#A0B0C8" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="18" r="6" fill="#EEB513" stroke="#D4A00A" strokeWidth="1.5">
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Ears */}
                <rect x="28" y="62" width="14" height="32" rx="5" fill="#A0B0C8" stroke="#8898B0" strokeWidth="1" />
                <rect x="158" y="62" width="14" height="32" rx="5" fill="#A0B0C8" stroke="#8898B0" strokeWidth="1" />
                <circle cx="35" cy="72" r="3" fill="#0047AB" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="165" cy="72" r="3" fill="#0047AB" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" begin="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Head */}
                <rect x="42" y="36" width="116" height="90" rx="22" fill="#EDF0F7" stroke="#B0BED0" strokeWidth="1.5" />

                {/* Screen */}
                <rect x="52" y="48" width="96" height="62" rx="14" fill="#0047AB" />
                <rect x="56" y="52" width="40" height="6" rx="3" fill="white" opacity="0.06" />

                {/* Eyes */}
                {!robotExcited ? (
                  <g>
                    <ellipse cx="78" cy="74" rx="12" ry="13" fill="white" opacity="0.95" />
                    <circle cx="80" cy="75" r="7" fill="#2D1B06">
                      <animate attributeName="cx" values="76;84;76" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="83" cy="72" r="2.5" fill="white">
                      <animate attributeName="cx" values="79;87;79" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <ellipse cx="122" cy="74" rx="12" ry="13" fill="white" opacity="0.95" />
                    <circle cx="120" cy="75" r="7" fill="#2D1B06">
                      <animate attributeName="cx" values="116;124;116" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="123" cy="72" r="2.5" fill="white">
                      <animate attributeName="cx" values="119;127;119" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </g>
                ) : (
                  <g>
                    {/* Excited eyes — bigger, looking at user */}
                    <ellipse cx="78" cy="73" rx="13" ry="14" fill="white" opacity="0.95" />
                    <circle cx="80" cy="74" r="8" fill="#2D1B06" />
                    <circle cx="83" cy="70" r="3" fill="white" />
                    <ellipse cx="122" cy="73" rx="13" ry="14" fill="white" opacity="0.95" />
                    <circle cx="120" cy="74" r="8" fill="#2D1B06" />
                    <circle cx="123" cy="70" r="3" fill="white" />
                    {/* Sparkle near eyes */}
                    <g opacity="0.7">
                      <line x1="56" y1="58" x2="56" y2="50" stroke="#EEB513" strokeWidth="2" strokeLinecap="round" />
                      <line x1="52" y1="54" x2="60" y2="54" stroke="#EEB513" strokeWidth="2" strokeLinecap="round" />
                      <line x1="144" y1="58" x2="144" y2="50" stroke="#EEB513" strokeWidth="2" strokeLinecap="round" />
                      <line x1="140" y1="54" x2="148" y2="54" stroke="#EEB513" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  </g>
                )}

                {/* Mouth */}
                {!robotExcited ? (
                  <>
                    <path d="M 86 94 Q 100 104 114 94" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="62" cy="88" r="5" fill="#EEB513" opacity="0.25" />
                    <circle cx="138" cy="88" r="5" fill="#EEB513" opacity="0.25" />
                  </>
                ) : (
                  <>
                    {/* Big happy smile */}
                    <path d="M 82 92 Q 100 110 118 92" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="62" cy="88" r="6" fill="#EEB513" opacity="0.4" />
                    <circle cx="138" cy="88" r="6" fill="#EEB513" opacity="0.4" />
                  </>
                )}

                {/* Body */}
                <rect x="62" y="130" width="76" height="34" rx="14" fill="#E0E5EF" stroke="#B0BED0" strokeWidth="1" />
                <circle cx="100" cy="145" r="4.5" fill="#0047AB" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
                </circle>

                {/* Arms */}
                {!robotExcited ? (
                  <>
                    {/* Arms — reaching outward (organizing) */}
                    <path d="M 60 142 Q 38 138 20 148" stroke="#A0B0C8" strokeWidth="10" strokeLinecap="round" fill="none" />
                    <circle cx="18" cy="150" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
                    <path d="M 140 142 Q 162 138 180 148" stroke="#A0B0C8" strokeWidth="10" strokeLinecap="round" fill="none" />
                    <circle cx="182" cy="150" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
                  </>
                ) : (
                  <>
                    {/* Arms — raised up celebrating */}
                    <path d="M 58 136 Q 32 118 24 90" stroke="#A0B0C8" strokeWidth="10" strokeLinecap="round" fill="none" />
                    <circle cx="22" cy="86" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
                    <path d="M 142 136 Q 168 118 176 90" stroke="#A0B0C8" strokeWidth="10" strokeLinecap="round" fill="none" />
                    <circle cx="178" cy="86" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
                  </>
                )}
              </g>
            </svg>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ animation: 'fadeUp 0.6s ease-out 0.1s both' }}
          >
            <span className="text-[#0047AB]">Gestão de editais</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #0047AB 0%, #e32a74 35%, #eeb513 65%, #77a80b 100%)',
              }}
            >
              culturais inteligente
            </span>
          </h1>

          <p
            className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ animation: 'fadeUp 0.6s ease-out 0.2s both' }}
          >
            Do edital ao pagamento, do proponente à prestação de contas.
            A plataforma mais completa do Brasil para fomento cultural municipal.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}
          >
            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-[#0047AB] text-white font-semibold text-sm hover:brightness-110 transition-all shadow-xl shadow-[#0047AB]/25"
              onMouseEnter={() => setRobotExcited(true)}
              onMouseLeave={() => setRobotExcited(false)}
            >
              Comece Agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/editais"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm text-slate-600 font-semibold text-sm hover:bg-white hover:border-slate-300 hover:text-slate-800 transition-all shadow-sm"
              onMouseEnter={() => setRobotExcited(true)}
              onMouseLeave={() => setRobotExcited(false)}
            >
              Ver Editais Abertos
            </Link>
          </div>

          {/* Floating badges */}
          <div
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-medium"
            style={{ animation: 'fadeUp 0.6s ease-out 0.5s both' }}
          >
            {['Lei 14.903/2024 (PNAB)', 'Decreto 11.453/2023', 'LGPD Compliant', 'Gov.br OAuth'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[#77a80b]" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#0047AB]/30 z-10">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#0047AB]/25 to-transparent" />
        </div>

        {/* Gradient fade — soft blue to white at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,71,171,0.15) 0%, rgba(0,71,171,0.06) 40%, transparent 100%)',
          }}
        />
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
              Uma experiência pensada para você
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-lg mx-auto">
              Seja proponente, gestor, avaliador ou cidadão — cada perfil tem funcionalidades específicas.
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
          DIFERENCIAIS — Comparison cards
          ════════════════════════════════════════════ */}
      <section className="bg-[#FAFBFD]">
        <div className="container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#e32a74] mb-3">Diferenciais exclusivos</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif]">
              O que nenhum concorrente oferece
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {differentiators.map((d, i) => (
              <DiffCard key={d.title} {...d} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURES HIGHLIGHT — 3 big cards
          ════════════════════════════════════════════ */}
      <section className="bg-[#0047AB] text-white relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #4d8fea, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #eeb513, transparent)' }}
        />

        <div className="relative container mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#eeb513] mb-3">Tecnologia de ponta</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-[Sora,sans-serif]">
              Construído para o setor público brasileiro
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Lock,
                title: 'Segurança e LGPD',
                desc: 'Assinatura SHA-256, verificação pública, exportação de dados pessoais, solicitação de exclusão. Row-level security no banco de dados.',
                color: '#0047AB',
              },
              {
                icon: Zap,
                title: 'Automação Inteligente',
                desc: 'Ranking automático com desempate, motor de cotas, triagem IA, geração de PDFs, notificações dual-channel, suplentes e convocações.',
                color: '#77a80b',
              },
              {
                icon: LayoutDashboard,
                title: 'Multi-Tenant SaaS',
                desc: 'Uma única plataforma para N municípios. Cada prefeitura com sua marca, logo, cores, domínio e dados isolados.',
                color: '#e32a74',
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="relative rounded-2xl bg-white p-8 shadow-lg shadow-black/5"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${card.color}14` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{card.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
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
              Do edital à prestação de contas
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-lg mx-auto">
              8 etapas totalmente digitalizadas. Sem papel, sem planilha, sem retrabalho.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {[
              { step: '01', title: 'Publicação', desc: 'Edital configurado e publicado', color: '#0047AB', icon: FileText },
              { step: '02', title: 'Inscrição', desc: 'Proponentes enviam projetos', color: '#0047AB', icon: Upload },
              { step: '03', title: 'Avaliação', desc: 'Pareceristas avaliam por critérios', color: '#eeb513', icon: Star },
              { step: '04', title: 'Ranking', desc: 'Consolidação automática + cotas', color: '#eeb513', icon: TrendingUp },
              { step: '05', title: 'Recursos', desc: 'Prazo e análise de recursos', color: '#e32a74', icon: Gavel },
              { step: '06', title: 'Habilitação', desc: 'Conferência documental', color: '#e32a74', icon: FileCheck },
              { step: '07', title: 'Execução', desc: 'Termos, pagamentos, aditivos', color: '#77a80b', icon: Wallet },
              { step: '08', title: 'Prestação', desc: 'Relatório final e encerramento', color: '#77a80b', icon: Receipt },
            ].map((s, i) => (
              <JourneyStep key={s.step} {...s} index={i} />
            ))}
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
                Todos os documentos oficiais do processo são gerados pelo sistema com assinatura digital integrada.
                Chega de montar documentos no Word.
              </p>
              <div className="space-y-3">
                {[
                  'Termo de Execução Cultural',
                  'Decisão Administrativa de Recurso',
                  'Portaria da Comissão de Avaliação',
                  'Lista Oficial de Inscritos',
                  'Termo Aditivo',
                  'Recibo de Inscrição',
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
                      <p className="text-sm font-semibold text-slate-900">Termo de Execução</p>
                      <p className="text-xs text-slate-400">14 cláusulas • Assinado digitalmente</p>
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
                VLibras integrado para tradução em Libras, campos de acessibilidade nos projetos
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
            Pronto para transformar a gestão cultural?
          </h2>
          <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto mb-10">
            Junte-se à plataforma mais completa para editais culturais do Brasil.
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
      `}</style>
    </div>
  )
}

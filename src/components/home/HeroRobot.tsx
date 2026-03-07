'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface HeroRobotProps {
  /** Main heading line 1 */
  title?: string
  /** Gradient line 2 (null to hide) */
  subtitle?: string | null
  /** Description paragraph */
  description?: string
  /** Primary CTA */
  ctaLabel?: string
  ctaHref?: string
  /** Secondary CTA */
  secondaryLabel?: string
  secondaryHref?: string
  /** Show compliance badges */
  showBadges?: boolean
  /** Compact mode (less vertical space) */
  compact?: boolean
  /** Brand color for CTA button (tenant mode) */
  brandColor?: string
}

export function HeroRobot({
  title = 'Gestão de editais',
  subtitle = 'culturais inteligente',
  description = 'Do edital ao pagamento, do proponente à prestação de contas. A plataforma mais completa do Brasil para fomento cultural municipal.',
  ctaLabel = 'Comece Agora',
  ctaHref = '/cadastro',
  secondaryLabel = 'Ver Editais Abertos',
  secondaryHref = '/editais',
  showBadges = true,
  compact = false,
  brandColor,
}: HeroRobotProps) {
  const [robotExcited, setRobotExcited] = useState(false)

  return (
    <section className={`relative ${compact ? 'py-12 md:py-20' : 'min-h-[92vh]'} flex items-center justify-center overflow-hidden bg-white`}>
      <div className="relative z-10 container mx-auto px-6 md:px-8 text-center max-w-4xl">
        {/* Robot organizing editais scene */}
        <div
          className="flex justify-center mb-6"
          style={{ animation: 'fadeUp 0.6s ease-out both' }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 480 220" className="w-full max-w-[320px] md:max-w-[420px] h-auto" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,71,171,0.10))' }}>
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

            {/* Curved connecting lines */}
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

            {/* ROBOT */}
            <g transform="translate(175, 16) scale(0.65)">
              <line x1="100" y1="22" x2="100" y2="38" stroke="#A0B0C8" strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="18" r="6" fill="#EEB513" stroke="#D4A00A" strokeWidth="1.5">
                <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
              </circle>
              <rect x="28" y="62" width="14" height="32" rx="5" fill="#A0B0C8" stroke="#8898B0" strokeWidth="1" />
              <rect x="158" y="62" width="14" height="32" rx="5" fill="#A0B0C8" stroke="#8898B0" strokeWidth="1" />
              <circle cx="35" cy="72" r="3" fill="#0047AB" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="165" cy="72" r="3" fill="#0047AB" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" begin="1.5s" repeatCount="indefinite" />
              </circle>
              <rect x="42" y="36" width="116" height="90" rx="22" fill="#EDF0F7" stroke="#B0BED0" strokeWidth="1.5" />
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
                  <ellipse cx="78" cy="73" rx="13" ry="14" fill="white" opacity="0.95" />
                  <circle cx="80" cy="74" r="8" fill="#2D1B06" />
                  <circle cx="83" cy="70" r="3" fill="white" />
                  <ellipse cx="122" cy="73" rx="13" ry="14" fill="white" opacity="0.95" />
                  <circle cx="120" cy="74" r="8" fill="#2D1B06" />
                  <circle cx="123" cy="70" r="3" fill="white" />
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
                  <path d="M 82 92 Q 100 110 118 92" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="62" cy="88" r="6" fill="#EEB513" opacity="0.4" />
                  <circle cx="138" cy="88" r="6" fill="#EEB513" opacity="0.4" />
                </>
              )}

              <rect x="62" y="130" width="76" height="34" rx="14" fill="#E0E5EF" stroke="#B0BED0" strokeWidth="1" />
              <circle cx="100" cy="145" r="4.5" fill="#0047AB" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
              </circle>

              {/* Arms */}
              {!robotExcited ? (
                <>
                  <path d="M 60 142 Q 38 138 20 148" stroke="#A0B0C8" strokeWidth="10" strokeLinecap="round" fill="none" />
                  <circle cx="18" cy="150" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
                  <path d="M 140 142 Q 162 138 180 148" stroke="#A0B0C8" strokeWidth="10" strokeLinecap="round" fill="none" />
                  <circle cx="182" cy="150" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
                </>
              ) : (
                <>
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
          className={`${compact ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'} font-extrabold tracking-tight leading-[1.08] mb-6`}
          style={{ animation: 'fadeUp 0.6s ease-out 0.1s both' }}
        >
          <span className="text-[#0047AB]">{title}</span>
          {subtitle && (
            <>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #0047AB 0%, #e32a74 35%, #eeb513 65%, #77a80b 100%)',
                }}
              >
                {subtitle}
              </span>
            </>
          )}
        </h1>

        <p
          className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ animation: 'fadeUp 0.6s ease-out 0.2s both' }}
        >
          {description}
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}
        >
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-white font-semibold text-sm hover:brightness-110 transition-all shadow-xl"
            style={{
              backgroundColor: brandColor || '#0047AB',
              boxShadow: `0 10px 25px -5px ${brandColor || '#0047AB'}40`,
            }}
            onMouseEnter={() => setRobotExcited(true)}
            onMouseLeave={() => setRobotExcited(false)}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm text-slate-600 font-semibold text-sm hover:bg-white hover:border-slate-300 hover:text-slate-800 transition-all shadow-sm"
            onMouseEnter={() => setRobotExcited(true)}
            onMouseLeave={() => setRobotExcited(false)}
          >
            {secondaryLabel}
          </Link>
        </div>

        {showBadges && (
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
        )}
      </div>

      {!compact && (
        <>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#0047AB]/30 z-10">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-[#0047AB]/25 to-transparent" />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,71,171,0.15) 0%, rgba(0,71,171,0.06) 40%, transparent 100%)',
            }}
          />
        </>
      )}

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

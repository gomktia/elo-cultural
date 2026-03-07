'use client'

import { useState, useEffect, useCallback } from 'react'

type MascotState = 'idle' | 'watching' | 'hiding' | 'peeking'

interface MascotProps {
  state: MascotState
  lookProgress: number
}

export function MicoMascot({ state, lookProgress }: MascotProps) {
  const eyeX = state === 'watching' ? (lookProgress - 0.5) * 16 : 0
  const eyeY = state === 'watching' ? 2 : 0
  const isHiding = state === 'hiding'
  const isPeeking = state === 'peeking'
  const handsUp = isHiding || isPeeking

  return (
    <div className="flex justify-center select-none" aria-hidden="true">
      <svg
        viewBox="0 0 200 190"
        className="w-28 h-28 md:w-32 md:h-32"
        style={{ filter: 'drop-shadow(0 6px 20px rgba(0, 71, 171, 0.18))' }}
      >
        {/* ── Antenna ── */}
        <line x1="100" y1="22" x2="100" y2="38" stroke="#A0B0C8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="18" r="6" fill="#EEB513" stroke="#D4A00A" strokeWidth="1.5">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* ── Ears ── */}
        <rect x="28" y="62" width="14" height="32" rx="5" fill="#A0B0C8" stroke="#8898B0" strokeWidth="1" />
        <rect x="158" y="62" width="14" height="32" rx="5" fill="#A0B0C8" stroke="#8898B0" strokeWidth="1" />
        <circle cx="35" cy="72" r="3" fill="#0047AB" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="165" cy="72" r="3" fill="#0047AB" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" begin="1.5s" repeatCount="indefinite" />
        </circle>

        {/* ── Head ── */}
        <rect x="42" y="36" width="116" height="90" rx="22" fill="#EDF0F7" stroke="#B0BED0" strokeWidth="1.5" />

        {/* ── Screen ── */}
        <rect x="52" y="48" width="96" height="62" rx="14" fill="#0047AB" />
        <rect x="56" y="52" width="40" height="6" rx="3" fill="white" opacity="0.06" />

        {/* ── Eyes (idle/watching) ── */}
        {!handsUp && (
          <g style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}>
            <ellipse cx="78" cy="74" rx="12" ry="13" fill="white" opacity="0.95" />
            <circle cx="80" cy="75" r="7" fill="#2D1B06" />
            <circle cx="83" cy="72" r="2.5" fill="white" />
            <ellipse cx="122" cy="74" rx="12" ry="13" fill="white" opacity="0.95" />
            <circle cx="120" cy="75" r="7" fill="#2D1B06" />
            <circle cx="123" cy="72" r="2.5" fill="white" />
          </g>
        )}

        {/* ── Mouth ── */}
        {!handsUp && (
          <>
            <path d="M 86 94 Q 100 104 114 94" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="62" cy="88" r="5" fill="#EEB513" opacity="0.25" />
            <circle cx="138" cy="88" r="5" fill="#EEB513" opacity="0.25" />
          </>
        )}
        {isHiding && (
          <path d="M 92 98 L 108 98" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {isPeeking && (
          <path d="M 88 96 Q 100 103 112 96" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* ── Body ── */}
        <rect x="62" y="130" width="76" height="34" rx="14" fill="#E0E5EF" stroke="#B0BED0" strokeWidth="1" />
        <circle cx="100" cy="145" r="4.5" fill="#0047AB" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* ── Arms (idle - down at sides) ── */}
        {!handsUp && (
          <>
            <rect x="44" y="134" width="16" height="24" rx="8" fill="#C8D0DE" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="52" cy="162" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <rect x="140" y="134" width="16" height="24" rx="8" fill="#C8D0DE" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="148" cy="162" r="7.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
          </>
        )}

        {/* ═══ HANDS COVERING EYES ═══ */}
        {isHiding && (
          <>
            {/* Left arm reaching up */}
            <path d="M 52 130 Q 40 110 55 75" stroke="#A0B0C8" strokeWidth="14" strokeLinecap="round" fill="none" />
            {/* Left hand */}
            <ellipse cx="62" cy="72" rx="22" ry="17" fill="#C8D0DE" stroke="#A0B0C8" strokeWidth="1.5" />
            <circle cx="46" cy="64" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="54" cy="59" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="64" cy="57" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="74" cy="60" r="6.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            {/* Finger joints */}
            <circle cx="46" cy="64" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="54" cy="59" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="64" cy="57" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="74" cy="60" r="2.5" fill="#0047AB" opacity="0.2" />

            {/* Right arm reaching up */}
            <path d="M 148 130 Q 160 110 145 75" stroke="#A0B0C8" strokeWidth="14" strokeLinecap="round" fill="none" />
            {/* Right hand */}
            <ellipse cx="138" cy="72" rx="22" ry="17" fill="#C8D0DE" stroke="#A0B0C8" strokeWidth="1.5" />
            <circle cx="154" cy="64" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="146" cy="59" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="136" cy="57" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="126" cy="60" r="6.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="154" cy="64" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="146" cy="59" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="136" cy="57" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="126" cy="60" r="2.5" fill="#0047AB" opacity="0.2" />
          </>
        )}

        {/* ═══ PEEKING: hands partially covering, one eye visible ═══ */}
        {isPeeking && (
          <>
            {/* Left arm reaching up but offset */}
            <path d="M 52 130 Q 34 105 48 80" stroke="#A0B0C8" strokeWidth="14" strokeLinecap="round" fill="none" />
            {/* Left hand - shifted left to reveal left eye */}
            <ellipse cx="54" cy="76" rx="20" ry="16" fill="#C8D0DE" stroke="#A0B0C8" strokeWidth="1.5" />
            <circle cx="40" cy="68" r="6.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="47" cy="63" r="6.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="56" cy="62" r="6.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="65" cy="65" r="6" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="40" cy="68" r="2" fill="#0047AB" opacity="0.2" />
            <circle cx="47" cy="63" r="2" fill="#0047AB" opacity="0.2" />
            <circle cx="56" cy="62" r="2" fill="#0047AB" opacity="0.2" />
            <circle cx="65" cy="65" r="2" fill="#0047AB" opacity="0.2" />

            {/* Right arm reaching up */}
            <path d="M 148 130 Q 160 110 145 75" stroke="#A0B0C8" strokeWidth="14" strokeLinecap="round" fill="none" />
            {/* Right hand - still covering right eye */}
            <ellipse cx="138" cy="72" rx="22" ry="17" fill="#C8D0DE" stroke="#A0B0C8" strokeWidth="1.5" />
            <circle cx="154" cy="64" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="146" cy="59" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="136" cy="57" r="7" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="126" cy="60" r="6.5" fill="#D0D8E6" stroke="#A0B0C8" strokeWidth="1" />
            <circle cx="154" cy="64" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="146" cy="59" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="136" cy="57" r="2.5" fill="#0047AB" opacity="0.2" />
            <circle cx="126" cy="60" r="2.5" fill="#0047AB" opacity="0.2" />

            {/* Left eye peeking (between gap left by shifted left hand) */}
            <ellipse cx="80" cy="74" rx="10" ry="11" fill="white" opacity="0.95" />
            <circle cx="82" cy="76" r="6" fill="#2D1B06" />
            <circle cx="84" cy="73" r="2" fill="white" />
          </>
        )}
      </svg>
    </div>
  )
}

export function useMicoState() {
  const [state, setState] = useState<MascotState>('idle')
  const [lookProgress, setLookProgress] = useState(0.5)
  const [showPassword, setShowPassword] = useState(false)

  const onEmailFocus = useCallback(() => setState('watching'), [])
  const onEmailBlur = useCallback(() => setState('idle'), [])

  const onPasswordFocus = useCallback(() => {
    setState(showPassword ? 'peeking' : 'hiding')
  }, [showPassword])

  const onPasswordBlur = useCallback(() => setState('idle'), [])

  const onEmailChange = useCallback((value: string) => {
    const progress = Math.min(value.length / 30, 1)
    setLookProgress(progress)
  }, [])

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => {
      const next = !prev
      setState(s => s === 'hiding' || s === 'peeking' ? (next ? 'peeking' : 'hiding') : s)
      return next
    })
  }, [])

  useEffect(() => {
    if (state === 'hiding' && showPassword) setState('peeking')
    if (state === 'peeking' && !showPassword) setState('hiding')
  }, [showPassword, state])

  return {
    micoState: state,
    lookProgress,
    showPassword,
    onEmailFocus,
    onEmailBlur,
    onEmailChange,
    onPasswordFocus,
    onPasswordBlur,
    toggleShowPassword,
  }
}

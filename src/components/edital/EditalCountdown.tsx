'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface EditalCountdownProps {
  deadline: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calcTimeLeft(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  }
}

function Digit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div className="bg-slate-900 rounded-xl w-16 h-18 md:w-20 md:h-22 flex items-center justify-center shadow-lg shadow-slate-900/20 border border-slate-700/50">
          <span className="text-3xl md:text-4xl font-bold text-white tabular-nums tracking-tight font-[Sora,monospace]">
            {display}
          </span>
        </div>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/30" />
      </div>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col items-center gap-2 pb-5">
      <div className="h-1.5 w-1.5 rounded-full bg-[#0047AB] animate-pulse" />
      <div className="h-1.5 w-1.5 rounded-full bg-[#0047AB] animate-pulse" />
    </div>
  )
}

export function EditalCountdown({ deadline }: EditalCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(deadline))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTimeLeft(calcTimeLeft(deadline)), 1000)
    return () => clearInterval(timer)
  }, [deadline])

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-[#0047AB]" />
        <div className="p-6 md:p-8 flex items-center justify-center h-32">
          <div className="h-5 w-5 border-2 border-slate-200 border-t-[#0047AB] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (timeLeft.total <= 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-slate-300" />
        <div className="p-6 md:p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Prazo de Inscrição</span>
          </div>
          <p className="text-lg font-bold text-slate-900">Inscrições encerradas</p>
        </div>
      </div>
    )
  }

  const isUrgent = timeLeft.days <= 3

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${isUrgent ? 'bg-[#e32a74]' : 'bg-[#0047AB]'}`} />
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Clock className={`h-4 w-4 ${isUrgent ? 'text-[#e32a74]' : 'text-[#0047AB]'}`} />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            {isUrgent ? 'Últimos dias para inscrição' : 'Inscrições encerram em'}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 md:gap-4">
          <Digit value={timeLeft.days} label="Dias" />
          <Separator />
          <Digit value={timeLeft.hours} label="Horas" />
          <Separator />
          <Digit value={timeLeft.minutes} label="Min" />
          <Separator />
          <Digit value={timeLeft.seconds} label="Seg" />
        </div>
        {isUrgent && (
          <p className="text-center text-xs font-medium text-[#e32a74] mt-4 animate-pulse">
            Corra! O prazo está acabando.
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import type { Edital } from '@/types/database.types'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EditalSliderProps {
  editais: Edital[]
}

export function EditalSlider({ editais }: EditalSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = editais.length

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % Math.max(total, 1))
  }, [total])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + Math.max(total, 1)) % Math.max(total, 1))
  }, [total])

  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, total])

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center max-w-2xl mx-auto">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#0047AB] via-[#e32a74] via-[#eeb513] to-[#77a80b] mb-8" />
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
          Bem-vindo ao Elo Cultural
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Nenhum edital publicado no momento. Acompanhe esta página para novidades.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild className="rounded-xl bg-[#0047AB] hover:bg-[#003d91]">
            <Link href="/editais">Ver Editais</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/cadastro">Cadastrar-se</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-[#0047AB] via-[#e32a74] via-[#eeb513] to-[#77a80b]" />

        <div className="slider-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {editais.map((edital) => (
            <div key={edital.id} className="slider-slide p-6 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-[#0047AB] bg-[#0047AB]/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-wide">
                  {edital.numero_edital}
                </span>
                <EditalStatusBadge status={edital.status} />
              </div>

              <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mb-3 leading-snug">
                {edital.titulo}
              </h3>

              {edital.descricao && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-5 leading-relaxed">
                  {edital.descricao}
                </p>
              )}

              {edital.fim_inscricao && (
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                  <Calendar className="h-4 w-4" />
                  <span>Inscrições até {format(new Date(edital.fim_inscricao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button asChild className="rounded-xl bg-[#0047AB] hover:bg-[#003d91] text-sm">
                  <Link href={`/editais/${edital.id}`}>Ver Edital</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl text-sm">
                  <Link href={`/editais/${edital.id}`}>Saiba Mais</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md transition-all"
            aria-label="Edital anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md transition-all"
            aria-label="Próximo edital"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-center gap-2 mt-4">
            {editais.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-6 bg-[#0047AB]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Ir para edital ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

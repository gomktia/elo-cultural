'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function GovBrButton() {
  const [loading, setLoading] = useState(false)

  async function handleGovBr() {
    setLoading(true)

    try {
      const res = await fetch('/api/auth/govbr/authorize')
      const data = await res.json()

      if (data.enabled && data.url) {
        window.location.href = data.url
      } else {
        toast.info('Integração gov.br em breve', {
          description: 'Estamos finalizando a integração com o login gov.br. Por enquanto, use e-mail e senha.',
          duration: 5000,
        })
        setLoading(false)
      }
    } catch {
      toast.error('Erro ao conectar com gov.br')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-white px-3 text-slate-300 font-semibold">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGovBr}
        disabled={loading}
        className="w-full h-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide transition-all gap-3"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="48" height="48" rx="8" fill="#1351B4"/>
          <path d="M24 10L38 24L24 38L10 24L24 10Z" fill="#FFCD07"/>
          <circle cx="24" cy="24" r="6" fill="#1351B4"/>
        </svg>
        Entrar com <strong className="ml-1">gov.br</strong>
      </Button>
    </>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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

      <button
        type="button"
        onClick={handleGovBr}
        disabled={loading}
        className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-[#1351B4] hover:bg-[#0C326F] text-white font-semibold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {/* Gov.br official logo mark */}
            <svg width="28" height="16" viewBox="0 0 100 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              {/* Yellow diamond */}
              <path d="M28 0L56 28L28 56L0 28L28 0Z" fill="#FFCD07"/>
              {/* Blue circle inside diamond */}
              <circle cx="28" cy="28" r="10" fill="#1351B4"/>
              {/* "gov.br" text */}
              <text x="62" y="36" fill="white" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold">gov.br</text>
            </svg>
            <span>Entrar com <strong>gov.br</strong></span>
          </>
        )}
      </button>
    </>
  )
}

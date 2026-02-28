'use client'

import { AlertTriangle } from 'lucide-react'

export default function TenantNaoEncontradoPage() {
  const domain = typeof window !== 'undefined' ? window.location.hostname : ''

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Instancia nao encontrada
          </h1>

          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            O dominio <strong className="text-slate-700">{domain}</strong> nao esta
            vinculado a nenhuma instancia ativa na plataforma Elo Cultura Digital.
          </p>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Possiveis causas:</p>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc ml-4">
              <li>O dominio ainda nao foi configurado pelo administrador</li>
              <li>A instancia esta temporariamente inativa ou suspensa</li>
              <li>O endereco digitado pode estar incorreto</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-400 mt-6">
            Se voce e administrador, acesse o painel super admin para configurar o dominio desta instancia.
          </p>
        </div>
      </div>
    </div>
  )
}

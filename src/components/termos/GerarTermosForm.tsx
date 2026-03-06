'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileSignature, Loader2, AlertTriangle } from 'lucide-react'
import { gerarTermosEdital } from '@/lib/actions/termo-actions'

interface ProjetoItem {
  id: string
  titulo: string
  protocolo: string
  proponente: string
  valor: number
  jaTemTermo: boolean
}

interface GerarTermosFormProps {
  editalId: string
  projetos: ProjetoItem[]
}

export function GerarTermosForm({ editalId, projetos }: GerarTermosFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; gerados?: number; error?: string } | null>(null)

  const pendentes = projetos.filter(p => !p.jaTemTermo)
  const jaGerados = projetos.filter(p => p.jaTemTermo)

  function handleGerar() {
    startTransition(async () => {
      const res = await gerarTermosEdital(editalId)
      setResult(res)
      if (res.success) {
        setTimeout(() => router.push(`/admin/editais/${editalId}/termos`), 2000)
      }
    })
  }

  if (projetos.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Nenhum projeto selecionado</h3>
          <p className="text-sm text-slate-500 font-normal max-w-md mx-auto">
            Para gerar termos, primeiro consolide o ranking e selecione os projetos aprovados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Projetos Selecionados</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {pendentes.length} termo{pendentes.length !== 1 ? 's' : ''} será{pendentes.length !== 1 ? 'ão' : ''} gerado{pendentes.length !== 1 ? 's' : ''}
                {jaGerados.length > 0 && ` (${jaGerados.length} já existente${jaGerados.length !== 1 ? 's' : ''})`}
              </p>
            </div>
            <Button
              onClick={handleGerar}
              disabled={isPending || pendentes.length === 0 || !!result?.success}
              className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 font-semibold text-xs uppercase tracking-wide gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="h-4 w-4" />
              )}
              {isPending ? 'Gerando...' : 'Confirmar Geração'}
            </Button>
          </div>

          {result?.error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              {result.error}
            </div>
          )}
          {result?.success && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {result.gerados} termo{result.gerados !== 1 ? 's' : ''} gerado{result.gerados !== 1 ? 's' : ''} com sucesso! Redirecionando...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project list */}
      <div className="space-y-2">
        {projetos.map(p => (
          <Card key={p.id} className={`border shadow-sm rounded-2xl overflow-hidden ${p.jaTemTermo ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.titulo}</p>
                  {p.jaTemTermo && (
                    <Badge className="bg-green-50 text-green-700 border-none text-[11px] font-medium px-2 py-0.5 rounded-lg shrink-0">
                      Termo existente
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span>{p.protocolo}</span>
                  <span>{p.proponente}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-900 shrink-0">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Play } from 'lucide-react'
import {
  analisarRequerimento,
  pedirDiligencia,
  decidirRequerimento,
} from '@/lib/actions/requerimento-actions'

interface RequerimentoDecisaoPanelProps {
  requerimentoId: string
  status: string
  diligenciaCount: number
}

export function RequerimentoDecisaoPanel({
  requerimentoId,
  status,
  diligenciaCount,
}: RequerimentoDecisaoPanelProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'diligencia' | 'deferir' | 'indeferir' | null>(null)
  const [texto, setTexto] = useState('')

  async function handleIniciarAnalise() {
    setLoading(true)
    const result = await analisarRequerimento(requerimentoId)
    setLoading(false)
    if (result.error) toast.error(result.error)
    else toast.success('Análise iniciada')
  }

  async function handleDiligencia() {
    if (!texto.trim()) { toast.error('Escreva o texto da diligência'); return }
    setLoading(true)
    const result = await pedirDiligencia(requerimentoId, texto.trim())
    setLoading(false)
    if (result.error) toast.error(result.error)
    else { toast.success('Diligência enviada'); setAction(null); setTexto('') }
  }

  async function handleDecidir(decisao: 'deferido' | 'indeferido') {
    if (!texto.trim()) { toast.error('Escreva a justificativa da decisão'); return }
    setLoading(true)
    const result = await decidirRequerimento(requerimentoId, decisao, texto.trim())
    setLoading(false)
    if (result.error) toast.error(result.error)
    else { toast.success(`Requerimento ${decisao}`); setAction(null); setTexto('') }
  }

  return (
    <Card className="border border-slate-200 rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Ações</p>

        {status === 'pendente' && (
          <Button
            onClick={handleIniciarAnalise}
            disabled={loading}
            className="rounded-xl w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Iniciar Análise
          </Button>
        )}

        {(status === 'em_analise' || status === 'respondida') && (
          <div className="space-y-3">
            {!action && (
              <div className="flex gap-2">
                {diligenciaCount < 2 && (
                  <Button
                    variant="outline"
                    onClick={() => { setAction('diligencia'); setTexto('') }}
                    className="rounded-xl flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Diligência
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setAction('deferir'); setTexto('') }}
                  className="rounded-xl flex-1 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Deferir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setAction('indeferir'); setTexto('') }}
                  className="rounded-xl flex-1 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Indeferir
                </Button>
              </div>
            )}

            {action && (
              <div className="space-y-3 p-4 rounded-xl border bg-slate-50">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  {action === 'diligencia' ? 'Texto da Diligência' :
                   action === 'deferir' ? 'Justificativa do Deferimento' :
                   'Justificativa do Indeferimento'}
                </Label>
                <Textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder={
                    action === 'diligencia'
                      ? 'Descreva os documentos ou informações necessárias...'
                      : 'Fundamente a decisão...'
                  }
                  rows={4}
                  className="rounded-xl border-slate-200 bg-white text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setAction(null); setTexto('') }}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      if (action === 'diligencia') handleDiligencia()
                      else handleDecidir(action === 'deferir' ? 'deferido' : 'indeferido')
                    }}
                    className={`rounded-xl ${
                      action === 'deferir' ? 'bg-green-600 hover:bg-green-700' :
                      action === 'indeferir' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                    {action === 'diligencia' ? 'Enviar Diligência' :
                     action === 'deferir' ? 'Confirmar Deferimento' :
                     'Confirmar Indeferimento'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

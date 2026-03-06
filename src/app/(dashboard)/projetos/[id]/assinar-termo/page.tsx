'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { assinarDocumento } from '@/lib/actions/termo-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, FileSignature, Shield, CheckCircle2, Loader2 } from 'lucide-react'

export default function AssinarTermoPage() {
  const params = useParams()
  const router = useRouter()
  const projetoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [termo, setTermo] = useState<any>(null)
  const [projeto, setProjeto] = useState<any>(null)
  const [aceito, setAceito] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: t } = await supabase
        .from('termos_execucao')
        .select('id, numero_termo, status, valor_total, vigencia_inicio, vigencia_fim, edital_referencia')
        .eq('projeto_id', projetoId)
        .eq('status', 'pendente_assinatura_proponente')
        .single()

      const { data: p } = await supabase
        .from('projetos')
        .select('titulo, numero_protocolo')
        .eq('id', projetoId)
        .single()

      setTermo(t)
      setProjeto(p)
      setLoading(false)
    }
    load()
  }, [projetoId])

  async function handleAssinar() {
    if (!termo || !aceito) return
    setSubmitting(true)

    const result = await assinarDocumento({
      termoId: termo.id,
      ipAddress: '', // Will be captured server-side in production
      userAgent: navigator.userAgent,
    })

    if ('error' in result) {
      toast.error(result.error)
      setSubmitting(false)
      return
    }

    toast.success('Termo assinado com sucesso!')
    router.push(`/projetos/${projetoId}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    )
  }

  if (!termo) {
    return (
      <div className="space-y-6">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--brand-primary)]" />
          <CardContent className="p-6 text-center">
            <FileSignature className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhum termo pendente de assinatura para este projeto.</p>
            <Link href={`/projetos/${projetoId}`} className="mt-4 inline-block">
              <Button variant="outline" size="sm">Voltar ao Projeto</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/projetos/${projetoId}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Assinatura do Termo</h1>
              <p className="text-sm text-slate-500">{projeto?.titulo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Termo Summary */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-[var(--brand-primary)]" />
            <h2 className="text-base font-semibold text-slate-900">Termo de Execução Cultural</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Número do Termo</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{termo.numero_termo}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Edital Referência</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{termo.edital_referencia}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Valor</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {Number(termo.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Vigência</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {termo.vigencia_inicio ? new Date(termo.vigencia_inicio).toLocaleDateString('pt-BR') : '—'}
                {' a '}
                {termo.vigencia_fim ? new Date(termo.vigencia_fim).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>

          {/* Acceptance */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800 font-medium">
                Ao assinar este Termo de Execução Cultural, você se compromete a cumprir todas as cláusulas estabelecidas,
                executar o projeto conforme aprovado, e prestar contas no prazo determinado.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceito}
                onChange={e => setAceito(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-sm text-slate-700">
                Declaro que li e concordo com todos os termos e cláusulas do Termo de Execução Cultural.
                Estou ciente das obrigações de execução do projeto e prestação de contas.
              </span>
            </label>

            <Button
              onClick={handleAssinar}
              disabled={!aceito || submitting}
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm rounded-xl h-12"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSignature className="h-4 w-4 mr-2" />
              )}
              Assinar Eletronicamente
            </Button>

            <p className="text-[11px] text-slate-400 text-center">
              A assinatura eletrônica é válida conforme Lei nº 14.063/2020 (assinatura eletrônica simples).
              Serão registrados: IP, navegador, timestamp e hash SHA-256 do documento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

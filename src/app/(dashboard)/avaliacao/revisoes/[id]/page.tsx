'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { submeterRevisao } from '@/lib/actions/revisao-avaliacao-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react'

interface CriterioRevisao {
  criterio_id: string
  descricao: string
  nota_minima: number
  nota_maxima: number
  peso: number
  nota_anterior: number | null
  nova_nota: string
}

export default function RevisaoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const revisaoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [revisao, setRevisao] = useState<{
    id: string; status: string; recurso_id: string; avaliador_id: string;
    criterios_revisar: string[]; notas_anteriores: Record<string, unknown> | null;
    data_solicitacao: string | null;
  } | null>(null)
  const [projeto, setProjeto] = useState<{
    titulo: string; numero_protocolo: string; edital_id: string; resumo: string | null;
    recurso_protocolo: string; fundamentacao: string;
  } | null>(null)
  const [criterios, setCriterios] = useState<CriterioRevisao[]>([])
  const [justificativa, setJustificativa] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Load revision
      const { data: rev } = await supabase
        .from('recurso_revisoes')
        .select('*')
        .eq('id', revisaoId)
        .single()

      if (!rev) { setLoading(false); return }
      setRevisao(rev)

      // Verify user is the assigned avaliador
      if (rev.avaliador_id !== user.id) {
        toast.error('Voce nao tem permissao para acessar esta revisao')
        setLoading(false)
        return
      }

      // Load recurso -> projeto
      const { data: recurso } = await supabase
        .from('recursos')
        .select('projeto_id, numero_protocolo, fundamentacao, projetos(titulo, numero_protocolo, edital_id, resumo)')
        .eq('id', rev.recurso_id)
        .single()

      if (!recurso) { setLoading(false); return }

      const proj = recurso.projetos as unknown as { titulo: string; numero_protocolo: string; edital_id: string; resumo: string | null } | null
      setProjeto({ ...proj!, recurso_protocolo: recurso.numero_protocolo, fundamentacao: recurso.fundamentacao })

      // Load criterios
      const criteriosRevisar = rev.criterios_revisar as string[]
      const editalId = proj?.edital_id

      if (editalId && criteriosRevisar.length > 0) {
        const { data: crits } = await supabase
          .from('criterios')
          .select('id, descricao, nota_minima, nota_maxima, peso, ordem')
          .eq('edital_id', editalId)
          .in('id', criteriosRevisar)
          .order('ordem')

        const notasAnteriores = (rev.notas_anteriores || {}) as Record<string, { nota: number; comentario?: string }>

        setCriterios(
          (crits || []).map((c: { id: string; descricao: string; nota_minima: number; nota_maxima: number; peso: number }) => ({
            criterio_id: c.id,
            descricao: c.descricao,
            nota_minima: c.nota_minima,
            nota_maxima: c.nota_maxima,
            peso: c.peso,
            nota_anterior: notasAnteriores[c.id]?.nota ?? null,
            nova_nota: '',
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [revisaoId])

  function updateNota(idx: number, value: string) {
    setCriterios(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], nova_nota: value }
      return next
    })
  }

  async function handleSubmit() {
    // Validate all criteria have new scores
    const semNota = criterios.filter(c => c.nova_nota === '')
    if (semNota.length > 0) {
      toast.error(`Preencha a nota revisada de todos os criterios. Faltam ${semNota.length} criterio(s).`)
      return
    }

    // Validate score ranges
    for (const c of criterios) {
      const nota = parseFloat(c.nova_nota)
      if (isNaN(nota) || nota < c.nota_minima || nota > c.nota_maxima) {
        toast.error(`A nota de "${c.descricao}" deve estar entre ${c.nota_minima} e ${c.nota_maxima}.`)
        return
      }
    }

    if (!justificativa.trim()) {
      toast.error('A justificativa da revisao e obrigatoria.')
      return
    }

    setSubmitting(true)

    const notas: Record<string, number> = {}
    for (const c of criterios) {
      notas[c.criterio_id] = parseFloat(c.nova_nota)
    }

    const result = await submeterRevisao({
      revisaoId,
      notas,
      justificativa,
    })

    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Revisao submetida com sucesso. Nova pontuacao: ${result.novaPontuacao}`)
      router.push('/avaliacao/revisoes')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!revisao) {
    return <div className="text-center py-12 text-muted-foreground">Revisao nao encontrada.</div>
  }

  if (revisao.status === 'revisada') {
    return (
      <div className="space-y-6">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-green-500" />
          <CardContent className="p-4 text-center space-y-3">
            <h1 className="text-xl font-bold text-slate-900">Revisao Concluida</h1>
            <p className="text-sm text-slate-500">Esta revisao ja foi submetida.</p>
            <Link href="/avaliacao/revisoes">
              <Button variant="outline" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Revisoes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-purple-500" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/avaliacao/revisoes">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-purple-500" />
                  Revisao de Criterios
                </h1>
                <Badge className="bg-purple-50 text-purple-700 border-none text-[11px] font-medium uppercase tracking-wide">
                  {revisao.status === 'em_revisao' ? 'Em revisao' : 'Pendente'}
                </Badge>
              </div>
              {projeto && (
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {projeto.recurso_protocolo}
                  </code>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-sm text-slate-500 truncate">{projeto.titulo}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Revisao solicitada pelo gestor:</strong> Reavalie apenas os criterios abaixo
          com base na fundamentacao do recurso. A nota sera recalculada automaticamente.
        </div>
      </div>

      {/* Fundamentacao do recurso */}
      {projeto?.fundamentacao && (
        <Card className="border border-amber-200 rounded-2xl shadow-sm bg-amber-50/30">
          <CardContent className="p-5 space-y-2">
            <h3 className="text-sm font-semibold text-amber-900">Fundamentacao do Recurso</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {projeto.fundamentacao}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Criterios to revise */}
      <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white">
        <CardContent className="p-5 space-y-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Criterios para Revisao ({criterios.length})
          </h3>

          {criterios.map((c, idx) => (
            <div key={c.criterio_id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-900">{c.descricao}</Label>
                <span className="text-xs text-slate-400">
                  Min: {c.nota_minima} | Max: {c.nota_maxima} | Peso: {c.peso}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Original score */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Nota Anterior</p>
                  <p className="text-lg font-bold text-slate-900">
                    {c.nota_anterior != null ? c.nota_anterior.toFixed(2) : '--'}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ {c.nota_maxima}</span>
                  </p>
                </div>

                {/* New score */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-3 space-y-1">
                  <p className="text-[11px] font-medium text-purple-500 uppercase tracking-wide">Nova Nota</p>
                  <Input
                    type="number"
                    step="0.01"
                    min={c.nota_minima}
                    max={c.nota_maxima}
                    value={c.nova_nota}
                    onChange={e => updateNota(idx, e.target.value)}
                    placeholder="Nova nota"
                    className="border-purple-200 bg-white font-semibold text-lg h-10"
                  />
                </div>
              </div>

              {/* Show change indicator */}
              {c.nova_nota !== '' && c.nota_anterior != null && (
                <div className="flex items-center gap-2 text-xs">
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className={`font-semibold ${
                    parseFloat(c.nova_nota) > c.nota_anterior ? 'text-green-600' :
                    parseFloat(c.nova_nota) < c.nota_anterior ? 'text-red-600' :
                    'text-slate-500'
                  }`}>
                    {parseFloat(c.nova_nota) > c.nota_anterior ? '+' : ''}
                    {(parseFloat(c.nova_nota) - c.nota_anterior).toFixed(2)} pontos
                  </span>
                </div>
              )}

              {idx < criterios.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Justificativa */}
      <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white">
        <CardContent className="p-5 space-y-3">
          <Label className="text-sm font-semibold text-slate-900">
            Justificativa da Revisao <span className="text-xs font-normal text-red-500 ml-1">*obrigatoria</span>
          </Label>
          <Textarea
            value={justificativa}
            onChange={e => setJustificativa(e.target.value)}
            placeholder="Justifique as alteracoes nas notas (obrigatorio)..."
            rows={4}
            className="rounded-xl border-slate-200 text-sm"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/avaliacao/revisoes">
          <Button variant="outline" className="rounded-xl">
            Cancelar
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm gap-1.5 h-10 px-6 shadow-xl shadow-purple-600/20"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submeter Revisao
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface CriterioAvaliacao {
  criterio_id: string
  descricao: string
  nota_minima: number
  nota_maxima: number
  peso: number
  nota: string
  comentario: string
}

export default function AvaliacaoPage() {
  const router = useRouter()
  const params = useParams()
  const projetoId = params.projetoId as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projeto, setProjeto] = useState<any>(null)
  const [avaliacao, setAvaliacao] = useState<any>(null)
  const [criterios, setCriterios] = useState<CriterioAvaliacao[]>([])
  const [justificativa, setJustificativa] = useState('')
  const [aiSugestoes, setAiSugestoes] = useState<Record<string, { nota: number; justificativa: string; confianca: number }>>({})
  const [expandedAiHint, setExpandedAiHint] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Load projeto (AVALIACAO CEGA - sem nome do proponente)
      const { data: proj } = await supabase
        .from('projetos')
        .select('id, titulo, resumo, descricao_tecnica, orcamento_total, cronograma_execucao, numero_protocolo, edital_id')
        .eq('id', projetoId)
        .single()

      setProjeto(proj)

      // Load avaliacao
      const { data: av } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('projeto_id', projetoId)
        .eq('avaliador_id', user!.id)
        .single()

      setAvaliacao(av)
      if (av?.justificativa) setJustificativa(av.justificativa)

      // Load criterios do edital
      if (proj) {
        const { data: crits } = await supabase
          .from('criterios')
          .select('*')
          .eq('edital_id', proj.edital_id)
          .order('ordem', { ascending: true })

        // Load existing notas
        const { data: existingNotas } = av
          ? await supabase
              .from('avaliacao_criterios')
              .select('*')
              .eq('avaliacao_id', av.id)
          : { data: [] }

        setCriterios(
          (crits || []).map((c: any) => {
            const existing = existingNotas?.find((n: any) => n.criterio_id === c.id)
            return {
              criterio_id: c.id,
              descricao: c.descricao,
              nota_minima: c.nota_minima,
              nota_maxima: c.nota_maxima,
              peso: c.peso,
              nota: existing?.nota?.toString() ?? '',
              comentario: existing?.comentario ?? '',
            }
          })
        )

        // Load AI suggestions (if triagem was run)
        const { data: latestExec } = await supabase
          .from('triagem_ia_execucoes')
          .select('id')
          .eq('edital_id', proj.edital_id)
          .eq('status', 'concluida')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        let aiNotas: Record<string, { nota: number; justificativa: string; confianca: number }> = {}
        if (latestExec) {
          const { data: resultado } = await supabase
            .from('triagem_ia_resultados')
            .select('id')
            .eq('execucao_id', latestExec.id)
            .eq('projeto_id', projetoId)
            .single()

          if (resultado) {
            const { data: notas } = await supabase
              .from('triagem_ia_notas')
              .select('criterio_id, nota_sugerida, justificativa, confianca')
              .eq('resultado_id', resultado.id)

            if (notas) {
              for (const n of notas) {
                aiNotas[n.criterio_id] = {
                  nota: n.nota_sugerida,
                  justificativa: n.justificativa,
                  confianca: n.confianca,
                }
              }
            }
          }
        }
        setAiSugestoes(aiNotas)
      }

      setLoading(false)
    }

    load()
  }, [projetoId])

  function updateCriterio(idx: number, field: 'nota' | 'comentario', value: string) {
    setCriterios(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  async function salvarNotas(finalizar = false) {
    setSaving(true)
    const supabase = createClient()

    if (!avaliacao) {
      toast.error('Avaliação não encontrada.')
      setSaving(false)
      return
    }

    // Delete existing notas and re-insert
    await supabase.from('avaliacao_criterios').delete().eq('avaliacao_id', avaliacao.id)

    const notas = criterios
      .filter(c => c.nota !== '')
      .map(c => ({
        avaliacao_id: avaliacao.id,
        criterio_id: c.criterio_id,
        nota: parseFloat(c.nota),
        comentario: c.comentario || null,
      }))

    if (notas.length > 0) {
      const { error } = await supabase.from('avaliacao_criterios').insert(notas)
      if (error) {
        toast.error('Erro ao salvar notas: ' + error.message)
        setSaving(false)
        return
      }
    }

    // Update avaliacao status + calculate pontuacao_total on finalize
    const updateData: any = { justificativa }
    if (finalizar) {
      updateData.status = 'finalizada'
      const notasPreenchidas = criterios.filter(c => c.nota !== '')
      if (notasPreenchidas.length > 0) {
        let somaNotasPeso = 0
        let somaPesos = 0
        for (const c of notasPreenchidas) {
          somaNotasPeso += parseFloat(c.nota) * c.peso
          somaPesos += c.peso
        }
        updateData.pontuacao_total = somaPesos > 0
          ? Math.round((somaNotasPeso / somaPesos) * 100) / 100
          : 0
      }
    }

    await supabase.from('avaliacoes').update(updateData).eq('id', avaliacao.id)

    if (finalizar) {
      toast.success('Avaliação finalizada com sucesso')
      router.push('/avaliacao')
    } else {
      toast.success('Notas salvas')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!projeto || !avaliacao) {
    return <div className="text-center py-12 text-muted-foreground">Avaliação não encontrada.</div>
  }

  const isFinalizada = avaliacao.status === 'finalizada'

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/avaliacao">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Avaliação</h1>
              <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                {projeto.numero_protocolo}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
        <p className="text-sm text-yellow-800">
          Avaliação cega: o nome do proponente não é exibido.
        </p>
      </div>

      {/* Project details (blind) */}
      <Card>
        <CardHeader>
          <CardTitle>{projeto.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {projeto.resumo && <div><strong>Resumo:</strong> {projeto.resumo}</div>}
          {projeto.descricao_tecnica && <div><strong>Descrição Técnica:</strong> {projeto.descricao_tecnica}</div>}
          {projeto.orcamento_total && <div><strong>Orçamento:</strong> R$ {Number(projeto.orcamento_total).toFixed(2)}</div>}
          {projeto.cronograma_execucao && <div><strong>Cronograma:</strong> {projeto.cronograma_execucao}</div>}
        </CardContent>
      </Card>

      {/* Criterios */}
      <Card>
        <CardHeader>
          <CardTitle>Notas por Critério</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {criterios.map((c, idx) => (
            <div key={c.criterio_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{c.descricao}</Label>
                  {aiSugestoes[c.criterio_id] && (
                    <button
                      type="button"
                      onClick={() => setExpandedAiHint(
                        expandedAiHint === c.criterio_id ? null : c.criterio_id
                      )}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-[var(--brand-primary)] hover:bg-blue-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      Dica IA
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Min: {c.nota_minima} | Max: {c.nota_maxima} | Peso: {c.peso}
                </span>
              </div>
              {expandedAiHint === c.criterio_id && aiSugestoes[c.criterio_id] && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--brand-primary)]">Sugestão IA</span>
                    <span className="text-sm font-bold text-[var(--brand-primary)]">
                      {aiSugestoes[c.criterio_id].nota.toFixed(1)} / {c.nota_maxima}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{aiSugestoes[c.criterio_id].justificativa}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Confiança:</span>
                    <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--brand-primary)] rounded-full"
                        style={{ width: `${aiSugestoes[c.criterio_id].confianca * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">{Math.round(aiSugestoes[c.criterio_id].confianca * 100)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">Apenas sugestão — sua avaliação independente é o que conta.</p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min={c.nota_minima}
                  max={c.nota_maxima}
                  value={c.nota}
                  onChange={e => updateCriterio(idx, 'nota', e.target.value)}
                  placeholder="Nota"
                  disabled={isFinalizada}
                />
                <Textarea
                  className="col-span-3"
                  value={c.comentario}
                  onChange={e => updateCriterio(idx, 'comentario', e.target.value)}
                  placeholder="Comentário (opcional)"
                  rows={1}
                  disabled={isFinalizada}
                />
              </div>
              {idx < criterios.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Justificativa geral */}
      <Card>
        <CardHeader>
          <CardTitle>Justificativa Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={justificativa}
            onChange={e => setJustificativa(e.target.value)}
            placeholder="Justificativa geral da avaliação (opcional)"
            rows={4}
            disabled={isFinalizada}
          />
        </CardContent>
      </Card>

      {!isFinalizada && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => salvarNotas(false)} disabled={saving}>
            Salvar Rascunho
          </Button>
          <Button onClick={() => salvarNotas(true)} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar Avaliação
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, AlertTriangle, Sparkles, FileDown, CheckCircle2, Circle, ExternalLink } from 'lucide-react'
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
  const [projeto, setProjeto] = useState<{
    id: string; titulo: string; resumo: string | null; descricao_tecnica: string | null;
    orcamento_total: number | null; cronograma_execucao: string | null;
    numero_protocolo: string; edital_id: string;
  } | null>(null)
  const [avaliacao, setAvaliacao] = useState<{
    id: string; status: string; justificativa: string | null;
    checklist_documentos: Record<string, unknown> | null;
  } | null>(null)
  const [criterios, setCriterios] = useState<CriterioAvaliacao[]>([])
  const [justificativa, setJustificativa] = useState('')
  const [documentos, setDocumentos] = useState<{ nome_arquivo: string; storage_path: string; tipo: string }[]>([])
  const [checklistDocs, setChecklistDocs] = useState<Record<string, boolean>>({})
  const [aiSugestoes, setAiSugestoes] = useState<Record<string, { nota: number; justificativa: string; confianca: number }>>({})
  const [expandedAiHint, setExpandedAiHint] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Load projeto (AVALIACAO CEGA - sem nome do proponente)
      const { data: proj } = await supabase
        .from('projetos')
        .select('id, titulo, resumo, descricao_tecnica, orcamento_total, cronograma_execucao, numero_protocolo, edital_id')
        .eq('id', projetoId)
        .single()

      setProjeto(proj)

      // Load project documents
      if (proj) {
        const { data: docs } = await supabase
          .from('projeto_documentos')
          .select('nome_arquivo, storage_path, tipo')
          .eq('projeto_id', projetoId)
        setDocumentos(docs || [])
      }

      // Load avaliacao
      const { data: av } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('projeto_id', projetoId)
        .eq('avaliador_id', user.id)
        .single()

      setAvaliacao(av)
      if (av?.justificativa) setJustificativa(av.justificativa)
      if (av?.checklist_documentos) {
        const cl: Record<string, boolean> = {}
        for (const [key, val] of Object.entries(av.checklist_documentos as Record<string, { verificado?: boolean }>)) {
          cl[key] = val?.verificado ?? false
        }
        setChecklistDocs(cl)
      }

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
          (crits || []).map((c: { id: string; descricao: string; nota_minima: number; nota_maxima: number; peso: number }) => {
            const existing = existingNotas?.find((n: { criterio_id: string; nota?: number; comentario?: string }) => n.criterio_id === c.id)
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

        const aiNotas: Record<string, { nota: number; justificativa: string; confianca: number }> = {}
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

    // Validation on finalize
    if (finalizar) {
      // All criteria must have scores
      const semNota = criterios.filter(c => c.nota === '')
      if (semNota.length > 0) {
        toast.error(`Preencha a nota de todos os critérios antes de finalizar. Faltam ${semNota.length} critério(s).`)
        setSaving(false)
        return
      }

      // Scores below 6 require a comment
      const semComentario = criterios.filter(c => {
        const nota = parseFloat(c.nota)
        return nota < 6 && !c.comentario.trim()
      })
      if (semComentario.length > 0) {
        toast.error(`Notas abaixo de 6 exigem justificativa no comentário. Preencha o comentário em ${semComentario.length} critério(s).`)
        setSaving(false)
        return
      }

      // General justification is required
      if (!justificativa.trim()) {
        toast.error('O comentário geral é obrigatório para finalizar a avaliação.')
        setSaving(false)
        return
      }
    }

    // Upsert notas (avoids race condition from separate delete+insert)
    const notas = criterios
      .filter(c => c.nota !== '')
      .map(c => ({
        avaliacao_id: avaliacao.id,
        criterio_id: c.criterio_id,
        nota: parseFloat(c.nota),
        comentario: c.comentario || null,
      }))

    // Remove criteria that were cleared (nota is empty)
    const criteriosLimpos = criterios
      .filter(c => c.nota === '')
      .map(c => c.criterio_id)

    if (criteriosLimpos.length > 0) {
      await supabase
        .from('avaliacao_criterios')
        .delete()
        .eq('avaliacao_id', avaliacao.id)
        .in('criterio_id', criteriosLimpos)
    }

    if (notas.length > 0) {
      const { error } = await supabase
        .from('avaliacao_criterios')
        .upsert(notas, { onConflict: 'avaliacao_id,criterio_id' })
      if (error) {
        toast.error('Erro ao salvar notas: ' + error.message)
        setSaving(false)
        return
      }
    }

    // Update avaliacao status + calculate pontuacao_total on finalize
    // Build checklist JSON
    const checklistJson: Record<string, { verificado: boolean }> = {}
    for (const doc of documentos) {
      checklistJson[doc.storage_path] = { verificado: checklistDocs[doc.storage_path] ?? false }
    }

    const updateData: { justificativa: string; checklist_documentos: typeof checklistJson; status?: string; pontuacao_total?: number } = { justificativa, checklist_documentos: checklistJson }
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
      const supabaseAudit = createClient()
      const { data: { user: currentUser } } = await supabaseAudit.auth.getUser()
      const { data: userProfile } = currentUser ? await supabaseAudit
        .from('profiles')
        .select('tenant_id')
        .eq('id', currentUser.id)
        .single() : { data: null }

      if (currentUser && userProfile) {
        logAudit({
          supabase: supabaseAudit,
          acao: 'FINALIZACAO_AVALIACAO',
          tabela_afetada: 'avaliacoes',
          registro_id: avaliacao.id,
          tenant_id: userProfile.tenant_id,
          usuario_id: currentUser.id,
          dados_novos: {
            projeto_id: projetoId,
            pontuacao_total: updateData.pontuacao_total,
            criterios_avaliados: notas.length,
          },
        }).catch(() => {})
      }

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
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Avaliação</h1>
                <Link href={`/projetos/${projetoId}`} target="_blank">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 border-slate-200 text-slate-500 hover:text-[var(--brand-primary)]">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver Projeto Completo
                  </Button>
                </Link>
              </div>
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

      {/* Documentos do projeto + checklist */}
      {documentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Documentos do Projeto</span>
              <span className="text-xs font-normal text-slate-400">
                {Object.values(checklistDocs).filter(Boolean).length}/{documentos.length} verificados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentos.map((doc, idx) => {
                const checked = checklistDocs[doc.storage_path] ?? false
                return (
                  <div key={idx} className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${checked ? 'border-green-200 bg-green-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => !isFinalizada && setChecklistDocs(prev => ({ ...prev, [doc.storage_path]: !checked }))}
                        className="shrink-0"
                        disabled={isFinalizada}
                      >
                        {checked ? (
                          <CheckCircle2 className="h-5 w-5 text-[var(--brand-success)]" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400 transition-colors" />
                        )}
                      </button>
                      <span className={`text-sm truncate ${checked ? 'text-slate-500 line-through' : ''}`}>{doc.nome_arquivo}</span>
                      {doc.tipo && (
                        <span className="text-[11px] font-medium text-slate-400 uppercase shrink-0">{doc.tipo}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--brand-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 shrink-0"
                      onClick={async () => {
                        const supabase = createClient()
                        const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.storage_path, 300)
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                        else toast.error('Erro ao gerar link do documento.')
                      }}
                    >
                      Visualizar
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder={parseFloat(c.nota) < 6 && c.nota !== '' ? 'Comentário (obrigatório para nota < 6)' : 'Comentário'}
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
          <CardTitle>Comentário Geral <span className="text-xs font-normal text-red-500 ml-1">*obrigatório</span></CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={justificativa}
            onChange={e => setJustificativa(e.target.value)}
            placeholder="Justificativa geral da avaliação (obrigatório)"
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

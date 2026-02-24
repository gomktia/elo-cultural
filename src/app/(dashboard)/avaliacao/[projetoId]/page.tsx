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
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'
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
      toast.error('Avaliacao nao encontrada.')
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

    // Update avaliacao status
    const updateData: any = { justificativa }
    if (finalizar) updateData.status = 'finalizada'

    await supabase.from('avaliacoes').update(updateData).eq('id', avaliacao.id)

    if (finalizar) {
      toast.success('Avaliacao finalizada com sucesso')
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
    return <div className="text-center py-12 text-muted-foreground">Avaliacao nao encontrada.</div>
  }

  const isFinalizada = avaliacao.status === 'finalizada'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/avaliacao">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliacao</h1>
          <p className="text-muted-foreground font-mono">{projeto.numero_protocolo}</p>
        </div>
      </div>

      <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
        <p className="text-sm text-yellow-800">
          Avaliacao cega: o nome do proponente nao e exibido.
        </p>
      </div>

      {/* Project details (blind) */}
      <Card>
        <CardHeader>
          <CardTitle>{projeto.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {projeto.resumo && <div><strong>Resumo:</strong> {projeto.resumo}</div>}
          {projeto.descricao_tecnica && <div><strong>Descricao Tecnica:</strong> {projeto.descricao_tecnica}</div>}
          {projeto.orcamento_total && <div><strong>Orcamento:</strong> R$ {Number(projeto.orcamento_total).toFixed(2)}</div>}
          {projeto.cronograma_execucao && <div><strong>Cronograma:</strong> {projeto.cronograma_execucao}</div>}
        </CardContent>
      </Card>

      {/* Criterios */}
      <Card>
        <CardHeader>
          <CardTitle>Notas por Criterio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {criterios.map((c, idx) => (
            <div key={c.criterio_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{c.descricao}</Label>
                <span className="text-xs text-muted-foreground">
                  Min: {c.nota_minima} | Max: {c.nota_maxima} | Peso: {c.peso}
                </span>
              </div>
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
                  placeholder="Comentario (opcional)"
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
            placeholder="Justificativa geral da avaliacao (opcional)"
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
            Finalizar Avaliacao
          </Button>
        </div>
      )}
    </div>
  )
}

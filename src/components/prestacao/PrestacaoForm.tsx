'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DocumentUpload } from '@/components/projeto/DocumentUpload'
import { PrestacaoStatusBadge } from './PrestacaoStatusBadge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Save, Send, FileText, AlertTriangle, CheckCircle2, Banknote,
  Users, MapPin, Target, Package, Megaphone, Plus, Trash2,
} from 'lucide-react'
import type { PrestacaoContas, PrestacaoMeta, PrestacaoProduto } from '@/types/database.types'

interface PrestacaoFormProps {
  projetoId: string
  tenantId: string
  orcamentoPrevisto: number
  prestacao: PrestacaoContas | null
  documentos: { id: string; nome_arquivo: string; storage_path: string; tamanho_bytes: number | null; tipo: string; created_at: string }[]
}

const RESULTADOS_OPTIONS = [
  { value: 'criacao', label: 'Criação artística/cultural' },
  { value: 'pesquisa', label: 'Pesquisa e documentação' },
  { value: 'manutencao_atividades', label: 'Manutenção de atividades' },
  { value: 'identidade_cultural', label: 'Fortalecimento da identidade cultural' },
  { value: 'praticas_culturais', label: 'Práticas culturais tradicionais' },
  { value: 'formacao', label: 'Formação e capacitação' },
  { value: 'programacoes', label: 'Programações culturais' },
  { value: 'preservacao', label: 'Preservação do patrimônio' },
]

const PRODUTOS_TIPOS = [
  'Publicação', 'Livro', 'Catálogo', 'Live', 'Vídeo', 'Documentário',
  'Filme', 'Pesquisa', 'Produção musical', 'Jogo', 'Artesanato',
  'Obra de arte', 'Espetáculo', 'Show', 'Site/Portal', 'Música', 'Outro',
]

const sectionIcon = 'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0'

export function PrestacaoForm({ projetoId, tenantId, orcamentoPrevisto, prestacao, documentos }: PrestacaoFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  // Basic fields
  const [valorExecutado, setValorExecutado] = useState(prestacao?.valor_total_executado?.toString() || '')
  const [resumo, setResumo] = useState(prestacao?.resumo_atividades || '')
  const [observacoes, setObservacoes] = useState(prestacao?.observacoes || '')

  // Structured fields
  const [acoesRealizadas, setAcoesRealizadas] = useState<string>(prestacao?.acoes_realizadas || 'sim_conforme')
  const [acoesDesenvolvidas, setAcoesDesenvolvidas] = useState(prestacao?.acoes_desenvolvidas || '')
  const [metas, setMetas] = useState<PrestacaoMeta[]>(prestacao?.metas || [])
  const [produtos, setProdutos] = useState<PrestacaoProduto[]>(prestacao?.produtos_gerados || [])
  const [produtosDisponibilizacao, setProdutosDisponibilizacao] = useState(prestacao?.produtos_disponibilizacao || '')
  const [resultados, setResultados] = useState<string[]>(prestacao?.resultados_gerados || [])
  const [publicoQtd, setPublicoQtd] = useState(prestacao?.publico_alcancado_quantidade?.toString() || '')
  const [publicoMensuracao, setPublicoMensuracao] = useState(prestacao?.publico_mensuracao || '')
  const [publicoJustificativa, setPublicoJustificativa] = useState(prestacao?.publico_justificativa || '')
  const [equipeQtd, setEquipeQtd] = useState(prestacao?.equipe_quantidade?.toString() || '')
  const [equipeMudancas, setEquipeMudancas] = useState(prestacao?.equipe_houve_mudancas || false)
  const [localTipo, setLocalTipo] = useState<string>(prestacao?.local_tipo || 'presencial')
  const [localPlataformas, setLocalPlataformas] = useState(prestacao?.local_plataformas || '')
  const [localDescricao, setLocalDescricao] = useState(prestacao?.local_descricao || '')
  const [divulgacao, setDivulgacao] = useState(prestacao?.divulgacao || '')
  const [topicosAdicionais, setTopicosAdicionais] = useState(prestacao?.topicos_adicionais || '')

  const isReadOnly = prestacao?.status === 'enviada' || prestacao?.status === 'em_analise' || prestacao?.status === 'aprovada'
  const canEdit = !prestacao || prestacao.status === 'rascunho' || prestacao.status === 'com_pendencias' || prestacao.status === 'reprovada'

  function buildPayload() {
    return {
      valor_total_executado: valorExecutado ? parseFloat(valorExecutado) : null,
      resumo_atividades: resumo || null,
      observacoes: observacoes || null,
      acoes_realizadas: acoesRealizadas,
      acoes_desenvolvidas: acoesDesenvolvidas || null,
      metas,
      produtos_gerados: produtos,
      produtos_disponibilizacao: produtosDisponibilizacao || null,
      resultados_gerados: resultados,
      publico_alcancado_quantidade: publicoQtd ? parseInt(publicoQtd) : null,
      publico_mensuracao: publicoMensuracao || null,
      publico_justificativa: publicoJustificativa || null,
      equipe_quantidade: equipeQtd ? parseInt(equipeQtd) : null,
      equipe_houve_mudancas: equipeMudancas,
      local_tipo: localTipo,
      local_plataformas: localPlataformas || null,
      local_descricao: localDescricao || null,
      divulgacao: divulgacao || null,
      topicos_adicionais: topicosAdicionais || null,
    }
  }

  async function salvarRascunho() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const dados = buildPayload()

    if (prestacao) {
      const { error } = await supabase
        .from('prestacoes_contas')
        .update({ ...dados, status: 'rascunho' })
        .eq('id', prestacao.id)
      if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('prestacoes_contas')
        .insert({
          ...dados,
          tenant_id: tenantId,
          projeto_id: projetoId,
          proponente_id: user.id,
          status: 'rascunho',
        })
      if (error) { toast.error('Erro ao criar: ' + error.message); setSaving(false); return }
    }

    toast.success('Rascunho salvo')
    setSaving(false)
    router.refresh()
  }

  async function enviarPrestacao() {
    if (!valorExecutado || !resumo) {
      toast.error('Preencha o valor executado e o resumo de atividades')
      return
    }

    setSending(true)
    const supabase = createClient()

    if (!prestacao) {
      await salvarRascunho()
    }

    const { data: current } = await supabase
      .from('prestacoes_contas')
      .select('id')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!current) { toast.error('Erro: prestação não encontrada'); setSending(false); return }

    const { error } = await supabase
      .from('prestacoes_contas')
      .update({
        ...buildPayload(),
        status: 'enviada',
        data_envio: new Date().toISOString(),
      })
      .eq('id', current.id)

    if (error) { toast.error('Erro ao enviar: ' + error.message); setSending(false); return }

    toast.success('Prestação de contas enviada com sucesso!')
    setSending(false)
    router.refresh()
  }

  const fieldLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wide'
  const fieldInput = 'rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all'

  return (
    <div className="space-y-6">
      {/* Status */}
      {prestacao && (
        <Card className="border-slate-200 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Status da Prestação</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {prestacao.data_envio
                      ? `Enviada em ${new Date(prestacao.data_envio).toLocaleDateString('pt-BR')}`
                      : 'Rascunho em edição'}
                  </p>
                </div>
              </div>
              <PrestacaoStatusBadge status={prestacao.status} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parecer */}
      {prestacao?.parecer_gestor && (
        <Card className={`rounded-2xl shadow-sm ${prestacao.status === 'aprovada' ? 'border-green-200 bg-green-50/50' : prestacao.status === 'reprovada' ? 'border-red-200 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              {prestacao.status === 'aprovada' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">Parecer do Gestor</p>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{prestacao.parecer_gestor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1. Execução Financeira */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-[var(--brand-primary)]" />
            Execução Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={fieldLabel}>Orçamento Previsto</Label>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {orcamentoPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div>
              <Label className={fieldLabel}>Valor Executado (R$)</Label>
              <Input type="number" step="0.01" min="0" value={valorExecutado} onChange={e => setValorExecutado(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Execução das Ações */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            Execução das Ações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className={fieldLabel}>As ações previstas foram realizadas?</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { value: 'sim_conforme', label: 'Sim, conforme previsto' },
                { value: 'sim_com_adaptacoes', label: 'Sim, com adaptações' },
                { value: 'parcial', label: 'Parcialmente' },
                { value: 'nao_conforme', label: 'Não foram realizadas' },
              ].map(opt => (
                <Badge
                  key={opt.value}
                  className={`cursor-pointer text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    acoesRealizadas === opt.value
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[var(--brand-primary)]/30'
                  }`}
                  onClick={() => canEdit && setAcoesRealizadas(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className={fieldLabel}>Resumo das atividades realizadas</Label>
            <Textarea rows={4} value={resumo} onChange={e => setResumo(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} placeholder="Descreva as atividades realizadas..." />
          </div>
          <div>
            <Label className={fieldLabel}>Ações desenvolvidas (datas, locais, detalhes)</Label>
            <Textarea rows={4} value={acoesDesenvolvidas} onChange={e => setAcoesDesenvolvidas(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} placeholder="Detalhe cada ação com datas e locais..." />
          </div>
        </CardContent>
      </Card>

      {/* 3. Metas */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">Metas</CardTitle>
            {canEdit && (
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={() => setMetas([...metas, { meta: '', status: 'cumprida', observacao: '', justificativa: '' }])}>
                <Plus className="h-3 w-3" /> Adicionar Meta
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {metas.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma meta adicionada.</p>
          )}
          {metas.map((m, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Input placeholder={`Meta ${i + 1}`} value={m.meta} onChange={e => { const n = [...metas]; n[i].meta = e.target.value; setMetas(n) }} disabled={!canEdit} className={fieldInput} />
                </div>
                <div className="flex items-center gap-2">
                  <select value={m.status} onChange={e => { const n = [...metas]; n[i].status = e.target.value as PrestacaoMeta['status']; setMetas(n) }} disabled={!canEdit} className="text-xs rounded-lg border-slate-200 bg-white px-2 py-1.5">
                    <option value="cumprida">Cumprida</option>
                    <option value="parcial">Parcial</option>
                    <option value="nao_cumprida">Não cumprida</option>
                  </select>
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setMetas(metas.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {m.status !== 'cumprida' && (
                <Input placeholder="Justificativa" value={m.justificativa} onChange={e => { const n = [...metas]; n[i].justificativa = e.target.value; setMetas(n) }} disabled={!canEdit} className={fieldInput} />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4. Produtos Gerados */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              Produtos Gerados
            </CardTitle>
            {canEdit && (
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={() => setProdutos([...produtos, { tipo: 'Outro', quantidade: 1, descricao: '' }])}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {produtos.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum produto adicionado.</p>
          )}
          {produtos.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <select value={p.tipo} onChange={e => { const n = [...produtos]; n[i].tipo = e.target.value; setProdutos(n) }} disabled={!canEdit} className="text-xs rounded-lg border-slate-200 bg-white px-2 py-1.5 w-36">
                {PRODUTOS_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Input type="number" min="1" value={p.quantidade} onChange={e => { const n = [...produtos]; n[i].quantidade = parseInt(e.target.value) || 0; setProdutos(n) }} disabled={!canEdit} className={`w-20 ${fieldInput}`} />
              <Input placeholder="Descrição" value={p.descricao} onChange={e => { const n = [...produtos]; n[i].descricao = e.target.value; setProdutos(n) }} disabled={!canEdit} className={`flex-1 ${fieldInput}`} />
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setProdutos(produtos.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <div>
            <Label className={fieldLabel}>Como os produtos foram disponibilizados ao público?</Label>
            <Textarea rows={2} value={produtosDisponibilizacao} onChange={e => setProdutosDisponibilizacao(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} />
          </div>
        </CardContent>
      </Card>

      {/* 5. Resultados Gerados */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Resultados Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {RESULTADOS_OPTIONS.map(opt => (
              <Badge
                key={opt.value}
                className={`cursor-pointer text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  resultados.includes(opt.value)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'
                }`}
                onClick={() => {
                  if (!canEdit) return
                  setResultados(
                    resultados.includes(opt.value)
                      ? resultados.filter(r => r !== opt.value)
                      : [...resultados, opt.value]
                  )
                }}
              >
                {resultados.includes(opt.value) ? '✓ ' : ''}{opt.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. Público Alcançado */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Público Alcançado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={fieldLabel}>Quantidade de público</Label>
              <Input type="number" min="0" value={publicoQtd} onChange={e => setPublicoQtd(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput}`} />
            </div>
            <div>
              <Label className={fieldLabel}>Como foi mensurado?</Label>
              <Input value={publicoMensuracao} onChange={e => setPublicoMensuracao(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput}`} placeholder="Ex: lista de presença, contagem, analytics" />
            </div>
          </div>
          <div>
            <Label className={fieldLabel}>Justificativa (se público abaixo do previsto)</Label>
            <Textarea rows={2} value={publicoJustificativa} onChange={e => setPublicoJustificativa(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} />
          </div>
        </CardContent>
      </Card>

      {/* 7. Equipe */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Equipe do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={fieldLabel}>Quantidade de profissionais</Label>
              <Input type="number" min="0" value={equipeQtd} onChange={e => setEquipeQtd(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput}`} />
            </div>
            <div>
              <Label className={fieldLabel}>Houve mudanças na equipe?</Label>
              <div
                onClick={() => canEdit && setEquipeMudancas(!equipeMudancas)}
                className={`mt-1 h-10 rounded-xl border flex items-center px-3 gap-2 cursor-pointer transition-all ${
                  equipeMudancas ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  equipeMudancas ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'
                }`}>
                  {equipeMudancas && <span className="text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm font-medium text-slate-700">{equipeMudancas ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. Local de Realização */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" />
            Local de Realização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className={fieldLabel}>Modalidade</Label>
            <div className="flex gap-2 mt-2">
              {[
                { value: 'presencial', label: 'Presencial' },
                { value: 'virtual', label: 'Virtual' },
                { value: 'hibrido', label: 'Híbrido' },
              ].map(opt => (
                <Badge
                  key={opt.value}
                  className={`cursor-pointer text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    localTipo === opt.value
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                  onClick={() => canEdit && setLocalTipo(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
          {(localTipo === 'virtual' || localTipo === 'hibrido') && (
            <div>
              <Label className={fieldLabel}>Plataformas utilizadas</Label>
              <Input value={localPlataformas} onChange={e => setLocalPlataformas(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput}`} placeholder="Ex: YouTube, Zoom, Instagram" />
            </div>
          )}
          <div>
            <Label className={fieldLabel}>Descrição dos locais</Label>
            <Textarea rows={2} value={localDescricao} onChange={e => setLocalDescricao(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} placeholder="Descreva os locais onde o projeto foi realizado..." />
          </div>
        </CardContent>
      </Card>

      {/* 9. Divulgação */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-500" />
            Divulgação do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className={fieldLabel}>Estratégias de divulgação utilizadas</Label>
            <Textarea rows={3} value={divulgacao} onChange={e => setDivulgacao(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} placeholder="Descreva como o projeto foi divulgado..." />
          </div>
          <div>
            <Label className={fieldLabel}>Observações adicionais</Label>
            <Textarea rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} />
          </div>
          <div>
            <Label className={fieldLabel}>Tópicos adicionais</Label>
            <Textarea rows={2} value={topicosAdicionais} onChange={e => setTopicosAdicionais(e.target.value)} disabled={!canEdit} className={`mt-1 ${fieldInput} resize-none`} placeholder="Informações complementares..." />
          </div>
        </CardContent>
      </Card>

      {/* Upload comprovantes */}
      {canEdit && (
        <Card className="border-slate-200 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Comprovantes e Anexos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUpload
              tipo="comprovante_despesa"
              label="Comprovantes de despesa (notas fiscais, recibos)"
              tenantId={tenantId}
              onUpload={async (file) => {
                const supabase = createClient()
                await supabase.from('projeto_documentos').insert({
                  tenant_id: tenantId, projeto_id: projetoId, tipo: 'comprovante_despesa',
                  nome_arquivo: file.nome_arquivo, storage_path: file.storage_path, tamanho_bytes: file.tamanho_bytes,
                })
                router.refresh()
              }}
              existingFiles={documentos.filter(d => d.tipo === 'comprovante_despesa').map(d => ({
                nome_arquivo: d.nome_arquivo, storage_path: d.storage_path, tamanho_bytes: d.tamanho_bytes || 0, tipo: d.tipo,
              }))}
            />
            <DocumentUpload
              tipo="relatorio_atividade"
              label="Relatório fotográfico, vídeos, listas de presença"
              tenantId={tenantId}
              onUpload={async (file) => {
                const supabase = createClient()
                await supabase.from('projeto_documentos').insert({
                  tenant_id: tenantId, projeto_id: projetoId, tipo: 'relatorio_atividade',
                  nome_arquivo: file.nome_arquivo, storage_path: file.storage_path, tamanho_bytes: file.tamanho_bytes,
                })
                router.refresh()
              }}
              existingFiles={documentos.filter(d => d.tipo === 'relatorio_atividade').map(d => ({
                nome_arquivo: d.nome_arquivo, storage_path: d.storage_path, tamanho_bytes: d.tamanho_bytes || 0, tipo: d.tipo,
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Read-only docs */}
      {!canEdit && documentos.length > 0 && (
        <Card className="border-slate-200 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Documentos Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentos.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 truncate">{doc.nome_arquivo}</span>
                  <span className="text-xs text-slate-400">{doc.tipo.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={salvarRascunho} disabled={saving || sending} className="rounded-xl">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          <Button onClick={enviarPrestacao} disabled={saving || sending} className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold">
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Enviando...' : 'Enviar Prestação'}
          </Button>
        </div>
      )}
    </div>
  )
}

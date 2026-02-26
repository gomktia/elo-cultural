'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DocumentUpload } from '@/components/projeto/DocumentUpload'
import { PrestacaoStatusBadge } from './PrestacaoStatusBadge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Save, Send, FileText, AlertTriangle, CheckCircle2, Banknote } from 'lucide-react'
import type { PrestacaoContas } from '@/types/database.types'

interface PrestacaoFormProps {
  projetoId: string
  tenantId: string
  orcamentoPrevisto: number
  prestacao: PrestacaoContas | null
  documentos: { id: string; nome_arquivo: string; storage_path: string; tamanho_bytes: number | null; tipo: string; created_at: string }[]
}

export function PrestacaoForm({ projetoId, tenantId, orcamentoPrevisto, prestacao, documentos }: PrestacaoFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [valorExecutado, setValorExecutado] = useState(
    prestacao?.valor_total_executado?.toString() || ''
  )
  const [resumo, setResumo] = useState(prestacao?.resumo_atividades || '')
  const [observacoes, setObservacoes] = useState(prestacao?.observacoes || '')

  const isReadOnly = prestacao?.status === 'enviada' || prestacao?.status === 'em_analise' || prestacao?.status === 'aprovada'
  const canEdit = !prestacao || prestacao.status === 'rascunho' || prestacao.status === 'com_pendencias' || prestacao.status === 'reprovada'

  async function salvarRascunho() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const dados = {
      valor_total_executado: valorExecutado ? parseFloat(valorExecutado) : null,
      resumo_atividades: resumo || null,
      observacoes: observacoes || null,
    }

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
      // Salvar primeiro como rascunho e depois enviar
      await salvarRascunho()
    }

    // Buscar ID atualizado
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
        valor_total_executado: parseFloat(valorExecutado),
        resumo_atividades: resumo,
        observacoes: observacoes || null,
        status: 'enviada',
        data_envio: new Date().toISOString(),
      })
      .eq('id', current.id)

    if (error) { toast.error('Erro ao enviar: ' + error.message); setSending(false); return }

    toast.success('Prestação de contas enviada com sucesso!')
    setSending(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Status atual */}
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

      {/* Parecer do gestor (se houver) */}
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
                {prestacao.data_analise && (
                  <p className="text-xs text-slate-400 mt-2">
                    Analisado em {new Date(prestacao.data_analise).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparativo orçamentário */}
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
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Orçamento Previsto</Label>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {orcamentoPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div>
              <Label htmlFor="valor_executado" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Valor Executado (R$)
              </Label>
              <Input
                id="valor_executado"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valorExecutado}
                onChange={e => setValorExecutado(e.target.value)}
                disabled={!canEdit}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de atividades */}
      <Card className="border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Relatório de Atividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="resumo" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Resumo das atividades realizadas
            </Label>
            <Textarea
              id="resumo"
              rows={6}
              placeholder="Descreva as atividades realizadas com o recurso recebido, incluindo datas, locais e públicos atingidos..."
              value={resumo}
              onChange={e => setResumo(e.target.value)}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="observacoes" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Observações adicionais (opcional)
            </Label>
            <Textarea
              id="observacoes"
              rows={3}
              placeholder="Informações complementares, justificativas de mudanças no plano original..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload de comprovantes */}
      {canEdit && (
        <Card className="border-slate-200 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Comprovantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUpload
              tipo="comprovante_despesa"
              label="Comprovantes de despesa (notas fiscais, recibos)"
              tenantId={tenantId}
              onUpload={async (file) => {
                const supabase = createClient()
                await supabase.from('projeto_documentos').insert({
                  tenant_id: tenantId,
                  projeto_id: projetoId,
                  tipo: 'comprovante_despesa',
                  nome_arquivo: file.nome_arquivo,
                  storage_path: file.storage_path,
                  tamanho_bytes: file.tamanho_bytes,
                })
                router.refresh()
              }}
              existingFiles={documentos.filter(d => d.tipo === 'comprovante_despesa').map(d => ({
                nome_arquivo: d.nome_arquivo,
                storage_path: d.storage_path,
                tamanho_bytes: d.tamanho_bytes || 0,
                tipo: d.tipo,
              }))}
            />
            <DocumentUpload
              tipo="relatorio_atividade"
              label="Relatório de atividade (fotos, registros)"
              tenantId={tenantId}
              onUpload={async (file) => {
                const supabase = createClient()
                await supabase.from('projeto_documentos').insert({
                  tenant_id: tenantId,
                  projeto_id: projetoId,
                  tipo: 'relatorio_atividade',
                  nome_arquivo: file.nome_arquivo,
                  storage_path: file.storage_path,
                  tamanho_bytes: file.tamanho_bytes,
                })
                router.refresh()
              }}
              existingFiles={documentos.filter(d => d.tipo === 'relatorio_atividade').map(d => ({
                nome_arquivo: d.nome_arquivo,
                storage_path: d.storage_path,
                tamanho_bytes: d.tamanho_bytes || 0,
                tipo: d.tipo,
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Documentos já enviados (modo leitura) */}
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

      {/* Ações */}
      {canEdit && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={salvarRascunho}
            disabled={saving || sending}
            className="rounded-xl"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          <Button
            onClick={enviarPrestacao}
            disabled={saving || sending}
            className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Enviando...' : 'Enviar Prestação'}
          </Button>
        </div>
      )}
    </div>
  )
}

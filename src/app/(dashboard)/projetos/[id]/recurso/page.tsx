'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'
import { recursoSchema } from '@/lib/schemas/projeto'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentUpload } from '@/components/projeto/DocumentUpload'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PrazoRecurso {
  tipo: string
  inicio: string
  fim: string
  aberto: boolean
}

export default function RecursoPage() {
  const router = useRouter()
  const params = useParams()
  const projetoId = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingPrazos, setLoadingPrazos] = useState(true)
  const [tipo, setTipo] = useState<string>('')
  const [fundamentacao, setFundamentacao] = useState('')
  const [anexos, setAnexos] = useState<Array<{ storage_path: string; nome_arquivo: string }>>([])
  const [prazos, setPrazos] = useState<PrazoRecurso[]>([])
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    async function loadPrazos() {
      const supabase = createClient()
      const { data: projeto } = await supabase
        .from('projetos')
        .select('edital_id')
        .eq('id', projetoId)
        .single()

      if (!projeto) { setLoadingPrazos(false); return }

      const { data: edital } = await supabase
        .from('editais')
        .select('inicio_recurso_inscricao, fim_recurso_inscricao, inicio_recurso_selecao, fim_recurso_selecao, inicio_recurso_habilitacao, fim_recurso_habilitacao')
        .eq('id', projeto.edital_id)
        .single()

      if (!edital) { setLoadingPrazos(false); return }

      const now = new Date()
      const lista: PrazoRecurso[] = []

      if (edital.inicio_recurso_inscricao && edital.fim_recurso_inscricao) {
        const aberto = now >= new Date(edital.inicio_recurso_inscricao) && now <= new Date(edital.fim_recurso_inscricao)
        lista.push({ tipo: 'Inscricao', inicio: edital.inicio_recurso_inscricao, fim: edital.fim_recurso_inscricao, aberto })
      }
      if (edital.inicio_recurso_selecao && edital.fim_recurso_selecao) {
        const aberto = now >= new Date(edital.inicio_recurso_selecao) && now <= new Date(edital.fim_recurso_selecao)
        lista.push({ tipo: 'Avaliacao/Selecao', inicio: edital.inicio_recurso_selecao, fim: edital.fim_recurso_selecao, aberto })
      }
      if (edital.inicio_recurso_habilitacao && edital.fim_recurso_habilitacao) {
        const aberto = now >= new Date(edital.inicio_recurso_habilitacao) && now <= new Date(edital.fim_recurso_habilitacao)
        lista.push({ tipo: 'Habilitacao', inicio: edital.inicio_recurso_habilitacao, fim: edital.fim_recurso_habilitacao, aberto })
      }

      setPrazos(lista)

      // Block if no deadline is active (but only if deadlines are configured)
      if (lista.length > 0 && !lista.some(p => p.aberto)) {
        setBloqueado(true)
      }

      setLoadingPrazos(false)
    }
    loadPrazos()
  }, [projetoId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (bloqueado) {
      toast.error('Prazo de recurso encerrado')
      return
    }

    const validation = recursoSchema.safeParse({ tipo, fundamentacao })
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { toast.error('Sessao expirada'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) { toast.error('Perfil nao encontrado'); setLoading(false); return }

    const protocolo = `REC-${Date.now().toString(36).toUpperCase()}`

    const { data: recurso, error } = await supabase
      .from('recursos')
      .insert({
        tenant_id: profile.tenant_id,
        projeto_id: projetoId,
        proponente_id: user.id,
        tipo,
        numero_protocolo: protocolo,
        fundamentacao,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao enviar recurso: ' + error.message)
      setLoading(false)
      return
    }

    if (anexos.length > 0 && recurso) {
      await supabase.from('recurso_anexos').insert(
        anexos.map(a => ({
          recurso_id: recurso.id,
          storage_path: a.storage_path,
          nome_arquivo: a.nome_arquivo,
        }))
      )
    }

    logAudit({
      supabase,
      acao: 'SUBMISSAO_RECURSO',
      tabela_afetada: 'recursos',
      registro_id: recurso!.id,
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      dados_novos: { protocolo, tipo, projeto_id: projetoId, anexos: anexos.length },
    }).catch(() => {})

    toast.success(`Recurso enviado! Protocolo: ${protocolo}`)
    router.push(`/projetos/${projetoId}`)
  }

  if (loadingPrazos) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Interpor Recurso</h1>
              <p className="text-sm text-slate-500">Fundamentacao obrigatoria</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prazos info */}
      {prazos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {prazos.map(p => (
            <div key={p.tipo} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
              p.aberto ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <Clock className="h-3 w-3" />
              {p.tipo}: {format(new Date(p.inicio), 'dd/MM', { locale: ptBR })} - {format(new Date(p.fim), 'dd/MM', { locale: ptBR })}
              {p.aberto && <span className="text-[10px] uppercase tracking-wide font-semibold">(aberto)</span>}
              {!p.aberto && <span className="text-[10px] uppercase tracking-wide">(encerrado)</span>}
            </div>
          ))}
        </div>
      )}

      {/* Blocked message */}
      {bloqueado && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Prazo de recurso encerrado</p>
            <p className="text-xs text-red-600">Nao e possivel enviar recursos fora do prazo estabelecido no edital.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dados do Recurso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Tipo de Recurso *</Label>
              <Select value={tipo} onValueChange={setTipo} disabled={bloqueado}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habilitacao">Habilitacao</SelectItem>
                  <SelectItem value="avaliacao">Avaliacao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Fundamentacao *</Label>
              <Textarea
                value={fundamentacao}
                onChange={e => setFundamentacao(e.target.value)}
                placeholder="Descreva detalhadamente os motivos do recurso..."
                rows={8}
                required
                disabled={bloqueado}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {!bloqueado && (
              <DocumentUpload
                tipo="complementar"
                label="Anexos do Recurso"
                tenantId=""
                onUpload={(doc) => setAnexos(prev => [...prev, { storage_path: doc.storage_path, nome_arquivo: doc.nome_arquivo }])}
              />
            )}

            {anexos.length > 0 && (
              <div className="space-y-1">
                {anexos.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="truncate">{a.nome_arquivo}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Link href={`/projetos/${projetoId}`}>
                <Button variant="outline" type="button" className="rounded-xl">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={loading || bloqueado} className="rounded-xl">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Recurso
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

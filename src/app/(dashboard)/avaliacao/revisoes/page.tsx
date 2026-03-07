import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, RotateCcw, Clock, CheckCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function RevisoesListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: revisoes } = await supabase
    .from('recurso_revisoes')
    .select('*')
    .eq('avaliador_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch recurso + project info for each revision
  const recursoIds = [...new Set((revisoes || []).map(r => r.recurso_id))]
  const { data: recursos } = recursoIds.length > 0
    ? await supabase
        .from('recursos')
        .select('id, numero_protocolo, projeto_id, projetos(titulo, numero_protocolo, edital_id, editais(titulo))')
        .in('id', recursoIds)
    : { data: [] }

  const recursoMap = new Map((recursos || []).map((r) => [r.id, r]))

  const pendentes = (revisoes || []).filter(r => r.status !== 'revisada')
  const concluidas = (revisoes || []).filter(r => r.status === 'revisada')

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-purple-500" />
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-500" />
              Revisoes Solicitadas
            </h1>
            <p className="text-sm text-slate-500">
              Criterios que precisam ser reavaliados conforme decisao do gestor em recursos administrativos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{(revisoes || []).length}</div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Total</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{pendentes.length}</div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{concluidas.length}</div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Concluidas</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {(revisoes || []).length > 0 ? (
        <div className="grid gap-3">
          {/* Show pending first */}
          {[...pendentes, ...concluidas].map((rev) => {
            const recurso = recursoMap.get(rev.recurso_id)
            const projeto = (recurso?.projetos as unknown as { titulo?: string; editais?: { titulo?: string } } | null)
            const edital = projeto?.editais
            const criteriosCount = (rev.criterios_revisar as string[])?.length || 0

            const statusColor = rev.status === 'revisada'
              ? 'bg-green-50 text-green-600'
              : rev.status === 'em_revisao'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-amber-50 text-amber-600'

            const statusLabel = rev.status === 'revisada'
              ? 'Revisada'
              : rev.status === 'em_revisao'
                ? 'Em revisao'
                : 'Pendente'

            return (
              <Card key={rev.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                      {projeto?.titulo || 'Projeto'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 font-medium leading-none truncate max-w-[200px]">
                        {edital?.titulo || ''}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <p className="text-xs text-slate-300 font-mono leading-none">
                        {recurso?.numero_protocolo || ''}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {criteriosCount} criterio(s) para revisar
                      {rev.data_solicitacao && (
                        <span className="text-slate-400">
                          {' '}| Solicitado em {format(new Date(rev.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`border-none text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md ${statusColor}`}>
                      {statusLabel}
                    </Badge>
                    {rev.status !== 'revisada' && (
                      <Link href={`/avaliacao/revisoes/${rev.id}`}>
                        <Button className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-xl shadow-purple-600/20 transition-all active:scale-95">
                          Revisar
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <RotateCcw className="h-8 w-8 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500">Nenhuma revisao solicitada no momento.</p>
        </div>
      )}
    </div>
  )
}

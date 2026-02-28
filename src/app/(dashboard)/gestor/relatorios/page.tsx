import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import type { FaseEdital } from '@/types/database.types'
import { DownloadRelatorios } from '@/components/gestor/RelatorioButtons'
import { FileText } from 'lucide-react'

export default async function GestorRelatoriosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id

  const { data: editais } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, status, inicio_inscricao, fim_inscricao')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Estatisticas por edital
  const relatorios = await Promise.all(
    (editais || []).map(async (edital: any) => {
      const [
        { count: totalInscritos },
        { count: habilitados },
        { count: avaliacoesFinalizadas },
        { count: recursosAbertos },
      ] = await Promise.all([
        supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('edital_id', edital.id),
        supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('edital_id', edital.id).eq('status_habilitacao', 'habilitado'),
        supabase
          .from('avaliacoes')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'finalizada')
          .in('projeto_id',
            (await supabase.from('projetos').select('id').eq('edital_id', edital.id)).data?.map((p: any) => p.id) || []
          ),
        supabase
          .from('recursos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendente')
          .in('projeto_id',
            (await supabase.from('projetos').select('id').eq('edital_id', edital.id)).data?.map((p: any) => p.id) || []
          ),
      ])

      const { data: tenantData } = await supabase.from('tenants').select('nome').eq('id', tenantId).single()

      return {
        ...edital,
        totalInscritos: totalInscritos ?? 0,
        habilitados: habilitados ?? 0,
        avaliacoesFinalizadas: avaliacoesFinalizadas ?? 0,
        recursosAbertos: recursosAbertos ?? 0,
        tenantNome: tenantData?.nome || 'Elo Cultura'
      }
    })
  )

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">
          Relatórios
        </h1>
        <p className="text-sm text-slate-500 font-normal max-w-xl">
          Extração de atas, rankings e homologações oficiais. Gestão documental automatizada para prestação de contas.
        </p>
      </div>

      <div className="grid gap-6">
        {relatorios.map(rel => (
          <Card key={rel.id} className="relative group border-slate-200/50 hover:shadow-md transition-all duration-500 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-200 p-5 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 rounded-md bg-[var(--brand-primary)] text-white text-[11px] font-semibold tracking-wide uppercase">
                      ID {rel.numero_edital}
                    </div>
                    <EditalStatusBadge status={rel.status as FaseEdital} />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 leading-tight tracking-tight group-hover:text-[var(--brand-primary)] transition-colors">
                    {rel.titulo}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-4">
                  <DownloadRelatorios
                    editalId={rel.id}
                    editalTitulo={rel.titulo}
                    editalNumero={rel.numero_edital}
                    tenantId={tenantId || ''}
                    tenantNome={rel.tenantNome}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1 relative">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Inscritos</p>
                  <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                    {rel.totalInscritos.toString().padStart(2, '0')}
                  </div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-slate-100 hidden lg:block" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Habilitados</p>
                  <div className="text-3xl font-semibold text-[var(--brand-success)] tracking-tight">
                    {rel.habilitados.toString().padStart(2, '0')}
                  </div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-slate-100 hidden lg:block" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Avaliações</p>
                  <div className="text-3xl font-semibold text-[var(--brand-primary)] tracking-tight">
                    {rel.avaliacoesFinalizadas.toString().padStart(2, '0')}
                  </div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-slate-100 hidden lg:block" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Recursos</p>
                  <div className="text-3xl font-semibold text-rose-500 tracking-tight">
                    {rel.recursosAbertos.toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide leading-none">
                    Cronograma: <span className="text-slate-900 not-italic ml-1">
                      {new Date(rel.inicio_inscricao).toLocaleDateString('pt-BR')}
                      {rel.fim_inscricao && ` — ${new Date(rel.fim_inscricao).toLocaleDateString('pt-BR')}`}
                    </span>
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">Gestão {rel.tenantNome}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {relatorios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <FileText className="h-6 w-6 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Sem editais ativos</h3>
            <p className="text-xs text-slate-500 max-w-xs font-normal">Não encontramos nenhum edital aguardando relatórios.</p>
          </div>
        )}
      </div>
    </div>
  )
}

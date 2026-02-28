import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, User, FileText } from 'lucide-react'

export default async function AvaliadoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user!.id)
    .single()

  const { data: avaliadores } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', myProfile!.tenant_id)
    .eq('role', 'avaliador')
    .order('nome')

  // Buscar contagem de avaliacoes por avaliador
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('avaliador_id, status, projetos(titulo, editais(titulo, numero_edital))')
    .eq('tenant_id', myProfile!.tenant_id)

  // Agrupar avaliações por avaliador
  const avaliacoesPorAvaliador = new Map<string, { total: number; finalizadas: number; em_andamento: number; editais: Set<string> }>()
  for (const av of avaliacoes || []) {
    const current = avaliacoesPorAvaliador.get(av.avaliador_id) || { total: 0, finalizadas: 0, em_andamento: 0, editais: new Set<string>() }
    current.total++
    if (av.status === 'finalizada') current.finalizadas++
    if (av.status === 'em_andamento') current.em_andamento++
    const edital = (av as any).projetos?.editais
    if (edital?.numero_edital) current.editais.add(edital.numero_edital)
    avaliacoesPorAvaliador.set(av.avaliador_id, current)
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Avaliadores</h1>
            <p className="text-sm text-slate-500">
              {avaliadores?.length || 0} avaliador{(avaliadores?.length || 0) !== 1 ? 'es' : ''} cadastrado{(avaliadores?.length || 0) !== 1 ? 's' : ''} no tenant
            </p>
          </div>
        </CardContent>
      </Card>

      {avaliadores && avaliadores.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {avaliadores.map(av => {
            const stats = avaliacoesPorAvaliador.get(av.id)
            const initials = av.nome?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

            return (
              <div key={av.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-2xl" />
                <div className="relative p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-500">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-[var(--brand-primary)] transition-colors">
                        {av.nome}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">
                        {av.cpf_cnpj || 'CPF não informado'}
                      </p>
                    </div>
                    <Badge className={`${av.active ? 'bg-green-50 text-[var(--brand-success)]' : 'bg-slate-50 text-slate-400'} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                      {av.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/50 rounded-2xl">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">{stats?.total || 0}</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Atribuídas</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-lg font-semibold text-[var(--brand-success)]">{stats?.finalizadas || 0}</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Concluídas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-amber-600">{stats?.em_andamento || 0}</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Pendentes</p>
                    </div>
                  </div>

                  {stats && stats.editais.size > 0 && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <FileText className="h-3 w-3 text-slate-300 flex-shrink-0" />
                      {Array.from(stats.editais).slice(0, 3).map(ed => (
                        <span key={ed} className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                          {ed}
                        </span>
                      ))}
                      {stats.editais.size > 3 && (
                        <span className="text-[11px] font-bold text-slate-300">+{stats.editais.size - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400">{av.telefone || 'Sem telefone'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300">
                      Desde {new Date(av.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
            <ClipboardList className="h-8 w-8 text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum avaliador cadastrado</h3>
          <p className="text-sm text-slate-500 max-w-xs font-normal">
            Promova usuários ao perfil de avaliador na página de Usuários.
          </p>
        </div>
      )}
    </div>
  )
}

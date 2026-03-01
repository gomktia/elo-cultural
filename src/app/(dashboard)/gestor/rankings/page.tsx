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
import { Trophy } from 'lucide-react'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import type { Edital, FaseEdital } from '@/types/database.types'

export default async function GestorRankingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { data: editais } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, status')
    .eq('tenant_id', profile?.tenant_id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Para cada edital, buscar projetos com nota
  const editaisComProjetos = await Promise.all(
    (editais || []).map(async (edital) => {
      const { data: projetos } = await supabase
        .from('projetos')
        .select('id, titulo, numero_protocolo, nota_final, status_atual')
        .eq('edital_id', edital.id)
        .not('nota_final', 'is', null)
        .order('nota_final', { ascending: false })
        .limit(10)

      return { ...edital, projetos: projetos || [] }
    })
  )

  const editaisComResultado = editaisComProjetos.filter(e => e.projetos.length > 0)

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Rankings</h1>
            <p className="text-sm text-slate-500">Classificação em tempo real dos projetos por edital.</p>
          </div>
        </CardContent>
      </Card>

      {editaisComResultado.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <Trophy className="h-8 w-8 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500 font-normal">Nenhum edital com avaliações concluídas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {editaisComResultado.map(edital => (
            <Card key={edital.id} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-[var(--brand-primary)] p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-white leading-none">{edital.titulo}</CardTitle>
                    <p className="text-xs text-white/70 font-medium uppercase tracking-wide">{edital.numero_edital}</p>
                  </div>
                  <EditalStatusBadge status={edital.status as FaseEdital} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16 py-3 px-4 font-semibold text-xs uppercase tracking-wide text-slate-500 text-center">Posição</TableHead>
                      <TableHead className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-slate-500">Projeto</TableHead>
                      <TableHead className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-slate-500">Protocolo</TableHead>
                      <TableHead className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-slate-500 text-right">Nota</TableHead>
                      <TableHead className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-slate-500 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {edital.projetos.map((p, idx) => {
                      const isTop3 = idx < 3
                      const medalColors = ['text-yellow-500 bg-yellow-50 border-yellow-100', 'text-slate-400 bg-slate-50 border-slate-100', 'text-amber-600 bg-amber-50 border-amber-100']
                      const statusBarColor = p.status_atual === 'selecionado' ? 'bg-[var(--brand-success)]' :
                        p.status_atual === 'suplente' ? 'bg-amber-400' : 'bg-slate-200'

                      return (
                        <TableRow key={p.id} className="relative even:bg-slate-50/40 hover:bg-slate-100/60 transition-all duration-300 border-slate-100 group">
                          <TableCell className="py-5 px-4 relative">
                            <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${statusBarColor}`} />
                            <div className="flex items-center justify-center">
                              {isTop3 ? (
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center border shadow-sm ${medalColors[idx]}`}>
                                  <Trophy className="h-4 w-4 fill-current" />
                                </div>
                              ) : (
                                <span className="text-sm font-semibold text-slate-300">{idx + 1}º</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-4">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">
                                {p.titulo}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-4">
                            <code className="text-xs font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide">{p.numero_protocolo}</code>
                          </TableCell>
                          <TableCell className="py-5 px-4 text-right">
                            <span className={['text-lg font-bold tracking-tight', isTop3 ? 'text-slate-900' : 'text-slate-400'].join(' ')}>
                              {Number(p.nota_final).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="py-5 px-4 text-right">
                            <Badge className={[
                              'border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-1',
                              p.status_atual === 'selecionado' ? 'bg-green-50 text-[var(--brand-success)]' :
                                p.status_atual === 'suplente' ? 'bg-orange-50 text-[var(--brand-warning)]' :
                                  'bg-slate-50 text-slate-400'
                            ].join(' ')}>
                              {p.status_atual}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

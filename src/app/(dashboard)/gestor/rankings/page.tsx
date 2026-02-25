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
import type { Edital } from '@/types/database.types'

export default async function GestorRankingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user!.id)
    .single()

  const { data: editais } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, status')
    .eq('tenant_id', profile?.tenant_id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Para cada edital, buscar projetos com nota
  const editaisComProjetos = await Promise.all(
    (editais || []).map(async (edital: any) => {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">Rankings</h1>
        <p className="text-sm text-slate-500 font-normal">Classificação em tempo real dos projetos por edital.</p>
      </div>

      {editaisComResultado.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <Trophy className="h-8 w-8 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500 font-normal">Nenhum edital com avaliações concluídas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {editaisComResultado.map(edital => (
            <Card key={edital.id} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-slate-900 leading-none">{edital.titulo}</CardTitle>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{edital.numero_edital}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-[11px] font-medium uppercase tracking-wide bg-white">
                    {edital.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-1">
                <Table>
                  <TableHeader className="bg-slate-50/30">
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="w-16 py-3 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">Pos.</TableHead>
                      <TableHead className="py-3 px-2 font-medium text-xs uppercase tracking-wide text-slate-400">Projeto</TableHead>
                      <TableHead className="py-3 px-2 font-medium text-xs uppercase tracking-wide text-slate-400">Protocolo</TableHead>
                      <TableHead className="py-3 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-right">Nota</TableHead>
                      <TableHead className="py-3 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {edital.projetos.map((p: any, idx: number) => {
                      const isTop3 = idx < 3
                      const colors = ['text-yellow-500', 'text-slate-400', 'text-amber-600']

                      return (
                        <TableRow key={p.id} className="hover:bg-white transition-all duration-300 border-slate-50 group">
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              {isTop3 ? (
                                <div className={`h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-50 ${colors[idx]}`}>
                                  <span className="font-semibold text-xs">{idx + 1}º</span>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-slate-300">{idx + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-2">
                            <div className="text-sm font-bold text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">
                              {p.titulo}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-2">
                            <span className="text-xs font-mono text-slate-400 font-bold">{p.numero_protocolo}</span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <span className={['text-base font-semibold tracking-tight', idx < 3 ? 'text-slate-900' : 'text-slate-400'].join(' ')}>
                              {Number(p.nota_final).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <Badge variant="outline" className="border border-slate-200 bg-slate-50 text-slate-400 text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md">
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

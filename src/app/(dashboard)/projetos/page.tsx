import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusTracker } from '@/components/projeto/StatusTracker'
import { Plus, ArrowRight, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function MeusProjetosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projetos } = await supabase
    .from('projetos')
    .select('*, editais(titulo, numero_edital)')
    .eq('proponente_id', user!.id)
    .order('data_envio', { ascending: false })

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">Meus Projetos</h1>
          <p className="text-sm text-slate-500">Acompanhe o status das suas propostas culturais.</p>
        </div>
        <Link href="/editais">
          <Button className="h-10 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Nova Inscrição
          </Button>
        </Link>
      </div>

      {projetos && projetos.length > 0 ? (
        <div className="grid gap-3">
          {projetos.map((projeto: any) => (
            <Card key={projeto.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">
                    {projeto.titulo}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 font-medium leading-none truncate max-w-[200px]">
                      {projeto.editais?.titulo}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <p className="text-xs text-slate-300 font-mono leading-none">
                      {projeto.numero_protocolo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <StatusTracker status={projeto.status_atual} />
                  <div className="text-xs font-medium text-slate-500 text-right">
                    <p className="text-[11px] text-slate-400 mb-0.5">Enviado em</p>
                    {format(new Date(projeto.data_envio), 'dd MMM yyyy', { locale: ptBR })}
                  </div>
                  <Link href={`/projetos/${projeto.id}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-brand-primary/5 hover:text-brand-primary transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <FolderOpen className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500">Você ainda não possui projetos inscritos.</p>
          <Link href="/editais" className="mt-4">
            <Button variant="outline" className="rounded-xl border-slate-200 font-medium text-sm">
              Explorar Editais
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

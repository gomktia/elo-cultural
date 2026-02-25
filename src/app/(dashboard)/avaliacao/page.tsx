import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText } from 'lucide-react'
import type { AvaliacaoWithProjeto } from '@/types/database.types'

export default async function AvaliacaoListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawAvaliacoes } = await supabase
    .from('avaliacoes')
    .select('*, projetos(titulo, numero_protocolo, editais(titulo, numero_edital))')
    .eq('avaliador_id', user!.id)
    .order('created_at', { ascending: false })

  const avaliacoes = (rawAvaliacoes || []) as AvaliacaoWithProjeto[]

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-[900] tracking-tight text-slate-900 leading-none mb-2">Avaliacoes</h1>
        <p className="text-sm text-slate-500 font-medium italic">Projetos atribuidos ao seu comite tecnico.</p>
      </div>

      {avaliacoes.length > 0 ? (
        <div className="grid gap-3">
          {avaliacoes.map((av) => (
            <Card key={av.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">
                    {av.projetos?.titulo}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none truncate max-w-[200px]">
                      {av.projetos?.editais?.titulo}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <p className="text-[10px] text-slate-300 font-mono leading-none">
                      {av.projetos?.numero_protocolo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {av.pontuacao_total !== null && (
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Nota</p>
                      <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                        {Number(av.pontuacao_total).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Badge variant="outline" className={[
                    'border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md',
                    av.status === 'finalizada' ? 'bg-green-50 text-[var(--brand-success)]' :
                      av.status === 'em_andamento' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-400'
                  ].join(' ')}>
                    {av.status === 'em_andamento' ? 'Pendente' : av.status === 'finalizada' ? 'Concluída' : 'Bloqueada'}
                  </Badge>
                  {av.status === 'em_andamento' && (
                    <Link href={`/avaliacao/${av.projeto_id}`}>
                      <Button className="h-9 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 transition-all active:scale-95">
                        Avaliar
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <FileText className="h-8 w-8 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500 font-medium italic">Nenhum projeto atribuído para avaliação no momento.</p>
        </div>
      )}
    </div>
  )
}

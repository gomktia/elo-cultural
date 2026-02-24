import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import { Plus, FileText } from 'lucide-react'
import type { Edital } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AdminEditaisPage() {
  const supabase = await createClient()
  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-[900] tracking-tight text-slate-900 leading-none mb-2">Editais</h1>
          <p className="text-sm text-slate-500 font-medium italic">Gestão estratégica dos processos seletivos do município.</p>
        </div>
        <Link href="/admin/editais/novo">
          <Button className="h-10 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Novo Edital
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {(editais as Edital[] | null)?.map(edital => (
          <div key={edital.id} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-2xl" />
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-0.5">
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[var(--brand-primary)] group-hover:bg-brand-primary/5 transition-colors duration-500">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-widest bg-brand-primary/5 px-2 py-0.5 rounded-md">
                      ID {edital.numero_edital}
                    </span>
                    <EditalStatusBadge status={edital.status} />
                  </div>
                  <h3 className="text-lg font-[900] text-slate-900 tracking-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">
                    {edital.titulo}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <span>Criado em: {format(new Date(edital.created_at), "dd MMM, yyyy", { locale: ptBR })}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span>Início: {edital.inicio_inscricao ? format(new Date(edital.inicio_inscricao), "dd/MM/yyyy") : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/admin/editais/${edital.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full h-9 px-4 rounded-lg border-slate-200 font-black text-[10px] text-slate-600 uppercase tracking-widest hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:bg-brand-primary/5 transition-all">
                    Gerenciar Painel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {(!editais || editais.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
              <Plus className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum edital cadastrado</h3>
            <p className="text-sm text-slate-500 max-w-xs font-medium italic">Comece criando o primeiro edital para lançar seu projeto cultural.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { EditalCard } from '@/components/edital/EditalCard'
import type { Edital } from '@/types/database.types'
import { Scale, Calendar } from 'lucide-react'

export default async function EditaisPublicosPage() {
  const supabase = await createClient()

  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16 border-b border-slate-100 pb-6 md:pb-10">
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Editais Abertos
          </h1>
          <p className="text-sm md:text-base text-slate-500">
            Descubra novas oportunidades para o seu projeto cultural.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="h-14 w-14 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
            <Scale className="h-7 w-7" />
          </div>
        </div>
      </div>

      {editais && editais.length > 0 ? (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(editais as Edital[]).map(edital => (
            <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 md:py-40 bg-slate-50/50 rounded-3xl md:rounded-[40px] border-2 border-dashed border-slate-200 text-center px-6">
          <div className="h-20 w-20 md:h-24 md:w-24 bg-white rounded-2xl md:rounded-3xl shadow-sm flex items-center justify-center mb-6 md:mb-8 border border-slate-100">
            <Calendar className="h-8 w-8 md:h-10 md:w-10 text-slate-200" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Nenhum edital disponível</h3>
          <p className="text-sm md:text-slate-500 max-w-xs font-medium">No momento não há processos de seleção abertos para novos projetos.</p>
        </div>
      )}
    </div>
  )
}

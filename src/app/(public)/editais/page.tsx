import { createClient } from '@/lib/supabase/server'
import { EditalCard } from '@/components/edital/EditalCard'
import type { Edital } from '@/types/database.types'
import { Scale, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function EditaisPublicosPage() {
  const supabase = await createClient()

  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden mb-10">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Editais Abertos</h1>
            <p className="text-sm text-slate-500">Descubra novas oportunidades para o seu projeto cultural.</p>
          </div>
          <div className="hidden md:block">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <Scale className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {editais && editais.length > 0 ? (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(editais as Edital[]).map(edital => (
            <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
          ))}
        </div>
      ) : (
        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100">
              <Calendar className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhum edital disponível</h3>
            <p className="text-sm text-slate-500 max-w-xs">No momento não há processos de seleção abertos para novos projetos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

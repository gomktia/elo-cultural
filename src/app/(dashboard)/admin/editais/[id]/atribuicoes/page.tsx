import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AtribuicaoMatrix } from '@/components/avaliacao/AtribuicaoMatrix'
import { ArrowLeft, Users } from 'lucide-react'
import type { Profile, Projeto } from '@/types/database.types'

export default async function AtribuicoesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, tenant_id')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const { data: avaliadores } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', edital.tenant_id)
    .eq('role', 'avaliador')
    .eq('active', true)

  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('edital_id', id)

  const { data: existingAvals } = await supabase
    .from('avaliacoes')
    .select('avaliador_id, projeto_id')
    .eq('tenant_id', edital.tenant_id)
    .in('projeto_id', (projetos || []).map((p: any) => p.id))

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
        <Link href={`/admin/editais/${id}`}>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all active:scale-90 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
        </Link>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{edital.numero_edital}</span>
          </div>
          <h1 className="text-4xl font-[900] tracking-tight text-slate-900 leading-none">Atribuição de Avaliadores</h1>
          <p className="text-lg text-slate-400 font-medium">{edital.titulo}</p>
        </div>
      </div>

      {/* Quick action: add evaluators */}
      <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <Users className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium flex-1">
          Precisa adicionar novos avaliadores? Altere o perfil de um usuario para "Avaliador" na pagina de usuarios.
        </p>
        <Link href="/admin/usuarios">
          <Button variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-xs uppercase tracking-widest">
            Gerenciar Usuarios
          </Button>
        </Link>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-[40px] border border-slate-100 p-10 shadow-premium">
        <AtribuicaoMatrix
          editalId={id}
          tenantId={edital.tenant_id}
          avaliadores={(avaliadores as Profile[]) || []}
          projetos={(projetos as Projeto[]) || []}
          atribuicoes={existingAvals || []}
        />
      </div>
    </div>
  )
}

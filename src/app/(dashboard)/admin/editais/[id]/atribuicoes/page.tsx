import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    .eq('status_habilitacao', 'habilitado')

  const { data: existingAvals } = await supabase
    .from('avaliacoes')
    .select('avaliador_id, projeto_id')
    .eq('tenant_id', edital.tenant_id)
    .in('projeto_id', (projetos || []).map((p) => p.id))

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/admin/editais/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Atribuição de Avaliadores</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {edital.numero_edital}
                </code>
                <span className="text-sm text-slate-500">{edital.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick action: add evaluators */}
      <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <Users className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium flex-1">
          Precisa adicionar novos avaliadores? Altere o perfil de um usuário para "Avaliador" na página de usuários.
        </p>
        <Link href="/admin/usuarios">
          <Button variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-xs uppercase tracking-wide">
            Gerenciar Usuários
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
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

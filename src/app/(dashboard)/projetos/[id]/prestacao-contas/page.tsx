import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PrestacaoForm } from '@/components/prestacao/PrestacaoForm'
import type { PrestacaoContas } from '@/types/database.types'

export default async function PrestacaoContasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Buscar projeto (deve ser do proponente e estar aprovado)
  const { data: projeto } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, orcamento_total, proponente_id, editais(titulo, numero_edital)')
    .eq('id', id)
    .single()

  if (!projeto || projeto.proponente_id !== user.id) notFound()

  // Buscar prestação existente (ou null)
  const { data: prestacao } = await supabase
    .from('prestacoes_contas')
    .select('*')
    .eq('projeto_id', id)
    .eq('proponente_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Buscar documentos de comprovantes já enviados
  const { data: documentos } = await supabase
    .from('projeto_documentos')
    .select('id, nome_arquivo, storage_path, tamanho_bytes, tipo, created_at')
    .eq('projeto_id', id)
    .in('tipo', ['comprovante_despesa', 'relatorio_atividade', 'prestacao_contas'])

  const edital = (projeto as any).editais as { titulo: string; numero_edital: string } | null

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/projetos/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Prestação de Contas</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {edital?.numero_edital}
                </code>
                <span className="text-sm text-slate-500">{projeto.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrestacaoForm
        projetoId={id}
        tenantId={profile.tenant_id}
        orcamentoPrevisto={Number(projeto.orcamento_total) || 0}
        prestacao={prestacao as PrestacaoContas | null}
        documentos={documentos || []}
      />
    </div>
  )
}

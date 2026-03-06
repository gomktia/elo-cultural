import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { GerarTermosForm } from '@/components/termos/GerarTermosForm'

export default async function GerarTermosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  // Load selecionados
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, proponente_id, orcamento_total, profiles:proponente_id (nome)')
    .eq('edital_id', id)
    .eq('status_atual', 'selecionado')
    .order('nota_final', { ascending: false })

  // Check which already have termos
  const projetoIds = (projetos || []).map(p => p.id)
  const { data: existingTermos } = projetoIds.length > 0
    ? await supabase
        .from('termos_execucao')
        .select('projeto_id')
        .in('projeto_id', projetoIds)
    : { data: [] }

  const existingSet = new Set((existingTermos || []).map(t => t.projeto_id))

  const projetosFormatted = (projetos || []).map(p => ({
    id: p.id,
    titulo: p.titulo,
    protocolo: p.numero_protocolo,
    proponente: (p.profiles as unknown as { nome: string } | null)?.nome || '—',
    valor: p.orcamento_total || 0,
    jaTemTermo: existingSet.has(p.id),
  }))

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/admin/editais/${id}/termos`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Gerar Termos de Execução</h1>
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

      <GerarTermosForm editalId={id} projetos={projetosFormatted} />
    </div>
  )
}

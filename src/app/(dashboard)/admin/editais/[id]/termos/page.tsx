import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, FileSignature, DollarSign, CheckCircle2, Clock } from 'lucide-react'
import { TermosTable } from '@/components/termos/TermosTable'
import { PagamentosSection } from '@/components/termos/PagamentosSection'
import { AditivosSection } from '@/components/termos/AditivosSection'
import type { TermoWithProjeto, TermoAditivo } from '@/types/database.types'

export default async function TermosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, status')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const { data: termos } = await supabase
    .from('termos_execucao')
    .select(`
      *,
      projetos:projeto_id (titulo, numero_protocolo, editais:edital_id (titulo, numero_edital)),
      profiles:proponente_id (nome, cpf_cnpj)
    `)
    .eq('projetos.edital_id', id)
    .order('created_at', { ascending: false })

  // Filter only termos that belong to projects from this edital
  const termosFiltered = (termos || []).filter(
    (t: TermoWithProjeto) => t.projetos !== null
  )

  const termoIds = termosFiltered.map((t: TermoWithProjeto) => t.id)
  const { data: aditivos } = termoIds.length > 0
    ? await supabase
        .from('termos_aditivos')
        .select('*')
        .in('termo_id', termoIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const stats = {
    total: termosFiltered.length,
    assinados: termosFiltered.filter((t: TermoWithProjeto) => ['assinado', 'vigente'].includes(t.status)).length,
    pendentes: termosFiltered.filter((t: TermoWithProjeto) => t.status.startsWith('pendente_')).length,
    valorTotal: termosFiltered.reduce((sum: number, t: TermoWithProjeto) => sum + Number(t.valor_total || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-5">
              <Link href={`/admin/editais/${id}`}>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Termos de Execução Cultural</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {edital.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{edital.titulo}</span>
                </div>
              </div>
            </div>
            <Link href={`/admin/editais/${id}/termos/novo`}>
              <Button className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 font-semibold text-xs uppercase tracking-wide gap-2">
                <Plus className="h-4 w-4" />
                Gerar Termos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Termos', value: stats.total, icon: FileSignature, color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary)]/10' },
          { label: 'Assinados / Vigentes', value: stats.assinados, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pendentes Assinatura', value: stats.pendentes, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Valor Total', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.valorTotal), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">{stat.label}</p>
                  <p className="text-xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <TermosTable termos={termosFiltered as TermoWithProjeto[]} editalId={id} />

      {/* Aditivos (Fase 6.5) */}
      {termosFiltered.length > 0 && (
        <AditivosSection termos={termosFiltered as TermoWithProjeto[]} aditivos={(aditivos || []) as TermoAditivo[]} />
      )}

      {/* Pagamentos */}
      {termosFiltered.length > 0 && (
        <PagamentosSection editalId={id} termos={termosFiltered as TermoWithProjeto[]} />
      )}
    </div>
  )
}

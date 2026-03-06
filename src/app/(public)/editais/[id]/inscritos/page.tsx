import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Users, Printer, FileText } from 'lucide-react'
import { InscritosExport } from '@/components/edital/InscritosExport'
import { PrintButton } from '@/components/edital/PrintButton'
import type { Edital } from '@/types/database.types'

export default async function InscritosPublicosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('*')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const e = edital as Edital

  // Show inscritos only after divulgacao phase
  const allowedPhases = [
    'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
    'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
    'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
    'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
  ]
  const showList = allowedPhases.includes(e.status)

  // Load projects with proponent name and category
  const { data: projetos } = showList
    ? await supabase
      .from('projetos')
      .select('id, titulo, numero_protocolo, data_envio, categoria_id, profiles:proponente_id (nome)')
      .eq('edital_id', id)
      .order('data_envio', { ascending: true })
    : { data: [] }

  // Load categories
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome')
    .eq('edital_id', id)

  const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

  const inscritos = (projetos || []).map((p, idx) => ({
    numero: idx + 1,
    protocolo: p.numero_protocolo,
    proponente: (p.profiles as unknown as { nome: string } | null)?.nome || '—',
    projeto: p.titulo,
    categoria: p.categoria_id ? catMap.get(p.categoria_id) || '—' : '—',
    data: p.data_envio,
  }))

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href={`/editais/${id}`} className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-[var(--brand-primary)] transition-colors mb-6 md:mb-8 group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar para o Edital
      </Link>

      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--brand-primary)]" />
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] md:text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide">Processo Seletivo {e.numero_edital}</p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Lista de Inscritos</h1>
                <p className="text-sm text-slate-500">{e.titulo}</p>
              </div>
              {showList && inscritos.length > 0 && (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/pdf/inscritos/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--brand-primary)]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </a>
                  <PrintButton />
                  <InscritosExport inscritos={inscritos} editalNumero={e.numero_edital} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {showList && (
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-xs font-medium px-2.5 py-1 rounded-lg gap-1.5">
              <Users className="h-3 w-3" />
              {inscritos.length} inscrito{inscritos.length !== 1 ? 's' : ''}
            </Badge>
            {categorias && categorias.length > 0 && categorias.map(c => {
              const count = inscritos.filter(i => i.categoria === c.nome).length
              return (
                <Badge key={c.id} className="bg-slate-100 text-slate-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
                  {c.nome}: {count}
                </Badge>
              )
            })}
          </div>
        )}

        {!showList ? (
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
              <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100">
                <Calendar className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Lista ainda não disponível</h3>
              <p className="text-sm text-slate-500 max-w-xs">A lista de inscritos será publicada após o encerramento das inscrições.</p>
            </CardContent>
          </Card>
        ) : inscritos.length === 0 ? (
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhuma inscrição registrada</h3>
              <p className="text-sm text-slate-500">Não foram encontrados projetos inscritos neste edital.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-[var(--brand-primary)]">
                <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
                  <TableHead className="w-16 py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-white text-center">Nº</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-white">Proponente</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-white">Projeto</TableHead>
                  {categorias && categorias.length > 0 && (
                    <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-white">Categoria</TableHead>
                  )}
                  <TableHead className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-white text-right">Protocolo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscritos.map((item) => (
                  <TableRow key={item.protocolo} className="even:bg-slate-50/40 hover:bg-slate-100/60 transition-all border-slate-100">
                    <TableCell className="py-3 px-4 text-center">
                      <span className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center font-semibold text-xs text-slate-400 mx-auto">
                        {item.numero}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <p className="text-sm font-semibold text-slate-900">{item.proponente}</p>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <p className="text-sm text-slate-700 font-medium">{item.projeto}</p>
                    </TableCell>
                    {categorias && categorias.length > 0 && (
                      <TableCell className="py-3 px-4">
                        <Badge className="bg-slate-50 text-slate-600 border-none rounded-lg px-2 text-[11px] font-medium py-0.5">
                          {item.categoria}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="py-3 px-4 text-right">
                      <code className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        {item.protocolo}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react'

interface ProjetoRelatorio {
  id: string
  titulo: string
  numero_protocolo: string
  status_atual: string
  status_habilitacao: string
  nota_final: number | null
  proponente_nome: string | null
  proponente_cpf: string | null
  proponente_municipio: string | null
  proponente_genero: string | null
  num_avaliacoes: number
  categoria_nome: string | null
  campos_extras: Record<string, string> | null
}

interface RelatorioDetalhadoProps {
  editalId: string
}

export function RelatorioDetalhado({ editalId }: RelatorioDetalhadoProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projetos, setProjetos] = useState<ProjetoRelatorio[]>([])
  const [busca, setBusca] = useState('')
  const [filtroHabilitacao, setFiltroHabilitacao] = useState('todos')
  const [filtroAvaliacao, setFiltroAvaliacao] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroGenero, setFiltroGenero] = useState('todos')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!expanded || projetos.length > 0) return
    loadProjetos()
  }, [expanded])

  async function loadProjetos() {
    setLoading(true)
    const supabase = createClient()

    const [{ data: projs }, { data: categorias }] = await Promise.all([
      supabase
        .from('projetos')
        .select('id, titulo, numero_protocolo, status_atual, status_habilitacao, nota_final, proponente_id, categoria_id, campos_extras')
        .eq('edital_id', editalId)
        .order('nota_final', { ascending: false, nullsFirst: false }),
      supabase
        .from('edital_categorias')
        .select('id, nome')
        .eq('edital_id', editalId),
    ])

    if (!projs) { setLoading(false); return }

    const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

    // Load proponente data
    const proponenteIds = [...new Set(projs.map(p => p.proponente_id).filter(Boolean))]
    const { data: profiles } = proponenteIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, nome, cpf_cnpj, municipio, genero')
          .in('id', proponenteIds)
      : { data: [] }

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    // Load avaliação counts
    const projetoIds = projs.map(p => p.id)
    const { data: avaliacoes } = projetoIds.length > 0
      ? await supabase
          .from('avaliacoes')
          .select('projeto_id')
          .in('projeto_id', projetoIds)
          .eq('status', 'finalizada')
      : { data: [] }

    const avCount: Record<string, number> = {}
    for (const a of avaliacoes || []) {
      avCount[a.projeto_id] = (avCount[a.projeto_id] || 0) + 1
    }

    setProjetos(projs.map(p => {
      const prof = profileMap.get(p.proponente_id)
      return {
        ...p,
        proponente_nome: prof?.nome || null,
        proponente_cpf: prof?.cpf_cnpj || null,
        proponente_municipio: prof?.municipio || null,
        proponente_genero: prof?.genero || null,
        num_avaliacoes: avCount[p.id] || 0,
        categoria_nome: p.categoria_id ? catMap.get(p.categoria_id) || null : null,
        campos_extras: (p as unknown as { campos_extras: Record<string, string> | null }).campos_extras || null,
      }
    }))
    setLoading(false)
  }

  const habilitacaoOptions = useMemo(() => {
    const s = new Set(projetos.map(p => p.status_habilitacao).filter(Boolean))
    return Array.from(s).sort()
  }, [projetos])

  const categoriaOptions = useMemo(() => {
    const s = new Set(projetos.map(p => p.categoria_nome).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [projetos])

  const generoOptions = useMemo(() => {
    const s = new Set(projetos.map(p => p.proponente_genero).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [projetos])

  const filtered = useMemo(() => {
    let result = projetos
    if (filtroHabilitacao !== 'todos') {
      result = result.filter(p => p.status_habilitacao === filtroHabilitacao)
    }
    if (filtroAvaliacao === 'avaliados') {
      result = result.filter(p => p.num_avaliacoes > 0)
    } else if (filtroAvaliacao === 'pendentes') {
      result = result.filter(p => p.num_avaliacoes === 0)
    }
    if (filtroCategoria !== 'todas') {
      result = result.filter(p => p.categoria_nome === filtroCategoria)
    }
    if (filtroGenero !== 'todos') {
      result = result.filter(p => p.proponente_genero === filtroGenero)
    }
    if (busca.trim()) {
      const q = busca.toLowerCase()
      result = result.filter(p =>
        p.titulo.toLowerCase().includes(q) ||
        p.numero_protocolo?.toLowerCase().includes(q) ||
        p.proponente_nome?.toLowerCase().includes(q) ||
        p.proponente_cpf?.includes(q) ||
        p.proponente_municipio?.toLowerCase().includes(q)
      )
    }
    return result
  }, [projetos, filtroHabilitacao, filtroAvaliacao, filtroCategoria, filtroGenero, busca])

  function exportCSV() {
    const hasCat = filtered.some(p => p.categoria_nome)
    // Collect unique custom field labels across all projects
    const extraLabels = new Set<string>()
    for (const p of filtered) {
      if (p.campos_extras) Object.keys(p.campos_extras).forEach(k => extraLabels.add(k))
    }
    const extraKeys = Array.from(extraLabels)

    const header = ['Protocolo', 'Título', ...(hasCat ? ['Categoria'] : []), 'Proponente', 'CPF/CNPJ', 'Município', 'Gênero', 'Habilitação', 'Nota Final', 'Avaliações', 'Status', ...extraKeys]
    const rows = filtered.map(p => [
      p.numero_protocolo,
      p.titulo,
      ...(hasCat ? [p.categoria_nome || ''] : []),
      p.proponente_nome || '',
      p.proponente_cpf || '',
      p.proponente_municipio || '',
      p.proponente_genero || '',
      p.status_habilitacao,
      p.nota_final?.toFixed(2) || '',
      p.num_avaliacoes,
      p.status_atual,
      ...extraKeys.map(k => p.campos_extras?.[k] || ''),
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-projetos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border-t border-slate-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-400 hover:text-[var(--brand-primary)] uppercase tracking-wide transition-colors"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? 'Recolher Detalhes' : 'Ver Projetos com Filtros'}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, CPF, protocolo, município..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="pl-9 h-9 rounded-lg border-slate-200 text-sm"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant={filtroHabilitacao === 'todos' ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-9 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroHabilitacao('todos')}>
                    Todos ({projetos.length})
                  </Button>
                  {habilitacaoOptions.map(s => (
                    <Button key={s} variant={filtroHabilitacao === s ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-9 capitalize border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroHabilitacao(s)}>
                      {s} ({projetos.filter(p => p.status_habilitacao === s).length})
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant={filtroAvaliacao === 'avaliados' ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-9 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroAvaliacao(filtroAvaliacao === 'avaliados' ? 'todos' : 'avaliados')}>
                    Avaliados
                  </Button>
                  <Button variant={filtroAvaliacao === 'pendentes' ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-9 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroAvaliacao(filtroAvaliacao === 'pendentes' ? 'todos' : 'pendentes')}>
                    Pendentes
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg text-[11px] h-9 gap-1.5 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={exportCSV} disabled={filtered.length === 0}>
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
              </div>

              {(categoriaOptions.length > 0 || generoOptions.length > 0) && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {categoriaOptions.length > 0 && (
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Categoria:</span>
                      <Button variant={filtroCategoria === 'todas' ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-7 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroCategoria('todas')}>
                        Todas
                      </Button>
                      {categoriaOptions.map(c => (
                        <Button key={c} variant={filtroCategoria === c ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-7 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroCategoria(c)}>
                          {c}
                        </Button>
                      ))}
                    </div>
                  )}
                  {generoOptions.length > 0 && (
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Gênero:</span>
                      <Button variant={filtroGenero === 'todos' ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-7 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroGenero('todos')}>
                        Todos
                      </Button>
                      {generoOptions.map(g => (
                        <Button key={g} variant={filtroGenero === g ? 'default' : 'outline'} size="sm" className="rounded-lg text-[11px] h-7 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={() => setFiltroGenero(g)}>
                          {g}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Protocolo</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Projeto</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Proponente</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Município</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-center">Nota</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-center">Aval.</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Habilitação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs font-medium text-slate-500">{p.numero_protocolo}</TableCell>
                        <TableCell className="text-sm font-medium text-slate-900 max-w-[200px] truncate">{p.titulo}</TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-700">{p.proponente_nome || '—'}</div>
                          {p.proponente_cpf && <div className="text-[11px] text-slate-400">{p.proponente_cpf}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{p.proponente_municipio || '—'}</TableCell>
                        <TableCell className="text-center text-sm font-semibold text-slate-900">{p.nota_final?.toFixed(2) || '—'}</TableCell>
                        <TableCell className="text-center text-xs text-slate-500">{p.num_avaliacoes}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={`text-[11px] font-medium uppercase tracking-wide border-none rounded-md px-2 py-0.5 ${p.status_habilitacao === 'habilitado' ? 'bg-green-50 text-green-600' : p.status_habilitacao === 'inabilitado' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                            {p.status_habilitacao || 'pendente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-400">
                          Nenhum projeto encontrado para os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[11px] text-slate-400 text-right">
                Mostrando {filtered.length} de {projetos.length} projetos
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

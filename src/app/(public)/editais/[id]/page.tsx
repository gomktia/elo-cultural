import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import { Separator } from '@/components/ui/separator'
import type { Edital, Criterio } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Calendar, FileText, Users, AlertCircle, ArrowRight, Clock, Tag, Shield, FileDown, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EditalCountdown } from '@/components/edital/EditalCountdown'

export default async function EditalPublicoPage({
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
    .eq('active', true)
    .single()

  if (!edital) notFound()

  const e = edital as Edital

  const { data: criterios } = await supabase
    .from('criterios')
    .select('*')
    .eq('edital_id', id)
    .order('ordem', { ascending: true })

  const { data: erratas } = await supabase
    .from('edital_erratas')
    .select('id, numero_errata, descricao, campo_alterado, valor_anterior, valor_novo, publicado_em')
    .eq('edital_id', id)
    .not('publicado_em', 'is', null)
    .order('numero_errata', { ascending: false })

  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome, vagas')
    .eq('edital_id', id)
    .order('created_at')

  const { data: cotas } = await supabase
    .from('edital_cotas')
    .select('tipo_cota, percentual, vagas_fixas')
    .eq('edital_id', id)
    .order('ordem')

  const { data: comissao } = await supabase
    .from('edital_comissao')
    .select('nome, qualificacao, tipo, portaria_numero')
    .eq('edital_id', id)
    .order('tipo')
    .order('nome')

  const { data: anexos } = await supabase
    .from('edital_anexos')
    .select('id, nome, descricao, tipo_anexo, nome_arquivo, storage_path, tamanho_bytes')
    .eq('edital_id', id)
    .order('ordem')
    .order('created_at')

  const isOpen = e.status === 'inscricao'

  // Build cronograma from edital dates
  const cronograma = [
    { fase: 'Inscrições', inicio: e.inicio_inscricao, fim: e.fim_inscricao },
    { fase: 'Recurso Inscrição', inicio: (e as unknown as Record<string, string | null>).inicio_recurso_inscricao, fim: (e as unknown as Record<string, string | null>).fim_recurso_inscricao },
    { fase: 'Impugnação da Lista de Inscritos', inicio: e.inicio_impugnacao_inscritos, fim: e.fim_impugnacao_inscritos },
    { fase: 'Avaliação Técnica', inicio: (e as unknown as Record<string, string | null>).inicio_avaliacao, fim: (e as unknown as Record<string, string | null>).fim_avaliacao },
    { fase: 'Recurso Avaliação', inicio: (e as unknown as Record<string, string | null>).inicio_recurso_selecao, fim: (e as unknown as Record<string, string | null>).fim_recurso_selecao },
    { fase: 'Habilitação', inicio: (e as unknown as Record<string, string | null>).inicio_habilitacao, fim: (e as unknown as Record<string, string | null>).fim_habilitacao },
    { fase: 'Recurso Habilitação', inicio: (e as unknown as Record<string, string | null>).inicio_recurso_habilitacao, fim: (e as unknown as Record<string, string | null>).fim_recurso_habilitacao },
  ].filter(item => item.inicio || item.fim)

  const cotaLabels: Record<string, string> = {
    pessoa_negra: 'Pessoas Negras',
    pessoa_indigena: 'Pessoas Indígenas',
    pessoa_pcd: 'Pessoas com Deficiência',
    areas_perifericas: 'Áreas Periféricas',
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/editais" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-[var(--brand-primary)] transition-colors mb-6 md:mb-8 group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Explorar outros Editais
      </Link>

      <div className="space-y-6 md:space-y-8">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--brand-primary)]" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] md:text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide bg-brand-primary/5 px-2 py-1 rounded-lg">
                  Edital {e.numero_edital}
                </span>
                <EditalStatusBadge status={e.status} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight max-w-2xl">
                {e.titulo}
              </h1>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {(e.inicio_inscricao || e.fim_inscricao) && (
            <div className="bg-white rounded-2xl md:rounded-2xl p-5 md:p-6 border border-slate-100 shadow-premium flex flex-col justify-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 uppercase tracking-wide">Abertura</p>
                  <p className="text-sm md:text-base font-semibold text-slate-900">
                    {e.inicio_inscricao ? format(new Date(e.inicio_inscricao), "dd 'de' MMMM", { locale: ptBR }) : 'A definir'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 uppercase tracking-wide">Encerramento</p>
                  <p className="text-sm md:text-base font-semibold text-slate-900">
                    {e.fim_inscricao ? format(new Date(e.fim_inscricao), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'A definir'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {e.descricao && (
            <div className="bg-[var(--brand-primary)] rounded-2xl md:rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <FileText className="h-16 w-16 md:h-20 md:w-20" />
              </div>
              <h3 className="text-[11px] md:text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 md:mb-3">Sobre o Processo</h3>
              <p className="text-white font-medium leading-relaxed italic relative z-10 text-xs md:text-sm line-clamp-4">
                {'"'}{e.descricao}{'"'}
              </p>
            </div>
          )}
        </div>

        {e.fim_inscricao && new Date(e.fim_inscricao).getTime() > new Date().getTime() && (
          <EditalCountdown deadline={e.fim_inscricao} />
        )}

        {/* Anexos para Download (Fase 1.9) */}
        {anexos && anexos.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl p-5 md:p-8 shadow-premium">
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-5">
              <div className="h-5 md:h-6 w-1 md:w-1.5 bg-pink-500 rounded-full" />
              Anexos para Download
            </h2>
            <div className="grid gap-2">
              {anexos.map((anexo: { id: string; nome: string; tipo_anexo: string; descricao?: string | null; nome_arquivo?: string; storage_path: string; tamanho_bytes?: number }) => {
                const tipoLabels: Record<string, string> = {
                  carta_anuencia: 'Carta de Anuência',
                  planilha_orcamentaria: 'Planilha Orçamentária',
                  cronograma: 'Cronograma',
                  termo_compromisso: 'Termo de Compromisso',
                  declaracao_etnico_racial: 'Declaração Étnico-Racial',
                  declaracao_pcd: 'Declaração PcD',
                  declaracao_coletivo: 'Declaração de Coletivo',
                  formulario_recurso: 'Formulário de Recurso',
                  modelo_projeto: 'Modelo de Projeto',
                  edital_completo: 'Edital Completo',
                  outros: 'Outros',
                }
                const bytes = anexo.tamanho_bytes || 0
                const sizeStr = bytes < 1024 * 1024
                  ? `${(bytes / 1024).toFixed(0)} KB`
                  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
                return (
                  <a
                    key={anexo.id}
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos/${anexo.storage_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-50 hover:border-pink-100 hover:shadow-md transition-all group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 group-hover:bg-pink-100 transition-colors flex-shrink-0">
                      <FileDown className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-pink-600 transition-colors">{anexo.nome}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{tipoLabels[anexo.tipo_anexo] || anexo.tipo_anexo}</span>
                        <span className="text-[11px] text-slate-300">{sizeStr}</span>
                      </div>
                      {anexo.descricao && <p className="text-xs text-slate-400 mt-0.5">{anexo.descricao}</p>}
                    </div>
                    <Paperclip className="h-4 w-4 text-slate-300 group-hover:text-pink-400 transition-colors flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {criterios && criterios.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl md:rounded-2xl p-5 md:p-8 shadow-premium">
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-5 md:mb-6">
              <div className="h-5 md:h-6 w-1 md:w-1.5 bg-purple-500 rounded-full" />
              Regras de Avaliação
            </h2>
            <div className="grid gap-3">
              {(criterios as Criterio[]).map((c, i) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl md:rounded-2xl bg-white border border-slate-50 hover:border-purple-100 hover:shadow-md transition-all group gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center font-semibold text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors text-xs md:text-xs text-center leading-none">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-700 text-xs md:text-sm">{c.descricao}</span>
                  </div>
                  <div className="flex items-center gap-4 ml-10 sm:ml-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Peso</p>
                      <p className="font-semibold text-slate-900 text-xs md:text-xs">{c.peso}x</p>
                    </div>
                    <div className="h-5 md:h-6 w-[1px] bg-slate-100" />
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Escala</p>
                      <p className="font-semibold text-slate-900 text-xs md:text-xs">{c.nota_minima} - {c.nota_maxima}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cronograma */}
        {cronograma.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl p-5 md:p-8 shadow-premium">
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-5">
              <div className="h-5 md:h-6 w-1 md:w-1.5 bg-emerald-500 rounded-full" />
              Cronograma
            </h2>
            <div className="space-y-3">
              {cronograma.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-50">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.fase}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-slate-600">
                      {item.inicio ? format(new Date(item.inicio), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                      {' → '}
                      {item.fim ? format(new Date(item.fim), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorias e Vagas */}
        {categorias && categorias.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl p-5 md:p-8 shadow-premium">
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-5">
              <div className="h-5 md:h-6 w-1 md:w-1.5 bg-indigo-500 rounded-full" />
              Categorias e Vagas
            </h2>
            <div className="grid gap-3">
              {categorias.map((cat: { id: string; nome: string; vagas: number }) => (
                <div key={cat.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-50">
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-900">{cat.nome}</span>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-600 border-none text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {cat.vagas} vaga{cat.vagas !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
            {cotas && cotas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-3">Cotas / Ações Afirmativas</p>
                <div className="flex flex-wrap gap-2">
                  {cotas.map((cota: { tipo_cota: string; vagas_fixas: number; percentual: number }, i: number) => (
                    <Badge key={i} className="bg-amber-50 text-amber-700 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
                      {cotaLabels[cota.tipo_cota] || cota.tipo_cota}: {cota.vagas_fixas > 0 ? `${cota.vagas_fixas} vagas` : `${cota.percentual}%`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comissão de Avaliação (Fase 2.4) */}
        {comissao && comissao.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl p-5 md:p-8 shadow-premium">
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-5">
              <div className="h-5 md:h-6 w-1 md:w-1.5 bg-amber-500 rounded-full" />
              Comissão de Avaliação
            </h2>
            <div className="space-y-2">
              {(['sociedade_civil', 'poder_executivo', 'suplente'] as const).map(tipo => {
                const membros = comissao.filter((m: { tipo: string; nome: string; qualificacao?: string; portaria_numero?: string }) => m.tipo === tipo)
                if (membros.length === 0) return null
                const tipoLabel: Record<string, string> = {
                  sociedade_civil: 'Sociedade Civil',
                  poder_executivo: 'Poder Executivo',
                  suplente: 'Suplentes',
                }
                return (
                  <div key={tipo}>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{tipoLabel[tipo]}</p>
                    <div className="grid gap-2 mb-3">
                      {membros.map((m: { tipo: string; nome: string; qualificacao?: string; portaria_numero?: string }, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-50">
                          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{m.nome}</p>
                            {m.qualificacao && <p className="text-xs text-slate-400">{m.qualificacao}</p>}
                          </div>
                          {m.portaria_numero && (
                            <Badge className="bg-slate-50 text-slate-400 border-none text-[10px] px-2 py-0.5 rounded-md">
                              {m.portaria_numero}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {erratas && erratas.length > 0 && (
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Erratas ({erratas.length})
            </h2>
            <div className="space-y-3">
              {erratas.map((errata: { id: string; numero_errata: number; descricao: string; campo_alterado?: string; valor_anterior?: string; valor_novo?: string; publicado_em: string }) => (
                <div key={errata.id} className="bg-white rounded-xl p-4 border border-amber-100 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700 border-none text-[11px] font-semibold px-2 py-0.5 rounded-md">
                      Errata #{errata.numero_errata}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(errata.publicado_em), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{errata.descricao}</p>
                  {errata.campo_alterado && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold">{errata.campo_alterado}:</span>
                      {errata.valor_anterior && <span className="line-through text-red-400">{errata.valor_anterior}</span>}
                      {errata.valor_anterior && errata.valor_novo && <ArrowRight className="h-3 w-3" />}
                      {errata.valor_novo && <span className="font-semibold text-green-600">{errata.valor_novo}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 pt-2 md:pt-4">
          {isOpen && (
            <Link href={`/projetos/novo?edital=${id}&tenant=${e.tenant_id}`} className="w-full sm:w-auto">
              <Button className="w-full h-11 px-8 rounded-xl md:rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold shadow-lg shadow-brand-primary/20 transition-all active:scale-98 text-xs md:text-sm uppercase tracking-wide">
                Inscrever meu Projeto
              </Button>
            </Link>
          )}
          <Link href={`/editais/${id}/inscritos`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 px-8 rounded-xl md:rounded-2xl border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-98 text-xs md:text-sm flex items-center justify-center gap-2 uppercase tracking-wide">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              Lista de Inscritos
            </Button>
          </Link>
          <Link href={`/editais/${id}/resultados`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 px-8 rounded-xl md:rounded-2xl border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-98 text-xs md:text-sm flex items-center justify-center gap-2 uppercase tracking-wide">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              Ver Resultados
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

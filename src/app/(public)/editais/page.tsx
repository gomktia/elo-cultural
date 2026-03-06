import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EditalCard } from '@/components/edital/EditalCard'
import type { Edital } from '@/types/database.types'
import { Scale, Calendar, Search, Archive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function EditaisPublicosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const { tab = 'abertos', q } = await searchParams
  const supabase = await createClient()
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value

  const isEncerrados = tab === 'encerrados'

  // Abertos: publicacao + inscricao
  // Encerrados: everything else (post-inscricao phases)
  const statusAbertos = ['publicacao', 'inscricao']
  const statusEncerrados = [
    'inscricao_encerrada', 'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
    'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
    'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
    'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
  ]

  let query = supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .in('status', isEncerrados ? statusEncerrados : statusAbertos)
    .order('created_at', { ascending: false })

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  if (q && q.trim()) {
    query = query.or(`titulo.ilike.%${q.trim()}%,numero_edital.ilike.%${q.trim()}%`)
  }

  const { data: editais } = await query

  // Count for both tabs
  let countAbertosQuery = supabase
    .from('editais')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
    .in('status', statusAbertos)
  let countEncerradosQuery = supabase
    .from('editais')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
    .in('status', statusEncerrados)

  if (tenantId) {
    countAbertosQuery = countAbertosQuery.eq('tenant_id', tenantId)
    countEncerradosQuery = countEncerradosQuery.eq('tenant_id', tenantId)
  }

  const [{ count: countAbertos }, { count: countEncerrados }] = await Promise.all([
    countAbertosQuery,
    countEncerradosQuery,
  ])

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden mb-6">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Editais</h1>
              <p className="text-sm text-slate-500">Descubra oportunidades para o seu projeto cultural.</p>
            </div>
            <div className="hidden md:block">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <Scale className="h-5 w-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <Link
            href="/editais?tab=abertos"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !isEncerrados
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            Abertos
            {countAbertos != null && (
              <Badge className="ml-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-[10px] px-1.5 py-0">
                {countAbertos}
              </Badge>
            )}
          </Link>
          <Link
            href="/editais?tab=encerrados"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isEncerrados
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            Encerrados
            {countEncerrados != null && (
              <Badge className="ml-1 bg-slate-200 text-slate-600 border-none text-[10px] px-1.5 py-0">
                {countEncerrados}
              </Badge>
            )}
          </Link>
        </div>

        {/* Search */}
        <form method="GET" action="/editais" className="w-full sm:w-auto">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por titulo ou numero..."
              className="w-full sm:w-72 h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
            />
          </div>
        </form>
      </div>

      {/* Results */}
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
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {q ? 'Nenhum resultado encontrado' : isEncerrados ? 'Nenhum edital encerrado' : 'Nenhum edital disponivel'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              {q
                ? `Nenhum edital corresponde a "${q}". Tente buscar com outros termos.`
                : isEncerrados
                  ? 'Ainda nao ha processos seletivos encerrados.'
                  : 'No momento nao ha processos de selecao abertos para novos projetos.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

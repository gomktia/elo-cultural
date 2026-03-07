import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EditalCard } from '@/components/edital/EditalCard'
import type { Edital } from '@/types/database.types'
import { ArrowRight, FileText } from 'lucide-react'
import SalesPage from './home/page'
import { HeroRobot } from '@/components/home/HeroRobot'

export default async function RootPage() {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value

  // No tenant → show sales/marketing page
  if (!tenantId) {
    return <SalesPage />
  }

  // Has tenant → show robot hero + editais
  const supabase = await createClient()

  let tenantName: string | null = null
  const { data: t } = await supabase.from('tenants').select('nome').eq('id', tenantId).single()
  tenantName = t?.nome || null

  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .in('status', ['publicacao', 'inscricao'])
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div>
      {/* ═══════════════════════════════════════
          HERO — Robot + tenant branding
          ═══════════════════════════════════════ */}
      <HeroRobot
        title={tenantName ? `${tenantName}` : 'Editais Culturais'}
        subtitle="Editais Culturais"
        description="Descubra oportunidades, envie seus projetos e acompanhe resultados de forma transparente."
        ctaLabel="Cadastrar-se"
        ctaHref="/cadastro"
        secondaryLabel="Ver Editais"
        secondaryHref="/editais"
        showBadges={false}
        compact
      />

      {/* ═══════════════════════════════════════
          EDITAIS EM DESTAQUE
          ═══════════════════════════════════════ */}
      <section className="bg-[#F8FAFC]">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
              Editais em Destaque
            </h2>
            <Button asChild variant="ghost" className="font-medium text-slate-500 hover:text-[var(--brand-primary)] group text-sm">
              <Link href="/editais">
                Ver todos os editais
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {editais && editais.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(editais as Edital[]).map(edital => (
                <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(var(--brand-rgb, 0,71,171), 0.06)' }}>
                <FileText className="h-6 w-6 text-[var(--brand-primary)]" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">Nenhum edital aberto no momento</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Novos editais são publicados periodicamente. Cadastre-se para receber notificações.
              </p>
              <Button asChild className="mt-5 rounded-xl" size="lg">
                <Link href="/cadastro">
                  Cadastrar-se
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

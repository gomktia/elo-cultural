import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Toaster } from '@/components/ui/sonner'
import { FooterLogo } from '@/components/layout/FooterLogo'
import type { UserRole, TenantTemaCores } from '@/types/database.types'

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = (profile?.role as UserRole) || 'proponente'

  // Staff: use profile.tenant_id. Global proponente: use cookie tenant (domain context).
  let tenant: { nome?: string; tema_cores?: unknown; logo_url?: string | null; logo_rodape_url?: string | null } | null = null
  if (profile?.tenant_id) {
    const { data } = await supabase
      .from('tenants')
      .select('nome, tema_cores, logo_url, logo_rodape_url')
      .eq('id', profile.tenant_id)
      .single()
    tenant = data
  } else if (role === 'proponente' || role === 'super_admin') {
    const { getTenantFromCookie } = await import('@/lib/tenant')
    tenant = await getTenantFromCookie()
  }
  const isSuperAdmin = role === 'super_admin'
  const pendingApproval = !isSuperAdmin && (role === 'avaliador' || role === 'gestor') && profile?.aprovado === false
  const userName = profile?.nome || user.email || 'Usuario'
  const userEmail = user.email || ''
  const tenantName = isSuperAdmin ? 'Elo Cultural' : tenant?.nome
  const tenantLogoUrl = isSuperAdmin ? null : tenant?.logo_url || null
  const tenantRodapeUrl = isSuperAdmin ? null : tenant?.logo_rodape_url || null
  const temaCores = isSuperAdmin ? null : (tenant?.tema_cores as TenantTemaCores | null)
  const brandColor = temaCores?.primary || '#0047AB'
  const brandSecondary = temaCores?.secondary || '#E91E63'
  const brandRgb = hexToRgb(brandColor)

  return (
    <>
      {/* Inject brand CSS vars at :root so Radix portals (Sheet, Dialog, DropdownMenu) inherit them */}
      <style>{`:root { --brand-primary: ${brandColor}; --brand-secondary: ${brandSecondary}; --brand-rgb: ${brandRgb}; }`}</style>
      <div
        style={{
          ['--brand-primary' as string]: brandColor,
          ['--brand-secondary' as string]: brandSecondary,
          ['--brand-rgb' as string]: brandRgb,
        }}
        className="min-h-screen bg-[var(--background)]"
      >
      <SidebarProvider>
        <AppSidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          tenantName={tenantName}
          brandColor={brandColor}
          tenantLogoUrl={tenantLogoUrl}
        />
        <SidebarInset className="bg-transparent">
          <main className="flex-1 px-4 py-4 md:px-8 lg:px-10 md:py-6">
            <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
              {pendingApproval ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="h-20 w-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <h2 className="text-lg font-bold text-slate-900">Conta pendente de aprovação</h2>
                    <p className="text-sm text-slate-500">
                      Seu cadastro como <strong className="text-amber-700">{role}</strong> está aguardando aprovação de um administrador.
                      Você receberá acesso completo às funcionalidades assim que sua conta for aprovada.
                    </p>
                  </div>
                </div>
              ) : children}
            </div>
          </main>
          {tenantRodapeUrl && (
            <footer className="border-t border-slate-100 dark:border-white/5 px-5 py-4 flex items-center justify-center">
              <FooterLogo src={tenantRodapeUrl} />
            </footer>
          )}
        </SidebarInset>
        <Toaster richColors closeButton position="bottom-right" />
      </SidebarProvider>
    </div>
    </>
  )
}

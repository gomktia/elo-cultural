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

  const { data: tenant } = profile?.tenant_id
    ? await supabase
      .from('tenants')
      .select('nome, tema_cores, logo_url, logo_rodape_url')
      .eq('id', profile.tenant_id)
      .single()
    : { data: null }

  const role = (profile?.role as UserRole) || 'proponente'
  const isSuperAdmin = role === 'super_admin'
  const userName = profile?.nome || user.email || 'Usuario'
  const userEmail = user.email || ''
  const tenantName = isSuperAdmin ? 'Elo Cultural' : tenant?.nome
  const tenantLogoUrl = isSuperAdmin ? null : (tenant as any)?.logo_url || null
  const tenantRodapeUrl = isSuperAdmin ? null : (tenant as any)?.logo_rodape_url || null
  const temaCores = tenant?.tema_cores as TenantTemaCores | null
  const brandColor = temaCores?.primary || '#0047AB'
  const brandSecondary = temaCores?.secondary || '#E91E63'
  const brandRgb = hexToRgb(brandColor)

  return (
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
              {children}
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
  )
}

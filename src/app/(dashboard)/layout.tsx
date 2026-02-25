import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { TenantHeader } from '@/components/layout/TenantHeader'
import { Toaster } from '@/components/ui/sonner'
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
  const userName = profile?.nome || user.email || 'Usuario'
  const userEmail = user.email || ''
  const tenantName = tenant?.nome
  const tenantLogoUrl = (tenant as any)?.logo_url || null
  const tenantRodapeUrl = (tenant as any)?.logo_rodape_url || null
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
          <TenantHeader tenantName={tenantName} brandColor={brandColor} userName={userName} userRole={role} />
          <main className="flex-1 px-4 py-6 md:px-8 lg:px-10 md:py-8 relative">
            <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />
            <div className="relative z-10 w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
              {children}
            </div>
          </main>
          {tenantRodapeUrl && (
            <footer className="border-t border-slate-100 dark:border-white/5 px-5 py-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tenantRodapeUrl}
                alt="Governo"
                className="h-10 w-auto opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </footer>
          )}
        </SidebarInset>
        <Toaster richColors closeButton position="bottom-right" />
      </SidebarProvider>
    </div>
  )
}

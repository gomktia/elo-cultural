import type { Metadata } from 'next'
import { getTenantFromCookie, getTenantBrand, brandCssVars } from '@/lib/tenant'
import { TenantProvider } from '@/components/TenantProvider'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromCookie()
  const name = tenant?.nome || 'Elo Cultural'
  return {
    title: `${name} - Acesso`,
  }
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantFromCookie()
  const brand = getTenantBrand(tenant)
  const cssVars = brandCssVars(brand)

  return (
    <div className="min-h-screen" style={cssVars}>
      <TenantProvider name={tenant?.nome || null} logoUrl={(tenant as unknown as { logo_url?: string })?.logo_url || null}>
        {children}
      </TenantProvider>
    </div>
  )
}

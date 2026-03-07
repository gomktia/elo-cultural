import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { TenantTemaCores } from '@/types/database.types'

export interface TenantCookieData {
  nome: string
  tema_cores: TenantTemaCores | null
  logo_url: string | null
  logo_rodape_url: string | null
  whatsapp_suporte: string | null
  email_suporte: string | null
  site_url: string | null
}

export function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export async function getTenantFromCookie(): Promise<TenantCookieData | null> {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value
  if (!tenantId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('nome, tema_cores, logo_url, logo_rodape_url, whatsapp_suporte, email_suporte, site_url')
    .eq('id', tenantId)
    .single()

  return data as unknown as TenantCookieData | null
}

export function getTenantBrand(tenant: TenantCookieData | null) {
  const temaCores = tenant?.tema_cores
  const brandColor = temaCores?.primary || '#0047AB'
  const brandSecondary = temaCores?.secondary || '#E91E63'
  const brandRgb = hexToRgb(brandColor)
  const logoSrc = tenant?.logo_url || '/icon-192.png'
  const brandName = tenant?.nome || 'EloCultural'

  return { brandColor, brandSecondary, brandRgb, logoSrc, brandName }
}

export function brandCssVars(brand: ReturnType<typeof getTenantBrand>) {
  return {
    ['--brand-primary' as string]: brand.brandColor,
    ['--brand-secondary' as string]: brand.brandSecondary,
    ['--brand-rgb' as string]: brand.brandRgb,
  }
}

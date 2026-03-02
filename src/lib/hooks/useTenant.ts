'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractSubdomain } from '@/lib/utils/domain'
import type { Tenant } from '@/types/database.types'

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTenant() {
      // Get slug from cookie or extract from hostname
      const slug = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenant_slug='))
        ?.split('=')[1] || extractSubdomain(window.location.hostname)

      // Root domain or no tenant → return null
      if (!slug) {
        setTenant(null)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('dominio', slug)
        .eq('status', 'ativo')
        .single()

      setTenant(data)
      setLoading(false)
    }

    fetchTenant()
  }, [])

  return { tenant, loading }
}

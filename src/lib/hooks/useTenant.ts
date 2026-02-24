'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/types/database.types'

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTenant() {
      const supabase = createClient()

      // Get tenant domain from cookie or hostname
      const domain = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenant_domain='))
        ?.split('=')[1] || window.location.hostname

      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('dominio', domain)
        .eq('status', 'ativo')
        .single()

      setTenant(data)
      setLoading(false)
    }

    fetchTenant()
  }, [])

  return { tenant, loading }
}

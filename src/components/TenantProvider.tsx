'use client'

import { createContext, useContext } from 'react'

type TenantInfo = {
  name: string | null
  logoUrl: string | null
}

const TenantContext = createContext<TenantInfo>({ name: null, logoUrl: null })

export function TenantProvider({
  name,
  logoUrl,
  children,
}: TenantInfo & { children: React.ReactNode }) {
  return (
    <TenantContext.Provider value={{ name, logoUrl }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}

'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

interface TenantHeaderProps {
  tenantName?: string
}

export function TenantHeader({ tenantName }: TenantHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-slate-200 bg-white px-5 md:px-6"
      style={{ height: 64 }}
    >
      {/* Left: Trigger + Tenant Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all" />

        {tenantName && (
          <span className="text-sm text-slate-400 font-medium truncate hidden sm:block max-w-[240px]">
            {tenantName}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Notificacoes"
              onClick={() => toast.info('Notificacoes em breve!')}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--brand-secondary)] ring-2 ring-white dark:ring-[#121218]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Notificacoes</TooltipContent>
        </Tooltip>

      </div>
    </header>
  )
}

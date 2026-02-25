'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bell, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface TenantHeaderProps {
  tenantName?: string
}

const pageTitles: Record<string, string> = {
  '/': 'Inicio',
  '/projetos': 'Meus Projetos',
  '/editais': 'Editais Abertos',
  '/perfil': 'Meu Perfil',
  '/avaliacao': 'Projetos Atribuidos',
  '/gestor': 'Dashboard',
  '/gestor/relatorios': 'Relatorios',
  '/gestor/rankings': 'Rankings',
  '/admin/editais': 'Editais',
  '/admin/usuarios': 'Usuarios',
  '/admin/avaliadores': 'Avaliadores',
  '/admin/auditoria': 'Auditoria',
  '/admin/configuracoes': 'Configuracoes',
  '/super/tenants': 'Tenants',
  '/super/dashboard': 'Visao Global',
  '/super/usuarios': 'Todos Usuarios',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const match = Object.entries(pageTitles).find(
    ([path]) => path !== '/' && pathname.startsWith(path)
  )
  return match ? match[1] : 'Inicio'
}

export function TenantHeader({ tenantName }: TenantHeaderProps) {
  const pathname = usePathname()

  const pageTitle = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl px-5 md:px-6"
      style={{ height: 80 }}
    >
      {/* Left: Trigger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all" />

        <div className="flex items-center gap-2 min-w-0">
          {tenantName && (
            <>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-medium truncate hidden sm:block max-w-[180px]">
                {tenantName}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0 hidden sm:block" />
            </>
          )}
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
            {pageTitle}
          </h1>
        </div>
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

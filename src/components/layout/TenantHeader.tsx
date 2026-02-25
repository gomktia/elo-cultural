'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bell, User, LogOut } from 'lucide-react'
import { toast } from 'sonner'

interface TenantHeaderProps {
  tenantName?: string
  brandColor?: string
  userName?: string
  userRole?: string
}

const roleLabels: Record<string, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Administrador',
  super_admin: 'Super Admin',
}

export function TenantHeader({ tenantName, brandColor, userName, userRole }: TenantHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (userName || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 glass px-4 md:px-5">
      <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all" />
      <Separator orientation="vertical" className="h-4 bg-slate-200/50 dark:bg-white/10" />

      <div className="flex-1 min-w-0">
        {tenantName && (
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] truncate">
            {tenantName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-slate-200/60 dark:border-white/10 text-slate-400 dark:text-slate-500 hidden sm:inline-flex rounded-lg px-2 py-0.5"
        >
          v0.1.0
        </Badge>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Notificacoes"
              onClick={() => toast.info('Notificacoes em breve!')}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--brand-secondary)] shadow-[0_0_6px_rgba(var(--brand-secondary-rgb),0.5)]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Notificacoes</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white text-[11px] font-bold shadow-sm flex-shrink-0"
                style={{ backgroundColor: brandColor || 'var(--brand-primary)' }}
              >
                {initials}
              </div>
              {userName && (
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight truncate max-w-[120px]">
                    {userName.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
                    {roleLabels[userRole || ''] || userRole}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-xl shadow-premium border-slate-100 backdrop-blur-xl bg-white/95">
            <DropdownMenuItem
              onClick={() => router.push('/perfil')}
              className="rounded-lg py-2.5 px-3 font-semibold text-sm text-slate-600 hover:text-slate-900 focus:bg-slate-50 transition-colors cursor-pointer group"
            >
              <User className="mr-2 h-4 w-4 text-slate-400 group-hover:text-[var(--brand-primary)]" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 mx-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg py-2.5 px-3 font-semibold text-sm text-destructive hover:bg-destructive/5 focus:bg-destructive/5 transition-colors cursor-pointer group"
            >
              <LogOut className="mr-2 h-4 w-4 text-destructive/40 group-hover:text-destructive" />
              Encerrar Sessao
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

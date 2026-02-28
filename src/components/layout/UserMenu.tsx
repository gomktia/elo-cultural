'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { ChevronsUpDown, LogOut, User } from 'lucide-react'
import type { UserRole } from '@/types/database.types'

const roleLabels: Record<UserRole, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Administrador',
  super_admin: 'Super Admin',
}

interface UserMenuProps {
  userName: string
  userEmail: string
  role: UserRole
}

export function UserMenu({ userName, userEmail, role }: UserMenuProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="h-14 w-full rounded-xl bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/10 hover:border-[var(--brand-primary)]/20 group transition-all duration-200 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none"
        >
          <Avatar className="h-9 w-9 ring-2 ring-[var(--brand-primary)]/20 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:ring-1">
            <AvatarFallback className="bg-[var(--brand-primary)] text-white font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 text-left leading-tight ml-2 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {userName}
            </span>
            <span className="text-[11px] font-medium text-[var(--brand-primary)] truncate">
              {roleLabels[role]}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-300 group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="p-0 rounded-xl shadow-lg border-slate-200 bg-white overflow-hidden" style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}>
        {/* User info header */}
        <div className="bg-[var(--brand-primary)] px-3 py-3">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-[11px] text-white/60 truncate mt-0.5">{userEmail}</p>
        </div>

        {/* Menu items */}
        <div className="p-1">
          <DropdownMenuItem
            onClick={() => router.push('/perfil')}
            className="rounded-lg py-2 px-3 font-medium text-sm text-slate-600 hover:text-[var(--brand-primary)] focus:bg-[var(--brand-primary)]/5 transition-colors cursor-pointer group"
          >
            <User className="mr-2 h-4 w-4 text-slate-400 group-hover:text-[var(--brand-primary)] transition-colors" />
            Meu Perfil
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 mx-1.5" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="rounded-lg py-2 px-3 font-medium text-sm text-red-500 hover:text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors cursor-pointer group"
          >
            <LogOut className="mr-2 h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
            Encerrar Sessão
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
        <SidebarMenuButton size="lg" className="h-12 w-full rounded-xl hover:bg-white/[0.08] group transition-all duration-200 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto">
          <Avatar className="h-8 w-8 border border-white/20 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
            <AvatarFallback className="bg-[var(--brand-primary)] text-white font-bold text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 text-left leading-tight ml-2 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-white truncate">
              {userName}
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
              {roleLabels[role]}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-500 group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-[240px] p-2 rounded-xl shadow-premium border-slate-100 backdrop-blur-xl bg-white/95">
        <div className="px-3 py-2.5 mb-1 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Logado como</p>
          <p className="text-sm font-bold text-slate-900 truncate">{userEmail}</p>
        </div>

        <DropdownMenuItem
          onClick={() => router.push('/perfil')}
          className="rounded-lg py-2.5 px-3 font-semibold text-sm text-slate-600 hover:text-slate-900 focus:bg-slate-50 transition-colors cursor-pointer group"
        >
          <User className="mr-2.5 h-4 w-4 text-slate-400 group-hover:text-[var(--brand-primary)]" />
          Meu Perfil
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100 mx-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-lg py-2.5 px-3 font-semibold text-sm text-destructive hover:bg-destructive/5 focus:bg-destructive/5 transition-colors cursor-pointer group"
        >
          <LogOut className="mr-2.5 h-4 w-4 text-destructive/40 group-hover:text-destructive" />
          Encerrar Sessao
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

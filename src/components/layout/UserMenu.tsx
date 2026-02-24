'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { ChevronsUpDown, LogOut, User } from 'lucide-react'
import type { UserRole } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'

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
        <SidebarMenuButton size="lg" className="h-14 w-full rounded-[20px] hover:bg-slate-900 group transition-all duration-300 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto">
          <Avatar className="h-10 w-10 border-2 border-slate-100 group-hover:border-slate-800 transition-colors group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <AvatarFallback className="bg-slate-900 text-white font-black text-xs group-hover:bg-[var(--brand-primary)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 text-left leading-tight ml-2 group-data-[collapsible=icon]:hidden transition-all">
            <span className="text-sm font-black text-slate-900 group-hover:text-white truncate transition-colors">
              {userName}
            </span>
            <span className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-widest truncate transition-colors">
              {roleLabels[role]}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 text-slate-400 group-hover:text-white transition-colors group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] p-2 rounded-[28px] shadow-premium border-slate-100 backdrop-blur-xl bg-white/95 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="px-4 py-3 mb-2 border-b border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Logado como</p>
          <p className="text-sm font-black text-slate-900 truncate">{userEmail}</p>
        </div>

        <DropdownMenuItem
          onClick={() => router.push('/perfil')}
          className="rounded-xl py-3 px-4 font-black text-sm text-slate-600 hover:text-slate-900 focus:bg-slate-50 transition-colors cursor-pointer group"
        >
          <User className="mr-3 h-5 w-5 text-slate-400 group-hover:text-brand-primary" />
          Meu Perfil
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-50 mx-2" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-xl py-3 px-4 font-black text-sm text-destructive hover:bg-destructive/5 focus:bg-destructive/5 transition-colors cursor-pointer group"
        >
          <LogOut className="mr-3 h-5 w-5 text-destructive/40 group-hover:text-destructive" />
          Encerrar Sessão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

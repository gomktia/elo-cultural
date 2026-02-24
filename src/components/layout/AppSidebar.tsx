'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { UserMenu } from './UserMenu'
import type { UserRole } from '@/types/database.types'
import {
  Home, FolderOpen, FileText, Users, BarChart3,
  ClipboardList, Shield, Settings, Trophy, Search,
  Building2, Globe,
} from 'lucide-react'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const navByRole: Record<UserRole, NavItem[]> = {
  proponente: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Meus Projetos', url: '/projetos', icon: FolderOpen },
    { title: 'Editais Abertos', url: '/editais', icon: Search },
    { title: 'Meu Perfil', url: '/perfil', icon: Users },
  ],
  avaliador: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Projetos Atribuidos', url: '/avaliacao', icon: ClipboardList },
    { title: 'Meu Perfil', url: '/perfil', icon: Users },
  ],
  gestor: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Dashboard', url: '/gestor', icon: BarChart3 },
    { title: 'Relatorios', url: '/gestor/relatorios', icon: FileText },
    { title: 'Rankings', url: '/gestor/rankings', icon: Trophy },
  ],
  admin: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Editais', url: '/admin/editais', icon: FileText },
    { title: 'Usuarios', url: '/admin/usuarios', icon: Users },
    { title: 'Avaliadores', url: '/admin/avaliadores', icon: ClipboardList },
    { title: 'Relatorios', url: '/gestor/relatorios', icon: BarChart3 },
    { title: 'Auditoria', url: '/admin/auditoria', icon: Shield },
    { title: 'Configuracoes', url: '/admin/configuracoes', icon: Settings },
  ],
  super_admin: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Tenants', url: '/super/tenants', icon: Building2 },
    { title: 'Visao Global', url: '/super/dashboard', icon: Globe },
    { title: 'Todos Usuarios', url: '/super/usuarios', icon: Users },
    { title: 'Auditoria', url: '/admin/auditoria', icon: Shield },
    { title: 'Configuracoes', url: '/admin/configuracoes', icon: Settings },
  ],
}

interface AppSidebarProps {
  role: UserRole
  userName: string
  userEmail: string
  tenantName?: string
  brandColor?: string
  tenantLogoUrl?: string | null
}

export function AppSidebar({ role, userName, userEmail, tenantName, brandColor, tenantLogoUrl }: AppSidebarProps) {
  const pathname = usePathname()
  const items = navByRole[role] || navByRole.proponente

  return (
    <Sidebar collapsible="icon" className="border-none bg-transparent">
      <div className="flex h-full flex-col glass-sidebar">
        <SidebarHeader className="px-5 py-7 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
          <div className="flex items-center gap-3.5 group-data-[collapsible=icon]:justify-center">
            <Image
              src={tenantLogoUrl || '/icon-192.png'}
              alt="Elo Cultura"
              width={44}
              height={44}
              className="flex-shrink-0 rounded-full bg-white/80 dark:bg-white/10 p-1.5 shadow-lg shadow-black/5 ring-1 ring-slate-200/50 dark:ring-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-1"
            />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden transition-all">
              <p className="truncate text-base font-[800] tracking-[-0.02em] text-slate-900 dark:text-white leading-tight">
                {tenantName || 'Elo Cultura'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-success)] shadow-[0_0_8px_rgba(0,200,83,0.5)]" />
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-[0.15em]">Painel de Gestao</p>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-2 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroup className="group-data-[collapsible=icon]:p-1">
            <SidebarGroupLabel className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400/60 dark:text-slate-600 px-4 mb-3 group-data-[collapsible=icon]:hidden">
              Navegacao
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {items.map(item => {
                  const isActive = pathname === item.url ||
                    (item.url !== '/' && pathname.startsWith(item.url))

                  const isExactlyActive = (item.title === 'Dashboard' || item.title === 'Inicio' ? pathname === item.url : isActive)

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={[
                            'flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 group relative overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0',
                            isExactlyActive
                              ? 'bg-[var(--brand-primary)] text-white shadow-glow-primary'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:shadow-sm',
                          ].join(' ')}
                        >
                          <item.icon className={[
                            'h-[18px] w-[18px] flex-shrink-0 transition-all duration-200',
                            isExactlyActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                          ].join(' ')} />
                          <span className="relative z-10 tracking-[-0.01em] group-data-[collapsible=icon]:hidden truncate opacity-100 group-data-[collapsible=icon]:opacity-0 transition-opacity">
                            {item.title}
                          </span>

                          {isExactlyActive && (
                            <motion.div
                              layoutId="active-nav-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white/40 rounded-full group-data-[collapsible=icon]:hidden"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-1.5">
          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-0.5 border border-slate-200/40 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-none">
            <UserMenu userName={userName} userEmail={userEmail} role={role} />
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}

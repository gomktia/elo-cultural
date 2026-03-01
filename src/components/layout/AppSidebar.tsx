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
  useSidebar,
} from '@/components/ui/sidebar'
import { UserMenu } from './UserMenu'
import { NotificationBell } from './NotificationBell'
import type { UserRole } from '@/types/database.types'
import {
  Home, FolderOpen, FileText, Users, BarChart3,
  ClipboardList, Shield, Settings, Trophy, Search,
  Building2, Globe, FileCheck, ChevronsLeft,
} from 'lucide-react'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const navByRole: Record<UserRole, NavItem[]> = {
  proponente: [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Meus Projetos', url: '/projetos', icon: FolderOpen },
    { title: 'Editais Abertos', url: '/editais', icon: Search },
    { title: 'Meu Perfil', url: '/perfil', icon: Users },
  ],
  avaliador: [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Projetos Atribuídos', url: '/avaliacao', icon: ClipboardList },
    { title: 'Meu Perfil', url: '/perfil', icon: Users },
  ],
  gestor: [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Dashboard', url: '/gestor', icon: BarChart3 },
    { title: 'Relatórios', url: '/gestor/relatorios', icon: FileText },
    { title: 'Rankings', url: '/gestor/rankings', icon: Trophy },
    { title: 'Prestação Contas', url: '/gestor/prestacao-contas', icon: FileCheck },
  ],
  admin: [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Editais', url: '/admin/editais', icon: FileText },
    { title: 'Usuários', url: '/admin/usuarios', icon: Users },
    { title: 'Avaliadores', url: '/admin/avaliadores', icon: ClipboardList },
    { title: 'Auditoria', url: '/admin/auditoria', icon: Shield },
    { title: 'Configurações', url: '/admin/configuracoes', icon: Settings },
  ],
  super_admin: [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Tenants', url: '/super/tenants', icon: Building2 },
    { title: 'Visão Global', url: '/super/dashboard', icon: Globe },
    { title: 'Todos Usuários', url: '/super/usuarios', icon: Users },
    { title: 'Auditoria', url: '/admin/auditoria', icon: Shield },
    { title: 'Configurações', url: '/super/configuracoes', icon: Settings },
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

function CollapseButton() {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div className="relative mx-4 my-2 group-data-[collapsible=icon]:mx-2">
      <div className="h-px bg-slate-200/80" />
      <button
        onClick={toggleSidebar}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-md bg-white border border-slate-200 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 hover:border-[var(--brand-primary)]/30 transition-all shadow-sm flex items-center justify-center"
        title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
      >
        <ChevronsLeft className={`h-3.5 w-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

export function AppSidebar({ role, userName, userEmail, tenantName, brandColor, tenantLogoUrl }: AppSidebarProps) {
  const pathname = usePathname()
  const items = navByRole[role] || navByRole.proponente

  return (
    <Sidebar collapsible="icon" className="border-none bg-transparent">
      <div className="flex h-full flex-col sidebar-light">
        {/* Header with Logo */}
        <SidebarHeader className="px-4 pt-5 pb-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Image
              src={tenantLogoUrl || '/icon-192.png'}
              alt="Elo Cultura"
              width={40}
              height={40}
              className="rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200 object-contain transition-all flex-shrink-0 aspect-square w-10 h-10 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
            />
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-700">
                {tenantName || 'Elo Cultura'}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Ativo</span>
              </div>
            </div>
          </div>
        </SidebarHeader>

        {/* Separator with Collapse trigger centered on line */}
        <CollapseButton />

        {/* Navigation */}
        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroup className="group-data-[collapsible=icon]:p-1">
            <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-3 mb-2 group-data-[collapsible=icon]:hidden">
              Menu
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
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0',
                            isExactlyActive
                              ? 'sidebar-item-active text-[var(--brand-primary)] font-semibold'
                              : 'text-slate-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10',
                          ].join(' ')}
                        >
                          {/* Active indicator bar */}
                          {isExactlyActive && (
                            <motion.div
                              layoutId="active-nav-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--brand-primary)] group-data-[collapsible=icon]:hidden"
                              initial={{ opacity: 0, scaleY: 0.5 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}

                          <item.icon className={[
                            'h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200',
                            isExactlyActive ? 'text-[var(--brand-primary)]' : 'text-slate-400 group-hover:text-[var(--brand-primary)]'
                          ].join(' ')} />
                          <span className="relative z-10 tracking-[-0.01em] group-data-[collapsible=icon]:hidden truncate">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer - Notifications + User Menu */}
        <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-1.5 mt-auto">
          <div className="border-t border-slate-100 pt-3 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:pt-0 space-y-2">
            <NotificationBell />
            <UserMenu userName={userName} userEmail={userEmail} role={role} />
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}

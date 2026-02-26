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
  Building2, Globe, FileCheck,
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
    { title: 'Prestacao Contas', url: '/gestor/prestacao-contas', icon: FileCheck },
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
      <div className="flex h-full flex-col sidebar-light">
        {/* Header with Logo */}
        <SidebarHeader className="flex items-center px-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center" style={{ height: 64 }}>
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex-shrink-0 flex items-center justify-center">
              <Image
                src={tenantLogoUrl || '/icon-192.png'}
                alt="Elo Cultura"
                width={36}
                height={36}
                className="rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200 object-contain transition-all group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
              />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900 leading-tight">
                {tenantName || 'Elo Cultura'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Sistema Ativo</p>
              </div>
            </div>
          </div>
        </SidebarHeader>

        {/* Separator */}
        <div className="mx-4 h-px bg-slate-100 group-data-[collapsible=icon]:mx-2" />

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

        {/* Footer - User Menu */}
        <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-1.5 mt-auto">
          <div className="border-t border-slate-100 pt-3 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:pt-0">
            <UserMenu userName={userName} userEmail={userEmail} role={role} />
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}

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
      <div className="flex h-full flex-col sidebar-navy">
        {/* Header with Logo */}
        <SidebarHeader className="px-5 pt-6 pb-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-4 group-data-[collapsible=icon]:pb-3">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex-shrink-0 flex items-center justify-center">
              <Image
                src={tenantLogoUrl || '/icon-192.png'}
                alt="Elo Cultura"
                width={40}
                height={40}
                className="rounded-xl bg-white p-1 shadow-lg shadow-black/20 ring-1 ring-white/20 transition-all group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
              />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-[15px] font-[800] tracking-[-0.02em] text-white leading-tight">
                {tenantName || 'Elo Cultura'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.12em]">Sistema Ativo</p>
              </div>
            </div>
          </div>
        </SidebarHeader>

        {/* Separator */}
        <div className="mx-4 h-px bg-white/[0.06] group-data-[collapsible=icon]:mx-2" />

        {/* Navigation */}
        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroup className="group-data-[collapsible=icon]:p-1">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 px-3 mb-2 group-data-[collapsible=icon]:hidden">
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
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 relative group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0',
                            isExactlyActive
                              ? 'sidebar-item-active text-white'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]',
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
                            isExactlyActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
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
          <div className="border-t border-white/[0.06] pt-3 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:pt-0">
            <UserMenu userName={userName} userEmail={userEmail} role={role} />
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}

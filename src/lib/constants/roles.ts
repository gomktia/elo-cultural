import type { UserRole } from '@/types/database.types'

export const ROLE_LABELS: Record<UserRole, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Administrador',
  super_admin: 'Super Admin',
}

/** Roles that can manage editais, users, habilitação, ranking — full admin access */
export const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin']

/** Roles that can view reports, rankings, and analyze prestação de contas */
export const GESTAO_ROLES: UserRole[] = ['admin', 'gestor', 'super_admin']

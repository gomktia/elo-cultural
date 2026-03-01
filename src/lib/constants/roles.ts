import type { UserRole } from '@/types/database.types'

export const ROLE_LABELS: Record<UserRole, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Administrador',
  super_admin: 'Super Admin',
}

/** Roles that can access admin/gestor features */
export const ADMIN_ROLES: UserRole[] = ['admin', 'gestor', 'super_admin']

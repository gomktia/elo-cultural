import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database.types'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role as UserRole) || 'proponente'

  switch (role) {
    case 'super_admin':
      redirect('/super/dashboard')
    case 'admin':
      redirect('/admin/editais')
    case 'gestor':
      redirect('/gestor')
    case 'avaliador':
      redirect('/avaliacao')
    case 'proponente':
    default:
      redirect('/projetos')
  }
}

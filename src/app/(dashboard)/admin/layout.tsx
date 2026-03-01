import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_ROLES = ['admin', 'gestor', 'super_admin']

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}

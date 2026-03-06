import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GESTAO_ROLES } from '@/lib/constants/roles'

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

  if (!profile || !GESTAO_ROLES.includes(profile.role as typeof GESTAO_ROLES[number])) {
    redirect('/dashboard')
  }

  return <>{children}</>
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { UserRole } from '@/types/database.types'

const roleLabels: Record<string, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Administrador',
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  admin: 'destructive',
  gestor: 'default',
  avaliador: 'secondary',
  proponente: 'outline',
}

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<string>('proponente')

  useEffect(() => {
    loadUsuarios()
  }, [])

  async function loadUsuarios() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user!.id)
      .single()

    setMyRole(myProfile?.role || 'proponente')

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', myProfile!.tenant_id)
      .order('created_at', { ascending: false })

    setUsuarios(data || [])
    setLoading(false)
  }

  const canEditRoles = myRole === 'admin' || myRole === 'super_admin'

  async function alterarRole(userId: string, novoRole: UserRole) {
    setAtualizando(userId)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role: novoRole })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao alterar função: ' + error.message)
    } else {
      toast.success('Função atualizada com sucesso')
      setUsuarios(prev =>
        prev.map(u => u.id === userId ? { ...u, role: novoRole } : u)
      )
    }
    setAtualizando(null)
  }

  const filtrados = usuarios.filter(u =>
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.cpf_cnpj?.includes(busca)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">Usuários</h1>
          <p className="text-sm text-slate-500 font-normal">Controle de acessos e permissões do sistema.</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[var(--brand-primary)] transition-colors" />
          <input
            className="w-full h-10 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] outline-none transition-all"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtrados.map(u => (
          <div key={u.id} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-2xl" />
            <div className="relative p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/5 transition-colors overflow-hidden font-bold text-base">
                    {u.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">
                      {u.nome}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-400">{u.cpf_cnpj || 'Sem CPF/CNPJ'}</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-slate-200" />
                      <Badge className={`${u.active ? 'bg-green-50 text-[var(--brand-success)]' : 'bg-slate-50 text-slate-400'} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {canEditRoles ? (
                      atualizando === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={v => alterarRole(u.id, v as UserRole)}
                        >
                          <SelectTrigger className="h-8 w-32 rounded-lg border-slate-200 bg-slate-50/50 font-medium text-xs text-slate-500 hover:text-slate-900 hover:border-slate-200 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                            <SelectItem value="proponente" className="font-medium text-xs">Proponente</SelectItem>
                            <SelectItem value="avaliador" className="font-medium text-xs text-indigo-600">Avaliador</SelectItem>
                            <SelectItem value="gestor" className="font-medium text-xs text-[var(--brand-primary)]">Gestor</SelectItem>
                            <SelectItem value="admin" className="font-medium text-xs text-rose-600">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )
                    ) : (
                      <Badge variant={roleBadgeVariant[u.role] || 'outline'} className="rounded-lg px-3 py-1 text-[11px] font-medium uppercase tracking-wide">
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Telefone</p>
                    <p className="text-xs font-medium text-slate-600">{u.telefone || '—'}</p>
                  </div>
                  <div className="w-px h-5 bg-slate-100" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Cadastro</p>
                    <p className="text-xs font-medium text-slate-600">{new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <Link href={`/admin/usuarios/${u.id}`}>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-[var(--brand-primary)] hover:bg-brand-primary/5 transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-slate-100" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Nenhum usuário encontrado</h3>
            <p className="text-sm text-slate-500 max-w-xs font-normal">Não encontramos perfis para os termos de busca utilizados.</p>
          </div>
        )}
      </div>
    </div>
  )
}

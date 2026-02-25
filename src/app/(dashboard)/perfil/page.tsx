'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, User, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

const roleLabels: Record<string, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Administrador',
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ nome: '', telefone: '', cpf_cnpj: '' })
  const [senha, setSenha] = useState({ nova: '', confirmar: '' })
  const [alterandoSenha, setAlterandoSenha] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
      setProfile(prof)
      setForm({
        nome: prof?.nome || '',
        telefone: prof?.telefone || '',
        cpf_cnpj: prof?.cpf_cnpj || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ nome: form.nome, telefone: form.telefone || null, cpf_cnpj: form.cpf_cnpj || null })
      .eq('id', user!.id)
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
    } else {
      toast.success('Perfil atualizado com sucesso')
    }
    setSaving(false)
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha.nova !== senha.confirmar) {
      toast.error('As senhas nao coincidem.')
      return
    }
    setAlterandoSenha(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha.nova })
    if (error) {
      toast.error('Erro ao alterar senha: ' + error.message)
    } else {
      toast.success('Senha alterada com sucesso')
      setSenha({ nova: '', confirmar: '' })
    }
    setAlterandoSenha(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center gap-4 pb-6 border-b border-slate-200">
        <img
          src="/icon-192.png"
          alt="Logo"
          className="h-16 w-16 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200 object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meu Perfil</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className="text-[11px] font-medium uppercase tracking-wide rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none">
              {roleLabels[profile?.role] || profile?.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Dados Pessoais</h2>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={salvarPerfil} className="space-y-5">
            <div className="space-y-2 group">
              <Label htmlFor="nome" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome completo</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                required
                className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <Label htmlFor="cpf" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">CPF / CNPJ</Label>
                <Input
                  id="cpf"
                  value={form.cpf_cnpj}
                  onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="telefone" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-2xl bg-[var(--brand-primary)] hover:bg-[#005cdd] text-white font-semibold text-xs uppercase tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alteracoes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Alterar Senha</h2>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={alterarSenha} className="space-y-5">
            <div className="space-y-2 group">
              <Label htmlFor="nova-senha" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nova Senha</Label>
              <Input
                id="nova-senha"
                type="password"
                value={senha.nova}
                onChange={e => setSenha(p => ({ ...p, nova: e.target.value }))}
                minLength={6}
                required
                className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="confirmar-senha" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Confirmar Nova Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={senha.confirmar}
                onChange={e => setSenha(p => ({ ...p, confirmar: e.target.value }))}
                minLength={6}
                required
                className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="outline"
                disabled={alterandoSenha}
                className="h-10 px-6 rounded-2xl border-slate-200 font-semibold text-xs text-slate-600 uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                {alterandoSenha && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </div>
          </form>
        </div>
      </div>

      {profile?.consentimento_lgpd && (
        <p className="text-xs text-slate-400 text-center">
          Consentimento LGPD registrado em {new Date(profile.data_consentimento).toLocaleDateString('pt-BR')}.
        </p>
      )}
    </div>
  )
}

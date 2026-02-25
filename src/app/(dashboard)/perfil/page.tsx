'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'

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
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center gap-4 pb-4">
        <img
          src="/icon-192.png"
          alt="Logo"
          className="h-20 w-20 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200/50 object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary">{roleLabels[profile?.role] || profile?.role}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvarPerfil} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF / CNPJ</Label>
                <Input
                  id="cpf"
                  value={form.cpf_cnpj}
                  onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alteracoes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={alterarSenha} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova Senha</Label>
              <Input
                id="nova-senha"
                type="password"
                value={senha.nova}
                onChange={e => setSenha(p => ({ ...p, nova: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={senha.confirmar}
                onChange={e => setSenha(p => ({ ...p, confirmar: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={alterandoSenha}>
                {alterandoSenha && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {profile?.consentimento_lgpd && (
        <p className="text-xs text-muted-foreground">
          Consentimento LGPD registrado em {new Date(profile.data_consentimento).toLocaleDateString('pt-BR')}.
        </p>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, User, Lock, Download, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'
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
  const [exportando, setExportando] = useState(false)
  const [mostrarExclusao, setMostrarExclusao] = useState(false)
  const [motivoExclusao, setMotivoExclusao] = useState('')
  const [enviandoExclusao, setEnviandoExclusao] = useState(false)
  const [protocoloExclusao, setProtocoloExclusao] = useState<string | null>(null)

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
      toast.error('As senhas não coincidem.')
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

  async function exportarDados() {
    setExportando(true)
    try {
      const response = await fetch('/api/lgpd/exportar-dados')
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erro ao exportar dados')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elo-cultura-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar dados')
    }
    setExportando(false)
  }

  async function solicitarExclusao(e: React.FormEvent) {
    e.preventDefault()
    if (motivoExclusao.trim().length < 10) {
      toast.error('Descreva o motivo com pelo menos 10 caracteres.')
      return
    }
    setEnviandoExclusao(true)
    try {
      const response = await fetch('/api/lgpd/solicitar-exclusao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoExclusao }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar solicitação')
      }
      setProtocoloExclusao(data.protocolo)
      toast.success('Solicitação registrada com sucesso')
      setMotivoExclusao('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar solicitação')
    }
    setEnviandoExclusao(false)
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

      {/* Privacidade e Dados (LGPD) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Privacidade e Dados (LGPD)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Seus direitos conforme a Lei Geral de Protecao de Dados</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* Status do consentimento */}
          {profile?.consentimento_lgpd && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
              <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">
                Consentimento LGPD registrado em{' '}
                <span className="font-semibold">
                  {profile.data_consentimento
                    ? new Date(profile.data_consentimento).toLocaleDateString('pt-BR')
                    : new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </span>
              </p>
            </div>
          )}

          {/* Exportar dados */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Download className="h-5 w-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">Exportar meus dados</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Baixe uma copia completa de todos os seus dados pessoais, projetos, avaliacoes e historico de acoes em formato JSON. Direito garantido pelo Art. 18, V da LGPD (Portabilidade).
              </p>
              <Button
                onClick={exportarDados}
                disabled={exportando}
                variant="outline"
                className="mt-3 h-9 px-4 rounded-xl border-slate-200 font-semibold text-xs text-slate-600 uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                {exportando ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-2 h-3.5 w-3.5" />
                )}
                {exportando ? 'Exportando...' : 'Baixar meus dados'}
              </Button>
            </div>
          </div>

          {/* Solicitar exclusao */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Trash2 className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">Solicitar exclusão dos meus dados</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Solicite a eliminação dos seus dados pessoais. Conforme o Art. 18, VI da LGPD, dados vinculados a processos administrativos em andamento podem ser retidos até o arquivamento, conforme obrigação legal.
              </p>

              {protocoloExclusao ? (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">Solicitação registrada</p>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    Protocolo: <span className="font-mono font-semibold">{protocoloExclusao}</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    A administração analisará seu pedido e entrará em contato.
                  </p>
                </div>
              ) : !mostrarExclusao ? (
                <Button
                  onClick={() => setMostrarExclusao(true)}
                  variant="outline"
                  className="mt-3 h-9 px-4 rounded-xl border-red-200 font-semibold text-xs text-red-600 uppercase tracking-wider hover:bg-red-50 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Solicitar exclusão
                </Button>
              ) : (
                <form onSubmit={solicitarExclusao} className="mt-3 space-y-3">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <p className="text-xs text-red-700 font-semibold">Atenção: esta ação é irreversível</p>
                    </div>
                    <p className="text-xs text-red-600 leading-relaxed">
                      Ao solicitar a exclusão, seus dados pessoais serão removidos após análise administrativa. Dados vinculados a processos seletivos em andamento serão anonimizados após o arquivamento do edital.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivo" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">
                      Motivo da solicitação
                    </Label>
                    <Textarea
                      id="motivo"
                      value={motivoExclusao}
                      onChange={e => setMotivoExclusao(e.target.value)}
                      placeholder="Descreva o motivo da sua solicitação de exclusão de dados..."
                      required
                      minLength={10}
                      rows={3}
                      className="rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-red-200 outline-none resize-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={enviandoExclusao}
                      className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]"
                    >
                      {enviandoExclusao ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                      )}
                      {enviandoExclusao ? 'Enviando...' : 'Confirmar solicitação'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setMostrarExclusao(false); setMotivoExclusao('') }}
                      className="h-9 px-4 rounded-xl font-semibold text-xs text-slate-500 uppercase tracking-wider"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { perfilSchema, alterarSenhaSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, User, Lock, Download, Trash2, ShieldCheck, AlertTriangle, Mail, Phone, FileText, Briefcase } from 'lucide-react'
import { translateAuthError } from '@/lib/utils/translate-auth-error'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { ProponenteForm } from '@/components/cadastro/ProponenteForm'
import { AvaliadorForm } from '@/components/cadastro/AvaliadorForm'
import { GestorForm } from '@/components/cadastro/GestorForm'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [form, setForm] = useState({ nome: '', telefone: '', cpf_cnpj: '' })
  const [proponenteData, setProponenteData] = useState({
    areas_atuacao: [] as string[], tempo_atuacao: '', renda: '', genero: '',
    orientacao_sexual: '', raca_etnia: '', pcd: false, endereco_completo: '', municipio: '', estado: '',
    tipo_pessoa: 'fisica', nome_artistico: '', data_nascimento: '', comunidade_tradicional: 'nenhuma',
    tipo_deficiencia: '', escolaridade: '', beneficiario_programa_social: 'nenhum', funcao_cultural: '',
  })
  const [avaliadorData, setAvaliadorData] = useState({
    curriculo_descricao: '', areas_avaliacao: [] as string[], lattes_url: '',
  })
  const [gestorData, setGestorData] = useState({
    orgao_vinculado: '', funcao_cargo: '', matricula: '',
  })
  const [savingExtra, setSavingExtra] = useState(false)
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
      setUserEmail(user?.email || '')
      if (!user) { setLoading(false); return }
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)
      setForm({
        nome: prof?.nome || '',
        telefone: prof?.telefone || '',
        cpf_cnpj: prof?.cpf_cnpj || '',
      })
      // Populate role-specific data
      if (prof?.role === 'proponente') {
        setProponenteData({
          areas_atuacao: prof.areas_atuacao || [],
          tempo_atuacao: prof.tempo_atuacao || '',
          renda: prof.renda || '',
          genero: prof.genero || '',
          orientacao_sexual: prof.orientacao_sexual || '',
          raca_etnia: prof.raca_etnia || '',
          pcd: prof.pcd || false,
          endereco_completo: prof.endereco_completo || '',
          municipio: prof.municipio || '',
          estado: prof.estado || '',
          tipo_pessoa: prof.tipo_pessoa || 'fisica',
          nome_artistico: prof.nome_artistico || '',
          data_nascimento: prof.data_nascimento || '',
          comunidade_tradicional: prof.comunidade_tradicional || 'nenhuma',
          tipo_deficiencia: prof.tipo_deficiencia || '',
          escolaridade: prof.escolaridade || '',
          beneficiario_programa_social: prof.beneficiario_programa_social || 'nenhum',
          funcao_cultural: prof.funcao_cultural || '',
        })
      } else if (prof?.role === 'avaliador') {
        setAvaliadorData({
          curriculo_descricao: prof.curriculo_descricao || '',
          areas_avaliacao: prof.areas_avaliacao || [],
          lattes_url: prof.lattes_url || '',
        })
      } else if (prof?.role === 'gestor') {
        setGestorData({
          orgao_vinculado: prof.orgao_vinculado || '',
          funcao_cargo: prof.funcao_cargo || '',
          matricula: prof.matricula || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()

    const validation = perfilSchema.safeParse(form)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada'); setSaving(false); return }
    const { error } = await supabase
      .from('profiles')
      .update({ nome: form.nome, telefone: form.telefone || null, cpf_cnpj: form.cpf_cnpj || null })
      .eq('id', user.id)
    if (error) {
      toast.error(translateAuthError(error.message))
    } else {
      toast.success('Perfil atualizado com sucesso')
    }
    setSaving(false)
  }

  function updateProponente(field: string, value: any) {
    setProponenteData(prev => ({ ...prev, [field]: value }))
  }
  function updateAvaliador(field: string, value: any) {
    setAvaliadorData(prev => ({ ...prev, [field]: value }))
  }
  function updateGestor(field: string, value: any) {
    setGestorData(prev => ({ ...prev, [field]: value }))
  }

  async function salvarDadosPerfil(e: React.FormEvent) {
    e.preventDefault()
    setSavingExtra(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada'); setSavingExtra(false); return }

    let extraData: Record<string, any> = {}
    if (profile?.role === 'proponente') {
      extraData = {
        areas_atuacao: proponenteData.areas_atuacao.length > 0 ? proponenteData.areas_atuacao : null,
        tempo_atuacao: proponenteData.tempo_atuacao || null,
        renda: proponenteData.renda || null,
        genero: proponenteData.genero || null,
        orientacao_sexual: proponenteData.orientacao_sexual || null,
        raca_etnia: proponenteData.raca_etnia || null,
        pcd: proponenteData.pcd,
        endereco_completo: proponenteData.endereco_completo || null,
        municipio: proponenteData.municipio || null,
        estado: proponenteData.estado || null,
        tipo_pessoa: proponenteData.tipo_pessoa || 'fisica',
        nome_artistico: proponenteData.nome_artistico || null,
        data_nascimento: proponenteData.data_nascimento || null,
        comunidade_tradicional: proponenteData.comunidade_tradicional || 'nenhuma',
        tipo_deficiencia: proponenteData.pcd ? (proponenteData.tipo_deficiencia || null) : null,
        escolaridade: proponenteData.escolaridade || null,
        beneficiario_programa_social: proponenteData.beneficiario_programa_social || 'nenhum',
        funcao_cultural: proponenteData.funcao_cultural || null,
      }
    } else if (profile?.role === 'avaliador') {
      extraData = {
        curriculo_descricao: avaliadorData.curriculo_descricao || null,
        areas_avaliacao: avaliadorData.areas_avaliacao.length > 0 ? avaliadorData.areas_avaliacao : null,
        lattes_url: avaliadorData.lattes_url || null,
      }
    } else if (profile?.role === 'gestor') {
      extraData = {
        orgao_vinculado: gestorData.orgao_vinculado || null,
        funcao_cargo: gestorData.funcao_cargo || null,
        matricula: gestorData.matricula || null,
      }
    }

    const { error } = await supabase.from('profiles').update(extraData).eq('id', user.id)
    if (error) {
      toast.error(translateAuthError(error.message))
    } else {
      toast.success('Dados do perfil atualizados com sucesso')
    }
    setSavingExtra(false)
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()

    const validation = alterarSenhaSchema.safeParse(senha)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setAlterandoSenha(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha.nova })
    if (error) {
      toast.error(translateAuthError(error.message))
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

  const initials = (form.nome || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-0">
          {/* Blue gradient banner */}
          <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[#005cdd] px-6 py-6 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/20 flex-shrink-0">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white tracking-tight">{form.nome || 'Meu Perfil'}</h1>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="text-sm">{userEmail}</span>
                  </div>
                  {form.telefone && (
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="text-sm">{form.telefone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Badge className="text-[11px] font-semibold uppercase tracking-wide rounded-lg bg-white/20 text-white border-none backdrop-blur-sm px-3 py-1">
                    {ROLE_LABELS[profile?.role as keyof typeof ROLE_LABELS] || profile?.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
            <div className="px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</p>
              <p className="text-sm font-semibold text-[var(--brand-success)] mt-0.5">Ativo</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">CPF/CNPJ</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{form.cpf_cnpj || '—'}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">LGPD</p>
              <p className="text-sm font-semibold text-[var(--brand-success)] mt-0.5">
                {profile?.consentimento_lgpd ? 'Consentido' : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Perfil (Role-specific) — shown first for visibility */}
      {profile?.role && ['proponente', 'avaliador', 'gestor'].includes(profile.role) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[var(--brand-primary)] px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Dados do Perfil — {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] || profile.role}
                </h2>
                <p className="text-[11px] text-white/60 mt-0.5">Informações específicas do seu tipo de cadastro</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={salvarDadosPerfil} className="space-y-6">
              {profile.role === 'proponente' && (
                <ProponenteForm form={proponenteData} onChange={updateProponente} />
              )}
              {profile.role === 'avaliador' && (
                <AvaliadorForm form={avaliadorData} onChange={updateAvaliador} />
              )}
              {profile.role === 'gestor' && (
                <GestorForm form={gestorData} onChange={updateGestor} />
              )}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={savingExtra}
                  className="h-10 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[#005cdd] text-white font-semibold text-xs uppercase tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]"
                >
                  {savingExtra && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Dados do Perfil
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[var(--brand-primary)] px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Dados Pessoais</h2>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={salvarPerfil} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome completo</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">CPF / CNPJ</Label>
                <Input
                  id="cpf"
                  value={form.cpf_cnpj}
                  onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[#005cdd] text-white font-semibold text-xs uppercase tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[var(--brand-primary)] px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Lock className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Alterar Senha</h2>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={alterarSenha} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nova-senha" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nova Senha</Label>
                <Input
                  id="nova-senha"
                  type="password"
                  value={senha.nova}
                  onChange={e => setSenha(p => ({ ...p, nova: e.target.value }))}
                  minLength={6}
                  required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-senha" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Confirmar Nova Senha</Label>
                <Input
                  id="confirmar-senha"
                  type="password"
                  value={senha.confirmar}
                  onChange={e => setSenha(p => ({ ...p, confirmar: e.target.value }))}
                  minLength={6}
                  required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={alterandoSenha}
                  className="h-10 px-6 rounded-xl border-slate-200 font-semibold text-xs text-slate-600 uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  {alterandoSenha && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alterar Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Privacidade e Dados (LGPD) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[var(--brand-primary)] px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Privacidade e Dados (LGPD)</h2>
              <p className="text-[11px] text-white/60 mt-0.5">Seus direitos conforme a Lei Geral de Proteção de Dados</p>
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
            <div className="h-10 w-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">Exportar meus dados</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Baixe uma cópia completa de todos os seus dados pessoais, projetos, avaliações e histórico de ações em formato JSON. Direito garantido pelo Art. 18, V da LGPD (Portabilidade).
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

          {/* Solicitar exclusão */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
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

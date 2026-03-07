'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cadastroStep1Schema } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProponenteForm } from '@/components/cadastro/ProponenteForm'
import { AvaliadorForm } from '@/components/cadastro/AvaliadorForm'
import { GestorForm } from '@/components/cadastro/GestorForm'
import { Loader2, User, Mail, Lock, Phone, CreditCard, ArrowRight, ArrowLeft, Building2 } from 'lucide-react'
import { translateAuthError } from '@/lib/utils/translate-auth-error'
import { formatCpfCnpj, cleanDigits, isCnpj } from '@/lib/utils/cpf-cnpj'
import { motion, AnimatePresence } from 'framer-motion'

type PerfilTipo = 'proponente' | 'avaliador' | 'gestor'

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [perfilTipo, setPerfilTipo] = useState<PerfilTipo>('proponente')

  // Step 1: Personal data
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [lgpdConsent, setLgpdConsent] = useState(false)

  // Step 2: Role-specific data
  const [proponenteData, setProponenteData] = useState({
    areas_atuacao: [] as string[],
    tempo_atuacao: '',
    renda: '',
    genero: '',
    orientacao_sexual: '',
    raca_etnia: '',
    pcd: false,
    endereco_completo: '',
    municipio: '',
    estado: '',
    tipo_pessoa: 'fisica',
    nome_artistico: '',
    data_nascimento: '',
    comunidade_tradicional: 'nenhuma',
    tipo_deficiencia: '',
    escolaridade: '',
    beneficiario_programa_social: 'nenhum',
    funcao_cultural: '',
    razao_social: '', nome_fantasia: '', endereco_sede: '',
    representante_nome: '', representante_cpf: '', representante_genero: '',
    representante_raca_etnia: '', representante_pcd: false, representante_escolaridade: '',
    nome_coletivo: '', ano_criacao: '', quantidade_membros: '', portfolio: '',
    membros: [] as { nome: string; cpf: string }[],
  })
  const [avaliadorData, setAvaliadorData] = useState({
    curriculo_descricao: '',
    areas_avaliacao: [] as string[],
    lattes_url: '',
  })
  const [gestorData, setGestorData] = useState({
    orgao_vinculado: '',
    funcao_cargo: '',
    matricula: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Detect root domain (no tenant cookie = global platform)
  const [isRootDomain] = useState(() => {
    if (typeof document === 'undefined') return false
    const tid = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant_id='))
      ?.split('=')[1]
    return !tid
  })

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    const validation = cadastroStep1Schema.safeParse({
      nome, email, password, cpfCnpj, telefone, lgpdConsent,
    })
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }
    setError('')
    setStep(2)
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Read tenant_id from cookie (set by middleware from domain)
    const tenantId = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant_id='))
      ?.split('=')[1] || undefined

    // Proponentes are global (no tenant_id). Staff needs tenant_id.
    const isProponente = perfilTipo === 'proponente'

    // 1. Create account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cpf_cnpj: cpfCnpj,
          telefone,
          consentimento_lgpd: true,
          // Proponente: no tenant_id (global citizen). Staff: tenant from domain.
          ...(!isProponente && tenantId ? { tenant_id: tenantId } : {}),
        },
      },
    })

    if (signUpError) {
      setError(translateAuthError(signUpError.message))
      setLoading(false)
      return
    }

    // 2. Update profile with role and role-specific data
    if (signUpData.user) {
      const extraData: Record<string, string | boolean | string[] | Record<string, unknown>> = {
        role: perfilTipo,
        // Avaliador/gestor precisam de aprovação do admin
        ...(perfilTipo !== 'proponente' ? { aprovado: false } : {}),
      }

      if (perfilTipo === 'proponente') {
        Object.assign(extraData, {
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
          // PJ fields
          ...(proponenteData.tipo_pessoa === 'juridica' ? {
            razao_social: proponenteData.razao_social || null,
            nome_fantasia: proponenteData.nome_fantasia || null,
            endereco_sede: proponenteData.endereco_sede || null,
            representante_nome: proponenteData.representante_nome || null,
            representante_cpf: proponenteData.representante_cpf || null,
            representante_genero: proponenteData.representante_genero || null,
            representante_raca_etnia: proponenteData.representante_raca_etnia || null,
            representante_pcd: proponenteData.representante_pcd,
            representante_escolaridade: proponenteData.representante_escolaridade || null,
          } : {}),
        })
      } else if (perfilTipo === 'avaliador') {
        Object.assign(extraData, {
          curriculo_descricao: avaliadorData.curriculo_descricao || null,
          areas_avaliacao: avaliadorData.areas_avaliacao.length > 0 ? avaliadorData.areas_avaliacao : null,
          lattes_url: avaliadorData.lattes_url || null,
        })
      } else if (perfilTipo === 'gestor') {
        Object.assign(extraData, {
          orgao_vinculado: gestorData.orgao_vinculado || null,
          funcao_cargo: gestorData.funcao_cargo || null,
          matricula: gestorData.matricula || null,
        })
      }

      if (Object.keys(extraData).length > 0) {
        await supabase
          .from('profiles')
          .update(extraData)
          .eq('id', signUpData.user.id)
      }

      // Save coletivo data if applicable
      if (perfilTipo === 'proponente' && proponenteData.tipo_pessoa === 'coletivo_sem_cnpj' && proponenteData.nome_coletivo) {
        const { data: coletivo } = await supabase.from('coletivos').insert({
          profile_id: signUpData.user.id,
          nome_coletivo: proponenteData.nome_coletivo,
          ano_criacao: proponenteData.ano_criacao ? parseInt(proponenteData.ano_criacao) : null,
          quantidade_membros: proponenteData.quantidade_membros ? parseInt(proponenteData.quantidade_membros) : 1,
          portfolio: proponenteData.portfolio || null,
        }).select('id').single()

        if (coletivo && proponenteData.membros.length > 0) {
          await supabase.from('coletivo_membros').insert(
            proponenteData.membros.map(m => ({
              coletivo_id: coletivo.id,
              nome: m.nome,
              cpf: m.cpf || null,
            }))
          )
        }
      }
    }

    const msg = perfilTipo !== 'proponente' ? 'cadastro-pendente' : 'cadastro-sucesso'
    router.push(`/login?msg=${msg}`)
  }

  function updateProponente(field: string, value: string | boolean | string[] | { nome: string; cpf: string }[]) {
    setProponenteData(prev => ({ ...prev, [field]: value }))
  }
  function updateAvaliador(field: string, value: string | string[]) {
    setAvaliadorData(prev => ({ ...prev, [field]: value }))
  }
  function updateGestor(field: string, value: string | string[]) {
    setGestorData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden selection:bg-[#0047AB]/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-8 md:p-12">

            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-2">
                Criar <span className="text-[var(--brand-primary)]">Conta</span>
              </h1>
              <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400 text-center">
                {step === 1 ? 'Dados Pessoais' : 'Dados do Perfil'}
              </p>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-[#0047AB]' : 'bg-slate-200'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-[#0047AB]' : 'bg-slate-200'}`} />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200/60 p-4 text-xs font-bold text-rose-600 text-center mb-5">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleStep1}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 group">
                      <Label htmlFor="nome" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="nome" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="email" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="password" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="password" type="password" placeholder="Min. 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required
                          className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="cpf" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">
                        CPF ou CNPJ
                        {cpfCnpj && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isCnpj(cpfCnpj) ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {isCnpj(cpfCnpj) ? 'CNPJ' : 'CPF'}
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        {isCnpj(cpfCnpj)
                          ? <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 transition-colors" />
                          : <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                        }
                        <Input id="cpf" placeholder="000.000.000-00" value={cpfCnpj}
                          onChange={e => {
                            const formatted = formatCpfCnpj(e.target.value)
                            setCpfCnpj(formatted)
                            // Auto-set tipo_pessoa based on document type
                            if (isCnpj(e.target.value)) {
                              setProponenteData(prev => ({ ...prev, tipo_pessoa: 'juridica' }))
                            } else if (cleanDigits(e.target.value).length <= 11) {
                              setProponenteData(prev => prev.tipo_pessoa === 'juridica' ? { ...prev, tipo_pessoa: 'fisica' } : prev)
                            }
                          }}
                          maxLength={18}
                          required
                          className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all" />
                      </div>
                      {isCnpj(cpfCnpj) && (
                        <p className="text-[10px] text-blue-500 ml-1">CNPJ detectado — dados da empresa serão solicitados na próxima etapa</p>
                      )}
                    </div>

                    <div className="space-y-2 group md:col-span-2">
                      <Label htmlFor="telefone" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Telefone / WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="telefone" placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4">
                    <input type="checkbox" id="lgpd" checked={lgpdConsent} onChange={e => setLgpdConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-200 bg-slate-50 text-[#0047AB] focus:ring-offset-0 focus:ring-[#0047AB]" />
                    <Label htmlFor="lgpd" className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider cursor-pointer">
                      Li e aceito os <span className="text-[var(--brand-primary)] underline">Termos de Uso</span> e a <span className="text-[var(--brand-primary)] underline">Política de Privacidade</span> (LGPD).
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-semibold uppercase text-xs tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98] mt-4">
                    <ArrowRight className="mr-2 h-4 w-4" /> Próximo: Dados do Perfil
                  </Button>

                  <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-wide pt-2">
                    Já possui acesso? {' '}
                    <Link href="/login" className="text-[var(--brand-primary)] hover:underline transition-colors">Entrar</Link>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleFinalSubmit}
                  className="space-y-5"
                >
                  {/* Profile type selector */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Tipo de Perfil</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'proponente' as const, label: 'Proponente' },
                        { key: 'avaliador' as const, label: 'Avaliador' },
                        { key: 'gestor' as const, label: 'Gestor' },
                      ]).map(tipo => {
                        const isStaffRole = tipo.key !== 'proponente'
                        const disabled = isStaffRole && isRootDomain
                        return (
                          <button
                            key={tipo.key}
                            type="button"
                            onClick={() => !disabled && setPerfilTipo(tipo.key)}
                            disabled={disabled}
                            className={[
                              'py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all border',
                              disabled
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : perfilTipo === tipo.key
                                  ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-lg shadow-[#0047AB]/20'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                            ].join(' ')}
                          >
                            {tipo.label}
                          </button>
                        )
                      })}
                    </div>
                    {isRootDomain && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 rounded-xl p-2.5 border border-amber-200 mt-2">
                        Para se cadastrar como avaliador ou gestor, acesse o domínio do seu município.
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-slate-200 my-4" />

                  {/* Role-specific form */}
                  <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                    {perfilTipo === 'proponente' && (
                      <ProponenteForm form={proponenteData} onChange={updateProponente} cpfCnpj={cpfCnpj} />
                    )}
                    {perfilTipo === 'avaliador' && (
                      <AvaliadorForm form={avaliadorData} onChange={updateAvaliador} />
                    )}
                    {perfilTipo === 'gestor' && (
                      <GestorForm form={gestorData} onChange={updateGestor} />
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="h-12 px-6 rounded-2xl border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold uppercase text-xs tracking-wider transition-all"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button type="submit" className="flex-1 h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-semibold uppercase text-xs tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Finalizar Cadastro'}
                    </Button>
                  </div>

                  <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-wide pt-1">
                    Esses dados podem ser atualizados depois no seu perfil.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
